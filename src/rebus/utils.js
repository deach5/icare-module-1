// resizeStart event
(function ($) {
    var INTERVAL = 250;
    var poll = function () {
        var $this = $(this),
            data = $this.data('resizeStart');
        if (data.raise) {
            $this.trigger('resizeStart');
            data.raise = false;
        }
        clearTimeout(data.timeoutId);
        data.timeoutId = setTimeout(function () {
            data.raise = true;
        }, INTERVAL);
    };
    $.event.special['resizeStart'] = {
        setup: function () {
            $(this).data('resizeStart', {
                raise: true
            }).on("resize", poll);
        },
        teardown: function () {
            var $this = $(this),
                data = $this.data('resizeStart');
            if (data.timeoutId) {
                window.clearTimeout(data.timeoutId);
            }
            $this.removeData('resizeStart').off("resize", poll);
        }
    };
    $.fn['resizeStart'] = function (a, b) {
        return arguments.length > 0 ? this.on('resizeStart', null, a, b) : this.trigger('resizeStart');
    };
})(jQuery);

var OnSafeActionEnd = function (event, $element, expectedDuration, callback) {
    var target = $element[0],
        complete,
        timeoutId;

    $element.on(event, function (e) {
        if (e.originalEvent.target === target) {
            $element.off(event);
            if (!complete) {
                complete = true;
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }
                callback();
            }
        }
    });

    timeoutId = window.setTimeout(function () {
        if (!complete) {
            complete = true;
            timeoutId = null;
            $element.off(event);
            callback();
        }
    }, expectedDuration + 500);

    return {
        cancel: function () {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
                timeoutId = null;
            }
            $element.off(event);
            complete = true;
        }
    };
};

/*
    <div id="live-feedback" class="sr-only" aria-live="assertive" aria-atomic="true" data-clearafter="5000"></div>

    var $fb = $('#live-feedback').liveFeedback({ clearafter: 5000 });
    $fb.liveFeedback('value', '.....');
    $fb.liveFeedback('value', '.....', { silent: true }); // aria-live is temporarily removed during the update
 */
(function (undefined) {
    'use strict';

    var defaults = {
        clearafter: null
    };

    var setHTML = function ($fb, html, options) {
        var old = $fb.html(),
            data = $fb.data('rebus-live-feedback'),
            sameContent = html === old,
            ariaLive;
        options = options || {};
        window.clearTimeout(data.timeoutId);
        if (options.silent) {
            ariaLive = $fb.attr('aria-live');
            $fb.removeAttr('aria-live');
        }
        if (sameContent) {
            $fb.html('');
        }
        var setContent = function () {
            $fb.html(html);
            if (options.silent) {
                data.timeoutId = window.setTimeout(function () {
                    $fb.attr('aria-live', ariaLive);
                }, 100);
            }
            if (data.settings.clearafter && html !== '') {
                data.timeoutId = window.setTimeout(function () {
                    $fb.empty();
                }, data.settings.clearafter);
            }
        };
        if (sameContent) {
            data.timeoutId = window.setTimeout(setContent, 100);
        } else {
            setContent();
        }
    };

    $.fn.liveFeedback = function (options) {
        var collectionSettings;

        if (options === 'value') {
            var value, opts;
            if (arguments.length === 1) {
                return $(this).html();
            }
            value = arguments[1];
            opts = arguments.length > 2 ? arguments[2] : null;
            return this.each(function () {
                setHTML($(this), value, opts);
            });
        } else if (options === 'clearafter') {
            var clearafter;
            if (arguments.length === 1) {
                return $(this).data('rebus-live-feedback').settings.clearafter;
            }
            clearafter = arguments[1];
            return this.each(function () {
                $(this).data('rebus-live-feedback').settings.clearafter = clearafter;
            });
        }

        collectionSettings = $.extend({}, defaults, options);

        return this.each(function () {
            var settings = {},
                $this = $(this);
            $.each(collectionSettings, function (key, val) {
                var value = $this.data(key);
                settings[key] = value !== undefined ? value : val;
            });
            $this.data({
                'rebus-live-feedback': {
                    settings: settings,
                    timeoutId: null
                }
            });
        });
    };
}());

