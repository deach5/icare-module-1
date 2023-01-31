import { $body } from '../globals.js';

var setActivityAsComplete = function ($activity, id) {
    var $panel;
    $activity = $activity || $('[data-audio-file="' + id + '"]').closest('[data-activity="audio"]');
    if ($activity.length && $activity.data('mandatory')) {
        $panel = $activity.closest('.row[data-storeid]');
        if (rebus.stateHelper.getElementDetails($panel).state[$activity.data('mandatory-idx')] !== '1') {
            rebus.panels.setActivityAsComplete($activity, true);
            // Track interaction (if supported)
            var details = rebus.stateHelper.getElementDetails($activity);
            //RecordPerformanceInteraction( details.storeId, 'played', true, 'played', 'audio activity', null, null, null );
        }
    }
};

export default {
    init: function (partial) {
        if (partial) {
            return;
        }
        if (rebus.config.audioMustBePlayedThrough) {
            $('body').on('audioend', function () {
                setActivityAsComplete(null, arguments[1].id);
            }).on('click', '.btn-read-audio-transcript', function () {
                setActivityAsComplete($(this).closest('[data-activity="audio"]'));
            });
        } else {
            $('body').on('audioplay', function () {
                setActivityAsComplete(null, arguments[1].id);
            }).on('click', '.btn-read-audio-transcript', function () {
                setActivityAsComplete($(this).closest('[data-activity="audio"]'));
            });
        }
    }
};
