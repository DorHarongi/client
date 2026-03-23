import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import posthog from 'posthog-js';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.posthogKey) {
  posthog.init(environment.posthogKey, {
    api_host: 'https://us.i.posthog.com',
    autocapture: true,
  });
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
