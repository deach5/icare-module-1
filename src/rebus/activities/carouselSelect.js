import '../../../node_modules/owl.carousel/dist/owl.carousel.js';
import { $body } from '../globals.js';

/*
    [data-submit-type]:
        'button' (default) - the button will be enabled when at least 1 option has been selected
        'button-exact' - the button won't be enabled until the exact number of options have been selected; not less or more
        'instant' - If instant is specified for a single select and the keyboard is detected, the button will still be shown

    [data-submit-text]: Submit button text; if not present, defaults to 'Submit'

    <div data-activity="carousel-select" data-submit-type="button" data-randomize="true|false" data-mandatory="partial">
        <div class="owl-carousel">
            <div>Slide 1</div>
            <div data-required="true">Side 2</div>
            <div>Slide 3</div>
            <div data-required="true">Side 4</div>
        </div>
    </div>

    https://github.com/maaaaark/bcSwipe/blob/master/jquery.bcSwipe.min.js
    https://stackoverflow.com/questions/21349984/how-to-make-bootstrap-carousel-slider-use-mobile-left-right-swipe
*/
var isSubmitable = function ($activity) {
    var submitType = $activity.data('submit-type') || 'button',
        selected = $activity.find('.selected').length;
    if (submitType === 'instant' || submitType === 'button-exact') {
        return selected === $activity.data('required-selections');
    }
    else {
        return selected > 0;
    }
};

// Returns false if the submit button is not shown
var setSubmitBtnState = function ($activity) {
    var submitType = $activity.attr('data-submit-type') || 'button';
    if (submitType !== 'instant') {
        $activity.find('.btn-submit-answer').prop('disabled', !isSubmitable($activity));
        return true;
    }
};

var liveFeedback = (function () {
    var getContentElement = function ($carousel) {
        return $carousel.closest('[data-activity="carousel-select"]').find('.carousel-live-feedback .content');
    };
    var getStateElement = function ($carousel) {
        return $carousel.closest('[data-activity="carousel-select"]').find('.carousel-live-feedback .state');
    };
    var updateSelectedState = function ($item, selected) {
        var $activity = $item.closest('[data-activity="carousel-select"]'),
            html = ['<p>' + (selected ? 'Selected' : 'Not selected') + '</p>'];
        if ($activity.data('required-selections') === 1) {
            if (!selected) {
                html.push('<p>Press enter or space to select</p>');
            }
        }
        else {
            html.push('<p>Press enter or space to ' + (selected ? 'deselect' : 'select') + '</p>');
        }
        getStateElement($item).empty().append(html.join('\n'));
    };
    return {
        updateContent: function ($carousel, page) {
            var count = $('.owl-item', $carousel).length,
                $item;
            page = undefined === page ? $('.active', $carousel).index() : page;
            $item = $('.carousel-item-inner-1', $carousel).eq(page);
            getContentElement($carousel).empty().append('<p>Item ' + (page + 1) + ' of ' + count + '</p>\n' + $item.html());
            updateSelectedState($item, $item.hasClass('selected'));
        },
        updateSelectedState: updateSelectedState,
        clear: function ($carousel) {
            getContentElement($carousel).empty();
            getStateElement($carousel).empty();
        }
    };
})();

var selectItem = function ($item, updateLiveFeedback) {
    $item.addClass('selected');
    $item.closest('.owl-carousel').find('.owl-dots > .owl-dot').eq($item.closest('.owl-item').index()).addClass('item-selected');
    if (updateLiveFeedback) {
        liveFeedback.updateSelectedState($item, true);
    }
};

var deselectItem = function ($item, updateLiveFeedback) {
    $item.removeClass('selected');
    $item.closest('.owl-carousel').find('.owl-dots > .owl-dot').eq($item.closest('.owl-item').index()).removeClass('item-selected');
    if (updateLiveFeedback) {
        liveFeedback.updateSelectedState($item, false);
    }
};

var performSubmit = function ($submit, $activity) {
    var correct = true,
        learnerResponse = '',
        correctResponse = '',
        responses = [],
        correct_responses = [];
    $activity = $activity || $submit.closest('[data-activity="carousel-select"]');
    $('.carousel-item-inner-1', $activity).each(function () {
        var $item = $(this),
            selected = $item.hasClass('selected'),
            required = $item.attr('data-required') === 'true',
            // ResponseIdentifier requres one char per answer so below limits max nr answers to 36
            // consider using base64 or base256 for more, or have a serious convo with LD or client :D
            short = $item.data('idx').toString( 36 ),
            long = $item.clone().children().remove().end().text().trim().replaceAll(/\s+/g,'-'), // See: https://stackoverflow.com/a/33592275
            response = Track.getScormVersion() == '1_2' ? short : long; //CreateResponseIdentifier( short, long );

        if (correct && selected !== required) {
            correct = false;
        }
        learnerResponse += selected ? '1' : '0';
        correctResponse += required ? '1' : '0';

        if ( selected )
            responses.push( response );
        if ( required )
            correct_responses.push( response );
    });
    if (correct || !$activity.data('mandatory') || $activity.data('mandatory') === 'partial') {
        /* Track.setInteraction({
            $activity: $activity,
            type: 'other', //choice me think - its really a multichoice converted into a carousel
            learnerResponse: responses,
            correctResponse: correct_responses,
            correct: correct
        }); */
        rebus.panels.setActivityAsComplete($activity, true, correct);
    }
    questionFeedback.show(correct ? 'correct' : 'incorrect');

    // Track interaction (if supported)
    var details = rebus.stateHelper.getElementDetails($activity);
    //RecordMultipleChoiceInteraction( details.storeId, responses, correct, correct_responses, $activity.find('.question-text').text(), null, null, null );
};

