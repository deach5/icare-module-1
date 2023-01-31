import { $body } from '../globals.js';

//
var showAnswer = function ($activity) {
    if ($activity.data('show-answer')) {
        $activity.addClass('show-answer');
    }
};
//
var setAsComplete = function ($activity) {
    showAnswer($activity);
    rebus.panels.setActivityAsComplete($activity, true);
};
// get activity result
var getResult = function ($activity) {
    var result = true;
    $('[data-required-index]', $activity).each(function () {
        result = (Number($(this).attr('data-required-index')) === Number($(this).attr('data-selected-index')));
        return result;
    });
    return result;
}

export default {
    init: function (partial) {
        // reset
        var reset = function ($activity) {
            // reset the label
            $('[data-original-label]', $activity).each(function () {
                $(this).html($(this).attr('data-original-label'));
            });
            // reset the selected index
            $('[data-selected-index]', $activity).each(function () {
                $(this).attr('data-selected-index', '');
            });
            // enable all options again
            $('li[data-index]', $activity).removeClass('disabled');
            $('li[data-index] > a', $activity).removeAttr('aria-disabled');
            //
            $($activity).attr('data-correct', '');
            $('.response-text', $activity).html('');
            // store the state
            rebus.stateHelper.setElementState($activity, storeResponses(), null);
            rebus.stateHelper.save();
            toggleReset($activity);
            toggleSubmit($activity);
        }
        // submit
        var submit = function ($activity, announce) {
            var result, $responses, $response, user_responses = [], correct_responses = [];
            result = getResult($activity);
            $responses = $activity.data('responses');
            $activity.attr('data-correct', result === true ? true : false);
            $response = (result === true ? 'correct' : 'incorrect');
            $response = $responses[$response];
            $activity.data('$fb').liveFeedback('value', $response, {
                silent: !announce
            });
            if (result === true || !$activity.data('mandatory') || $activity.data('mandatory') === 'partial') {
                setAsComplete($activity);
            }
            rebus.stateHelper.save();
            toggleReset($activity);
            toggleSubmit($activity);
            if(announce)
            {
                // scroll to feedback
                var $responsecontainer = $activity.find('.response');
                rebus.utils.scrollTo( $responsecontainer );
                $responsecontainer[0].focus();
            }
            // Track interaction (if supported)
            // Build responses
            $activity.find( '[data-selected-index]' ).each( function () {
                var $this = $( this ),
                    short = $this.data('selectedIndex'),
                    $selected = $this.find('li[data-index]').get( short ),
                    long = $selected.find( 'a' ).text().replaceAll(/\s+/g,'-');
                user_responses.push( Track.getScormVersion() == '1_2' ? short : long); //CreateResponseIdentifier( short, long );
            } );
            $activity.find( '[data-required-index]' ).each( function () {
                var $this = $( this ),
                    short = $this.data('requiredIndex'),
                    $selected = $this.find('li[data-index]').get( short ),
                    long = $selected.find( 'a' ).text().replaceAll(/\s+/g,'-');
                correct_responses.push( Track.getScormVersion() == '1_2' ? short : long); //CreateResponseIdentifier( short, long );
            } );
            // Trackem!
            var details = rebus.stateHelper.getElementDetails($activity);
            //RecordMultipleChoiceInteraction( details.storeId, responses, result, correct_responses, $activity.find('.question-text').text(), null, null, null );
        };
        // toggle reset
        var toggleReset = function ($activity) {
            var $resetbtn = $('.btn-reset-drop-down-question', $activity);
            var $disabled = $('[data-selected-index=""]', $activity).length === $('[data-selected-index]', $activity).length;
            $resetbtn.attr('aria-disabled', $disabled).attr('disabled', $disabled);
        }
        // toggle submit
        var toggleSubmit = function ($activity) {
            var $submitbtn = $('.btn-check-drop-down-question', $activity);
            var $answered = (typeof $($activity).attr('data-correct') !== "undefined" && $($activity).attr('data-correct') !== "");
            var $disabled = ($('[data-selected-index=""]', $activity).length !== 0 || $answered);
            $submitbtn.attr('aria-disabled', $disabled).attr('disabled', $disabled);
        }
        // store responses
        var storeResponses = function ($activity) {
            var $responses = [];
            $('[data-selected-index]', $activity).each(function () {
                $responses.push($(this).attr('data-selected-index'));
            });
            return $responses.join();
        }
        //
        $('[data-activity="drop-down"]').each(function () {
            var $activity = $(this),
                details = rebus.stateHelper.getElementDetails($activity),
                selections = details.state;
            // submit button
            var $submitbtn = $('.btn-check-drop-down-question', $activity);
            $submitbtn.on('click', function () {
                submit($activity, true);
            }).attr('aria-disabled', true).attr('disabled', true);
            // reset button
            var $resetbtn = $('.btn-reset-drop-down-question', $activity);
            $resetbtn.on('click', function () {
                reset($activity, true);
            }).attr('aria-disabled', true).attr('disabled', true);
            //
            var $responses = {};
            $activity.data('responses', $responses);
            $('[data-response]', $activity).each(function () {
                var $response = $(this);
                $responses[$response.attr('data-response')] = $response.html();
                $response.remove();
            });
            var $response = $([
                '<div class="response" tabindex="-1">',
                '<div>',
                '<div data-svg="icon-thumb-up"></div>',
                '<div data-svg="icon-thumb-down"></div>',
                '<div data-svg="icon-think"></div>',
                '<div class="response-text" aria-live="assertive" aria-atomic="false"></div>',
                '</div>',
                '</div>'
            ].join('\n'));
            $('[data-drop-down-submit]', $activity).after($response);
            $activity.data('$fb', $('.response-text', $response).liveFeedback());
            if (selections) {
                var $complete = true;
                var selectedindexes = selections.split(',');
                var $index, $label;
                $('[data-selected-index]', $activity).each(function (ix, el) {
                    $index = selectedindexes[ix];
                    $('li[data-index="' + $index + '"]', $activity).addClass('disabled');
                    $(this).attr('data-selected-index', $index);
                    // now set the label
                    if ($index + "" !== "") {
                        $label = $('[data-index="' + $index + '"] > a', this).html();
                        $(this).closest('.btn-group').find('[data-original-label]').html($label);
                    }else{
                        $complete = false;
                    }
                    toggleReset($activity);
                    toggleSubmit($activity);
                });
                // 
                rebus.panels.markActivityAsStarted($activity);
                if($complete)
                {
                    submit($activity, false);
                    showAnswer($activity);
                }
                
            }
        });

        if (partial) {
            return;
        }
        
        var $selector = '[data-activity="drop-down"] .dropdown-menu a';
        $body.on('click', $selector, function () {
            var $this = $(this);
            // is this button disabled?
            if($this.attr('aria-disabled')+"" === "true") return;
            // continue
            var $activity = $(this).closest('[data-activity="drop-down"]');
            // get the current selected index and enable elements
            var $lastindex = $this.closest('[data-selected-index]').attr('data-selected-index');
            // enabled all elements with the same index
            $('li[data-index="' + $lastindex + '"]', $activity).removeClass('disabled');
            $('li[data-index="' + $lastindex + '"] > a', $activity).removeAttr('aria-disabled');
            // get this index
            var $index = $this.closest('li').attr('data-index');
            $this.closest('.dropdown-menu').attr('data-selected-index', $index);
            // disabled all elements with the same index
            $('li[data-index="' + $index + '"]', $activity).addClass('disabled');
            $('li[data-index="' + $index + '"] > a', $activity).attr('aria-disabled',true);
            // add this index to the selected index
            $this.closest('[data-selected-index]').attr('data-selected-index', $index);
            // add the value to the .selected-label
            $this.closest('.btn-group').find('.selected-label').html($this.html());
            // state manager
            rebus.stateHelper.setElementState($activity, storeResponses(), null);
            rebus.panels.markActivityAsStarted($activity);
            // enable/disabled submit
            toggleSubmit($activity);
            // enable/disabled reset
            toggleReset($activity);
        }).on('focus', $selector, function () {
            var $area = $(this);
            $area.closest('[data-activity]').find('.click-area-focus').eq($area.data('idx')).addClass('active');
        }).on('blur', $selector, function () {
            var $area = $(this);
            $area.closest('[data-activity]').find('.click-area-focus').eq($area.data('idx')).removeClass('active');
        });

    },
    getResult: getResult
};
