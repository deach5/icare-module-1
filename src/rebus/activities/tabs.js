import { $body } from '../globals.js';

/*

<div class="tabbed" data-activity="tab-panel">
    <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="AAA" data-toggle="tab" href="#XXX" role="tab" aria-controls="XXX" aria-selected="true">...</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="BBB" data-toggle="tab" href="#YYY" role="tab" aria-controls="YYY" aria-selected="false">...</a>
        </li>
    </ul>

    <!-- Tab panes -->
    <div class="tab-content">
        <div class="tab-pane active" id="XXX" role="tabpanel" aria-labelledby="AAA">
            <h4>...</h4>
            <p>...</p>
        </div>
        <div class="tab-pane" id="YYY" role="tabpanel" aria-labelledby="YYYY">
            <h4>...</h4>
            <p>...</p>
        </div>
    </div>
</div>
                                


*/

export default {
    init: function (partial) {
        $('[data-activity="tab-panel"]').each(function (actIdx) {
            var $activity = $(this).addClass('tab-panel'),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                btnsState = details.state,
                btnsDefaultState = '',
                activityStarted,
                $items = $('.nav-link', $activity),
                $reveals = $('.tab-pane', $activity);

            $items.each(function(t_idx){
                var cardid = 'act' + actIdx + '_t' + t_idx,
                    itemid = cardid + '_tab' + t_idx,
                    tabpanelid = cardid + '_tabpanel' + t_idx,
                    $tab = $(this),
                    $reveal = $reveals.eq(t_idx);

                $tab.attr({
                    'id': itemid,
                    'aria-controls': tabpanelid,
                    //'aria-selected': false,
                    'data-idx': t_idx,
                    'href': '#'+ tabpanelid,
                    'role': 'tab',
                    'data-toggle': "tab",
                });

                $reveal.attr({
                    'id': tabpanelid,
                    'role': 'tabpanel',
                    'aria-labelledby': itemid
                });

                if (btnsState) {
                    if (btnsState.charAt(t_idx) === '1') {
                        $tab.addClass('item-done');
                        activityStarted = true;
                    }
                } else {
                    btnsDefaultState += '0';
                }
            });

            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
            }

            rebus.stateHelper.setElementState($activity, btnsState || btnsDefaultState);
        });

        if (partial) {
            return;
        }

        $body.on('click', '.nav-link', function ( e ) {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity]'),
                reveal = $btn.attr('href'),
                mandatory = $activity.data('mandatory'),
                required = mandatory === true ? $activity.find('.nav-link').length : mandatory,
                correct;

            $btn.addClass('item-done');
            rebus.stateHelper.setElementState($activity, '1', $btn.data('idx'));

            if ($activity.find('.item-done').length >= required) {
                rebus.panels.setActivityAsComplete($activity);
                if (feedback) {
                    $(feedback).addClass('done');
                }
                correct = true;
            } else {
                rebus.panels.markActivityAsStarted($activity);
                correct = false;
            }
            rebus.stateHelper.save();

            // Track interaction (if supported)
            if ( correct ) {
                var details = rebus.stateHelper.getElementDetails($activity);
                //RecordPerformanceInteraction( details.storeId, details.state, correct, '1'.repeat( required ), 'accordion activity', null, null, null );
            }
        });
    }
};