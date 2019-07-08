import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'dexie-syncable';

(function() {
  if (/wipe\/?$/.test(location.pathname)) {
      indexedDB.deleteDatabase('nutrition-data');
      const newPath = location.href.replace(/wipe\/?$/, '');
      window.location.href = newPath;
  }
})();


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
