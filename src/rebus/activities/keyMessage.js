import { $body } from '../globals.js';
export default {
    init: function () {
        var clickKeyMessage = function($btn, $scrollto){
            var $container = $($btn).closest('.key-message-interaction'),
                $activity = $container.closest('[data-activity]'),
                $theMessage = $('.key-message-container',$activity);
                $container.addClass('item-done');
                // not always
                if($scrollto)
                {
                    var $target = $($btn).closest('section').find('.panel-anchor').attr('name');
                    rebus.utils.scrollToAnchor($target);
                }

        }
        $('[data-activity="key-message"]').each(function(){
            var $activity = $(this),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                btnsState = details.state,
                btnsDefaultState = '',
                activityStarted;
            $activity.find('.key-message-trigger').each(function (li_idx) {
                $(this).click(function(event){
                    clickKeyMessage($(this), true);
                });
            });
            // determine if it has been clicked already
            var $clickbtns = $($activity).find('[data-activity="click-btns"]')
            if($clickbtns)
            {
                var $cbdetails = rebus.stateHelper.getElementDetails($clickbtns);
                if($cbdetails.state+'' === '1')   clickKeyMessage($activity.find('.key-message-trigger'), false);
            }
        });
    }
}