import { $body } from '../globals.js';
import components from '../components.js';

/*
    Note: This can probably replace chooseHotspots (below) though it's not set up, yet, to show incorrect feedback if anywhere but a hotspot
          is clicked.

    The following example has the activity split over 2 images:

    HTML
    ----

    <div data-activity="click-areas" data-mandatory="true" data-done-indicator="images/icon_tick_green.png" class="show-click-areas animate-click-areas">
        <div id="cac-1" class="click-areas-container">
            <img class="click-areas-img" src="content/images/..." alt="..." usemap="#box-1-map" />
            <map name="box-1-map" id="box-1-map">
                <area alt="Area 1" href="#" shape="poly" coords="..." />
                <area alt="Area 2" href="#" shape="poly" coords="..." />
            </map>
        </div>
        <div id="cac-2" class="click-areas-container">
            <img class="click-areas-img" src="content/images/..." alt="..." usemap="#box-1-map" />
            <map name="box-1-map" id="box-1-map">
                <area alt="Area 2.1" href="#" shape="poly" coords="..." />
            </map>
        </div>
        <div class="modal">...</div>
        <div class="modal">...</div>
        <div class="modal">...</div>
    </div>

    CSS (the width and height must be specified for each .click-areas-container)
    ---

    #cac-1 { width: 415px; height: 270px; }
    #cac-2 { width: 416px; height: 272px; }

    Notes
    -----

    > Include a modal for each click area.
      If it's a choose hotspot task where only a final modal is shown, when the task is complete, include just one modal with the class: .complete
    > If it's a click and reveal task, include the classes: .show-click-areas & .animate-click-areas; omit it for a find hotspots task.
    > If [data-done-indicator] is included, done indicator images are automatically added with the class: .done-indicator.item-n
      -n is one based and is relative to the .click-areas-container:
        #cac-1 .done-indicator.item-1
        #cac-1 .done-indicator.item-2
        #cac-2 .done-indicator.item-1 (starts at 1 again)

    > SVG polygons are added for red focus highlights and blue blinking (item not clicked yet) highlights.
      To test & adjust the click areas without them blinking:
        > Remove the class .animate-click-areas
        > Inspect and look for <polygon class="click-area-highlight" />
        > Once happy, copy the data, add commas where there are spaces between the pairs, and copy into the map

    > Add the class: .click-area-once to the activity to prevent multiple clicks
*/
var markAreaAsDone = function ($activity, idx) {
    $activity.addClass('item-' + idx + '-done');
    $activity.find('img.done-indicator').eq(idx).removeAttr('hidden');
    $activity.find('.click-area-highlight').eq(idx).attr('hidden', true);
};

