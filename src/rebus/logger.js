var types, prefixType,
    localStorageLogKey,
    logs;

var logSerializer = (function () {
    
    return {
        serialize: function (items) {
            var res = [];
            if (!items) {
                return 'Empty';
            }
            for (var i = 0; i < items.length; i++) {
                var line = '',
                    item = items[i];
                for (var j = 0; j < item.args.length; j++) {
                    line += rebus.entitySerializer.serialize(item.args[j], item.type);
                }
                res.push('<div class="line">' + line.trim() + '</div>');
            }
            return res.join('\n');
        }
    };
})();

var logCore = function (type, args) {
    if (!$.isArray(args)) {
        args = [args];
    }
    if (type && prefixType) {
        args.unshift('[' + type + '] ');
    }
    if (!logs) {
        logs = localStorage.getItem(localStorageLogKey);
        if (logs) {
            logs = JSON.parse(logs);
        }
        else {
            logs = [];
        }
    }
    logs.push({ type: type, args: args });
    localStorage.setItem(localStorageLogKey, JSON.stringify(logs));
};

/*
    Use just like console.log:
        log('log label', 10, true);
    Specify a type:
        log('type=lms', 'log label', 10, true);
    Supply an object:
        log('type=error', e);
    Supply a mix:
        log('type=lms', 'arg 1', true, [], { });

    If the logging is costly, defer it by supplying one argument with a function that returns one of the above formats.
    If more than one value is returned, use an Array:
        log(function () { return ['type="lms"', 'log label', 10, true, { }, []]; });
*/
var log = function () {
    var type, consoleArguments;
    if (types) {
        if ($.isFunction(arguments[0])) {
            consoleArguments = arguments[0]();
        }
        else {
            consoleArguments = Array.prototype.slice.call(arguments);
        }
        if (consoleArguments[0] + '' === consoleArguments[0] && ('' + consoleArguments[0]).indexOf('type=') === 0) {
            type = consoleArguments[0].split('=')[1];
            consoleArguments = consoleArguments.slice(1);
        }
        if (!type || types === '*' || types[type]) {
            logCore(type, consoleArguments);
        }
    }
};

export default {
    /*
        options: { 
            namespace: String,
            types: { 'type1': Boolean, 'type2': Boolean, ... } | '*' | undefined [undefined],
            prefixType: Boolean [false]
        }

        If types is not supplied, nothing is logged.

        Usage:
            rebus.logger.init({ namespace: 'cyber', types: '*', prefixType: true });
     */
    init: function (options) {
        options = options || { };
        localStorageLogKey = options.namespace ? options.namespace + '.log' : 'log';
        types = options.types;
        prefixType = options.prefixType;
        if (types) {
            window.onerror = function (msg, url, line, col, error) {
                if (msg !== 'ResizeObserver loop limit exceeded') {
                    var e = { msg: msg, url: url, line: line, col: col, error: error };
                    log('type=error', e.msg, e);
                    throw e;
                }
            };
        }
    },
    /*
        Use just like console.log:
            log('log label', 10, true);
        Specify a type:
            log('type=lms', 'log label', 10, true);
        Supply an object: 
            log('type=error', e);
        Supply a mix:
            log('type=lms', 'arg 1', true, [], { });

        If the logging is costly, defer it by supplying one argument with a function that returns one of the above formats.
        If more than one value is returned, use an Array:
            log(function () { return ['type="lms"', 'log label', 10, true, { }, []]; });
     */
    log: log,
    clearLog: function () {
        localStorage.removeItem(localStorageLogKey);
        logs = null;
    },
    serializeLog: function () {
        return logSerializer.serialize(JSON.parse(localStorage.getItem(localStorageLogKey)));
    }
};