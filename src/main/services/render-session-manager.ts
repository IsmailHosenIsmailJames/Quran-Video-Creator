import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';
import { VideoTemplateConfig, AyahSequenceData } from '../../shared/types';

export interface RenderChunkMeta {
  index: number;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  videoFileName: string;
  completed: boolean;
  fileSizeBytes?: number;
}

export interface RenderSessionManifest {
  sessionId: string;
  sessionKey: string;
  outputPath: string;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciterIndex: number;
  resolution: string;
  fps: number;
  aspectRatio: string;
  totalDurationInFrames: number;
  framesPerChunk: number;
  totalChunks: number;
  hasAudio: boolean;
  audioFileName: string;
  audioCompleted: boolean;
  chunks: RenderChunkMeta[];
  status: 'in-progress' | 'completed' | 'interrupted' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface SessionCheckResult {
  hasExistingSession: boolean;
  completedChunks: number;
  totalChunks: number;
  percentComplete: number;
  sessionId: string;
  outputPath: string;
}

class RenderSessionManager {
  private getBaseDir(): string {
    const base = app
      ? path.join(app.getPath('userData'), 'render_sessions')
      : path.join(process.cwd(), '.cache', 'render_sessions');

    if (!fs.existsSync(base)) {
      try {
        fs.mkdirSync(base, { recursive: true });
      } catch (err) {
        console.warn('[RenderSessionManager] Failed to create baseDir:', err);
      }
    }
    return base;
  }

  public computeSessionId(
    config: VideoTemplateConfig,
    totalDurationInFrames: number,
    outputPath: string
  ): { sessionId: string; sessionKey: string } {
    // Generate deterministic key including core visual and layout parameters
    const safeOutput = path.resolve(outputPath).replace(/\\/g, '/');
    const sessionKey = [
      safeOutput,
      `surah_${config.surahNumber}`,
      `ayahs_${config.fromAyah}_${config.toAyah}`,
      `reciter_${config.reciterIndex}`,
      `res_${config.resolution}`,
      `fps_${config.fps || 30}`,
      `aspect_${config.aspectRatio || '16:9'}`,
      `frames_${totalDurationInFrames}`,
      `bg_${config.backgroundType}_${config.backgroundPath || ''}`,
      `font_${config.arabicFontSize}_${config.primaryFontSize}`,
    ].join('|');

    const sessionId = crypto.createHash('sha256').update(sessionKey).digest('hex').substring(0, 24);
    return { sessionId, sessionKey };
  }

  public getSessionDir(sessionId: string): string {
    return path.join(this.getBaseDir(), sessionId);
  }

  public getManifestPath(sessionDir: string): string {
    return path.join(sessionDir, 'manifest.json');
  }

  public loadManifest(sessionDir: string): RenderSessionManifest | null {
    const manifestPath = this.getManifestPath(sessionDir);
    if (!fs.existsSync(manifestPath)) return null;

    try {
      const data = fs.readFileSync(manifestPath, 'utf8');
      const manifest: RenderSessionManifest = JSON.parse(data);

      // Validate on-disk integrity of completed chunks
      let modified = false;
      for (const chunk of manifest.chunks) {
        if (chunk.completed) {
          const chunkPath = path.join(sessionDir, chunk.videoFileName);
          if (!fs.existsSync(chunkPath) || fs.statSync(chunkPath).size < 1024) {
            console.warn(`[RenderSessionManager] Chunk ${chunk.index} was marked completed but file is missing or invalid. Invalidation.`);
            chunk.completed = false;
            chunk.fileSizeBytes = 0;
            modified = true;
          }
        }
      }

      if (manifest.audioCompleted) {
        const audioPath = path.join(sessionDir, manifest.audioFileName);
        if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 512) {
          manifest.audioCompleted = false;
          modified = true;
        }
      }

      if (modified) {
        this.saveManifest(sessionDir, manifest);
      }

      return manifest;
    } catch (err) {
      console.error('[RenderSessionManager] Failed to read manifest:', err);
      return null;
    }
  }

