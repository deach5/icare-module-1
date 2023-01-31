var isElementInView = function ($element, bound, fullyInView) {
    var pageTop = $(window).scrollTop(),
        pageBottom = pageTop + $(window).height(),
        elementTop = $element.offset().top,
        elementBottom = elementTop + $element.height(),
        $bound = bound; // part of box model needing to be in viewport if sett - should be top or bottom
    
    if ($bound  === 'top') {
        return elementTop < pageBottom;
    }

    if ($bound  === 'bottom') {
        return elementBottom < pageBottom;
    }

    if($element.data('trigger-course-completion')){
        if(rebus.config.takeTopicsInOrder === true){
            rebus.stateHelper.setPageAsComplete(page).save();
        }
    }

    if (fullyInView) {
        return ((pageTop < elementTop) && (pageBottom > elementBottom));
    }
    return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
};


export default {
    start: function (markPageAsComplete) {
        var monitorLockedPanels,
            $monitorElements = $('[data-detect-when-in-view]');
        if (markPageAsComplete) {
            monitorLockedPanels = !!$('.locked-panel').length;
        }
        if ($monitorElements.length || markPageAsComplete) {
            $(window).on('scroll.rebus.monitor', function () {
                if ($monitorElements.length) {
                    $.each($monitorElements, function () {
                        var $element = $(this),
                        $peekaboo = $element.data('trigger-animation-from') ? $element.data('trigger-animation-from') : false ; //top or bottom of element is in viewport
                        
                        
                        if (!$element.closest('.locked-panel').length && isElementInView($element, $peekaboo, $(window).width() >= 768)) {
                            setTimeout(function(){
                                $element.addClass('animate__animated').addClass($element.data('transition-type'));
                                $element.removeAttr('data-detect-when-in-view');
                                $element.removeAttr('data-transition-type');
                                $monitorElements = $('[data-detect-when-in-view]');
                            },200)
                        }
                    });
                }
                if (monitorLockedPanels) {
                    if ($('.locked-panel').length) {
                        return;
                    }
                    monitorLockedPanels = false;
                }
            });
        }

    },
    getScrollPercent: function(){
        var h = document.documentElement, 
            b = document.body,
            st = 'scrollTop',
            sh = 'scrollHeight';
        return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
    }
};
