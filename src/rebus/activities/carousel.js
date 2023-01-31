import { $body } from '../globals.js';

/*
    Note: carousel-inner hides overflow so it's important to add the px-0 & px-3 classes to ensure that the background of the slides is within carousel-inner

    <section class="panel bg-white">
        // IMPORTANT! 'px-0'
        <div class="container px-0">
            <div data-touch="true" data-ride="carousel" data-activity="carousel" class="carousel slide" id="carousel-1" data-interval="false" data-mandatory="true">
                // IMPORTANT! 'px-3'
                <div class="carousel-inner px-sm-3">
                    <div class="carousel-item active">
                        <div class="row">
                            <div class="col-sm-6">Slide 1</div>
                            <div class="col-sm-6"><img /></div>
                        </div>
                    </div>
                    <div class="carousel-item">
                        <p>Slide 2</p>
                    </div>
                    ...
                </div>
                <div class="carousel-controls">
                    <ol class="carousel-indicators">
                        <li data-target="#carousel-1" data-slide-to="0" class="active"></li>
                        <li data-target="#carousel-1" data-slide-to="1"></li>
                    </ol>       
                    <div class="carousel-btns">
                        <button class="btn btn-primary" data-target="#carousel-1" data-slide="prev" aria-label="Previous"></button>
                        <button class="btn btn-primary" data-target="#carousel-1" data-slide="next" aria-label="Next"></button>                     
                    </div>
                </div>
            </div>
        </div>
    </section>
*/
export default {
    init: function (partial) {
        $('[data-activity="carousel"]').each(function () {
            var $activity = $(this),
                $slides = $('.carousel-item', $activity),
                details = rebus.stateHelper.getElementDetails($activity),
                state = details.state,
                defaultState = '',
                activityStarted;
            $slides.each(function (i) {
                var $slide = $(this);
                $slide.attr('data-idx', i);
                if (i === $slides.length - 1) {
                    $slide.addClass('final-slide');
                }
                if(i === 0){
                    $slide.addClass('first-slide');
                }
                if (state) {
                    if (state.charAt(i) === '1') {
                        $slide.addClass('item-done');
                        activityStarted = true;
                    }
                } else {
                    defaultState += '0';
                }
            });
            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
            }
            rebus.stateHelper.setElementState($activity, state || defaultState);
            
            //touch events not working on first slide
            //set timeout and reinit the carousel
            setTimeout(function(){$activity.carousel();}, 800);
             
        });

        if (!partial) {
            $body.on('slid.bs.carousel', '[data-activity="carousel"]', function (e) {
                var $activity = $(this),
                    $slide = $(e.relatedTarget),
                    $hasEmbeddedActivity = $slide.find('[data-activity]'),
                    correct;
                // new - update all indicators in this carousel
                var slide = isNaN(e.to) ? 0 : e.to
                $('.carousel-indicators', $activity).each(function($ix,$ul){
                    $('li',$ul).removeClass('active');
                    $('li',$ul).eq(slide).addClass('active');
                });
                //
                rebus.stateHelper.setElementState($activity, '1', $slide.data('idx'));
                if ($slide.hasClass('final-slide')) {
                    correct = true;
                    rebus.panels.setActivityAsComplete($activity);
                } else {
                    correct = false;
                    rebus.panels.markActivityAsStarted($activity);
                }
                rebus.stateHelper.save();
                
                // disable nav on either end of slide
                var pb = $activity.find( '[data-slide="prev"]' ),
                    nb = $activity.find( '[data-slide="next"]' );

                $slide.hasClass( 'first-slide' ) ? pb.addClass( 'disabled' ).attr('aria-disabled', 'true') : pb.removeClass( 'disabled' ).attr('aria-disabled', 'false');

                if( $slide.hasClass( 'final-slide' ) ){
                    $activity.addClass('on-last-slide'); 
                    nb.addClass( 'disabled' ).attr('aria-disabled', 'true');
                } else{
                    $activity.removeClass('on-last-slide'); 
                    nb.removeClass( 'disabled' ).attr('aria-disabled', 'false');
                }

                // this slide has a secondary (or more) activities in it. hold off completing the slide unless completed
                if($hasEmbeddedActivity.length){
                    if($hasEmbeddedActivity.hasClass('activity-done')){
                        $slide.addClass('item-done');
                        nb.removeClass( 'disabled' ).attr('aria-disabled', 'false');
                    }else{
                        nb.addClass( 'disabled' ).attr('aria-disabled', 'true');
                    }
                } else {
                    // no activity within so we can mark as done
                    $slide.addClass('item-done');
                }
                // remove tabindex from all other carousel containers
                $('.carousel-item').removeAttr('tabIndex');    
                // add tabindex so container can receive focus
                $slide.attr('tabIndex','0');
                // send the cursor to the element
                $slide[0].focus();

                // Track interaction (if supported)
                if ( correct ) {
                    var details = rebus.stateHelper.getElementDetails($activity);
                    //RecordPerformanceInteraction( details.storeId, details.state, correct, '1'.repeat( $('.carousel-item').find($activity).length ), 'carousel activity' );
                }

            });
        }

        // trigger slid for current active slide (if any) so its marked as done
        $( '[data-activity="carousel"]' ).each( function () {
            var $activity = $(this),
                $active_slide = $activity.find( '.carousel-item.active' );

            if ( $active_slide.length ) {
                $activity.trigger( {
                    type: 'slid.bs.carousel',
                    relatedTarget: $active_slide[0]
                } );
            }
        } );
    }
};
