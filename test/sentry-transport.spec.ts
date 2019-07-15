import * as Sentry from '@sentry/node';
import * as winston from 'winston';

import { SentryTransport, SentryTransportOpts } from '../src';
import { DEFAULT_LEVELS_MAP, SentryLevelsMap } from '../src/sentry-levels-map';

jest.mock('@sentry/node');

afterEach(() => {
  jest.clearAllMocks();
});

describe('The SentryTransport', () => {
  describe('when checking if a user is a Sentry user', () => {
    it('should return false if the user is undefined', () => {
      const result = getSentryTransport().isSentryUser(undefined);
      expect(result).toBe(false);
    });

    it('should return false if the user is null', () => {
      const result = getSentryTransport().isSentryUser(undefined);
      expect(result).toBe(false);
    });

    it('should return false if the user is not an object', () => {
      const result = getSentryTransport().isSentryUser('test-user');
      expect(result).toBe(false);
    });

    it('should return false if the user does not have any properties', () => {
      const result = getSentryTransport().isSentryUser({});
      expect(result).toBe(false);
    });

    it('should return false if the user has only a numeric id property', () => {
      const result = getSentryTransport().isSentryUser({ id: 999 });
      expect(result).toBe(false);
    });

    it('should return true if the user has a stringified id property', () => {
      const result = getSentryTransport().isSentryUser({ id: '999' });
      expect(result).toBe(true);
    });

    it('should return true if the user has a username property', () => {
      const result = getSentryTransport().isSentryUser({ username: 'test-user ' });
      expect(result).toBe(true);
    });

    it('should return true if the user has an email property', () => {
      const result = getSentryTransport().isSentryUser({ email: 'test-user@example.com' });
      expect(result).toBe(true);
    });

    it('should return true if the user has an ip_address property', () => {
      const result = getSentryTransport().isSentryUser({ ip_address: '127.0.0.1' });
      expect(result).toBe(true);
    });
  });

  describe('when initializing', () => {
    it('should initialize the Sentry library', () => {
      const opts: SentryTransportOpts = {
        sentryOpts: {},
      };

      const tranport = new SentryTransport(opts);

      expect(Sentry.init).toHaveBeenCalledWith(opts.sentryOpts);
    });

    it('should use the provided levels map', () => {
      const levelsMap: SentryLevelsMap = {
        error: Sentry.Severity.Error,
        verbose: Sentry.Severity.Debug,
      };

      const opts: SentryTransportOpts = {
        levelsMap,
        sentryOpts: {},
      };

      const tranport = new SentryTransport(opts);

      expect(tranport.levelsMap).toMatchObject(levelsMap);
    });

    it('should use the default levels map if no one is provided', () => {
      const opts: SentryTransportOpts = {
        levelsMap: undefined,
        sentryOpts: {},
      };

      const tranport = new SentryTransport(opts);

      expect(tranport.levelsMap).toMatchObject(DEFAULT_LEVELS_MAP);
    });
  });

  describe('when logging', () => {
    it('should set the scope level', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const level = 'error';

      logger.log(level, 'Error messsage.');

      expect(scope.setLevel).toHaveBeenCalledWith(level);
    });

    it('should set the scope tags', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const tags = { value1: 'v1', value2: 'v2' };

      logger.error('Error messsage.', { tags });

      expect(scope.setTags).toHaveBeenCalledWith(tags);
    });

    it('should set the scope fingerprint', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const fingerprint = ['any-fingerprint'];

      logger.error('Error messsage.', { fingerprint });

      expect(scope.setFingerprint).toHaveBeenCalledWith(fingerprint);
    });

    it('should set the scope fingerprint even if passed as a value', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const fingerprint = 'any-fingerprint-value';

      logger.error('Error messsage.', { fingerprint });

      expect(scope.setFingerprint).toHaveBeenCalledWith([fingerprint]);
    });

    it('should not set any extra info if nothing is passed', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      logger.error('Error messsage.');

      expect(scope.setExtras).not.toHaveBeenCalled();
    });

    it('should set the scope user if it is a valid Sentry user', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const user = { id: '1212' };

      logger.error('Error message.', { user });

      expect(scope.setUser).toHaveBeenCalledWith(user);
      expect(scope.setExtras).not.toHaveBeenCalled();
    });

    it('should set the user as extra info if it is not a valid Sentry user', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const user = 'stringified-user';

      logger.error('Error message.', { user });

      expect(scope.setUser).not.toHaveBeenCalled();
      expect(scope.setExtras).toHaveBeenCalledWith({ user });
    });

    it('should set the scope extra info when additional properties are provided', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const extra = { extra1: 'ex1', extra2: 'ex2' };

      logger.error('Error message.', { ...extra });

      expect(scope.setExtras).toHaveBeenCalledWith(extra);
    });

    it('should call the captureMessage method when logging a string message', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const message = 'Error message.';

      logger.error(message);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(message);
    });

    it('should call the captureException method when logging an error', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const error = new Error('Error message');

      logger.error(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should call the captureException method when logging an error with extra info', () => {
      const scope = getMockedScope();
      const logger = getLogger();

      const extra = { extra1: 'ex1', extra2: 'ex2' };
      const error = new Error('Error message');
      const info = { message: error.message, stack: error.stack, ...extra };

      logger.error(info);

      expect(Sentry.captureException).toHaveBeenCalledWith(info);
    });
  });

  function getSentryTransport() {
    return new SentryTransport({ sentryOpts: {} });
  }

  function getLogger() {
    const transport = getSentryTransport();
    const logger = winston.createLogger({
      transports: [transport],
    });

    return logger;
  }

  function getMockedScope() {
    const scope = ({
      setLevel: jest.fn(),
      setTags: jest.fn(),
      setUser: jest.fn(),
      setExtras: jest.fn(),
      setFingerprint: jest.fn(),
    } as unknown) as Sentry.Scope;

    jest.spyOn(Sentry, 'withScope').mockImplementationOnce(fn => fn(scope));

    return scope;
  }
});
