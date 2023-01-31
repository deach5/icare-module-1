import { $body } from '../globals.js';
import components from '../components.js';

/*
    [data-show-answer]: Boolean
    [data-type]: 'checkbox' | 'radio'
    [data-answer]: 'any' | 'anyOrNone' - Use instead of individual [data-required] attributes on the items. Can be, used in the future, for more complex requirements
    [data-required-selections]: Number | 'min:Number'. If omitted, at least one selection must be made
    [data-feedback] - used if there is more than 1 incorrect modal
    [data-instant-feedback-mouse] - If present, the submit button is only shown if keyboard input is detected
    [data-submit]: Submit button text; if not present, defaults to 'Check my answer'
    [data-noannounce]: 'true' | 'false' - Used to determine whether to use aria-live="assertive" on feedback - If not present the default is 'false'

    <form onsubmit="return false;" class="multiple-choice-quiz" data-activity="multiple-choice-quiz" data-type="radio" data-mandatory="true" data-show-answer="true"data-append-response-to="{SOMEWHERE-ELEMENT-BY-ID}">
        <ul class="multiple-choice-quiz-options">
            <li>Yes</li>
            <li data-required="true">No</li>
        </ul>
        <div class="modal correct" data-audio-file="...">...</div>
        <div class="modal incorrect" data-audio-file="...">...</div>
        <div class="modal no-answer" data-audio-file="...">...</div>
    </form>

    If there's more than one incorrect feedback, specify as follows:

        <li data-feedback="incorrect.other">...</li>
        ...
        <div class="modal incorrect other">...</div>

    Inline feedback
    ---------------
    Replace the modal feedbacks with:
        <div class="inline-feedback">...</div>
        <div class="inline-feedback">...</div>
        ...

    > List them in order of the options; one for each.
    > For incorrect feedback, make sure each is unique so that it'll be announced to screen-readers


    Other feedback
    --------------
    If a binary feedback option is needed and youi don't want a modal or inline you can simply add feedbacks within the data-activity e.g.

    <form class="multiple-choice-quiz quiz-option2 quiz-purple" data-activity="multiple-choice-quiz" data-type="radio" data-mandatory="true" >
        <ul class="multiple-choice-quiz-options">
            <li>...</li>
            <li data-required="true">...</li>
        </ul>
        <div class="feedback incorrect">
            <p>...</p>
        </div>
        <div class="feedback correct">
            <p>...</p>
        </div>
     </form>

    Complex content in the label
    ----------------------------

    It's not valid to put something like an image into a Label element and IE will fail to trigger a click if an image is clicked.
    To fix this:
    <li>MyText<img class="append-after triggers-input" src="..." /></li>

    The image will be appended after the label and, since .triggers-input is included, a click will be triggered on the input when the element is clicked.
*/
var setCheckAnswerBtnState = function ($activity) {
    var requiredSelections = $activity.attr('data-required-selections'),
        selected = $activity.find('input[type="' + $activity.data('type') + '"]:checked').length,
        enable;
    if (requiredSelections === undefined) {
        enable = selected > 0;
    }
    else {
        requiredSelections = requiredSelections.split(':');
        if (requiredSelections.length > 1) {
            enable = selected >= parseInt(requiredSelections[1], 10);
        }
        else {
            enable = selected === parseInt(requiredSelections[0], 10);
        }
    }
    $activity.find('.btn-check-multi-choice-answers, .btn-submit-assessment-answer').prop('disabled', !enable);
};

var showAnswer = function ($activity) {
    if ($activity.data('show-answer')) {
        $activity.addClass('show-answer');
    }
};

var setAsComplete = function ($activity) {
    showAnswer($activity);
    var $container = $activity.closest('[data-question-pools]');
    if($container.length)
    {
        $('form',$container).each(function(ix,el){
            rebus.panels.setActivityAsComplete($(this), true);
        });
    }else{
        rebus.panels.setActivityAsComplete($activity, true);
    }    
};

