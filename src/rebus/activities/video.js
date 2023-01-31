import { $body } from '../globals.js';

var setActivityAsComplete = function () {
    var $activity = $(this).closest('[data-activity="video"]');
    if ($activity.length) {
        rebus.panels.setActivityAsComplete($activity, true);

        //set scroll to continue button on play end
        var $target = $activity.closest('.panel').data('scroll-when-done');

        setTimeout( function(){  
            // only do this if transcript is not open/present
            if(!$('.video-transcript',$activity).length) rebus.utils.scrollToAnchor($target);
        }, 250 );

        // Track interaction (if supported)
        var details = rebus.stateHelper.getElementDetails($activity);
        //RecordPerformanceInteraction( details.storeId, 'played', true, 'played', 'audio activity', null, null, null );
        /* Track.setInteraction([{
            id: details.storeId,
            type: 'fill-in',
            description: 'Video - ' + details.storeId,
            learner_response: 'played',
            correct_responses: 'played'
        }]); */
    }
};

export default {
    init: function (partial) {
        $body.on('click', '.btn-read-transcript', setActivityAsComplete); // set complete when transcript button selected //
        if (rebus.config.videosMustBePlayedThrough) {
            var $target = $('video');
                $target.on('ended', setActivityAsComplete);

            if (!partial) {
                $body.on('slid.bs.carousel', '.video-transcript .carousel', function () {
                    if ($('.item:last', this).hasClass('active')) {
                        setActivityAsComplete.call(this);
                    }
                });
            }
        } else {
            $('video').on('play', setActivityAsComplete);
        }
    }
};
