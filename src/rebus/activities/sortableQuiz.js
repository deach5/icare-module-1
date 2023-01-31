import { $body } from '../globals.js';
import components from '../components.js';

/*
    data-mandatory = true | partial
    Note, not yet implemented; simply click the submit button to complete
    data-answer = '1,2,3,4,5,6,7'?? not fully implemented
*/
var performSubmit = function ($submit, $activity) {

    //do your stuff here

    var $checkedOption, correct, modalSelector;
        $activity = $activity || $submit.closest('[data-activity="sortable"]');
        correct = isCorrect($activity);
        // if ($checkedOption.find('.inline-feedback').length) {
        //     $activity.addClass('show-inline-feedback');
        // }
        // else 
        if($activity.find('.feedback') && !$activity.find('.modal')) {
            $activity.addClass('show-other-feedback');
        }
        else{
            //modalSelector = $checkedOption.data('feedback');
            //components.modalTemplates.setFocusOnClosed($submit);
            if (!modalSelector) {
                modalSelector = '#' + $activity.attr('data-storeid') + '-modal-' + (correct ? 'correct' : 'incorrect');
            }
            $(modalSelector).modal();
        }

        if (correct) {
            $activity.addClass('correct').removeClass('incorrect');;
        } else {
              $activity.addClass('incorrect').removeClass('correct');;
              showAnswer($activity);
        }
        if (correct || !$activity.data('mandatory') || $activity.data('mandatory') === 'partial') {
            setAsComplete($activity);
        }
};

var isCorrect = function ($activity) {
    var correct = true,
        $lis = $activity.find('.activity-sortable-options li');
    
    $lis.each(function (idx) {
        var $this = $(this),
            $datano = parseInt( $this.attr('data-no') );

        if ($datano !== idx) {
            correct = false;
            return false;
        }
    });
    
    return correct;
};

var setAsComplete = function ($activity) {
    showAnswer($activity);
    rebus.panels.setActivityAsComplete($activity, true);
};

var showAnswer = function ($activity) {
    if ($activity.data('show-answer')) {
        $activity.addClass('show-answer');
    }
};

export default {
    dispose: function () {
        $('.activity-sortable-modal').remove();
    },
    init: function(partial){
        var _this = this;
        $('[data-activity="sortable"]').each(function () {
            var $activity = $(this),
               $lis = $activity.find('.activity-sortable-options li');
               $activity.find('.activity-sortable-options').sortable({start: function( event, ui ) {
                    $activity.find('button.btn-submit-sortable-activity, button.btn-submit-assessment-answer').prop('disabled', false)
               }}).attr('tabindex', '0');

            //assign a data attr so we can track the order before shuffling
            $lis.each(function(){
                var $item = $(this);
                $item.attr('data-no', ($lis.index($item)));
            })

            // randomly shuffle list
            _this.shuffle($lis);

            $activity.append('<button class="btn btn-primary mt-2 btn-submit-sortable-activity"><span>Submit</span></button>');
            //$activity.find('.modal').attr('id', $activity.attr('data-storeid') + '-modal').addClass('modal-template activity-sortable-modal').detach().appendTo($body);

            $activity.find('.modal').each(function () {
                var $modal = $(this),
                    btnText = $modal.hasClass('correct') ? 'Continue' : $modal.hasClass('incorrect') ? 'Continue' : 'OK, thank you. I understand.',
                    modalId = $activity.attr('data-storeid') + '-' + $modal.attr('class').split(' ').join('-');
                if ($modal.hasClass('no-answer')) {
                    hasGiveUpModal = true;
                }
                $modal.detach().addClass('modal-template activity-sortable-modal').attr({ 'id': modalId, 'data-buttons': btnText }).appendTo($body);
            });

        });
        if (!partial) {
            $body.on('click', '.btn-submit-sortable-activity', function () {
                performSubmit($(this));
                return false;
            });
        }
        // Track interaction (if supported)
        //details = rebus.stateHelper.getElementDetails($activity);
        //activityId = details.storeId,
        //RecordPerformanceInteraction( rebus.config.TC_COURSE_NAME +"_"+ details.storeId, details.state, correct, '1'.repeat( required ), 'click btn activity' );
    },
    isCorrect: isCorrect,
    shuffle:  function($items){
        var ul = $items.parent().get(0);
        for (var i = $items.length; i >= 0; i--) {
            ul.appendChild(ul.children[Math.random() * i | 0]);
        }
   }
}