var isCorrect = function ($activity) {
    var correct = true,
        globalAnswer = $activity.data('answer');
    if (globalAnswer) {
        if (globalAnswer === 'anyOrNone') {
            return true;
        }
        if (globalAnswer === 'any') {
            return !!$activity.find('input[type="' + $activity.data('type') + '"]:checked').length;
        }
    }
    $activity.find('.multiple-choice-quiz-options li').each(function () {
        var $this = $(this),
            checked = $this.find('input').prop('checked'),
            required = $this.attr('data-required') === 'true';
        if (checked !== required) {
            correct = false;
            return false;
        }
    });
    return correct;
};

// Returns true | false | 'partial' (for checkboxes)
var getResult = function ($activity) {
    var globalAnswer = $activity.data('answer');
    if (globalAnswer) {
        if (globalAnswer === 'anyOrNone') {
            return true;
        }
        if (globalAnswer === 'any') {
            return !!$activity.find('input[type="' + $activity.data('type') + '"]:checked').length;
        }
    }
    if ($activity.data('type') === 'radio') {
        return !!$('input:checked', $activity).closest('li').data('required');
    }
    var requiredCount = 0,
        correctCount = 0, 
        notrequiredCount = 0;
    $('.multiple-choice-quiz-options li', $activity).each(function () {
        var $this = $(this),
            checked = $this.find('input').prop('checked'),
            required = $this.attr('data-required') === 'true';
        requiredCount += required ? 1 : 0;
        notrequiredCount += !required && checked ? 1 : 0;
        correctCount += required && checked === required ? 1 : 0;
    });
    return ((correctCount === requiredCount) && (notrequiredCount === 0) ? true : correctCount > 0 ? 'partial' : false);
};

