import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initSentry } from '@core/monitoring/sentry.init';

initSentry();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
