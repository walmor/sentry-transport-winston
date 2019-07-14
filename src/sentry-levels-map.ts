import { Severity } from '@sentry/node';

export interface SentryLevelsMap {
  [level: string]: Severity;
}

export const DEFAULT_LEVELS_MAP: SentryLevelsMap = {
  error: Severity.Error,
  warn: Severity.Warning,
  info: Severity.Info,
  verbose: Severity.Log,
  debug: Severity.Debug,
  silly: Severity.Debug,
};