export default {
    dispose: function () {
        $('.multiple-choice-quiz-modal').remove();
    },
    init: function (partial) {
        var keyboard = true;

        var performSubmit = function ($submit, $activity, announce, pageload) {
            var $checkedOption, res, modalSelector,
                responses, response,
                showPartialCorrect, $type, $survey;
            $activity = $activity || $submit.closest('[data-activity="multiple-choice-quiz"]');
            $survey = ($activity.attr('data-survey')+"" === "true");
            showPartialCorrect = $activity.hasClass('show-partial-correct');
            $type = $activity.data('type');
            responses = $activity.data('responses');
            $checkedOption = $activity.find('input:checked').closest('li');
            res = getResult($activity);

            pageload = pageload || false;
            if($activity.data('noannounce')) announce = false;
            $activity.attr('data-correct', res === true ? 'true' : showPartialCorrect ? res : 'false');
            if($activity.hasClass('has-modal-feedback')){
                modalSelector = $checkedOption.data('feedback');
                if (!modalSelector ) {
                    modalSelector = '#' + $activity.attr('data-storeid') + '-' + (res ? 'correct' : 'incorrect') + '-modal';
                }
                $(modalSelector).modal();
            }else{
                if($type !== "checkbox") {
                    response = responses[$checkedOption.attr('data-response')];
                }else {
                    response = responses[(res === true ? 'correct' : 'incorrect')];
                }
                if (showPartialCorrect && res === 'partial') {
                    response = '<p class="first">Nearly there</p>' + response;
                }
                $activity.data('$fb').liveFeedback('value', response, {
                    silent: !announce
                });
            }

            
            if (res === true || !$activity.data('mandatory') || $activity.data('mandatory') === 'partial') {
                setAsComplete($activity);
            }
            showAnswer($activity);
            if(!pageload && !announce){
                // clear tabindexes
                $('.response').removeAttr('tabIndex');
                var container = $($activity.data('$fb')).closest('.response');
                // give current response a focusable tabindex
                container.attr('tabIndex','0');
                // send the cursor to the element
                container.focus();
            }
            
            // Track interaction (if supported)

            // create response id objs
            // MHA: this should probably be merged with getResult somehow
            var responses = [], correct_responses = [];
            $activity.find('.multiple-choice-quiz-options li').each(function () {
                var $this = $(this),
                    $input = $this.find('input'),
                    required = $this.attr('data-required') === 'true',
                    checked = $input.prop('checked'),
                    idx = $input.data('idx'),
                    // ResponseIdentifier requres one char per answer so below limits max nr answers to 36
                    // consider using base64 or base256 for more, or have a serious convo with LD or client :D
                    short = idx.toString( 36 ),
                    long = $this.find('label').clone().children().remove().end().text().trim().replaceAll(/\s+/g,'-'), // See: https://stackoverflow.com/a/33592275
                    response  = Track.getScormVersion() == '1_2' ? short : long; //CreateResponseIdentifier( short, long );
                if ( checked ) {
                    if($survey)
                    {
                        responses.push( response );
                    }else{
                        responses.push( $this.find('label').find('.sr-only').text().trim().replaceAll(/\s+/g,'-') );
                    } 
                }
                if ( required ) correct_responses.push( response );
            } );
            var details = rebus.stateHelper.getElementDetails($activity);
            //RecordMultipleChoiceInteraction( details.storeId, responses, res, correct_responses, $activity.find('.question-text').text(), null, null, null );
            /* Track.setInteraction([{
                id: details.storeId,
                type: 'choice',
                description: $activity.find('.question-text').text(),
                learner_response: responses,
                correct_responses: correct_responses,
                result: ($survey ? 'neutral' : (res ? 'correct' : 'incorrect'))
            }]); */
        };

        $('[data-activity="multiple-choice-quiz"]').each(function () {
            var $activity = $(this),
                $ul = $activity.find('ul.multiple-choice-quiz-options'),
                //$inlineFeedback,
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                optionsState = details.state,
                optionsDefaultState = '',
                type = $activity.data('type'),
                noannounce = ($activity.data('noannounce')+'' === 'true' || false),
                activityStarted,
                hasGiveUpModal,
                hslide = $activity.find('[data-horz-slide-wrap]').length >= 0, // determine if the question is a horizontal sliding question
                hasFeedback;
                if(hslide)
                {
                    // initial the nav buttons
                    var slides = $activity.find('[data-horz-slide]');
                    var $btnback = $activity.find('[data-qestion-nav="back"]');
                    var $btnnext = $activity.find('[data-qestion-nav="next"]');
                    var $btnsubmit = $activity.find('[data-question-submit]');
                    var $btntryagain = $activity.find('[data-question-tryagain]');
                    var $btncontinue = $activity.find('[data-question-continue]');
                    var $btnreview = $activity.find('[data-question-reviewtopic]');
                    var $multitry = $btntryagain.length >= 1;
                    // methods
                    $(slides).attr('aria-hidden', true);
                    $(slides).eq(0).attr('aria-hidden', false);
                    var getWidth = function($btn)
                    {
                        var $activity = $btn.closest('.multiple-choice-quiz');
                        return $activity.outerWidth() >= 500 ? 500 : $activity.outerWidth() + 30;
                    }
                    var getPos = function($btn, $dir)
                    {
                        var $current = parseInt(slides.eq(0).css('margin-left'));
                        var $width = getWidth($btn);
                        var $pos = ($dir === 'back' ? -Math.abs($current + $width) : -Math.abs($current - $width))
                        return $pos;
                    }
                    var buttonsUpdate = function($btn)
                    {
                        
                        setTimeout(function(){
                            var $activity = $btn.closest('.multiple-choice-quiz');
                            var $wrapper = $($btn).closest('[data-question-pools]');
                            var $width = getWidth($btn);
                            var $correct = $activity.attr('data-correct')+"" === "true";
                            var $current = parseInt(slides.eq(0).css('margin-left'));
                            var $step = (($current === 0) ? 1 : $current === -Math.abs($width) ? 2 : 3);
                            // which question are we on? 
                            var $attempt = Number($($wrapper).attr('data-attempt'));
                            //
                            $('[data-horz-slide]',$activity).attr('aria-hidden', true);

                            $('[data-horz-slide]',$activity).eq($step-1).attr('aria-hidden', false);
                            $step === 1 || $step === 3 ? $btnback.hide() :  $btnback.fadeIn('slow');
                            $step === 1 ? $btnnext.fadeIn('slow') :  $btnnext.hide();
                            $step === 2 ? $btnsubmit.fadeIn('slow') :  $btnsubmit.hide();
                            $step === 2 ? $('input[type=radio]',$activity).removeAttr('tabindex') : $('input[type=radio]',$activity).attr('tabindex','-1');
                            if($step === 2) $('input[type=radio]',$activity).eq(0)[0].focus();
                            $step === 3 && $correct ||  ($step === 3 && !$multitry) ? $btncontinue.fadeIn('slow') :  $btncontinue.hide();
                            $step === 3 && !$correct && $multitry && $attempt < 3 ? $btntryagain.fadeIn('slow') :  $btntryagain.hide();
                            $step === 3 && !$correct && $multitry && $attempt === 3 ? $btnreview.fadeIn('slow') :  $btnreview.hide();
                            // update progress bar
                            $('.question-step > div', $activity).each(function(ix,el){
                                 $(el).attr('data-active', ((ix + 1) == $step)); 
                            });

                        },550);
                    }
                    var resetQuestion = function($btn, reset)
                    {
                        var $activity = $btn.closest('.multiple-choice-quiz');
                        rebus.stateHelper.setElementState( $activity, -1);
                        $activity.attr('data-state',0).removeAttr('data-correct').removeClass('activity-started activity-done');
                        $('[data-active]',$activity).attr('data-active', false);
                        $('.checked',$activity,).removeClass('checked');
                        $('input:checked',$activity,).prop('checked', false);
                        slides.eq(0).css('margin-left', 0);
                        buttonsUpdate($btn);
                        // reset all data
                        if(reset)
                        {
                            var $wrapper = $($btn).closest('[data-question-pools]');
                            $($wrapper).attr('data-attempt',1);
                            $('form',$wrapper).each(function(ix,el){
                                ix === 0 ? $(el).removeAttr('hidden').removeClass('opacity-0') : $(el).attr('hidden', true).addClass('opacity-0');
                            });
                        }

                    }
                    var loadNextQuestion = function($btn, callback)
                    {
                        var $container = $($btn).closest('form');
                        var $wrapper = $($btn).closest('[data-question-pools]');
                        var $next = $container.next('form').length === 1 ? $container.next('form') : $wrapper.find('form').eq(0);
                        $container.attr('hidden',true).addClass('opacity-0');
                        $next.attr('hidden',false);
                        setTimeout(function(){$next.removeClass('opacity-0');},500);
                        // increment attempt
                        var $attempt = (isNaN(Number($($wrapper).attr('data-attempt'))) ? 2 : Number($($wrapper).attr('data-attempt')) + 1);
                        $($wrapper).attr('data-attempt',$attempt);
                        //
                        callback();

                    }
                    $btnback.click(function(event){
                        event.preventDefault();
                        slides.eq(0).css('margin-left',getPos($(this),'back'));
                        buttonsUpdate($(this));
                    });
                    $btnnext.click(function(event){
                        event.preventDefault();
                        slides.eq(0).css('margin-left',getPos($(this),'next'));
                        buttonsUpdate($(this));
                    });
                    $btnsubmit.click(function(event){
                        event.preventDefault();
                        slides.eq(0).css('margin-left',getPos($(this),'next'));
                        buttonsUpdate($(this));
                    });
                    $btntryagain.click(function(event){
                        event.preventDefault();
                        // 1. load a different question
                        var $btn = $(this);
                        loadNextQuestion($btn,function(){
                            // 2. then reset this question
                            resetQuestion($btn);
                        });
                    });
                    $btncontinue.click(function(event){
                        event.preventDefault();
                        // scroll to next anchor
                        var $target = $(this).closest('[data-manual-scroll-when-done]').attr('data-manual-scroll-when-done');
                        rebus.utils.scrollToAnchor($target);
                    });
                    $btnreview.click(function(event){
                        event.preventDefault();
                        //
                        resetQuestion($(this), true);
                        // scroll to top of page
                        rebus.utils.scrollTop();
                    });
                    
                    // if(Math.abs($current) === $max) {/* disabled this button */}
                }
            $ul.addClass(type === 'radio' ? 'radio-list' : 'checkbox-list');
            //update scroll attrs on button before turning fb into modals
            $('[data-dismiss="modal"]', $activity).each(function(){
                var $btn = $(this),
                    $nextPanel = $activity.closest('.panel').data('scroll-when-done');
                    if( $btn.data('navigate-anchor') !== $nextPanel){
                        $btn.removeAttr('data-navigate-anchor');
                        $btn.attr('data-navigate-anchor', $nextPanel)
                    }
            });
            if($activity.find('.modal').length){
                $activity.addClass('has-modal-feedback');
                $activity.find('.modal').each(function () {
                    var $modal = $(this),
                        btnText = $modal.data('buttons') ? $modal.data('buttons') : $modal.hasClass('correct') ? 'Continue' : $modal.hasClass('incorrect') ? 'Continue' : 'OK, thank you. I understand.',
                        modalId = activityId + '-' + $modal.attr('class').split(' ').join('-');
                        hasFeedback = true;
                    if ($modal.hasClass('no-answer')) {
                        hasGiveUpModal = true;
                    }
                    $modal.detach().addClass('modal-template multiple-choice-quiz-modal').attr({ 'id': modalId, 'data-buttons': btnText }).appendTo($body);
                });
            }else{
                var responses = {};
                $activity.data('responses', responses);
                $('[data-response]', $activity).each(function () {
                    var $response = $(this);
                    responses[$response.attr('data-response')] = $response.html();
                    $response.remove();
                });
            }
            //if (hasFeedback) {
                if (!$('.btn-check-multi-choice-answers', $activity).length) {
                    $ul.after('<div class=""><button class="btn btn-primary btn-check-multi-choice-answers" disabled><span>' + ($activity.data('submit') || 'Check my answer') + '</span></button></div><p class="mobile-feedback-indicator-container"><span class="feedback-pointer"></span></p>');
                }
                if ($activity.attr('data-instant-feedback-mouse') !== undefined) {
                    $activity.find('.btn-check-multi-choice-answers').attr('hidden', true);
                }
            //}


            var $arialive = noannounce ? '' : 'aria-live="assertive" aria-atomic="false"';
            var $response = $([
                '<div class="response">',
                    '<div>',
                        '<div class="response-text" '+$arialive+' ></div>',
                    '</div>',
                '</div>'
            ].join('\n'));

            if ($activity.data('append-response-to')) {
                $($activity.data('append-response-to')).append($response).addClass('response-container');
            } else {
                $('.response-container', $activity).append($response)
            }/*  else {
                $('.question', $activity).after($response);
            } */

            $activity.data('$fb', $('.response-text', $response).liveFeedback());

            $ul.find('li').each(function (optionIdx) {
                var $li = $(this),
                    $appendAfter = $li.find('.append-after').removeClass('append-after').detach(),
                    appendAfter = $appendAfter.length ? $appendAfter[0].outerHTML : '',
                    label = $li.html(),
                    optionId = activityId + '_o' + optionIdx,
                    response = ($li.attr('data-feedback') ? $li.attr('data-feedback') :( $li.attr('data-required') === 'true' ? 'correct' : 'incorrect')),
                    inputHTML,
                    svg_insert,
                    correctIndicator = '<div class="icon-tick-cross"></div>';

                if (type === 'radio') {
                    inputHTML = '<input type="radio" data-idx="' + optionIdx + '" id="' + optionId + '" name="rg_' + activityId + '" />';
                    svg_insert = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44" role="presentation" focussable="false"><circle class="stroke" cx="19" cy="19" r="19" transform="translate(1 1)"/><circle class="selected" cx="14" cy="14" r="14" transform="translate(6 6)"/></svg>';
                } else {
                    inputHTML = '<input type="checkbox" data-idx="' + optionIdx + '" id="' + optionId + '" />';
                    svg_insert = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44" role="presentation" focussable="false"><rect class="stroke" width="38" height="38" fill="transparent" transform="translate(1 1)"/><rect class="fill selected" width="28" height="28" transform="translate(6 6)"/></svg>';
                }
                let labelid = $li.find('[aria-labelledby]');
                let labelledby = '';
                if(labelid)
                {
                    let id = labelid.attr('aria-labelledby');
                    labelid.attr('aria-labelledby','');
                    labelledby = 'aria-labelledby="'+id+'"';
                }
                
                $li.attr({ role: 'presentation', 'data-response': response }).empty().append([
                    inputHTML,
                    '<label for="' + optionId + '" '+labelledby+'>',
                    '<span class="indicator">',
                    //<div class="icon-' + type + '" data-svg="icon-' + type + '"></div>
                    //svg_insert,                     
                    '</span>',
                    label,
                    correctIndicator,
                    '</label>',
                    appendAfter
                ].join('\n'));

                
                if (optionsState) {
                    if ((type === 'checkbox' && optionsState.charAt(optionIdx) === '1') || (type === 'radio' && optionIdx + '' === optionsState)) {
                        $li.addClass('checked');
                        $li.find('input').prop('checked', true);
                        setCheckAnswerBtnState($activity);
                        activityStarted = true;
                    }
                }
                else if (type === 'checkbox') {
                    optionsDefaultState += '0';
                }
                else {
                    optionsDefaultState = '-1';
                }
            });
            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
                if ($activity.hasClass('activity-done')) {
                    if(!$activity.hasClass('has-modal-feedback')){
                        performSubmit($activity.find('.btn-check-multi-choice-answers'), $activity, false, true);
                        showAnswer($activity);
                    }
                }
                // if ($inlineFeedback && $inlineFeedback.length) {
                //     $activity.addClass('show-inline-feedback');
                // }
            }
            rebus.stateHelper.setElementState($activity, optionsState || optionsDefaultState);
            setCheckAnswerBtnState($activity);
        });

        if (partial) {
            return;
        }

        $('body').on('mousedown touchstart', '.radio-list li', function () {
            keyboard = false;
        }).on('keydown', '.radio-list li', function () {
            keyboard = true;
        }).on('focus', '.radio-list input, .checkbox-list input', function () {
            $(this).closest('li').addClass('focussed-pseudo');
        }).on('blur', '.radio-list input, .checkbox-list input', function () {
            $(this).closest('li').removeClass('focussed-pseudo');
        }).on('change', '.radio-list input', function (e) {
            var $input = $(this),
                $activity = $input.closest('[data-activity="multiple-choice-quiz"]'),
                $submit = $activity.find('.btn-check-multi-choice-answers'),
                instantFeedback = !keyboard && $activity.attr('data-instant-feedback-mouse') !== undefined;
            $activity.removeAttr('data-correct data-partially-correct').data('$fb').liveFeedback('value', '');
            $activity.removeClass('show-answer');
            //$activity.removeClass('show-inline-feedback');
            $input.closest('.radio-list').find('.checked').removeClass('checked');
            $input.closest('li').addClass('checked');
            rebus.stateHelper.setElementState($activity, $input.data('idx') + '');
            rebus.panels.markActivityAsStarted($activity);
            rebus.stateHelper.save();
            if (instantFeedback) {
                $submit.attr('hidden', true);
                $activity.removeClass('submit-visible');
                performSubmit($submit, $activity, true);
            }
            else {
                $submit.removeAttr('hidden');
                $activity.addClass('submit-visible');
            }
            setTimeout(function () {
                setCheckAnswerBtnState($activity);
            }, 100);
        }).on('click', '.checkbox-list input', function () {
            var $input = $(this),
                $activity = $input.closest('[data-activity="multiple-choice-quiz"]'),
                $option = $input.closest('li');
            $activity.removeAttr('data-correct data-partially-correct').data('$fb').liveFeedback('value', '');
            if ($option.hasClass('checked')) {
                $option.removeClass('checked');
            }
            else {
                $option.addClass('checked');
            }
            rebus.stateHelper.setElementState($activity, $input.is(":checked") ? '1' : '0', $input.data('idx'));
            rebus.panels.markActivityAsStarted($activity);
            rebus.stateHelper.save();
            setTimeout(function () {
                setCheckAnswerBtnState($input.closest('[data-activity="multiple-choice-quiz"]'));
            }, 100);
        }).on('click', '.btn-check-multi-choice-answers', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity="multiple-choice-quiz"]');
            performSubmit($btn, null, true);
            document.dispatchEvent(new CustomEvent("multiplechoicesubmit", { detail: {
                $activity: $activity,
                result: getResult($activity)
            }}));
            return false;
        }).on('click', '.btn-tried', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity="multiple-choice-quiz"]');
            //$btn.prop('disabled', true); We can't disable it because we focus on it after the modal is closed
            rebus.modalTemplates.setFocusOnClosed($btn);
            $('#' + $activity.attr('data-storeid') + '-modal-no-answer').modal();
            setAsComplete($activity);
        }).on('click', '.triggers-input', function () {
            $(this).closest('li').find('input').trigger('click');
        });
    },
    getResult: getResult,
    isCorrect: isCorrect,
    //reset: function ($quiz) {
    //    $quiz.find('input:checked').prop('checked', false);
    //    $quiz.find('.checked').removeClass('checked');
    //    return this;
    //},
    rebuildOptions: function ($activity) {
        var details = rebus.stateHelper.getElementDetails($activity),
            activityId = details.storeId,
            type = $activity.data('type');

        details[$activity.data('storeid')] = '-1';
        $activity.find('input:checked').prop('checked', false);
        $activity.find('.checked').removeClass('checked');
        $activity.removeClass('correct');
        $activity.removeClass('incorrect');
        $activity.removeClass('show-answer');

        $activity.find('ul.multiple-choice-quiz-options li').each(function (optionIdx) {
            var $li = $(this),
                label = $li.text(),
                optionId = activityId + '_o' + optionIdx,
                response = ($li.attr('data-feedback') ? $li.attr('data-feedback') :( $li.attr('data-required') === 'true' ? 'correct' : 'incorrect')),
                inputHTML,svg_insert,
                correctIndicator = '<div class="icon-tick-cross"></div>';

                if (type === 'radio') {
                    inputHTML = '<input type="radio" data-idx="' + optionIdx + '" id="' + optionId + '" name="rg_' + activityId + '" />';
                    svg_insert = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><title>Radio</title><circle class="stroke" cx="19" cy="19" r="19" transform="translate(1 1)"/><circle class="selected" cx="14" cy="14" r="14" transform="translate(6 6)"/></svg>';
                }
                else {
                    inputHTML = '<input type="checkbox" data-idx="' + optionIdx + '" id="' + optionId + '" />';
                    svg_insert = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><title>Checkbox</title><rect class="stroke" width="38" height="38" fill="transparent" transform="translate(1 1)"/><rect class="fill selected" width="28" height="28" transform="translate(6 6)"/></svg>';
                };

                $li.attr({ role: 'presentation', 'data-response': response }).empty().append([
                    inputHTML,
                    '<label for="' + optionId + '">',
                    '<span class="indicator">',
                    svg_insert,                     
                    '</span>',
                    label,
                    correctIndicator,
                    '</label>'
                ].join('\n'));

/*                 if (type === 'radio') {
                inputHTML = '<input type="radio" data-idx="' + optionIdx + '" id="' + optionId + '" name="rg_' + activityId + '" />';
            }
            else {
                inputHTML = '<input type="checkbox" data-idx="' + optionIdx + '" id="' + optionId + '" />';
            }
            $li.addClass('clearfix').attr({ 'role': 'presentation' }).empty().append([
                inputHTML,
                '<label for="' + optionId + '">',
                '<span class="indicator" aria-hidden="true"><img src="images/multichoice.png" alt="" /></span>',
                '<span class="correct-indicator" aria-hidden="true"><img src="images/icon_tick_red.png" alt="" /></span>',
                label,
                '</label>'
            ].join('\n')); */
        });
        return this;
    }
};
