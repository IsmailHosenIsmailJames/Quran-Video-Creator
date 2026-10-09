import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';
import seekBzip from 'seek-bzip';
import { ReciterInfo, AyahTimingManifest, AyahAudioData, WordSegment } from '../../shared/types';

class RecitationService {
  private recitersList: ReciterInfo[] = [];
  private manifestCache = new Map<string, AyahTimingManifest>();

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

  public async getAyahAudioData(
    reciterIndex: number,
    surah: number,
    ayah: number
  ): Promise<AyahAudioData> {
    const reciters = this.getReciters();
    const reciter = reciters[reciterIndex] || reciters[0];
    const verseKey = `${surah}:${ayah}`;

    let audioUrl = '';
    let segments: WordSegment[] = [];
    let durationInSeconds = 5.0; // fallback default

    if (reciter) {
      const manifest = await this.getTimingManifest(reciter);
      if (manifest && manifest[verseKey]) {
        const item = manifest[verseKey];
        audioUrl = item.audio_url;
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
      if (!audioUrl) {
        const surahPadded = String(surah).padStart(3, '0');
        const ayahPadded = String(ayah).padStart(3, '0');
        const base = reciter.link.replace(/\/$/, '');
        audioUrl = `${base}/${surahPadded}${ayahPadded}.mp3`;
      }
    }

    return {
      audioUrl,
      durationInSeconds: Math.max(2, durationInSeconds),
      segments,
    };
  }

  public async getAyahRangeAudioData(
    reciterIndex: number,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, AyahAudioData>> {
    const results: Record<number, AyahAudioData> = {};
    for (let a = fromAyah; a <= toAyah; a++) {
      results[a] = await this.getAyahAudioData(reciterIndex, surah, a);
    }
    return results;
  }
}

export const recitationService = new RecitationService();
