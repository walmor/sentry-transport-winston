# A Sentry Transport for Winston@3

![winston](https://img.shields.io/badge/winston-v3.2.1-informational.svg)
![sentry](https://img.shields.io/badge/sentry-v5.5.0-informational.svg)

A [Sentry](https://sentry.io/) transport for [Wiston@3](https://github.com/winstonjs/) using [@sentry/node](https://github.com/getsentry/sentry-javascript/tree/master/packages/node) that allows logging context data, such as user, tags, fingerprint, and extra data. Learn more checking the [Sentry Documentation](https://docs.sentry.io/enriching-error-data/context/?platform=node).

## Installation

```bash
# npm
npm install sentry-transport-winston

# yarn
yarn add sentry-transport-winston
```

## Initializing

```typescript
import { SentryTransport } from 'sentry-transport-winston';

const opts: SentryTransportOpts = {
  sentryOpts: {
    dns: '<sentry-dns>',
  },
};

const sentry = new SentryTransport(opts);

const logger = winston.createLogger({
  transports: [sentry],
});
```

### Transport Options

The `SentryTransportOpts` interface is extending the `TransportStreamOptions` so you can pass any options that are handled by the base winston transport stream, such as `format`. Take a look [here](https://github.com/winstonjs/winston-transport/blob/46db8f3c8cd8b106ade8d7e04a191ee388683d60/index.d.ts#L25) to see all the available options.

### Sentry Options

The `SentryTransportOpts` includes the property `sentryOpts` which is passed directly to the `Sentry.init()` method, without any changes. All available options can be found on [Sentry documentation](https://docs.sentry.io/error-reporting/configuration/?platform=browser).

### Levels Mapping

`SentryTransport` is using the npm logging levels by default (just like winston does) and mapping them to Sentry logging levels:

```typescript
export const DEFAULT_LEVELS_MAP: SentryLevelsMap = {
  error: Severity.Error,
  warn: Severity.Warning,
  info: Severity.Info,
  verbose: Severity.Info,
  debug: Severity.Debug,
  silly: Severity.Debug,
};
```

If you're using different logging levels, you can pass a custom map using the `levelsMap` option.

## Logging

### Simple message

```typescript
logger.info('Error message.');
```

### Error message

```typescript
logger.error(new Error('Error message'));
```

### Tags

You can [tag an event](https://docs.sentry.io/enriching-error-data/context/?platform=node#tagging-events) using the `tags` property:

```typescript
const tags = { module: 'users', language: 'english' };

logger.error('Error message.', { tags });
```

### User

You can [capture the user](https://docs.sentry.io/enriching-error-data/context/?platform=node#capturing-the-user) using the `user` property:

```typescript
const user = { username: 'test-user' };

logger.error('Error message.', { user });
```

The user object must have at least one of the following properties: `id`, `email`, `username` or `ip_address`. Otherwise it will be logged as extra data.

### Fingerprint

You can [set a fingerprint](https://docs.sentry.io/enriching-error-data/context/?platform=node#setting-the-fingerprint) using the `fingerprint` property.

```typescript
const fingerprint = ['{{ default }}', 'my-fingerprint'];

logger.error('Error message.', { fingerprint });
```

If the `fingerprint` is not an array it will be converted to one.

```typescript
const fingerprint = 'my-fingerprint'; // it'll be converted to ['my-fingerprint'];

logger.error('Error message.', { fingerprint });
```

### Extra data

Any other data which is not named as `tags`, `user` or `fingerprint` will be logged as [extra data](https://docs.sentry.io/enriching-error-data/context/?platform=node#extra-context).

```typescript
logger.error('Error message.', { url: '/users', input: 'some-input' });
```

## License

This project is [MIT Licensed](LICENSE).
