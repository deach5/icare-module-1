import { $body } from './globals.js';

var $top;

var disableExternalLinks = function ($context) {
    var cleanHref = function (href) {
        return href.replace('https://', '').replace('http://', '').replace('mailto:', '');
    };
    $('[target="_blank"], [href^="mailto:"]', $context).each(function () {
        var $this = $(this),
            text = $this.html().trim(),
            href = $this.attr('href').trim();
        if (!$this.hasClass('disable-link')) {
            if (href === text || cleanHref(href) === cleanHref(text)) {
                $this.replaceWith('<span class="dummy-link split-overflowed-text">' + text + '</span>');
            } else {
                $this.replaceWith('<span class="dummy-link">' + text + '<br /><span class="split-overflowed-text">' + href + '</span>' + '</span>');
            }
        }
    });
};

var fixHeader = function () {
    var $header = $('.navbar-fixed-top'),
        captureScrollStart = true,
        timeoutId;
    $top.on('scroll', function () {
        window.clearTimeout(timeoutId);
        if (captureScrollStart) {
            captureScrollStart = false;
            $header.hide().removeClass('in');
        }
        timeoutId = window.setTimeout(function () {
            $header.css('top', $top.scrollTop() + 'px').show().offset();
            $header.addClass('in');
            captureScrollStart = true;
        }, 200);
    });
};

// We need to ensure that the modal doesn't extend further than the end of the body so that the parent's scroll is always
// Without the fix, depending on where the modal is and how long it is, the modal will sometimes scroll and then get stuck which requires
// the user to move their finger over to scroll the container
var fixModals = function () {
    var BUFFER = 200;
    $body.on('show.bs.modal', '.modal', function () {
        var log = rebus.logger.log,
            pos = $top.scrollTop();
        log('type=modal', 'Modal pre-show; scroll position: ', pos);
        $(this).data('scrollposition', pos);
    }).on('shown.bs.modal', '.modal', function (e) {
        var log = rebus.logger.log,
            $this = $(this),
            bodyheight = $body.outerHeight(),
            modalheight = $this.find('.modal-dialog').height(),
            pos = $this.data('scrollposition') || 0,
            requiredBodyHeight = pos + modalheight + BUFFER;
        log('type=modal', 'Pre shown scroll position versus now: ', $this.data('scrollposition'), $top.scrollTop());
        $top.scrollTop(pos);
        window.setTimeout(function () {
            log('type=modal', 'Original body height, Modal height + BUFFER (200) & Scroll position: ', bodyheight, modalheight + BUFFER, pos);
            if (requiredBodyHeight > bodyheight) {
                log('type=modal', 'Body height too small');
                $body.height(requiredBodyHeight);
                log('type=modal', 'Revised body height & (calculated)', requiredBodyHeight, $body.outerHeight());
            }
            $this.css('top', pos + 'px');
        }, 0);
    }).on('hidden.bs.modal', '.modal', function () {
        var log = rebus.logger.log,
            $this = $(this);
        $body.css('height', '');
        log('type=modal', 'Reset body height & return to scoll position', $body.outerHeight());
        $top.scrollTop($this.data('scrollposition'));
        $this.data('scrollposition', '');
    });
};

export default {
    apply: function (page, partial) {
        //disableExternalLinks();
        if (!partial && rebus.features.iOS()) {
            $top = $(top);
            fixModals();
            if (!page.hideHeader) {
                window.setTimeout(function () {
                    fixHeader();
                }, 0);
            }
        }
    },
    disableExternalLinksIfApp: function ($context) {
        if (rebus.features.isApp()) {
            //disableExternalLinks($context);
        }
    }
};
