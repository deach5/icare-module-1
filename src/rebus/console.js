var storeKey = 'console.log',
    data,
    $output = $('#console-output');

// https://developer.mozilla.org/en/docs/Web/API/Window/getComputedStyle
var getCss = function (el) {
    var styles = window.getComputedStyle(el),
        style,
        res = {};
    for (var i = 0; i < styles.length; i++) {
        style = styles[i];
        res[style] = styles.getPropertyValue(style);
    }
    return res;
};

var evaluateAndSerialize = function (command) {
    var eval2 = eval;
    try {
        return rebus.entitySerializer.serialize(eval2(command));
    } catch (e) {
        return '<span class="console-error">' + e.message + '</span>';
    }
};

var addCommandToOutput = function (command) {
    $output.append([
        '<div class="console-line">',
            '<div class="console-command">&gt; ' + rebus.entitySerializer.htmlEncode(command) + '</div>',
            '<div class="console-command-eval">' + evaluateAndSerialize(command) + '</div>',
        '</div>'
    ].join('\n'));
};

var addStyleToOutput = function (selector) {
    var parts = selector.split('|'),
        $selector, styles, prop;
    try {
        if (parts.length > 1) {
            selector = parts[0].trim();
            prop = parts[1].trim();
        }
        $selector = $(selector);
        if ($selector.length) {
            if (prop) {
                $output.append([
                    '<div class="console-line">',
                    '<div class="console-command">&gt; ' + rebus.entitySerializer.htmlEncode(selector + ' | ' + prop) + '</div>',
                    '<div class="console-selector-styles">',
                    '<span class="key">' + prop + ':<span>',
                    '<span class="value">' + rebus.entitySerializer.htmlEncode(window.getComputedStyle($selector[0]).getPropertyValue(prop)) + '<span>',
                    '</div>',
                    '</div>'
                ].join('\n'));
            }
            else {
                styles = getCss($selector[0]);
                $output.append([
                    '<div class="console-line">',
                    '<div class="console-command">&gt; ' + rebus.entitySerializer.htmlEncode(selector) + '</div>',
                    '<div class="console-selector-styles">' + rebus.entitySerializer.serialize(styles) + '</div>',
                    '</div>'
                ].join('\n'));
            }
        }
        else {
            $output.append([
                '<div class="console-line">',
                '<div class="console-command">&gt; ' + rebus.entitySerializer.htmlEncode(selector) + '</div>',
                '<div class="console-selector-styles"><span class="console-error">Not found</span></div>',
                '</div>'
            ].join('\n'));
        }
    } catch (e) {
        $output.append('<div class="console-error">' + e.message + '</div>');
    }
};

var load = function () {
    $.each(data, function (i, item) {
        if (item.command) {
            addCommandToOutput(item.command);
        }
        else if (item.selector) {
            addStyleToOutput(item.selector);
        }
    });
};

export default {
    init: function () {
        $output = $('#console-output');
        data = sessionStorage.getItem(storeKey);
        data = data ? JSON.parse(data) : [];
        load();
        $('#btn-eval').on('click', function () {
            var command = $('#txt-eval').val();
            if (command) {
                command = command.trim();
                if (command.length) {
                    data.push({ command: command });
                    sessionStorage.setItem(storeKey, JSON.stringify(data));
                    addCommandToOutput(command);
                }
            }
        });
        $('#btn-get-styles').on('click', function () {
            var selector = $('#txt-eval').val();
            if (selector) {
                selector = selector.trim();
                if (selector.length) {
                    data.push({ selector: selector });
                    sessionStorage.setItem(storeKey, JSON.stringify(data));
                    addStyleToOutput(selector);
                }
            }
        });
        //$('#txt-eval').on('keydown', function (e) {
        //    if (e.which === 13 && !e.shiftKey) {
        //        $('#btn-eval').trigger('click');
        //        return false;
        //    }
        //});
        $('.btn-clear-console').on('click', function () {
            $output.empty();
            data = [];
            sessionStorage.setItem(storeKey, JSON.stringify(data));
        });
    }
};
