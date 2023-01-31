import { $body } from '../globals.js';
import components from '../components.js';

var reveal = function ($activity) {
    var hotspotState = '';
    $activity.find('.hotspot').each(function () {
        $(this).addClass('item-done');
        hotspotState += '1';
    });
    rebus.stateHelper.setElementState($activity, hotspotState);
    rebus.panels.setActivityAsComplete($activity);
    rebus.stateHelper.save();
};

export default {
    dispose: function () {
        $('.choose-hotspots-modal').remove();
    },
    init: function (partial) {
        $('.choose-hotspots').each(function () {
            var $activity = $(this),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                hotspotsState = details.state,
                hotspotsDefaultState = '',
                activityStarted;

            $activity.find('.hotspot').each(function (li_idx) {
                var $li = $(this);
                $li.attr({
                    'data-idx': li_idx
                }).find('.click-btn').append('<span class="done-indicator sr-only">Visited</span>');
                if (hotspotsState) {
                    if (hotspotsState.charAt(li_idx) === '1') {
                        $li.addClass('item-done');
                        activityStarted = true;
                    }
                } else {
                    hotspotsDefaultState += '0';
                }
            });

            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
            }

            rebus.stateHelper.setElementState($activity, hotspotsState || hotspotsDefaultState);

            $activity.find('.modal').each(function () {
                var $modal = $(this),
                    modalId = activityId + '-modal-',
                    buttons;
                if ($modal.hasClass('incorrect')) {
                    modalId += 'incorrect';
                    buttons = "Show me|btn-show-me~I'll try again";
                } else {
                    modalId += 'correct';
                }
                $modal.data('container', $activity).addClass('modal-template choose-hotspots-modal')
                    .attr({
                        id: modalId,
                        'data-buttons': buttons
                    }).detach().appendTo($body);
            });
        });

        if (partial) {
            return;
        }

        $body.on('click', '.hotspots', function (e) {
            var $target = $(e.target),
                $activity = $target.closest('.choose-hotspots'),
                $btn = $target.closest('.btn-hotspot');
            if ($btn.length) {
                var $li = $btn.closest('li'),
                    required = $activity.find('.btn-hotspot').length;
                $li.addClass('item-done');
                rebus.stateHelper.setElementState($activity, '1', $li.data('idx'));
                rebus.panels.markActivityAsStarted($activity);
                if ($activity.find('.hotspot.item-done').length === required) {
                    rebus.modalTemplates.setFocusOnClosed($btn);
                    $('#' + $activity.data('storeid') + '-modal-correct').modal();
                    rebus.panels.setActivityAsComplete($activity);

                    // Track interaction (if supported)
                    var details = rebus.stateHelper.getElementDetails($activity);
                    //RecordPerformanceInteraction( details.storeId, details.state, true, '1'.repeat( required ), 'Hotspot', null, null, null );
                }
                rebus.stateHelper.save();
            } else {
                $('#' + $activity.data('storeid') + '-modal-incorrect').modal();
            }
            return false;
        }).on('click', '.choose-hotspots .btn-show-me', function () {
            reveal($(this).closest('.choose-hotspots'));
            return false;
        }).on('click', '.choose-hotspots-modal .btn-show-me', function () {
            reveal($(this).closest('.modal').data('container'));
        });
    }
};
