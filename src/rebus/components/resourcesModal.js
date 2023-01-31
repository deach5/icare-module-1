var html, onShown, modal;
var showCore = function () {
    modal = rebus.controls.modal.show({
        'class': 'full-width max-width-content',
        body: html,
        onShown: onShown,
        focusOnClosed: $('#dropdown-mnu-main > a')
    });
};
export default {
    show: function (callback) {
        onShown = callback;
        if (html) {
            showCore();
        } else {
            $.get("content/ajax/resources.html", function (data) {
                html = data;
                showCore();
            });
        }
    },
    hide: function (callback) {
        modal.hide(callback);
    },
    reshow: function (callback) {
        modal.show(callback);
    }
};