export default {
    dispose: function () {
        $('.click-areas-modal').remove();
    },
    init: function (partial) {
        $('[data-activity="click-areas"]').each(function () {
            var $activity = $(this),
                doneIndicatorImage = $activity.data('done-indicator'),
                $doneIndicators = $activity.find('img.done-indicator'),
                details = rebus.stateHelper.getElementDetails($activity),
                activityId = details.storeId,
                areasState = details.state,
                areasDefaultState = '',
                img_width = $activity.data( 'width' ),
                img_height = $activity.data( 'height' );

            // Add the highlight & focus polygons and done indicator images
            $activity.find('.click-areas-container').each(function () {
                var $container = $(this),
                    highlights = [],
                    focuses = [],
                    doneIndicators = [];
                $container.css('background-image', 'url(' + $container.find('.click-areas-img').attr('src') + ')')
                          .css('padding-bottom', ( img_height / img_width * 100 ) + '%' );
                $container.find('area').each(function (area_idx) {
                    var $area = $(this),
                        shape = $area.attr('shape'),
                        points = '',
                        coords = $area.attr('coords').split(','),
                        rect;
                    if (shape === 'rect') {
                        // recalc coords to percents
                        coords[2] = ( coords[2] - coords[0] ) / img_width * 100;
                        coords[3] = ( coords[3] - coords[1] ) / img_height * 100;
                        coords[0] = coords[0] / img_width * 100;
                        coords[1] = coords[1] / img_height * 100;
                        rect = 'x="' + coords[0] + '%" y="' + coords[1] + '%" width="' + coords[2] + '%" height="' + coords[3] + '%"';
                        // Rounded corners
                        rect += ' rx="5" ry="5"';
                        highlights.push('<rect class="click-area-highlight" ' + rect + ' />');
                        focuses.push('<rect class="click-area-focus" ' + rect + ' />');
                    } else if (shape === 'poly') {
                        for (var i = 0; i < coords.length - 1; i += 2) {
                            if (i > 0) {
                                points += ' ';
                            }
                            points += coords[i] + ',' + coords[i + 1];
                        }
                        highlights.push('<polygon class="click-area-highlight" points="' + points + '" />');
                        focuses.push('<polygon class="click-area-focus" points="' + points + '" />');
                    } else if (shape === 'circle') {
                        dimensions = Number(coords[0]) * 2;
                        circ = 'cx="' + coords[0] + '" cy="' + coords[1] + '" r="' + (Number(coords[2]) - 2) + '" width="' + dimensions + '" height="' + dimensions + '"';
                        highlights.push('<circle class="click-area-highlight" ' + circ + ' />');
                        focuses.push('<circle class="click-area-focus" ' + circ + ' />');
                    }
                    if (doneIndicatorImage) {
                        doneIndicators.push('<img class="done-indicator item-' + (area_idx + 1) + '" src="' + doneIndicatorImage + '"  alt="" hidden />');
                    }
                });
                $container.prepend('<svg focusable="false" xmlns="http://www.w3.org/2000/svg"><title></title>' + highlights.join('\n') + '\n' + focuses.join('\n') + '</svg>');
                if (doneIndicators.length) {
                    $container.append(doneIndicators.join('\n'));
                }
            });

            $doneIndicators.attr('hidden', true);
            $activity.find('.modal').each(function (i) {
                var $modal = $(this),
                    idSuffix = $modal.hasClass('complete') ? 'complete' : i;
                $modal.detach().addClass('modal-template click-areas-modal').attr('id', activityId + '-modal-' + idSuffix).appendTo($body);
            });


            $activity.find('area').each(function (i) {
                var $area = $(this);
                $area.data('original-alt', $area.attr('alt')).attr('data-idx', i);
                if (areasState) {
                    if (areasState.charAt(i) === '1') {
                        markAreaAsDone($activity, i);
                    }
                } else {
                    areasDefaultState += '0';
                }
            });
            if (areasState && areasState.indexOf('1') !== -1) {
                rebus.panels.markActivityAsStarted($activity);
            }
            rebus.stateHelper.setElementState($activity, areasState || areasDefaultState);

            $('[data-activity="click-areas"] area').popover({
                template: '<div class="popover ' + activityId + '-popover' + ($(this).data('popover-class') ? ' ' + $(this).data('popover-class') : '') + '" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
            }).on('show.bs.popover', function () {
                $('.' + activityId + '-popover.in').popover('hide');
            });
        });

        if (partial) {
            return;
        }

        $body.on('click', '[data-activity="click-areas"] area', function () {
            var $area = $(this),
                $activity = $area.closest('[data-activity]'),
                mandatory = $activity.data('mandatory'),
                required = mandatory === true ? $activity.find('area').length : mandatory,
                idx = $area.data('idx'),
                $completeModal,
                correct = true;
            if ($activity.hasClass('click-area-once') && $activity.hasClass('item-' + idx + '-done')) {
                return false;
            }
            $area.attr('alt', $area.data('original-alt') + ' (Visited)');
            markAreaAsDone($activity, idx);
            rebus.stateHelper.setElementState($activity, '1', idx);
            rebus.components.modalTemplates.setFocusOnClosed($area);
            if (rebus.stateHelper.getNoOfElementStateFlagsSet($activity) >= required) {
                rebus.panels.setActivityAsComplete($activity);
                $completeModal = $('#' + $activity.data('storeid') + '-modal-complete');
                if ($completeModal.length) {
                    $completeModal.modal('show');
                }
                correct = true;
            } else {
                rebus.panels.markActivityAsStarted($activity);
                correct = false;
            }
            if (!$completeModal || !$completeModal.length) {
                $('#' + $activity.data('storeid') + '-modal-' + idx).modal({
                    show: true
                });
            }
            rebus.stateHelper.save();

            // Track interaction (if supported)
            if ( correct ) {
                var details = rebus.stateHelper.getElementDetails($activity);
                //RecordPerformanceInteraction( details.storeId, details.state, correct, '1'.repeat( required ), 'click areas activity', null, null, null );
            }

            return false;
        }).on('focus', '[data-activity="click-areas"] area', function () {
            var $area = $(this);
            $area.closest('[data-activity]').find('.click-area-focus').eq($area.data('idx')).addClass('active');
        }).on('blur', '[data-activity="click-areas"] area', function () {
            var $area = $(this);
            $area.closest('[data-activity]').find('.click-area-focus').eq($area.data('idx')).removeClass('active');
        });
    }
};
