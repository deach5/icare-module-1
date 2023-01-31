import { $body, page } from '../globals.js';

import scroller from './scroller.js';

var $modal;

export default {
    dispose: function () {
        $body.removeClass('read-or-listen-modal-in');
        $('.modal.read-or-listen').remove();
    },
    init: function () {
        var $introModal = $('.modal.intro-page'),
            ignoreIntroModal, readClicked;

        if (!$introModal.length) {
            return;
        }

        ignoreIntroModal = !$introModal.html().trim().length;

        $body.addClass('read-or-listen-modal-in');

        $modal = $([
            '<div class="modal read-or-listen" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">',
            '<div class="modal-dialog modal-dialog-centered" role="document">',
            '<div class="modal-content">',
            '<div class="modal-body">',
            '<p>The next screen includes a <br />brief audio introduction.</p>',
            '<p class="listen"><strong>Select</strong>',
            '<button class="btn-select-listen audio-control-simple" data-audio-file="' + $introModal.data('audio-file') + '" data-dismiss="modal" aria-label="Listen">',
            '<img src="images/btn-read-or-listen.png" alt="" />',
            '</button>',
            'to play',
            '</p>',
            '<p class="read">',
            '&nbsp;&nbsp;... or select',
            '<button class="btn-select-read" data-dismiss="modal" aria-label="Read">',
            '<img src="images/btn-read-or-listen.png" alt="" />',
            '</button>',
            'to read instead',
            '</p>',
            '</div>',
            '</div>',
            '</div>',
            '</div>'
        ].join('\n'));

        $body.append($modal);
        $introModal.removeAttr('data-audio-file').attr({
                'data-header': page.title + '|true',
                'data-buttons': "OK. Let's go"
            })
            .addClass('modal-template').detach().appendTo($body);

        $modal.one('hidden.bs.modal', function () {
            $body.removeClass('read-or-listen-modal-in');
            if (readClicked && !ignoreIntroModal) {
                $introModal.modal();
            }
        }).one('click', '.btn-select-read', function () {
            readClicked = true;
        });
    },
    show: function () {
        if ($modal) {
            $modal.modal();
        }
        var $bannerMessage = $('.banner-message').eq(0);
        if ($bannerMessage.length) {
            window.setTimeout(function () {
                $bannerMessage.addClass('flipped');
            }, 500);
        }
        if (page.topic) {
            scroller.start(!rebus.stateHelper.isPageComplete(page));
        }
    }
};
