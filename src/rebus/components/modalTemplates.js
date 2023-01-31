/*
    Builds a full modal, from a bare-bones template, detaches it and appends it to the body

    <div class="modal modal-template">
        Modal contents
    </div>

    data-header="Title:String|Include close button:Boolean"
    data-buttons="Button1~Button2" | "Button1|Class1~Button2|Class2" | "none"
    data-audio-file="String"
    data-focus-on-closed="Selector"

    <div class="modal modal-template" data-audio-file="file.mp3" data-header="Modal header|true" data-buttons="Try again|btn-try-again~Continue">
        Modal contents
    </div>

    The following attributes are automatically added:

        data-stop-audio-onopened="true" - Stops any audio when the modal is opened
        data-stop-audio-onclosed="true" - Stops any audio when the modal is closed
        data-auto-focus="true" - Focuses on the modal when opened and places focus back on the button, that opened it, when closed.
*/
var $focusOnClosed;

/*
    options: {
        header: String | { html: String, includeCloseBtn: Boolean },
        buttons: String | [String] | { label: String, classes: String } | [{ label: String, classes: String }]
    }

    data-header="String|Boolean"
    data-buttons="Button1~Button2" | "Button1|Class1~Button2|Class2" | 'none'

    If no options are passed, the modal is built with one 'Continue' button.
*/
var buildFullModal = function ($modal, options) {
    var html = $modal.html(),
        audioId = $modal.data('audio-file'),
        headerHTML,
        buttons, buttonsHTML = [],
        footer = '';

    options = options || {};

    // specify a size for the modal
    $modal.data('size') ? options.size = $modal.data('size') : options.size = "";
    if ($modal.data('buttons')) {
        options.buttons = $modal.data('buttons').split('~');
        if (options.buttons[0] !== 'none') {
            $.each(options.buttons, function (i, val) {
                var parts = val.split('|');
                if (parts.length > 1) {
                    options.buttons[i] = {
                        label: parts[0].trim(),
                        classes: parts[1].trim()
                    };
                }
            });
        }
    }

    if ($modal.data('header')) {
        options.header = $modal.data('header').split('|');
        if (options.header.length === 1) {
            options.header = options.header[0];
        } else {
            options.header = {
                html: options.header[0],
                includeCloseBtn: options.header[1].trim() === 'true'
            };
        }
    }

    buttons = options.buttons || ['Continue'];

    if (!$.isArray(buttons)) {
        buttons = [buttons];
    }

    if (buttons[0] !== 'none') {
        $.each(buttons, function () {
            var classes = 'btn btn-primary pink',
                label;
            if ($.isPlainObject(this)) {
                label = this.label || 'Continue';
                if (this.classes) {
                    classes += ' ' + this.classes;
                }
            } else {
                label = this;
            }
            buttonsHTML.push('<button class="' + classes + '" data-dismiss="modal"><span>' + label + '</span></button>');
        });
    }

    if (options.header) {
        var header,
            closeBtnHTML;
        if ($.isPlainObject(options.header)) {
            header = options.header.html;
            if (options.header.includeCloseBtn) {
                closeBtnHTML = '<button class="close" data-dismiss="modal" aria-label="Close">'+
                '<svg  aria-hidden="true" focusable="false" role="presentation" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 23 23">'+
                '<use href="content/images/icons.svg#icon-close-x" xlink:href="content/images/icons.svg#icon-close-x" />'+
                '</svg>'+
                '</button>';
            }
        } else {
            header = options.header;
        }
        header = header.trim();
        if (header.indexOf('<') !== '0') {
            header = '<h1 class="modal-title">' + header + '</h1>';
        }
        headerHTML = [
            '<div class="modal-header">',
            closeBtnHTML,
            header,
            '</div>'
        ].join('\n');
    }
    if (buttonsHTML.length) {
        footer = '<div class="modal-footer">\n' + buttonsHTML.join('\n') + '\n</div>';
    }

    $modal.addClass('fade')
        .attr({
            tabindex: '-1',
            role: 'dialog',
            'data-autofocus': true,
            'data-stop-audio-onclosed': true,
            'data-stop-audio-onopened': true
        })
        .removeAttr('data-audio-file').empty().append([
            '<div class="modal-dialog modal-dialog-centered '+(options.size || '')+'" role="document">',
            '<div class="modal-content">',
            headerHTML,
            '<div class="modal-body">',
            (audioId ? '<div class="audio-control" data-audio-file="' + audioId + '"></div>' : null),
            html,
            '</div>',
            footer,
            '</div>',
            '</div>'
        ].join('\n'));
};

export default {
    init: function () {
        $('.modal-template').each(function () {
            buildFullModal($(this));
        });

        if ($('.modal[data-autofocus="true"]').length) {
            $('[data-toggle="modal"]').on('click', function () {
                $focusOnClosed = $(this);
            });
            $('.modal').on('shown.bs.modal', function () {
                var $modal = $(this),
                    $focus;
                if ($modal.data('stop-audio-onopened')) {
                    rebus.audio.pause();
                    if(typeof(video) !== 'undefined'){
                        rebus.video.pause(video);
                    }
                }
                if ($modal.data('autofocus')) {
                    $focus = $modal.find('[tabindex="-1"]');
                    if (!$focus.length) {
                        $focus = $modal;
                    }
                    $focus[0].focus();
                }
                
            }).on('hidden.bs.modal', function () {
                var $modal = $(this),
                    focusOnClosed;
                if ($focusOnClosed && $modal.data('autofocus')) {
                    $focusOnClosed[0].focus();
                } else {
                    focusOnClosed = $modal.data('focus-on-closed');
                    if (focusOnClosed) {
                        $(focusOnClosed)[0].focus();
                    }
                }
                $focusOnClosed = null;
                if ($modal.data('stop-audio-onclosed')) {
                    rebus.audio.pause();
                    rebus.video.pauseAll();
                }
            }).on('loaded.bs.modal', function(){
                var $modal = $(this);
                //currently not used
            });
        }
    },
    setFocusOnClosed: function ($element) {
        $focusOnClosed = $element;
    },
    buildFullModal: buildFullModal
};
