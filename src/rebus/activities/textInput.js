import { $body } from '../globals.js';
import components from '../components.js';

/*
    [data-show-answer]: Boolean
    [data-type]: 'input'
    [data-answer]: 'any' | 'anyOrNone' - Use instead of individual [data-required] attributes on the items. Can be, used in the future, for more complex requirements
    [data-required-selections]: Number | 'min:Number'. If omitted, at least one selection must be made
    [data-feedback] - used if there is more than 1 incorrect modal
    [data-instant-feedback-mouse] - If present, the submit button is only shown if keyboard input is detected
    [data-submit]: Submit button text; if not present, defaults to 'Check my answer'
    [data-noannounce]: 'true' | 'false' - Used to determine whether to use aria-live="assertive" on feedback - If not present the default is 'false'

    <form onsubmit="return false;" class="input-quiz" data-activity="input-quiz" data-mandatory="true" data-show-answer="true">
        <input type="text" />
        <ul class="input-quiz-options">
            <li>Yes</li>
            <li data-required="true">No</li>
        </ul>
    </form>
    
//TRY THIS BELOW:
    <div data-activity="input-quiz" data-submit="Save" data-mandatory="true">
    <textarea maxlength="120" rows="1" class="input-quiz-textarea" placeholder="Write your name here"></textarea>
    <div class="d-flex justify-content-center">
        <button disabled data-navigate-anchor="panel-anchor-7" class="btn btn-primary btn-check-input-answer mx-1 disabled"><span>Save</span></button>
    </div>
</div>
*/
var setCheckAnswerBtnState = function ($activity) {
    var $input = $activity.find('.input-quiz-textarea');
    var $disabled = ($input.val() === '');
    var $submit = $activity.find('.btn-check-input-answer');
    if ($disabled) {
        $submit.addClass('disabled').prop('disabled', true);
        $('.btn-download-input-answer').prop('disabled', true);
    } else {
        $submit.removeClass('disabled').prop('disabled', false);
    }
};


export default {
    init: function () {
        var keyboard = true;
        var performSubmit = function ($submit, $activity, announce, pageload) {
            if ($submit) $submit.prop('disabled', 'true').addClass('disabled');
            $activity = $activity || $submit.closest('[data-activity="input-quiz"]');
            var $input = $activity.find('.input-quiz-textarea');
            var $val = $input.val();
            var $arialabel = $input.attr('aria-label')
            //
            if(typeof $arialabel !== 'undefined' && $arialabel !== "")
            {
                rebus.stateHelper.setElementState($activity, '1', $activity.data('idx'), $val + '~|~' + $arialabel);
            }else{
                rebus.stateHelper.setElementState($activity, $val);
            }
            
            //
            rebus.panels.setActivityAsComplete($activity, 1);
            rebus.stateHelper.save();
            var $feedback = $activity.find('.feedback');
            $feedback.addClass('complete').attr('tabindex','-1');
            $feedback[0].focus();
            // enable the download button
            $('.btn-download-input-answer').prop('disabled', false);
            // set interactions
            /* Track.setInteraction([{
                id: $activity.attr('data-storeid'),
                type: 'long-fill-in',
                description: $activity.find('.question-text').text(),
                learner_response: $input,
                result: 'neutral'
            }]); */
        };

        $('[data-activity="input-quiz"]').each(function () {
            var $activity = $(this),
                $input = $activity.find('.input-quiz-textarea'),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                optionsState = (details.state || ''),
                activityStarted;

            var $arialabel = $input.attr('aria-label');
            if(typeof $arialabel !== 'undefined' && $arialabel !== "")
            {
                // split text from button state and populate with saved data
                if((typeof optionsState !== 'undefined') && (optionsState.indexOf('~|~') !== -1))
                {
                    var $pieces  = optionsState.split('~|~')
                    optionsState   = $pieces[0];
                    var $userText    = $pieces[1];
                    var $qLabel      = $pieces[2];
                    // populate with any retrieved data
                    $input.val($userText);
                }
            }else{
                $input.val(optionsState);
            }
            if (optionsState != '') {
                var $feedback = $activity.find('.feedback');
                $feedback.addClass('complete');
            }
            if (!$('.btn-check-input-answer', $activity).length) {
                $input.after('<div class="d-flex justify-content-center"><button class="btn btn-primary btn-check-input-answer mx-1" disabled><span>' + ($activity.data('submit') || 'Check my answer') + '</span></button></div>');
            }
            if (!$('.btn-download-input-answer', $activity).length && $activity.attr('data-download')+"" === "true") {
                $('.btn-check-input-answer', $activity).after('<button class="btn btn-primary btn-download-input-answer mx-1" '+(optionsState === '' ? 'disabled' : '')+'><span>Download</span></button>');
            }
            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
                if ($activity.hasClass('activity-done')) {
                    performSubmit(null, $activity, false, true);
                }
            }
            //
            if((typeof $arialabel !== 'undefined' && $arialabel !== "") && typeof $qLabel === 'undefined') rebus.stateHelper.setElementState($activity,'0',undefined,'~|~');
            //
            setCheckAnswerBtnState($activity);
        });

        $('body').on('mousedown touchstart', function () {
            keyboard = false;
        }).on('input', '.input-quiz-textarea', function () {
            var $input = $(this);
            setTimeout(function () {
                setCheckAnswerBtnState($input.closest('[data-activity="input-quiz"]'));
            }, 100);
        }).on('click', '.btn-check-input-answer', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity="input-quiz"]');
                performSubmit($btn, null, true);
                try{ postSubmit($activity) } catch(e){ }
                return false;
        }).on('click', '.btn-download-input-answer', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity="input-quiz"]'),
                $details = rebus.stateHelper.getElementDetails($activity);
                var $obj = {
                    'title' : $activity.attr('data-title'),
                    'body' : $details.state
                }
                rebus.pdf.build.init($obj);
        });
    },
};