var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var core_1 = require('@angular/core');
var Messenger = (function () {
    function Messenger() {
        this.queue = [];
    }
    Messenger.prototype.registerListener = function (listener) {
        this.listener = listener;
        if (this.queue.length > 0) {
            var msg;
            while (msg = this.queue.shift()) {
                this.listener.apply(this, msg);
            }
        }
    };
    Messenger.prototype.send = function (message, isError) {
        if (this.listener) {
            this.listener(message, isError);
        }
        else {
            this.queue.push([message, isError]);
        }
    };
    Messenger = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], Messenger);
    return Messenger;
})();
exports.Messenger = Messenger;
