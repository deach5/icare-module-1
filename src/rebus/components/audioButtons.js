import { $body } from '../globals.js';

var buildAudioControlBtn = function (fileid, transcriptId) {
    var html = [
        '<button class="audio-btn" aria-label="Toggle audio" data-audio-file="' + fileid + '">',
            '<svg focusable="false" role="presentation" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64">',
                '<use href="content/images/icons.svg#icon-audio" xlink:href="content/images/icons.svg#icon-audio" />',
            '</svg>',
        '</button>',
        '<div><div></div></div>'
    ];

    return html.join('\n');
};

export default {
    dispose: function () {
        $('.audio-transcript-modal').remove();
    },
    init: function (partial) {
        // Do these first because the intro modal uses a simple control
        $('.audio-control-simple').each(function () {
            rebus.audio.add($(this).data('audio-file'));
        });
        $('.audio-control').each(function () {
            var $this = $(this),
                id = $this.data('audio-file'),
                transcript = $this.data('transcript');
            rebus.audio.add(id);
            $this.attr('data-id', id).removeAttr('data-audio-file').append(buildAudioControlBtn(id, transcript));
            if (transcript) {
                $this.after('<div class="margin-top-sm"><button data-transcript="' + transcript + '" class="btn btn-primary btn-read-audio-transcript"><span>Read the transcript</span></button></div>');
            }
        });
        if (partial) {
            return;
        }
        $body.on('click', '[data-audio-file]', function () {
            rebus.audio.toggle($(this).data('audio-file'));
        }).on('click', '.btn-read-audio-transcript', function () {
            var $btn = $(this),
                id = $btn.data('transcript');
            rebus.audio.pause();
            $.get("content/audio/" + id + ".html", function (data) {
                rebus.controls.modal.show({
                    class: 'audio-transcript-modal',
                    header: 'Audio transcript',
                    body: data,
                    footer: '<button class="btn btn-primary" data-dismiss="modal"><span>Close</span></button>',
                    focusOnOpened: 'modal',
                    focusOnClosed: $btn
                });
            });
        }).on('timeupdate', function () {
            var e = arguments[1];
            $('.audio-control[data-id="' + e.id + '"] > div > div').css('width', Math.floor(e.ratio*100) + '%');
        });
    }
};
