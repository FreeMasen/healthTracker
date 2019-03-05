var data_1 = require('./src/app/services/data');
(function () {
    var db = new data_1.Data(null);
    db.seed(function (event, table, target, value) {
        postMessage({ event: event, table: table, target: target, value: value }, null);
    });
})();
