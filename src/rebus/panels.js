/*
    All activities must be decorated with [data-activity="click-btns|multiple-choice-quiz|choose-hotspots|..."]
    If they are mandatory, decorate with [data-mandatory="true"]

    The panels function sorts out the locking of panels at page load time but it's up to each activity to inform the panels function, via
    setActivityAsComplete, when it is complete. The panels function then determines whether the row, containing the activity, is complete and also
    whether the page is complete.
    When an activity is complete, the helper class 'activity-complete' is added to the activity; the same goes for a panel with 'panel-complete'.

    Also inform the panels function when an activity is started by calling: markActivityAsStarted. This simply adds the helper class
    'activity-started' to the activity and 'panel-started' to the row.
*/

var $panels;

// target = "visibility:#my-selector", "block:#my-selector", "flex:#my-selector", etc.
var setVisibility = function (target, visible) {
    var parts = target.split(':'),
        type = parts.length === 1 ? 'block' : parts[0],
        selector = parts.length === 1 ? parts[0] : parts[1];
    if (type === 'visibility') {
        $(selector).css('visibility', visible ? 'visible' : 'hidden');
    } else {
        $(selector).css('display', visible ? type : 'none');
    }
};

export default {
    
    init: function () {
        var page,
            state,
            lockPanel,
            lockIsPrimary,
            $scroll_container = $('article.content')

            $panels = $('section.panel');

        page = rebus.navigation.getPage();
        state = rebus.stateHelper.get();

        //detect if scrollbar will appear
        if($scroll_container.get(0).scrollHeight > $scroll_container.get(0).clientHeight){

            //scroll bar will be available - will not occupy space on mac
            //so detect if with is impacted and greater than 0px

            //oh, wrote this and realise Edge doesn't do this anymore since they moved to chromium :D
            //commenting out for the meantime in case its needed

            /* if ($scroll_container.get(0).offsetWidth > $scroll_container.get(0).clientWidth ){
                //calculate the difference and add that as padding to
                //right side of scroll container
                var rightPadding = ($scroll_container.get(0).offsetWidth - $scroll_container.get(0).clientWidth) + 'px';
                $scroll_container.css({'padding-right': rightPadding });
            } */

        }
        

        $panels.each(function (i) {
            var $panel = $(this),
                storeId = page.storeId + 'r' + i,
                panelState = state[storeId],
                panelDefaultState = '',
                panelRequiresCompletion,
                panelIsComplete,
                mandatoryIdx = 0,
                inner;
                //insert anchor tag for scrolling assistance
                if(i < $panels.length){
                    $panel.prepend('<a class="panel-anchor position-absolute" name="panel-anchor-'+(i+1)+'"></a>');
                    var _t = 'panel-anchor-'+(i+2);
                    $panel.attr('data-manual-scroll-when-done') ? $panel.attr('data-manual-scroll-when-done',_t) : $panel.attr('data-scroll-when-done',_t);                    
                }



            $panel.find('[data-activity]').each(function (i) {
                var $activity = $(this);

                rebus.utils.modalReplacementContent(); 

                $activity.attr({
                    'data-idx': i,
                    'data-storeid': storeId + 'a' + i
                });
                if ($activity.data('mandatory')) {
                    var activityComplete;
                    $activity.attr({
                        'data-mandatory-idx': mandatoryIdx
                    });
                    if (!panelState) {
                        panelDefaultState += '0';
                    } else if (panelState.charAt(mandatoryIdx) === '1') {
                        $activity.addClass('activity-started activity-done');
                        activityComplete = true;
                    }
                    panelRequiresCompletion = true;
                    mandatoryIdx++;
                    var enableOnComplete = $activity.data('enable-on-complete'),
                        revealOnComplete = $activity.data('reveal-on-complete');
                    if (enableOnComplete) {
                        $(enableOnComplete).prop('disabled', !activityComplete);
                    }
                    if (revealOnComplete) {
                        setVisibility(revealOnComplete, activityComplete);
                    }
                }
            });
            if (panelRequiresCompletion) {
                if (!panelState) {
                    panelState = panelDefaultState;
                } else {
                    $panel.addClass('panel-started');
                }
                $panel.attr('data-storeid', storeId);
                rebus.stateHelper.setElementState($panel, panelState);
                if (rebus.stateHelper.isPanelComplete($panel)) {
                    panelIsComplete = true;
                    $panel.addClass('panel-done');
                }
            }
            $panel.attr({
                'data-idx': i
            });
            if (lockPanel) {
                var $customMessage = typeof $panel.attr('data-lock-message') !== "undefined" ? "<p>"+$panel.attr('data-lock-message').replace(/\[BR\]/g,'<br />') + "</p><div aria-hidden=\"true\"></div>" : false;
                inner = lockIsPrimary ? (!$customMessage ? '<p>Please complete the above activity before continuing.</p><div class="padlock" aria-hidden="true"></div>' : $customMessage) : '';
                $panel.addClass('locked-panel' + (lockIsPrimary ? ' primary-lock' : '')).append([
                    '<div class="lock-overlay">',
                    inner,
                    '</div>'
                ].join('\n'));
                lockIsPrimary = false;
                $panel.closest('.container-fluid').addClass('parent-lock')
                

            }
            if (panelRequiresCompletion && !panelIsComplete) {
                lockPanel = true;
                lockIsPrimary = true;
            }
        });
    },
    disableFocusInLockedPanels: function () {
        $('.locked-panel').each(function () {
            rebus.utils.focusHandler.disableFocus($(this));
        });
    },
    setActivityAsComplete: function ($activity, save) {
        //alert('setActivityAsComplete caller' + this.caller)
        var $panel,
            panelIdx,
            enableOnComplete = $activity.data('enable-on-complete'),
            revealOnComplete = $activity.data('reveal-on-complete');
        // Update the store and add completion classes
        $activity.addClass('activity-started activity-done');
        if (enableOnComplete) {
            $(enableOnComplete).prop('disabled', false);
        }
        if (revealOnComplete) {
            setVisibility(revealOnComplete, true);
        }
        if (!$activity.data('mandatory')) {
            return;
        }

        $panel = $activity.closest('.panel[data-storeid]');

        rebus.stateHelper.setElementState($panel, '1', $activity.data('mandatory-idx'));

        if (rebus.stateHelper.isPanelComplete($panel)) {
            $panel.addClass('panel-started panel-done');
            // Unlock panels
            panelIdx = $panel.data('idx');
            if (panelIdx < $panels.length - 1) {
                rebus.utils.focusHandler.enableFocus($panels.eq(panelIdx + 1)).removeClass('locked-panel primary-lock');                
                $panels.eq(panelIdx + 1).closest('.container-fluid').removeClass('parent-lock')
                


                if (panelIdx < $panels.length - 2) {
                    for (var i = panelIdx + 2; i < $panels.length; i++) {
                        var $next = $panels.eq(i);
                        if ($next.hasClass('primary-lock')) {
                            break;
                        } else {
                            rebus.utils.focusHandler.enableFocus($next).removeClass('locked-panel primary-lock');
                            $next.closest('.container-fluid').removeClass('parent-lock')
                            // scroll to next panel
                            if($panel.attr('data-manual-scroll-when-done') === "undefined") rebus.utils.scrollToAnchor($next.find('.panel-anchor').attr('name'));
                        }
                    }
                }
            }
        }
        if (save) {
            rebus.stateHelper.save();
        }
    },
    markActivityAsStarted: function ($activity) {
        $activity.addClass('activity-started').closest('.panel[data-storeid]').addClass('panel-started');
    }
};
