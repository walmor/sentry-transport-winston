import { SentryTransport, SentryTransportOpts } from '../src';
import * as Sentry from '@sentry/node';
import { DEFAULT_LEVELS_MAP, SentryLevelsMap } from '../src/sentry-levels-map';

jest.mock('@sentry/node');

afterEach(() => {
  jest.clearAllMocks();
});

describe('The SentryTransport', () => {
  describe('when checking if a user is a Sentry user', () => {
    it('should return false if the user is undefined', () => {
      const result = SentryTransport.isSentryUser(undefined);
      expect(result).toBe(false);
    });

    it('should return false if the user is null', () => {
      const result = SentryTransport.isSentryUser(undefined);
      expect(result).toBe(false);
    });

    it('should return false if the user is not an object', () => {
      const result = SentryTransport.isSentryUser('test-user');
      expect(result).toBe(false);
    });

    it('should return false if the user does not have any properties', () => {
      const result = SentryTransport.isSentryUser({});
      expect(result).toBe(false);
    });

    it('should return false if the user has only a numeric id property', () => {
      const result = SentryTransport.isSentryUser({ id: 999 });
      expect(result).toBe(false);
    });

    it('should return true if the user has a stringified id property', () => {
      const result = SentryTransport.isSentryUser({ id: '999' });
      expect(result).toBe(true);
    });

    it('should return true if the user has a username property', () => {
      const result = SentryTransport.isSentryUser({ username: 'test-user ' });
      expect(result).toBe(true);
    });

    it('should return true if the user has an email property', () => {
      const result = SentryTransport.isSentryUser({ email: 'test-user@example.com' });
      expect(result).toBe(true);
    });

    it('should return true if the user has an ip_address property', () => {
      const result = SentryTransport.isSentryUser({ ip_address: '127.0.0.1' });
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
      const tranport = getSentryTransport();

      const info = { level: 'error', message: 'Error messsage.' };

      tranport.log(info, () => {});

      expect(scope.setLevel).toHaveBeenCalledWith(info.level);
    });

    it('should set the scope tags', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const tags = { value1: 'v1', value2: 'v2' };
      const info = { level: 'info', message: 'Error messsage.', tags };

      tranport.log(info, () => {});

      expect(scope.setTags).toHaveBeenCalledWith(info.tags);
    });

    it('should set the scope user if it is a valid Sentry user', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const info = { level: 'error', user: { id: '1212' }, message: 'Error message.' };

      tranport.log(info, () => {});

      expect(scope.setUser).toHaveBeenCalledWith(info.user);
    });

    it('should set the user as extra info if it is not a valid Sentry user', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const info = { level: 'error', user: 'test-user', message: 'Error message.' };

      tranport.log(info, () => {});

      expect(scope.setUser).not.toHaveBeenCalled();
      expect(scope.setExtras).toHaveBeenCalledWith({ user: info.user });
    });

    it('should set the message as extra info when logging an error', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const error = new Error('Error message');
      const info = { level: 'error', message: 'Custom error message.', error };

      tranport.log(info, () => {});

      expect(scope.setExtras).toHaveBeenCalledWith({ message: info.message });
    });

    it('should set the scope extra info when additional properties are provided', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const extra = { extra1: 'ex1', extra2: 'ex2' };
      const info = { level: 'error', message: 'Error message.', ...extra };

      tranport.log(info, () => {});

      expect(scope.setExtras).toHaveBeenCalledWith(extra);
    });

    it('should call the captureMessage method when logging a message', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const info = { level: 'debug', message: 'Error message.' };

      tranport.log(info, () => {});

      expect(Sentry.captureMessage).toHaveBeenCalledWith(info.message);
    });

    it('should call the captureException method when logging an error', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const error = new Error('Error message');
      const info = { level: 'debug', message: 'Error message.', error };

      tranport.log(info, () => {});

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should call the next callback', () => {
      const scope = getMockedScope();
      const tranport = getSentryTransport();

      const info = { level: 'debug', message: 'Error message.' };
      const next = jest.fn();

      tranport.log(info, next);

      expect(next).toHaveBeenCalled();
    });

    function getSentryTransport() {
      return new SentryTransport({ sentryOpts: {} });
    }

    function getMockedScope() {
      const scope = ({
        setLevel: jest.fn(),
        setTags: jest.fn(),
        setUser: jest.fn(),
        setExtras: jest.fn(),
      } as unknown) as Sentry.Scope;

      jest.spyOn(Sentry, 'withScope').mockImplementationOnce(fn => fn(scope));

      return scope;
    }
  });
});
