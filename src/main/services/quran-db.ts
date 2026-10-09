import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { QuranWord, ScriptType } from '../../shared/types';

class QuranDatabaseService {
  private dbConnections = new Map<ScriptType, Database.Database>();

  private getDatabasePath(script: ScriptType): string {
    const isPackaged = app ? app.isPackaged : false;
    const basePath = isPackaged
      ? process.resourcesPath
      : process.cwd();
    return path.join(basePath, 'Quran Scripts', `${script}.db`);
  }

  private getConnection(script: ScriptType): Database.Database {
    if (!this.dbConnections.has(script)) {
      const dbPath = this.getDatabasePath(script);
      const db = new Database(dbPath, { readonly: true, fileMustExist: true });
      db.pragma('cache_size = 4000');
      this.dbConnections.set(script, db);
    }
    return this.dbConnections.get(script)!;
  }

  private toArabicDigits(num: number): string {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).split('').map((d) => arabicDigits[Number(d)] || d).join('');
  }

  private cleanWord(word: QuranWord, totalWordsInAyah: number): QuranWord {
    let cleanedText = word.text;
    const isLastWord = word.word === totalWordsInAyah;

    // 1. Remove Arabic Presentation Forms-A ligature codes (0xFD00 - 0xFDFF)
    // which are used as proprietary waqf glyphs in qpc-nastaleeq.db and cause fallback to "ضحي"
    cleanedText = cleanedText.replace(/[\uFD00-\uFDFF]/g, '').trim();

    // 2. If it is the last word (Ayah number marker) and contains PUA characters (0xE000 - 0xF8FF)
    // or if cleaning made it empty, replace with standard clean Arabic numeral
    if (isLastWord) {
      // Check if it's purely digits or has PUA
      const hasPUA = /[\uE000-\uF8FF]/.test(cleanedText);
      if (!cleanedText || hasPUA) {
        cleanedText = this.toArabicDigits(word.ayah);
      }
    }

    return {
      ...word,
      text: cleanedText || word.text,
    };
  }

  public getAyahWords(script: ScriptType, surah: number, ayah: number): QuranWord[] {
    const db = this.getConnection(script);
    const stmt = db.prepare<[number, number], QuranWord>(
      'SELECT id, location, surah, ayah, word, text FROM words WHERE surah = ? AND ayah = ? ORDER BY word ASC'
    );
    const rows = stmt.all(surah, ayah);
    const totalWords = rows.length;
    return rows.map((w) => this.cleanWord(w, totalWords));
  }

  public getAyahRangeWords(
    script: ScriptType,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Record<number, QuranWord[]> {
    const db = this.getConnection(script);
    const stmt = db.prepare<[number, number, number], QuranWord>(
      'SELECT id, location, surah, ayah, word, text FROM words WHERE surah = ? AND ayah BETWEEN ? AND ? ORDER BY ayah ASC, word ASC'
    );
    const rows = stmt.all(surah, fromAyah, toAyah);

    // Group first to know total words per ayah
    const tempGrouped: Record<number, QuranWord[]> = {};
    for (const row of rows) {
      if (!tempGrouped[row.ayah]) {
        tempGrouped[row.ayah] = [];
      }
      tempGrouped[row.ayah].push(row);
    }

    const grouped: Record<number, QuranWord[]> = {};
    for (const [ayahKey, words] of Object.entries(tempGrouped)) {
      const aNum = Number(ayahKey);
      const totalWords = words.length;
      grouped[aNum] = words.map((w) => this.cleanWord(w, totalWords));
    }
    return grouped;
  }

  public closeAll(): void {
    for (const [script, conn] of this.dbConnections.entries()) {
      try {
        conn.close();
      } catch (err) {
        console.error(`Error closing database ${script}:`, err);
      }
    }
    this.dbConnections.clear();
  }
}

export const quranDbService = new QuranDatabaseService();
