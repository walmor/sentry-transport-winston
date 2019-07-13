import Sentry from '@sentry/node';

export function isSentryUser(user: any): user is Sentry.User {
  if (!user) return false;

  return (
    typeof user.id === 'string' ||
    typeof user.username === 'string' ||
    typeof user.email === 'string' ||
    typeof user.ip_address === 'string'
  );
}
