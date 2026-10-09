import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import seekBzip from 'seek-bzip';
import { TranslationFileContent } from '../../shared/types';

class TranslationService {
  private cache = new Map<string, TranslationFileContent>();

  private getBasePath(): string {
    const isPackaged = app ? app.isPackaged : false;
    return isPackaged
      ? path.join(process.resourcesPath, 'compressed_translation_simple')
      : path.join(process.cwd(), 'compressed_translation_simple');
  }

  public getAvailableLanguages(): string[] {
    const dir = this.getBasePath();
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'With_footnotes')
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  }

  public getTranslatorsForLanguage(language: string): string[] {
    const langDir = path.join(this.getBasePath(), language);
    if (!fs.existsSync(langDir)) return [];
    return fs.readdirSync(langDir)
      .filter((file) => file.endsWith('.json.txt'))
      .sort((a, b) => a.localeCompare(b));
  }

  public loadTranslationFile(language: string, translatorFile: string): TranslationFileContent {
    const cacheKey = `${language}:${translatorFile}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const filePath = path.join(this.getBasePath(), language, translatorFile);
    if (!fs.existsSync(filePath)) {
      console.warn(`Translation file not found at: ${filePath}`);
      return {};
    }

    try {
      // 1. Read Base64-encoded compressed text
      const rawContent = fs.readFileSync(filePath, 'utf-8').trim();

      // 2. Base64 decode to BZip2 binary buffer
      const compressedBuffer = Buffer.from(rawContent, 'base64');

      // 3. Decompress BZip2 buffer
      const decompressedBuffer = seekBzip.decode(compressedBuffer);

      // 4. Parse UTF-8 JSON string
      const jsonStr = decompressedBuffer.toString('utf-8');
      const parsedData: TranslationFileContent = JSON.parse(jsonStr);

      // 5. Store in memory cache
      this.cache.set(cacheKey, parsedData);
      return parsedData;
    } catch (error) {
      console.error(`Failed to decompress translation ${language}/${translatorFile}:`, error);
      return {};
    }
  }

  public getVerseTranslation(
    language: string,
    translatorFile: string,
    surah: number,
    ayah: number
  ): string {
    try {
      const data = this.loadTranslationFile(language, translatorFile);
      const verseKey = `${surah}:${ayah}`;
      return data[verseKey]?.t || '';
    } catch (err) {
      console.error(`Failed to get translation for ${surah}:${ayah}:`, err);
      return '';
    }
  }

  public getVerseRangeTranslations(
    language: string,
    translatorFile: string,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Record<number, string> {
    const result: Record<number, string> = {};
    const data = this.loadTranslationFile(language, translatorFile);
    for (let a = fromAyah; a <= toAyah; a++) {
      result[a] = data[`${surah}:${a}`]?.t || '';
    }
    return result;
  }
}

export const translationService = new TranslationService();
