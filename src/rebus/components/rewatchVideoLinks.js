export default {
    init: function () {
        $('.rewatch-video-link').each(function () {
            var $this = $(this),
                $image = $this.find('img').detach().addClass('bg-img');
            $this.append([
                '<button class="rewatch-video-link" type="button" aria-label="Click to rewatch the introductory video" data-navigate="' + $this.data('navigate') + '">',
                '<img class="rewatch-video-link-hover-overlay" src="images/media_btn_up_play.png" alt="" />',
                '</button>',
                '<p aria-hidden="true"><strong>Select</strong> above to rewatch the introductory video</p>'
            ].join('\n')).removeAttr('data-navigate').find('button').prepend($image);
        });
    }
};
