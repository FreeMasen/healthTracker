import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'dexie-syncable';

(function() {
  if (/wipe\/?$/.test(location.pathname)) {
    const deleteOp = indexedDB.deleteDatabase('nutrition-data')
    deleteOp.onsuccess = () => {
      const newPath = location.href.replace(/wipe\/?$/, '');
      window.location.href = newPath;
    };
    deleteOp.onerror = (e) => {
      throw e;
    };
  } else {
    if (environment.production) {
      enableProdMode();
    }
    
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  }
})();



