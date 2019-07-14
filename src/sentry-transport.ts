import * as Sentry from '@sentry/node';
import Transport from 'winston-transport';

import { SentryLevelsMap, DEFAULT_LEVELS_MAP } from './sentry-levels-map';

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
      const { level, message, error, tags, user, ...extra } = info;

      scope.setLevel(this.levelsMap[level]);

      if (tags) {
        scope.setTags(tags);
      }

      if (SentryTransport.isSentryUser(user)) {
        scope.setUser(user);
      } else if (user) {
        extra.user = user;
      }

      if (error && message) {
        extra.message = message;
      }

      scope.setExtras(extra);

      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message);
      }

      next();
    });
  }

  static isSentryUser(user: any): user is Sentry.User {
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
}
