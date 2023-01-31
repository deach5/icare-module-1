import { $body, page } from './globals.js';

import activities from './activities.js';
import components from './components.js';

var state;

/*
    Unlocks the course with: ctrl + alt + shift + 'U'
    1. Adds the class 'course-unlocked' to the body
    2. Stores 'course-unlocked' = true in sessionStorage
*/
var courseUnLocker = (function () {
    var unlockCourse = function () {
        $body.addClass('course-unlocked');
    };
    return {
        init: function () {
            if (sessionStorage.getItem('course-unlocked')) {
                unlockCourse();
            }
            // ctrl + alt + shift + 'U' to unlock the course
            $(document).on('keydown', function (e) {
                if (e.altKey && e.ctrlKey && e.shiftKey && e.which === 85) {
                    sessionStorage.setItem('course-unlocked', true);
                    unlockCourse();
                }
            });
        }
    };
})();

var initKeyboardNav = function () {
    var keyboardNav;

    $body.on('keydown', function (e) {
        var key = e.keyCode || e.which;
        if (key === 9 && !keyboardNav) {
            $body.addClass('keyboard-nav');
            keyboardNav = true;
        }
    }).on('mousedown touchstart', function (e) {
        if (keyboardNav) {
            $body.removeClass('keyboard-nav');
            keyboardNav = false;
        }
    });
};

var initAutoSizeElements = function (partial) {
    var $elements = $('[data-same-size]'),
        breakpoints = {
            smr: 576,
            sm: 768,
            md: 992,
            lg: 1200
        };
    var resize = function () {
        $elements.each(function () {
            var $el1 = $(this),
                data = $el1.data('same-size').split('|'),
                breakPoint = data.length > 1 ? breakpoints[data[1].trim()] : null,
                $el2 = $(data[0].trim()),
                height1, height2, bottom1, bottom2;
            if (breakPoint && window.innerWidth < breakPoint) {
                $el1.add($el2).css('height', '');
            } else {
                height1 = $el1.height();
                height2 = $el2.height();
                bottom1 = $el1.offset().top + height1;
                bottom2 = $el2.offset().top + height2;
                if (bottom1 > bottom2) {
                    $el2.addClass('rebus-auto-sized').height(height2 + (bottom1 - bottom2));
                } else if (bottom1 < bottom2) {
                    $el1.addClass('rebus-auto-sized').height(height1 + (bottom2 - bottom1));
                }
            }
        });
    };

    if (!partial) {
        $(window).on('resizeStart', function () {
            if ($elements.length) {
                $('.rebus-auto-sized').removeClass('rebus-auto-sized').css('height', '');
            }
        }).on('resizeEnd', function () {
            if ($elements.length) {
                resize();
            }
        });
    }
    if ($elements.length) {
        resize();
    }
};

var disposePageCallback;

export default {
    dispose: function () {
        if (window.pageLoaded) {
            window.pageLoaded = undefined;
        }
        if (disposePageCallback) {
            disposePageCallback();
            disposePageCallback = undefined;
        }
        $body.removeClass('modal-open');
        components.audioButtons.dispose();
        for ( var activity in rebus.activities ) {
            if ( activity != 'assessment' && rebus.activities[ activity ].dispose )
            rebus.activities[ activity ].dispose();
        }
        activities.assessment.dispose();
        //components.pageIntro.dispose();
    },
    init: function (obj, partial) {
        page = rebus.navigation.getPage();
        state = rebus.stateHelper.get();

        if (!partial) {
            courseUnLocker.init();
            components.hamburgerMenu.init();
            initKeyboardNav();
        }

        components.videos.init(partial);
        initAutoSizeElements(partial);

        activities.assessment.buildTemplates();
        rebus.panels.init();
        activities.assessment.addQuestions();

        components.audioButtons.init(partial);
        // automatically init activites
        // except assessment (requires multiple steps)
        for ( var activity in rebus.activities ) {
            if ( activity != 'assessment' )
            rebus.activities[ activity ].init(partial);
        }
        activities.assessment.init(partial);
        
        // init components
        components.modalTemplates.init();
        //components.pageIntro.init();
        components.scroller.start();

        if (!partial) {
            components.button.init();
        }
        
        if (rebus.features.isApp()) {
            rebus.appFixes.apply(partial);
        }

        if (!partial) {
            // Reposition popovers after resize & fixes a bug that causes the trigger button to be clicked twice to reshow a manually hidden popover
            $(window).on('resizeStart', function () {
                $('.popover.in').each(function () {
                    $(this).popover('hide').data('bs.popover').$element.addClass('reshow-after-resize');
                });
            }).on('resizeEnd', function () {
                var $reshow = $('.reshow-after-resize');
                if ($reshow.length) {
                    $reshow.removeClass('reshow-after-resize').popover('show').data("bs.popover").inState.click = true;
                }
            }).on('hidden.bs.popover', function (e) {
                // http://stackoverflow.com/a/34320956/120399
                try{
                    $(e.target).data("bs.popover").inState.click = false;
                }catch(e){
                    try{
                        $(e.target).data("bs.popover")._activeTrigger.click = false;
                    }catch(e){

                    }
                }
            }).on('hidden.bs.tooltip', function (e) {
                // http://stackoverflow.com/a/34320956/120399
                try{
                    $(e.target).data("bs.tooltip").inState.click = false;
                }catch(e){
                    try{
                        $(e.target).data("bs.tootip")._activeTrigger.click = false;
                    }catch(e){

                    }
                }
            });
        }

        if (window.pageLoaded) {
            disposePageCallback = window.pageLoaded();
        }

        $('.carousel').accessibleCarousel();

        if (rebus.screenReaderTest) {
            rebus.screenReaderTest();
        }

        rebus.panels.disableFocusInLockedPanels();

        rebus.utils.scrollTop();

       
        window.setTimeout(function () {

            $body.removeClass('page-loading-mask-in');
            if (obj.anchor) {
                var $anchor = $('[data-anchor="' + obj.anchor + '"]');
                rebus.utils.scrollTo( $anchor );
                $anchor[0].focus();
            }
            if (!partial) {
                if (rebus.config.includeProgressModal && rebus.navigation.isReturningFromBookmark()) {
                    components.progressModal.show({
                        page: page,
                        returningFromBookmark: true,
                        onClosed: function () {
                            $(top).scrollTop(0);

                        }
                    });
                }
            }
        }, (rebus.navigation.isReturningFromBookmark() || !partial ) ? 500 : 150 );
    }
};
