import { $body } from '../globals.js';
import components from '../components.js';

/*
        <div data-activity="match-btns" data-mandatory="true">
            <ul class="primary-match-btns">
                <li role="button" class="match-btn"><span class="sr-only">...</span><span class="txt-answer">...</span><img class="done-indicator" src="images/icon_tick_green.png" aria-hidden="true" /></li>
                <li role="button" class="match-btn"><span class="sr-only">...</span><span class="txt-answer">...</span><img class="done-indicator" src="images/icon_tick_green.png" aria-hidden="true" /></li>
            </ul>
            <ul class="secondary-match-btns">
                <li class="match-btn" role="button" data-required="1">...</li>
                <li class="match-btn" role="button" data-required="0">...</li>
            </ul>
            <div class="modal incorrect">...</div>
            <div class="modal complete">...</div>
        </div>

        > When a match is made, the class .item-done is added to the primary & secondary button.
*/
export default {
    dispose: function () {
        $('.match-btns-modal').remove();
    },
    init: function (partial) {
        $('[data-activity="match-btns"]').each(function () {
            var $activity = $(this),
                $secondaryBtns = $activity.find('.secondary-match-btns .match-btn'),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                activityState = details.state,
                defaultState = '';
            $activity.find('.modal').each(function () {
                var $modal = $(this),
                    id = activityId + '-modal-' + ($modal.hasClass('incorrect') ? 'incorrect' : 'complete');
                $modal.detach().addClass('modal-template match-btns-modal').attr('id', id).appendTo($body);
            });
            $activity.find('.primary-match-btns .match-btn').each(function (idx) {
                if (activityState && activityState[idx] === '1') {
                    $(this).addClass('item-done').attr({
                        'aria-selected': 'false',
                        tabindex: -1,
                        'data-idx': idx
                    });
                    $secondaryBtns.filter('[data-required="' + idx + '"]').addClass('item-done').attr({
                        'aria-selected': 'false',
                        tabindex: -1
                    });
                } else {
                    $(this).attr({
                        'aria-selected': 'false',
                        tabindex: 0,
                        'data-idx': idx
                    });
                    $secondaryBtns.filter('[data-required="' + idx + '"]').attr({
                        'aria-selected': 'false',
                        tabindex: -1
                    });
                }
                if (!activityState) {
                    defaultState += '0';
                }
            });
            rebus.stateHelper.setElementState($activity, activityState || defaultState);
        });

        if (partial) {
            return;
        }

        $body.on('click', '.primary-match-btns .match-btn', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity]'),
                $primary = $btn.closest('.primary-match-btns'),
                selected = $btn.attr('aria-selected') === 'true';
            if (selected) {
                $primary.find('.match-btn:not(.item-done)').attr('tabindex', 0);
                $activity.find('.seconday-match-btns .match-btn').attr('tabindex', -1);
                $btn.attr('aria-selected', 'false');
            } else {
                $primary.find('[aria-selected="true"]').attr('aria-selected', 'false');
                $btn.attr('aria-selected', 'true');
                $primary.find('[aria-selected="false"]').attr('tabindex', -1);
                $activity.find('.secondary-match-btns .match-btn:not(.item-done)').attr('tabindex', 0);
            }
            return false;
        }).on('click', '.secondary-match-btns .match-btn', function () {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity]'),
                $primary = $activity.find('.primary-match-btns'),
                $required = $primary.find('.match-btn').eq($btn.data('required')),
                $remaining,
                activityId = rebus.stateHelper.getElementDetails($activity).storeId;
            if ($required.attr('aria-selected') === 'true') {
                $btn.addClass('item-done');
                $required.addClass('item-done').attr({
                    'aria-selected': 'false',
                    tabindex: -1
                });
                $remaining = $primary.find('.match-btn:not(.item-done)');
                rebus.stateHelper.setElementState($activity, '1', $required.data('idx'));
                if ($remaining.length) {
                    $remaining.attr('tabindex', 0)[0].focus();
                } else {
                    $('#' + activityId + '-modal-complete').modal();
                    rebus.panels.setActivityAsComplete($activity);
                }
                rebus.stateHelper.save();
            } else {
                rebus.modalTemplates.setFocusOnClosed($btn);
                $('#' + activityId + '-modal-incorrect').modal();
            }
            return false;
        }).on('keydown', '.match-btn[role="button"]', function (e) {
            if (e.which === 13 || e.which === 32) {
                $(this).trigger('click');
                return false;
            }
        });
    }
};
