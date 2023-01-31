/**
@name courseUnLocker
@memberof rebus.admin~
@description
<pre>
    Unlocks the course with: ctrl + alt + shift + 'U'
    1. Adds the class 'course-unlocked' to the body
    2. Stores 'course-unlocked' = true in sessionStorage
</pre>
*/
var courseUnLocker = (function () {
    var unlock = function () {
        $('body').addClass('course-unlocked');
    };
    return {
        init: function () {
            if ('1' === sessionStorage.getItem('course-unlocked')) {
                unlock();
            }
            // ctrl + alt + shift + 'U' to unlock the course
            $(document).on('keydown', function (e) {
                if (e.altKey && e.ctrlKey && e.shiftKey && e.which === 85) {
                    unlock();
                    sessionStorage.setItem('course-unlocked', '1');
                }
            });
        },
        unlock: function () {
            unlock();
            sessionStorage.setItem('course-unlocked', '1');
        }
    };
})();

/**
@name adminPanel
@memberof rebus.admin~
*/
var adminPanel = (function () {
    var cookieId = rebus.config.id + '.adminEnabled',
        firstClick = null,
        clickCount = 0;
    var toggleEnabled = function () {
        if ('1' === sessionStorage.getItem(cookieId)) {
            sessionStorage.setItem(cookieId, '0');
            $('body').removeClass('admin-enabled');
        } else {
            sessionStorage.setItem(cookieId, '1');
            $('body').addClass('admin-enabled');
        }
    };
    var headerClicked = function (e) {
        var now = new Date(),
            interval;
        if (e.clientY < 60) {
            if (firstClick !== null) {
                interval = now - firstClick;
            }
            if (interval > 2000) {
                clickCount = 0;
            }
            clickCount += 1;
            if (clickCount === 1) {
                firstClick = now;
            } else if (clickCount === 10) {
                toggleEnabled();
                clickCount = 0;
            }
        }
    };
    return {
        init: function () {
            $('body').on('click', headerClicked);
            if ('1' === sessionStorage.getItem(cookieId)) {
                $('body').addClass('admin-enabled');
            }
            // ctrl + alt + shift + 'A' to enable the admin menu items
            $(document).on('keydown', function (e) {
                if (e.altKey && e.ctrlKey && e.shiftKey && e.which === 65) {
                    toggleEnabled();
                }
            });
        }
    };
})();

/**
@name admin
@memberof rebus
@namespace
*/
export default {
    init: function () {
        courseUnLocker.init();
        adminPanel.init();
        if ('1' === sessionStorage.getItem(rebus.config.id + '.loggingEnabled')) {
            rebus.logger.init({
                namespace: rebus.config.id,
                types: '*',
                prefixType: true
            });
        } else {
            rebus.logger.init({
                namespace: rebus.config.id,
                types: rebus.config.debugTypes,
                prefixType: true
            });
        }
        rebus.console.init();
        $('body').on('click', '.log a', function () {
            var $expandable = $(this).find('+div');
            if ($expandable.attr('hidden')) {
                $expandable.removeAttr('hidden')
            } else {
                $expandable.attr('hidden', true);
            }
            return false;
        });
        if (rebus.config.debug) {
            $('body').addClass('debug-enabled');
            $('#btn-reset-course').on('click', function () {
                Track.activityData.reset();
                window.location = 'index.html?initialised=true';
                return false;
            });
        }
    },
    unlockCourse: function () {
        courseUnLocker.unlock();
    },
    showEmergencyLog: function () {
        $('#emergency-log').append(rebus.logger.serializeLog()).addClass('show-log');
        $('article.content').css('min-height', 0);
        if(window.location.protocol === 'file:'){
            setTimeout(function(){
                $('#content-page article.content').empty().append('<p>You shouldn\'t be seeing this message.</p><p>This course should be run from a server.</p>')
            },100);
        }
        $('#page-loading-mask').remove();
    }
};
