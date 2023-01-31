var modal = (function () {
    return {
        /*
            options: { 
                header: String, body: String, footer: String,
                focusOnOpened: jQuery,
                focusOnClosed: jQuery,
                onShown: Function,
                onClosing: Function ($button),
                onClosed: Function ($button),
                appendTo: String
                class: String
            } 
         */
        show: function (options) {

            var $modal, $closeButton,
                $focusOnClosed = options.focusOnClosed,
                $saveFocusOnClosed,
                onShown = options.onShown,
                onClosed = options.onClosed,
                removeOnClosed = true,
                content = '',
                //css = rebus.features.isApp ? 'no-fade ' : 'fade ' + (options['class'] || '');
                css = 'fade ' + (options['class'] || '');
            var timeout = $('body .modal.show').length ? 500 : 0;
            if($('body .modal.show').length){
                $('body').removeClass('modal-open');
                $('body .modal.show').each(function(e){$(this).modal('hide')})
            }

            if (options.header) {
                content += '<div class="modal-header">\n' + options.header + '</div>\n';
            }
            if (options.body) {
                content += '<div class="modal-body">\n' + options.body + '</div>\n';
            }
            if (options.footer) {
                content += '<div class="modal-footer">\n' + options.footer + '</div>\n';
            }
            if (options.bodyClass) {
                $('body').addClass(options.bodyClass);
            }
            $modal = $([
                '<div class="modal ' + css.trim() + '" tabindex="-1" role="dialog">',
                '<div class="modal-dialog modal-dialog-centered" role="document">',
                '<div class="modal-content">',
                content,
                '</div>',
                '</div>',
                '</div>'
            ].join('\n'));
            if (options.appendTo) {
                $(options.appendTo).append($modal);
            } else {
                //$('body > .container').append($modal);
                $('#main-content').append($modal);
            }
            $modal.on('show.bs.modal', function () {
                rebus.appFixes.disableExternalLinksIfApp($modal);
            }).on('shown.bs.modal', function () {
                if (options.focusOnOpened) {
                    if (options.focusOnOpened === 'modal') {
                        $modal[0].focus();
                    } else {
                        options.focusOnOpened[0].focus();
                    }
                }
                if (onShown) {
                    onShown();
                }
            }).on('hide.bs.modal', function () {
                if (options.onClosing) {
                    options.onClosing($closeButton);
                }
            }).on('hidden.bs.modal', function () {
                if (options.bodyClass) {
                    $('body').removeClass(options.bodyClass);
                }
                if ($focusOnClosed) {
                    $focusOnClosed[0].focus();
                }
                if (onClosed) {
                    onClosed($closeButton);
                }
                if (removeOnClosed) {
                    // Ensure the iOS modal fix hidden handler is called before we remove
                    window.setTimeout(function () {
                        $modal.remove();
                    }, 0);
                }
            }).on('click', '[data-dismiss]', function () {
                $closeButton = $(this);
            });
            setTimeout(function(){
                $modal.modal();
            }, timeout)
            
            return {
                hide: function (callback) {
                    removeOnClosed = false;
                    onClosed = callback;
                    $saveFocusOnClosed = $focusOnClosed;
                    $focusOnClosed = null;
                    $modal.modal('hide');
                },
                show: function (callback) {
                    removeOnClosed = true;
                    $focusOnClosed = $saveFocusOnClosed;
                    onShown = callback;
                    onClosed = null;
                    $modal.modal('show');
                }
            };
        }
    };
})();

export default {
    modal: modal
};
