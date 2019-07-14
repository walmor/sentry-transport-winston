import Sentry from '@sentry/node';
import Transport from 'winston-transport';

import { SentryLevelsMap, DEFAULT_LEVELS_MAP } from './sentry-levels-map';
import { isSentryUser } from './helpers';

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
    let { level, message, error, tags, user, ...extra } = info;

    level = this.levelsMap[level] || this.levelsMap.error;

    Sentry.withScope(scope => {
      scope.setLevel(level);

      if (tags) {
        scope.setTags(tags);
      }

      if (isSentryUser(user)) {
        scope.setUser(user);
      } else {
        extra.user = user;
      }

      if (error && message) {
        extra.message = message;
      }

      for (const key in extra) {
        scope.setExtra(key, extra[key]);
      }

      if (error) {
        Sentry.captureException(error);
      } else if (message) {
        Sentry.captureMessage(message);
      }

      next();
    });
  }
}
