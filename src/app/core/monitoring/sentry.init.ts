import * as Sentry from '@sentry/angular';
import { environment } from '@env/environment';

export function initSentry() {
  if (!environment.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
  });
}

