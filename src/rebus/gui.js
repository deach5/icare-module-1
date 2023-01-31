var disableable = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTGROUP', 'OPTION', 'FIELDSET'];

var canBeDisabled = function ($element) {
    return disableable.indexOf($element.prop('nodeName')) >= 0;
};

export default {
    hide: function ($element) {
        $element.removeAttr('hidden');
    },
    fadeIn: function ($element, options) {
        options = options || {};
        if ($element.length && $element.attr('hidden')) {
            $element.fadeIn(options.speed || 400, function () {
                $element.removeAttr('hidden');
                if (options.callback) {
                    options.callback();
                }
            });
        } else if (options.callback) {
            options.callback();
        }
    },
    fadeOut: function ($element, options) {
        options = options || {};
        if ($element.length && !$element.attr('hidden')) {
            $element.fadeOut(options.speed || 400, function () {
                $element.attr('hidden', 'true');
                if (options.callback) {
                    options.callback();
                }
            });
        } else if (options.callback) {
            options.callback();
        }
    },
    enable: function ($element) {
        if ($element.length) {
            $element.removeAttr('disabled').removeAttr('aria-disabled');
        }
        return $element;
    },
    disable: function ($element) {
        if ($element.length) {
            if (canBeDisabled($element)) {
                $element.prop('disabled', true);
            } else {
                $element.attr('aria-disabled', true);
            }
        }
        return $element;
    },
    setEnabledState: function ($element, enabled) {
        if (enabled) {
            return this.enable($element);
        } else {
            return this.disable($element);
        }
    }
};
