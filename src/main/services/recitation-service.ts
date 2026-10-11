import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';
import seekBzip from 'seek-bzip';
import { ReciterInfo, AyahTimingManifest, AyahAudioData, WordSegment } from '../../shared/types';

class RecitationService {
  private recitersList: ReciterInfo[] = [];
  private manifestCache = new Map<string, AyahTimingManifest>();
  private inFlightDownloads = new Map<string, Promise<string>>();

  private getRecitationsJsonPath(): string {
    const isPackaged = app ? app.isPackaged : false;
    return isPackaged
      ? path.join(process.resourcesPath, 'recitations.json')
      : path.join(process.cwd(), 'recitations.json');
  }

  private getDiskCacheDir(): string {
    const basePath = app ? app.getPath('userData') : path.join(process.cwd(), '.cache');
    const cacheDir = path.join(basePath, 'segments_cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  }

  public getAudioCacheDir(reciter?: ReciterInfo | null): string {
    const basePath = app ? app.getPath('userData') : path.join(process.cwd(), '.cache');
    const safeName = reciter
      ? (reciter.name + '_' + (reciter.style || '')).replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'common';
    const cacheDir = path.join(basePath, 'audio_cache', safeName);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  }

  public getReciters(): ReciterInfo[] {
    if (this.recitersList.length === 0) {
      try {
        const jsonPath = this.getRecitationsJsonPath();
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.recitersList = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to load recitations.json:', err);
        this.recitersList = [];
      }
    }
    return this.recitersList;
  }

  public async getTimingManifest(reciter: ReciterInfo): Promise<AyahTimingManifest | null> {
    if (!reciter.segments_url) return null;

    const cacheKey = `${reciter.name}_${reciter.style}`;
    if (this.manifestCache.has(cacheKey)) {
      return this.manifestCache.get(cacheKey)!;
    }

    try {
      const fileName = path.basename(reciter.segments_url.split('?')[0]);
      const diskPath = path.join(this.getDiskCacheDir(), fileName);

      let rawCompressedBase64 = '';
      if (fs.existsSync(diskPath)) {
        rawCompressedBase64 = fs.readFileSync(diskPath, 'utf-8');
      } else {
        const response = await axios.get<string>(reciter.segments_url, {
          responseType: 'text',
          timeout: 15000,
        });
        rawCompressedBase64 = response.data;
        fs.writeFileSync(diskPath, rawCompressedBase64, 'utf-8');
      }

      // Decode Base64 + BZip2
      const compressedBuffer = Buffer.from(rawCompressedBase64.trim(), 'base64');
      const decompressed = seekBzip.decode(compressedBuffer);
      const manifest: AyahTimingManifest = JSON.parse(decompressed.toString('utf-8'));

      this.manifestCache.set(cacheKey, manifest);
      return manifest;
    } catch (err) {
      console.warn(`Failed to retrieve timing manifest for ${reciter.name}:`, err);
      return null;
    }
  }

  public async ensureAudioCached(remoteUrl: string, destinationPath: string): Promise<string> {
    if (!remoteUrl) return '';

    // If remoteUrl is already a local file path
    if (fs.existsSync(remoteUrl)) {
      try {
        const stat = fs.statSync(remoteUrl);
        if (stat.size > 512) return remoteUrl;
      } catch {}
    }

    // If destination already exists with valid size, reuse immediately!
    if (fs.existsSync(destinationPath)) {
      try {
        const stat = fs.statSync(destinationPath);
        if (stat.size > 512) {
          return destinationPath;
        }
      } catch {}
    }

    // Only download if it's an HTTP/HTTPS remote URL
    if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
      return remoteUrl;
    }

    // Check if a download is already in flight
    const inFlight = this.inFlightDownloads.get(destinationPath);
    if (inFlight) {
      return inFlight;
    }

    const downloadTask = (async () => {
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${destinationPath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      let retries = 2;
      let lastErr: any = null;

      while (retries >= 0) {
        try {
          const response = await axios.get(remoteUrl, {
            responseType: 'arraybuffer',
            timeout: 25000,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: '*/*',
            },
          });

          const buffer = Buffer.from(response.data);
          if (buffer.length > 512) {
            fs.writeFileSync(tempPath, buffer);
            fs.renameSync(tempPath, destinationPath);
            return destinationPath;
          } else {
            throw new Error(`Audio payload too small: ${buffer.length} bytes`);
          }
        } catch (err: any) {
          lastErr = err;
          if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch {}
          }
          retries--;
          if (retries >= 0) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      }

      console.warn(`[RecitationService] Audio download failed for ${remoteUrl}:`, lastErr?.message);
      return remoteUrl;
    })();

    this.inFlightDownloads.set(destinationPath, downloadTask);
    try {
      return await downloadTask;
    } finally {
      this.inFlightDownloads.delete(destinationPath);
    }
  }

  public async getAyahAudioData(
    reciterIndex: number,
    surah: number,
    ayah: number
  ): Promise<AyahAudioData> {
    const reciters = this.getReciters();
    const reciter = reciters[reciterIndex] || reciters[0];
    const verseKey = `${surah}:${ayah}`;

    let remoteAudioUrl = '';
    let segments: WordSegment[] = [];
    let durationInSeconds = 5.0; // fallback default

    if (reciter) {
      const manifest = await this.getTimingManifest(reciter);
      if (manifest && manifest[verseKey]) {
        const item = manifest[verseKey];
        remoteAudioUrl = item.audio_url;
        segments = (item.segments || []).map(([wordIndex, startMs, endMs]) => ({
          wordIndex,
          startMs,
          endMs,
        }));

        if (item.duration) {
          durationInSeconds = item.duration;
        } else if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          durationInSeconds = (lastSegment.endMs + 600) / 1000;
        }
      }

      // Fallback: Direct CDN URL if no audioUrl found in manifest or manifest unavailable
      if (!remoteAudioUrl) {
        const surahPadded = String(surah).padStart(3, '0');
        const ayahPadded = String(ayah).padStart(3, '0');
        const base = reciter.link.replace(/\/$/, '');
        remoteAudioUrl = `${base}/${surahPadded}${ayahPadded}.mp3`;
      }

      // Local Cache Path
      const surahPadded = String(surah).padStart(3, '0');
      const ayahPadded = String(ayah).padStart(3, '0');
      const cacheDir = this.getAudioCacheDir(reciter);
      const cachedFilePath = path.join(cacheDir, `${surahPadded}${ayahPadded}.mp3`);

      let audioUrl = cachedFilePath;
      if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 512) {
        // Cached on local disk! No server request!
        audioUrl = cachedFilePath;
      } else {
        // Download once and store in cache
        audioUrl = await this.ensureAudioCached(remoteAudioUrl, cachedFilePath);
      }

      return {
        audioUrl,
        durationInSeconds: Math.max(2, durationInSeconds),
        segments,
      };
    }

    return {
      audioUrl: '',
      durationInSeconds: 5,
      segments: [],
    };
  }

  public async getAyahRangeAudioData(
    reciterIndex: number,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, AyahAudioData>> {
    const results: Record<number, AyahAudioData> = {};
    const ayahsToFetch: number[] = [];
    for (let a = fromAyah; a <= toAyah; a++) {
      ayahsToFetch.push(a);
    }

    // Controlled concurrency pool (3 workers) with gentle spacing to prevent rate limiting
    const CONCURRENCY = 3;
    let index = 0;

    const worker = async () => {
      while (index < ayahsToFetch.length) {
        const currentAyah = ayahsToFetch[index++];
        results[currentAyah] = await this.getAyahAudioData(reciterIndex, surah, currentAyah);
        // Small delay between remote fetches
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, ayahsToFetch.length) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}

export const recitationService = new RecitationService();
