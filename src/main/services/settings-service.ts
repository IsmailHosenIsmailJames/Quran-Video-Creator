import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { VideoTemplateConfig } from '../../shared/types';

export const PERSISTABLE_CONFIG_KEYS: Array<keyof VideoTemplateConfig> = [
  // Scripture Selection & Preferences
  'includeBismillah',

  // Scripture Typography & Styling
  'script',
  'selectedQuranFont',
  'arabicFontSize',
  'arabicLineHeight',
  'arabicTextColor',
  'arabicActiveColor',
  'arabicActiveGlow',
  'ayahFontOverrides',
  'autoAdjustFontSizeByLength',

  // Subtitles
  'showPrimaryTranslation',
  'primaryTranslationLang',
  'primaryTranslationFile',
  'primaryFontSize',
  'primaryTextColor',
  'showSecondaryTranslation',
  'secondaryTranslationLang',
  'secondaryTranslationFile',
  'secondaryFontSize',
  'secondaryTextColor',

  // Layout, Reordering, Alignment & Container
  'scriptLayoutOrder',
  'showTranslationContainer',
  'textAlignment',
  'verticalAlignment',
  'verticalCustomOffset',
  'showSurahHeader',
  'headerLanguage',

  // Scripture & Subtitle In/Out Motion Animations
  'animationIn',
  'animationOut',
  'animationDurationFrames',
  'staggerSubtitles',

  // Layout & Background
  'aspectRatio',
  'backgroundType',
  'backgroundPath',
  'backgroundClips',
  'defaultTransition',
  'overlayOpacity',
  'vignetteIntensity',
  'kenBurnsEffect',

  // Audio & Waveform
  'reciterIndex',
  'recitationSpeed',
  'showWaveform',
  'waveformType',
  'waveformColor',
  'waveformHeight',
  'waveformWidth',
  'waveformAmplitude',
  'waveformPositionY',

  // Branding
  'showBranding',
  'logoPath',
  'channelHandle',
  'brandingPosition',
  'brandingScale',

  // Channel Intro Video Bumper
  'enableIntroVideo',
  'introMode',
  'introPreset',
  'introTitle',
  'introSubtitle',
  'introCustomLogo',
  'introThemeColor',
  'introVideoPath',
  'introVideoDurationSeconds',
  'skipIntroForShorts',
  'introMuted',
  'introTransition',

  // Video Output
  'fps',
  'resolution',
];

export class SettingsService {
  private db: Database.Database | null = null;

  private getDatabasePath(): string {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    if (!fs.existsSync(userDataPath)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
      } catch (err) {
        console.error('Failed to create userData directory:', err);
      }
    }
    return path.join(userDataPath, 'user-settings.db');
  }

  private getDb(): Database.Database {
    if (!this.db) {
      const dbPath = this.getDatabasePath();
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.initSchema();
    }
    return this.db;
  }

  private initSchema(): void {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  public loadSettings(): Partial<VideoTemplateConfig> {
    try {
      const db = this.getDb();
      const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
        key: string;
        value: string;
      }>;

      const result: Partial<VideoTemplateConfig> = {};
      const persistableSet = new Set<string>(PERSISTABLE_CONFIG_KEYS);

      for (const row of rows) {
        if (!persistableSet.has(row.key)) continue;
        try {
          (result as any)[row.key] = JSON.parse(row.value);
        } catch (parseErr) {
          console.warn(`Failed to parse setting value for key: ${row.key}`, parseErr);
        }
      }
      return result;
    } catch (err) {
      console.error('Failed to load settings from database:', err);
      return {};
    }
  }

  public saveSettings(settings: Partial<VideoTemplateConfig>): void {
    if (!settings || typeof settings !== 'object') return;

    try {
      const db = this.getDb();
      const now = Date.now();
      const upsertStmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);
      const deleteStmt = db.prepare(`
        DELETE FROM settings WHERE key = ?
      `);

      const saveTx = db.transaction((entries: Array<{ key: string; value: any }>) => {
        for (const entry of entries) {
          if (entry.value === undefined || entry.value === null) {
            deleteStmt.run(entry.key);
          } else {
            upsertStmt.run(entry.key, JSON.stringify(entry.value), now);
          }
        }
      });

      const entries: Array<{ key: string; value: any }> = [];
      for (const key of PERSISTABLE_CONFIG_KEYS) {
        if (key in settings) {
          entries.push({ key, value: settings[key] });
        }
      }

      if (entries.length > 0) {
        saveTx(entries);
      }
    } catch (err) {
      console.error('Failed to save settings to database:', err);
    }
  }

  public resetSettings(): void {
    try {
      const db = this.getDb();
      const placeholders = PERSISTABLE_CONFIG_KEYS.map(() => '?').join(',');
      db.prepare(`DELETE FROM settings WHERE key IN (${placeholders})`).run(...PERSISTABLE_CONFIG_KEYS);
    } catch (err) {
      console.error('Failed to reset settings in database:', err);
    }
  }

  public getLastDirectory(category: string): string | null {
    try {
      const db = this.getDb();
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(`last_dir_${category}`) as
        | { value: string }
        | undefined;
      if (row && row.value) {
        const parsed = JSON.parse(row.value);
        if (typeof parsed === 'string' && fs.existsSync(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error(`Failed to get last directory for ${category}:`, err);
    }
    return null;
  }

  public setLastDirectory(category: string, dirPath: string): void {
    try {
      if (!dirPath || typeof dirPath !== 'string') return;
      const db = this.getDb();
      const now = Date.now();
      db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run(`last_dir_${category}`, JSON.stringify(dirPath), now);
    } catch (err) {
      console.error(`Failed to set last directory for ${category}:`, err);
    }
  }

  public close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch (err) {
        console.error('Failed to close settings database:', err);
      }
      this.db = null;
    }
  }
}

export const settingsService = new SettingsService();
