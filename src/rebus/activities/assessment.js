import { $body } from '../globals.js';

var $activity, $questionPanels, $activePanel,
    noOfQuestions, details, activityId, page;

var activityState = {
    rowAttempt: [],
    started: false,
    init: function (state) {
        this.started = !!state;
        for (var i = 0; i < noOfQuestions; i++) {
            this.rowAttempt.push(state && state.length > i ? parseInt(state[i], 10) : 1);
        }
    },
    getAttempt: function () {
        var res = 1;
        $.each(this.rowAttempt, function (i, attempt) {
            res = Math.max(res, attempt);
        });
        return res;
    },
    toString: function () {
        return this.rowAttempt.join('');
    },
    save: function () {
        rebus.stateHelper.setElementState($activity, this.toString());
        rebus.stateHelper.save();
    }
};

var getNextQuestionPanel = function () {
    $activity = $('[data-activity="assessment"]');
    var $panel = $activity.find('.assessment-question-panel:not(.panel-done)');
    return $panel.length ? $panel.eq(0) : null;
};

var activatePanel = function ($panel) {
    if ($activePanel) {
        $activePanel.removeClass('active');
    }
    $activePanel = $panel;
    $activePanel.addClass('active');
    window.setTimeout(function () {
        $(top).scrollTop(0);
    }, 0);
};

var showFinalPanel = function () {
    var correctAmount = 0;
    $('.assessement-total-amount').text(noOfQuestions);
    $questionPanels.each(function ( idx ) {
        
        var $activity = $(this).find('[data-activity]'),
            $type = $activity.data('activity');
            switch ( $type ){
                case "multiple-choice-quiz":
                    if ( rebus.activities.multiChoiceQuiz.isCorrect( $activity ) ) {
                        correctAmount++;
                    }else{
                        //console.log('multi incorrect ' + correctAmount , idx)
                    }
                    break;
                case "sortable":
                    if ( rebus.activities.sortableQuiz.isCorrect( $activity ) ) {
                        correctAmount++;
                    }else{
                        //console.log('sortable inorrect' + correctAmount , idx)
                    }
                    break;
                default:
                    break;
            }    
      
    });
    if (correctAmount === noOfQuestions) {
        activatePanel($('.assessment-over-correct'));
    }
    else {
        $('.assessement-correct-amount').text(correctAmount);
        activatePanel($('.assessment-over-incorrect.attempt-' + activityState.getAttempt()));
    }
};

var questionPanels = (function () {
    
    return {
        buildTemplates: function () {
            $questionPanels = $('.assessment-question-panel');
        },
        updateQuestion: function (questionIdx) {
            var $panel = $questionPanels.eq(questionIdx).removeClass('has-ancillary'),
                $ancillary = $panel.find('.assessment-ancillary');
        },
        addQuestions: function () {
            for (var i = 0; i < $('.assessment-question-panel').length; i++) {
                $questionPanels.eq(i).prepend('<h2>Question '+ (i + 1) + '</h2>')
                this.updateQuestion(i);
            }
        }
    };
})();

