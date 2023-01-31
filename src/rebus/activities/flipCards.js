import { $body, page } from '../globals.js';

/*
    <ul data-activity="flip-cards" data-mandatory="true">
        <li>
            <div class="d-flex flex-column justify-content-center">
                <p>FRONT: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do.</p>
            </div>
            <div class="d-flex flex-column justify-content-center">
                <p>REVERSE: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do.</p>
            </div>
        </li>
        ...
    </ul>

    CSS
    ----
    
    1. Fixed width and height, display non-stacked >= 768px
    
    .flip-card { width: 255px; height: 276px; }
    @media (min-width: 768px) {
        .flip-cards { flex-direction: row; justify-content: space-between; flex-wrap: wrap; }
        .flip-card { margin: 10px; }
    }

    2. Fluid width, display non-stacked, to per row >= 992px
    .flip-card { max-width: 255px; height: 276px; } // max-width options
    @media (min-width: 768px) {
        .flip-cards { flex-direction: row; flex-wrap: wrap; }
        .flip-cards > li { width: 50%; padding: 10px; }
        .flip-card { margin: 0; }
    }

    Notes
    -----

    > To show the flip icon on the reverse side as well as the front:
    <ul class="show-flip-icon-reverse">
*/
export default {
    init: function (partial) {
        $('[data-activity="flip-cards"]').each(function () {
            var $activity = $(this).addClass('flip-cards'),
                details = rebus.stateHelper.getElementDetails($activity),
                btnsState = details.state,
                btnsDefaultState = '',
                activityStarted,
                flipIcon = createFlipIcon('icon-flip-card', 48.831, 48.831),
                showFlipIconReverse = $activity.hasClass('show-flip-icon-reverse'),
                $cards = $('> li, .flip-item', $activity),
                requireAll = !$('[data-required]', $activity).length;
            $cards.each(function (li_idx) {
                var $card = $(this),
                    required = requireAll || $card.data('required'),
                    $front = $('> div:first-of-type', $card).detach().attr('tabindex', '-1').append('<span class="done-indicator sr-only">Visited</span>'),
                    $back = $('> div:last-of-type', $card).detach().attr('tabindex', '-1').append('<span class="done-indicator sr-only">Visited</span>'),
                    $btn = $('<button class="mx-auto flip-card" data-idx="' + li_idx + '" data-required="' + required + '"></button>')
                    .append('<div class="faces"><div class="face front" aria-hidden="false"></div><div class="face back" aria-hidden="true"></div></div>');
                $('.front', $btn).append($front).append(flipIcon);
                $('.back', $btn).append($back);
                if (showFlipIconReverse) {
                    $('.back', $btn).append(flipIcon);
                }
                if (btnsState) {
                    if (btnsState.charAt(li_idx) === '1') {
                        $btn.addClass('flipped flipped-it');
                        $('.front', $btn).attr('aria-hidden', "true");
                        $('.back', $btn).attr('aria-hidden', "false");
                        activityStarted = true;
                    }
                }
                else {
                    btnsDefaultState += '0';
                }
                $card.removeAttr('data-required').append($btn);
            });
            if (activityStarted) {
                rebus.panels.markActivityAsStarted($activity);
            }
            rebus.stateHelper.setElementState($activity, btnsState || btnsDefaultState);
        });
        
        if (partial) {
            return;
        }

        $body.on('click', '.flip-card', function ( e ) {
            var $btn = $(this),
                $activity = $btn.closest('[data-activity]'),
                mandatory = $activity.data('mandatory'),
                required = mandatory === true ? $activity.find('[data-required="true"].flip-card').length : mandatory,
                correct;

            // make sure e.target is not an audio btn (or is a child thereof)
            if ( e.target.closest( '.audio-btn' ) || e.target.closest( '.text-link' ) || e.target.closest( '.add-links-to-plan' ) )
                return;

            $btn.toggleClass('flipped');
            $btn.addClass('flipped-it');
            rebus.stateHelper.setElementState($activity, '1', $btn.data('idx'));
            if ($('[data-required="true"].flipped-it', $activity).length >= required) {
                correct = true;
                rebus.panels.setActivityAsComplete($activity);
            }
            else {
                correct = false;
                rebus.panels.markActivityAsStarted($activity);
            }
            rebus.stateHelper.save();
            var visibleSide = $btn.hasClass('flipped') ? '.back' : '.front',
                $visibleSide = $(visibleSide, $btn);
            $visibleSide.attr('aria-hidden', false);
            window.setTimeout(function () {
                $visibleSide[0].focus();
                $(visibleSide === '.front' ? '.back' : '.front', $btn).attr('aria-hidden', true);
            }, 0);

            // Track interaction (if supported)
            if ( correct ) {
                var details = rebus.stateHelper.getElementDetails($activity);
                //RecordPerformanceInteraction( details.storeId, details.state, correct, '1'.repeat( required ), 'flip card activity', null, null, null );
            }
        });
    }
};

// width & height = viewBox
var createFlipIcon = function (name, width, height) {
    return [
        '<svg class="icon-flip" focusable="false" role="presentation" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + width + ' ' + height + '">',
            '<use href="content/images/icons.svg#' + name + '" xlink:href="content/images/icons.svg#' + name + '" />',
        '</svg>',
    ].join('\n');
};