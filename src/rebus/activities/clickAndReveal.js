/*
    <div data-activity="click-and-reveal" data-reveal-type="show|expand" data-reveal-in-order="true" data-show-only-one="true" data-mandatory="true">
        <ul>
            <li>
                <button class="btn btn-primary btn-reveal one" data-reveal=".reveal.one"><span>Item 1</span></button>
                <button class="btn btn-primary btn-reveal one" data-reveal=".reveal.two"><span>Item 2</span></button>
                ...
            </li>
        </ul>
        <p class="reveal one">Reveal 1</p>
        <p class="reveal two">Reveal 2</p>
        <div class="reveal one">Another Reveal 1</div>
    </div>

    > data-show-only-one: hide previous reveal item
    > The class 'item-active' is added to the current button and reveal items
    > The class 'click-and-reveal-item' is added to all reveal items
    > The class 'item-done' is added to the buttons and reveal items that have been completed
    > If [data-reveal-type] is omitted, "show" is used.
      > By default the following CSS is used to reveal the blocks:
        [data-activity="click-and-reveal"][data-reveal-type="show"] .click-and-reveal-item:not(.item-done) { display: none; }
    > [data-reveal-type="expand"] uses Bootstrap collapse to show/hide
*/
export default {
    dispose: function(){

    },
    init: function (partial) {

        //rebus.utils.modalReplacementContent();

        $('[data-activity="click-and-reveal"]').each(function () {
            var $activity = $(this),
                revealInOrder = $activity.data('reveal-in-order'),
                revealType = $activity.data('reveal-type'),
                details = rebus.stateHelper.getElementDetails($activity),
                btnsState = details.state,
                btnsDefaultState = '',
                totalreveals = $('[data-reveal]', $activity).length,
                activityStarted;                
            if (!revealType) {
                revealType = 'show';
                $activity.attr('data-reveal-type', 'show');
            }
            $('[data-reveal]', $activity).each(function (btnIdx) {
                var $btn = $(this).attr('data-idx', btnIdx),
                    revealSelector = $btn.data('reveal'),
                    $associate = $btn.data('partner') ? $($btn.data('partner')) : null,            
                    $reveal = $(revealSelector).addClass('click-and-reveal-item'),
                    id = $reveal.attr('id');

                    if(btnIdx<(totalreveals-1)){      
                        $reveal.append("<a href='javascript:void(0)' class='keyboard-only'>Continue</a>").on({
                            click:function(){                                    
                                $('[data-reveal]', $activity).eq(btnIdx+1)[0].focus()                                   
                            }
                        });
                    }


                //hackorama
                if($associate){
                    var $parent = $associate.parent(),
                        $kids = $parent.find('img:not(.static)').fadeOut();
                }
                if (revealType === 'expand') {
                    if (!id) {
                        id = details.storeId + '-' + btnIdx;
                        $reveal.attr('id', id);
                    }
                    $btn.attr({
                        'data-toggle': 'collapse',
                        'data-target': '#' + id,
                        'aria-expanded': 'false',
                        'aria-controls': id
                    });
                    $reveal.addClass('collapse');
                }
                if (btnsState) {
                    if (btnsState.charAt(btnIdx) === '1') {
                        $btn.addClass('item-done');
                        $reveal.addClass('item-done');
                        activityStarted = true;
                    }
                } else {
                    btnsDefaultState += '0';
                }
                if (revealInOrder && btnIdx > 0 && (btnsState || btnsDefaultState)[btnIdx - 1] === '0') {
                    $btn.attr('disabled', true);
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
        
        $('body').on('click', '[data-reveal]', function () {
            var $btn = $(this),
                idx = $btn.data('idx'),
                $activity = $btn.closest('[data-activity]'),
                $panel = $btn.closest('section.panel'),
                count = $('[data-reveal]', $activity).length,
                revealSelector = $btn.data('reveal'),
                $reveal = $(revealSelector, $activity),
                $associate = $btn.data('partner') ? $($btn.data('partner')) : null,
                mandatory = $activity.data('mandatory'),
                required = mandatory === true ? count : mandatory,
                correct;


            $('.click-and-reveal-item.item-active', $activity).removeClass('item-active');
            
            //hackorama
            if($activity.data('show-only-one')){
                var _obs = $('.item-active', $activity);
                _obs.removeClass('item-active');
            }
            $btn.addClass('item-done item-active')
            $reveal.addClass('item-done item-active').attr({'tabindex': 0})[0].focus();     

            
            if($associate){
                var $parent = $associate.parent(),
                    $kids = $parent.find('img:not(.static):not('+$btn.data('partner')+')');
                    $kids.fadeOut();
                    $associate.fadeIn()
            }

            if ( $reveal.hasClass( 'modal' ) ) {
                if ( $reveal.find( '.modal-body' ).length === 0 )
                    rebus.components.modalTemplates.buildFullModal( $reveal );
                    rebus.components.modalTemplates.setFocusOnClosed($btn);
                $reveal.modal( 'show' )[0].focus();
            }

            
            if ($activity.data('reveal-in-order') && idx < count - 1) {
                $('[data-reveal][data-idx="' + (idx + 1) + '"]', $activity).removeAttr('disabled');
            }
            rebus.stateHelper.setElementState($activity, '1', $btn.data('idx'));
            if ($('[data-reveal].item-done', $activity).length >= required) {
                rebus.panels.setActivityAsComplete($activity);
                correct = true;
            } else {
                rebus.panels.markActivityAsStarted($activity);
                correct = false;
            }
            rebus.stateHelper.save();
    
            // Track interaction (if supported)
            if ( correct ) {
                var details = rebus.stateHelper.getElementDetails($activity);
                //RecordPerformanceInteraction( details.storeId, details.state, correct, '1'.repeat( required ), 'click reveal activity', null, null, null );
            }
        });
    }
};