export default {
    dispose: function () {
        $('body').removeAttr('assess-attempt');
    },
    buildTemplates: function () {
        // The row templates must be added before panels.init() is called so that it can generate ids and lock panels
        $activity = $('[data-activity="assessment"]');
        if ($activity.length) {
            noOfQuestions = $('.assessment-question-panel').length;
            questionPanels.buildTemplates();
        }
        page = rebus.navigation.getPage();
    },
    addQuestions: function () {
        // The questions must be added after panels.init(), so that we have access to the generated ids, and before the multiple choice
        // activity is initialized, so that the list items can be converted to options
        if ($activity.length) {
            $activity.data('storeid', page.storeId + 'assessment');
            var details = rebus.stateHelper.getElementDetails($activity);
            activityId = details.storeId;
            activityState.init(details.state);
            questionPanels.addQuestions();
        }
    },
    init: function (partial) {
        // Finally, now that the questions are built, we can start
        if (!$activity.length) {
            return;
        }

        $body.find('.btn-check-multi-choice-answers')
        .removeClass('btn-check-multi-choice-answers')
        .addClass('btn-submit-assessment-answer')
        .html('Submit');

        if (!partial) {
            $body.on('click', '.btn-submit-assessment-answer', function () {
                var $activity = $(this).closest('[data-activity="multiple-choice-quiz"], [data-activity="sortable"]'),
                    $panel, isCorrect = false,
                    $type = $activity.data('activity');
                    //show feedback on 3rd attempt
                    

                    switch ( $type ){
                        case "multiple-choice-quiz":
                            if ( rebus.activities.multiChoiceQuiz.isCorrect( $activity ) ) {
                                isCorrect = true;
                            }
                            break;
                        case "sortable":
                            if ( rebus.activities.sortableQuiz.isCorrect( $activity ) ) {
                                isCorrect = true;
                            }
                            break;
                        default:
                            break;
                    }    

                    rebus.panels.setActivityAsComplete($activity, true);
                if (activityState.getAttempt() >= 2 && !isCorrect) {
                    var modalSelector = '#' + $activity.attr('data-storeid') + '-modal-incorrect';
                    //set backdrop on modal to static so we can't click out
                    $(modalSelector).attr("data-backdrop","static");
                    //open the modal
                    $(modalSelector).modal();
                    $('.modal').on('click', '[data-dismiss="modal"]', function () {
                        nextOrEnd();
                    });
                }else{
                    nextOrEnd();
                }                    
            });
        }

        function nextOrEnd(){
            var $panel = getNextQuestionPanel();
            if ($panel) {
                activatePanel(getNextQuestionPanel());
            }
            else {
                showFinalPanel();
            }
        }

        $('#btn-start-assessment').on('click', function () {
            $('.assessment-intro').removeClass('active');
            $('body').attr('assess-attempt', activityState.getAttempt());
            activatePanel(getNextQuestionPanel());
            activityState.started = true;
            activityState.save();
            rebus.audio.pause();
        });

        $('.btn-assessment-try-again').on('click', function () {
            if (activityState.getAttempt() === 3) {
                rebus.stateHelper.resetModule(page.module.idx);
                rebus.navigation.gotoCurrentModuleMenu();
            }
            else {
                $questionPanels.each(function (i) {
                    var $panel = $(this),
                        $activity = $panel.find('[data-activity="multiple-choice-quiz"], [data-activity="sortable"]'),
                        $type = $activity.data('activity');


                     switch ( $type ){
                        case "multiple-choice-quiz":
                            if (!rebus.activities.multiChoiceQuiz.isCorrect($activity)) {
                                rebus.activities.multiChoiceQuiz.rebuildOptions($activity);
                                $panel.removeClass('panel-done panel-started');
                            }
                            break;
                        case "sortable":
                            if (!rebus.activities.sortableQuiz.isCorrect($activity)) {
                                $panel.removeClass('panel-done panel-started');
                            }
                            break;
                        default:
                            break;
                    }    

                    activityState.rowAttempt[i]++;
                    rebus.stateHelper.setElementState( $panel, '0' );
                    
                    questionPanels.updateQuestion(i, true);
                    $activity.find('.btn-submit-assessment-answer').prop('disabled', true);
                });
                activityState.save();
                activatePanel(getNextQuestionPanel());
            }
            return false;
        });
        $('body').attr('assess-attempt', activityState.getAttempt());
        if (activityState.started) {
            var $tmp = getNextQuestionPanel();
            if ($tmp) {
                activatePanel($tmp);
            }
            else {
                showFinalPanel();
            }
        }
        else {
            $('.assessment-intro').addClass('active');
        }
    }
};

// Track interaction (if supported)
//var details = rebus.stateHelper.getElementDetails($activity);
//activityId = details.storeId,
//RecordMultipleChoiceInteraction( rebus.config.TC_COURSE_NAME +"_"+ details.storeId, 'USERS RESPONSE', res, 'CORRECT ANSWER/S', $activity.find('.question-text').text() );


//also need to add scaled scores
//e.g./
//Set cmi.score.raw to 8
//Set cmi.score.min to 0
//Set cmi.score.max to 10
//Set cmi.score.scaled to 0.8