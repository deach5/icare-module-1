var FLAT_TYPES = 'string number boolean date'.split(' ');

var htmlEncode = function (value) {
    return $('<div/>').text(value).html();
};

var isSmallPlainArray = function (arr) {
    var res = true;
    if (arr.length > 30) {
        return false;
    }
    $.each(arr, function () {
        if (FLAT_TYPES.indexOf($.type(this)) === -1) {
            res = false;
            return false;
        }
    });
    return res;
};

// Serializes an object, array or simple value and does so recursively for object & arrays
var serialize = function (entity, isObjectValue, type) {
    var res = '';
    try {
        if (undefined === entity) {
            return isObjectValue ? ' <span class="value">undefined</span>' : ' undefined';
        }
        else if (entity === null) {
            return isObjectValue ? ' <span class="value">null</span>' : ' null';
        }
        else if ($.isArray(entity)) {
            if (isSmallPlainArray(entity)) {
                return htmlEncode(' [' + entity.join(', ') + ']');
            }
            res += ' <a href="#">Array</a><div class="expandable" hidden>';
            $.each(entity, function (i) {
                res += '<span class="key">' + i + ':' + '</span>' + serialize(this, true) + '<br />';
            });
            res += '</div>';
            return res;
        }
        else if ($.isFunction(entity)) {
            res += ' <a href="#">Function</a><div class="expandable" hidden><div>' + entity.toString() + '</div></div>';
            return res;
        }
        else if (FLAT_TYPES.indexOf($.type(entity)) === -1) {
            res += ' <a href="#">Object</a><div class="expandable" hidden>';
            Object.getOwnPropertyNames(entity).forEach(function (key) {
                res += '<span class="key">' + key + ':' + '</span>' + serialize(entity[key], true) + '<br />';
            });
            res += '</div>';
            return res;
        }
        if (isObjectValue) {
            return isObjectValue ? ' <span class="value">' + htmlEncode(entity) + '</span>' : ' ' + htmlEncode(entity);
        }
        else if (type) {
            return ' <span class="log-entry-type-' + type + '">' + htmlEncode(entity) + '</span>';
        }
        else {
            return ' <span>' + htmlEncode(entity) + '</span>';
        }
    } catch (e) {
        try {
            return JSON.serialize(entity);
        } catch (e2) {
            return '<span class="serialization-error">[Serialization Error] ' + e.message + '</span>';
        }
    }
};

export default {
    serialize: function (entity, type) {
        return serialize(entity, false, type);
    },
    htmlEncode: htmlEncode
};
