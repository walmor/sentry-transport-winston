export interface SentryLevelsMap {
  [level: string]: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

export const DEFAULT_LEVELS_MAP: SentryLevelsMap = {
  error: 'error',
  warn: 'warning',
  info: 'info',
  verbose: 'debug',
  debug: 'debug',
  silly: 'debug',
};
