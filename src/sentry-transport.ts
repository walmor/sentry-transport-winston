import * as Sentry from '@sentry/node';
import Transport from 'winston-transport';

import { SentryLevelsMap, DEFAULT_LEVELS_MAP } from './sentry-levels-map';

interface ExtraObject {
  [key: string]: any;
}

export interface SentryTransportOpts extends Transport.TransportStreamOptions {
  sentryOpts: Sentry.NodeOptions;
  levelsMap?: SentryLevelsMap;
}

export class SentryTransport extends Transport {
  readonly levelsMap: SentryLevelsMap;

  constructor(opts: SentryTransportOpts) {
    super(opts);

    this.levelsMap = opts.levelsMap || DEFAULT_LEVELS_MAP;

    Sentry.init(opts.sentryOpts);
  }

  log(info: any, next: () => void): any {
    Sentry.withScope(scope => {
      const { level, message, tags, user, fingerprint, ...rest } = info;

      scope.setLevel(this.levelsMap[level]);

      if (tags) {
        scope.setTags(tags);
      }

      if (fingerprint) {
        scope.setFingerprint(Array.isArray(fingerprint) ? fingerprint : [fingerprint]);
      }

      const extra = this.getExtra(rest);

      if (this.isSentryUser(user)) {
        scope.setUser(user);
      } else if (user) {
        extra.user = user;
      }

      if (Object.keys(extra).length > 0) {
        scope.setExtras(extra);
      }

      let error = null;

      if (this.isError(info)) {
        error = info;
      } else if (this.isError(message)) {
        error = message;
      }

      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message);
      }

      next();
    });
  }

  isSentryUser(user: any): user is Sentry.User {
    if (!user) {
      return false;
    }

    return (
      typeof user.id === 'string' ||
      typeof user.username === 'string' ||
      typeof user.email === 'string' ||
      typeof user.ip_address === 'string'
    );
  }

  private isError(obj: any): boolean {
    if (!obj) {
      return false;
    }

    return typeof obj.message === 'string' && typeof obj.stack === 'string';
  }

  private getExtra(rest: object): ExtraObject {
    const entries = Object.entries(rest);

    return entries.reduce((extra: ExtraObject, [key, value]) => {
      extra[key] = value;
      return extra;
    }, {});
  }
}