var createCarousel = function ($element, startPosition) {
    $element.owlCarousel({
        startPosition: startPosition || 0,
        //margin: 10,
        loop: false,
        mouseDrag: false,
        touchDrag: true,
        pullDrag: false,
        items: 1,
        //stagePadding: $element.closest('[data-activity="carousel-select"]').width() * 0.095,
        stagePadding: 0,
        nav: true,
        /* animateOut: 'fadeOut',  removed as caused issue in iOS. Sometimes elements would remain invisible */
        dots: true,
        onResized: function (e) {
            var $carousel = $(e.target);
            $carousel.trigger('destroy.owl.carousel');
            createCarousel($carousel, e.page.index);
        },
        onTranslate: function (e) {
            liveFeedback.updateContent($(e.target), e.page.index);
        },
        onInitialized: function (e) {
            $('.owl-nav, .owl-dots', $element).attr('aria-hidden', true);
            $('.owl-stage', $element).attr('aria-hidden', true);
            $('.owl-stage-outer', $element).attr({ 'tabindex': '0', 'aria-label': 'List of ' + e.item.count + ' items. Use the arrow keys to navigate and enter or space to select.' });
            $('.selected', $element).each(function () {
                selectItem($(this));
            });
        }
    });
};

var onItemClicked = function ($item) {
    var $activity = $item.closest('[data-activity="carousel-select"]'),
        $carousel = $('.owl-carousel', $activity),
        selected;
    if ($activity.data('required-selections') === 1) {
        if (!$item.hasClass('selected')) {
            deselectItem($('.selected', $carousel));
            selectItem($item, true);
            rebus.stateHelper.setElementState($activity, $item.attr('data-idx'));
        }
    }
    else {
        if ($item.hasClass('selected')) {
            deselectItem($item, true);
        }
        else {
            selectItem($item, true);
            selected = true;
        }
        rebus.stateHelper.setElementState($activity, selected ? '1' : '0', parseInt($item.attr('data-idx'), 10));
    }
    page.save();
    if (!setSubmitBtnState($activity) && isSubmitable($activity)) {
        performSubmit(null, $activity);
    }
};

export default {
    init: function (partial) {
        $('[data-activity="carousel-select"]').each(function () {
            var $activity = $(this),
                $carousel = $('.owl-carousel', $activity),
                $items = $('> div', $carousel),
                randomize = $activity.data('randomize'),
                requiredSelections = $items.filter('[data-required="true"]').length,
                singleSelect = requiredSelections === 1,
                submitType = $activity.attr('data-submit-type') || 'button',
                details = rebus.stateHelper.getElementDetails($activity),
                //id = details.storeId + '-carousel',
                state = details.state,
                defaultState = '',
                html = [];
            $carousel.wrap('<div></div>');
            $carousel.data('refreshCarousel', function () {
                $carousel.trigger('destroy.owl.carousel');
                createCarousel($carousel);
            });
            $activity.data('required-selections', requiredSelections);
            // Submit button
            if (submitType !== 'instant') {
                $('> div:last-of-type', $activity).append('<button class="btn btn-primary btn-submit-answer" disabled="disabled"><span>' + ($activity.data('submit-text') || 'Submit') + '</span></button>');
            }
            // Items
            $items.each(function (i) {
                var $item = $(this).clone(),
                    $inner = $('<div />', { 'class': 'carousel-item-inner-2' }).append($item.html()),
                    selected;
                if (state) {
                    if ((!singleSelect && state.charAt(i) === '1') || (singleSelect && i + '' === state)) {
                        //setCheckAnswerBtnState($activity);
                        selected = true;
                    }
                }
                else if (singleSelect) {
                    defaultState = '-1';
                }
                else {
                    defaultState += '0';
                }
                $item.addClass('carousel-item-inner-1' + (selected ? ' selected' : '')).attr({ 'data-idx': i, role: 'button' }).empty().append($inner);
                html.push($item[0].outerHTML);
            });
            if (randomize) {
                html = rebus.utils.shuffle(html);
            }
            $carousel.empty().append(html.join('\n')).after([
                '<div class="carousel-live-feedback sr-only" aria-live="polite" aria-atomic="false">',
                '<div class="content"></div>',
                '<div class="state"></div>',
                '</div>'
            ].join('\n'));
            rebus.stateHelper.setElementState($activity, state || defaultState);
            setSubmitBtnState($activity);
        });

        createCarousel($('[data-activity="carousel-select"] .owl-carousel'));

        if (partial) {
            return;
        }
        $body.on('click', '[data-activity="carousel-select"] .btn-submit-answer', function () {
            performSubmit($(this));
        }).on('keyup', '[data-activity="carousel-select"] .owl-stage-outer', function (e) {
            if (e.which === 13 || e.which === 32) {
                onItemClicked($('.owl-item.active .carousel-item-inner-1', this));
                return false;
            }
            else if (e.which === 37) {
                $(this).closest('.owl-carousel').trigger('prev.owl.carousel');
                return false;
            } else if (e.which === 39) {
                $(this).closest('.owl-carousel').trigger('next.owl.carousel');
                return false;
            }
        }).on('focus', '[data-activity="carousel-select"] .owl-stage-outer', function (e) {
            liveFeedback.updateContent($(this).closest('.owl-carousel'));
        }).on('blur', '[data-activity="carousel-select"] .owl-stage-outer', function (e) {
            liveFeedback.clear($(this));
        }).on('click', '[data-activity="carousel-select"] .carousel-item-inner-1', function (e) {
            // Ignore the clicked item - it may be the previous one still transitioning out; it's the active item we want to select
            onItemClicked($(this).closest('.owl-carousel').find('.owl-item.active .carousel-item-inner-1'));
            return false;
        });
    }
};