  public saveManifest(sessionDir: string, manifest: RenderSessionManifest): void {
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    manifest.updatedAt = Date.now();
    const manifestPath = this.getManifestPath(sessionDir);
    const tempPath = `${manifestPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf8');
    fs.renameSync(tempPath, manifestPath);
  }

  public checkExistingSession(
    config: VideoTemplateConfig,
    totalDurationInFrames: number,
    outputPath: string
  ): SessionCheckResult | null {
    if (!outputPath) return null;
    const { sessionId } = this.computeSessionId(config, totalDurationInFrames, outputPath);
    const sessionDir = this.getSessionDir(sessionId);
    const manifest = this.loadManifest(sessionDir);

    if (!manifest || manifest.chunks.length === 0) return null;

    const completedChunks = manifest.chunks.filter((c) => c.completed).length;
    if (completedChunks === 0) return null;

    const percentComplete = Math.round((completedChunks / manifest.chunks.length) * 100);
    return {
      hasExistingSession: true,
      completedChunks,
      totalChunks: manifest.chunks.length,
      percentComplete,
      sessionId,
      outputPath: manifest.outputPath,
    };
  }

  public initOrCreateSession(
    config: VideoTemplateConfig,
    totalDurationInFrames: number,
    outputPath: string,
    forceFresh: boolean = false
  ): { manifest: RenderSessionManifest; sessionDir: string; isResumed: boolean } {
    const { sessionId, sessionKey } = this.computeSessionId(config, totalDurationInFrames, outputPath);
    const sessionDir = this.getSessionDir(sessionId);

    if (forceFresh && fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('[RenderSessionManager] Could not delete old sessionDir:', err);
      }
    }

    // Try loading existing valid manifest
    const existing = this.loadManifest(sessionDir);
    if (existing && existing.chunks.length > 0) {
      const completed = existing.chunks.filter((c) => c.completed).length;
      if (completed > 0) {
        existing.status = 'in-progress';
        this.saveManifest(sessionDir, existing);
        return { manifest: existing, sessionDir, isResumed: true };
      }
    }

    // Initialize fresh session with slice definitions
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const fps = config.fps || 30;
    // 30 seconds per chunk (900 frames at 30fps) - optimal balance between render speed and power-cut safety
    const CHUNK_DURATION_SECONDS = 30;
    const framesPerChunk = Math.max(150, Math.round(CHUNK_DURATION_SECONDS * fps));
    const totalChunks = Math.max(1, Math.ceil(totalDurationInFrames / framesPerChunk));

    const chunks: RenderChunkMeta[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const startFrame = i * framesPerChunk;
      const endFrame = Math.min(totalDurationInFrames - 1, (i + 1) * framesPerChunk - 1);
      const duration = endFrame - startFrame + 1;
      const paddedIndex = String(i).padStart(4, '0');

      chunks.push({
        index: i,
        startFrame,
        endFrame,
        durationInFrames: duration,
        videoFileName: `chunk_${paddedIndex}.mp4`,
        completed: false,
      });
    }

    const manifest: RenderSessionManifest = {
      sessionId,
      sessionKey,
      outputPath,
      surahNumber: config.surahNumber,
      fromAyah: config.fromAyah,
      toAyah: config.toAyah,
      reciterIndex: config.reciterIndex,
      resolution: config.resolution || '1080p',
      fps,
      aspectRatio: config.aspectRatio || '16:9',
      totalDurationInFrames,
      framesPerChunk,
      totalChunks,
      hasAudio: true,
      audioFileName: 'master_audio.aac',
      audioCompleted: false,
      chunks,
      status: 'in-progress',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.saveManifest(sessionDir, manifest);
    return { manifest, sessionDir, isResumed: false };
  }

  public cleanupSession(sessionDir: string): void {
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`[RenderSessionManager] Successfully cleaned up session dir: ${sessionDir}`);
      }
    } catch (err) {
      console.warn(`[RenderSessionManager] Cleanup warning: ${err}`);
    }
  }

  public discardSession(
    config: VideoTemplateConfig,
    totalDurationInFrames: number,
    outputPath: string
  ): boolean {
    const { sessionId } = this.computeSessionId(config, totalDurationInFrames, outputPath);
    const sessionDir = this.getSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        return true;
      } catch (err) {
        console.warn('[RenderSessionManager] Could not discard session:', err);
      }
    }
    return false;
  }
}

export const renderSessionManager = new RenderSessionManager();
