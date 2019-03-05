import {Database} from './src/app/services/database'

(function() {
    let db = new Database();
    db.seed((event, table, target, value) => {
        postMessage({event, table, target, value}, null);
    }).then(() => {
        postMessage({event: 'all-complete', table: '', target: 100, value: 0}, null);
    }).catch(e => {
        postMessage({event: 'error', error: e}, null);
    });
})()