$.fn.accessibleCarousel = function () {
    return this.each(function () {
        var $carousel = $(this),
            slideCount = $('.item', $carousel).length,
            wrap = undefined === $carousel.attr('data-wrap') || $carousel.attr('data-wrap') === 'true';
        if (slideCount) {
            if (!wrap) {
                $('[data-slide="prev"]', $carousel).attr('aria-disabled', true);
            }
            $('.item', $carousel).each(function (i) {
                $(this).attr('tabindex', -1).prepend('<p class="sr-only">Item ' + (i + 1) + ' of ' + slideCount + '</p>')
            });
            $carousel.on('slid.bs.carousel', function (e) {
                var i = $(e.relatedTarget).index();
                e.relatedTarget.focus();
                if (!wrap) {
                    $('[data-slide="prev"]', $carousel).attr('aria-disabled', i === 0);
                    $('[data-slide="next"]', $carousel).attr('aria-disabled', i === slideCount - 1);
                }
            });
        }
    });
};

export default {
    onTransitionEnd: function ($element, expectedDuration, callback) {
        return OnSafeActionEnd("transitionend webkitTransitionEnd oTransitionEnd", $element, expectedDuration, callback);
    },
    onAnimationEnd: function ($element, expectedDuration, callback) {
        return OnSafeActionEnd("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", $element, expectedDuration, callback);
    },
    scrollTop: function () {
        // Overkill but who gives a shit?
        if (top !== self) {
            $(top).scrollTop(0).find('html, body, iframe').scrollTop(0);
        }
        $('html,body').eq(0).scrollTop(0);
    },
    scrollTo: function ( $el, buffer = 20 ) {
        var heightOfHeader = $('header.masthead').height() + buffer; //px
        window.scrollTo( {
            behavior: 'smooth',
            top: $el.offset().top - heightOfHeader
        } );
    },
    scrollToAnchor: function (name) {
        this.scrollTo( $("a[name='"+ name +"']") );
    },
    /* scroll to anchor, but place at top of viewport */
    scrollToAnchorTop: function (name) {
        this.scrollTo( $("a[name='"+ name +"']"), $('html,body').scrollTop() );
    },
    // string.format(s, args). http://stackoverflow.com/a/4896643/120399
    stringf: function (tokenised) {
        var args = arguments;
        return tokenised.replace(/{[0-9]}/g, function (matched) {
            matched = matched.replace(/[{}]/g, "");
            return args[parseInt(matched, 10) + 1];
        });
    },
    extractQueryStringArg: function (name, url) {
        if (!url) url = window.location.href;
        url = url.toLowerCase(); // This is just to avoid case sensitiveness
        name = name.replace(/[\[\]]/g, "\\$&").toLowerCase(); // This is just to avoid case sensitiveness for query parameter name
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    modalReplacementContent: function(){
        $('[data-modal-display-breakpoint]').each( function(){
            var $size = $(this).data('modal-display-breakpoint'),
                $activity = $(this).closest('.panel');
            if($(window).width() <= $size){
                $(".desktop-show", $activity).remove();
            }else{
                $(".mobile-show", $activity).remove();
            }
        });
    },
    cumulativeOffset: function(element){
        var top = 0, left = 0;
        do {
            top += element.offsetTop  || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while(element);

        return {
            top: top,
            left: left
        };
    },
    timeConverter: function(n) {
        var num = n;
        var hours = (num / 60);
        var rhours = Math.floor(hours);
        var minutes = (hours - rhours) * 60;
        var rminutes = Math.round(minutes);
        return {
            mins: rminutes + '<span class="unit">mins</span>',
            hours: rhours + '<span class="unit">hrs</span>'
        }
    },
    /*
        For speed, assumes that focus is always prevented with tabindex="-1", not "-2" or anything similar; otherwise [tabindex^="-"]
        would have to be used.
    */
    focusHandler: (function () {
        var focussable = [
            'a[href]:not([tabindex="-1"])',
            'area[href]:not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'iframe:not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])',
            '[contentEditable="true"]:not([tabindex="-1"])'
        ].join(',');
        return {
            disableFocus: function ($container) {
                var $focussable = $container.attr('aria-hidden', true).find(focussable);
                $focussable.each(function () {
                    var $this = $(this),
                        tabindex = $this.attr('tabindex');
                    $this.attr('tabindex', '-1').attr('data-saved-tabindex', !tabindex && 0 !== tabindex ? 'none' : tabindex);
                });
                return $container;
            },
            enableFocus: function ($container) {
                $container.removeAttr('aria-hidden').find('[data-saved-tabindex]').each(function () {
                    var $this = $(this),
                        tabindex = $this.data('saved-tabindex');
                    if (tabindex === 'none') {
                        $this.removeAttr('tabindex data-saved-tabindex');
                    } else {
                        $this.attr('tabindex', tabindex).removeAttr('data-saved-tabindex');
                    }
                });
                return $container;
            }
        };
    })()
};
