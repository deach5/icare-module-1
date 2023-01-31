export default {
    play: function (video) {
        video.play();
    },
    pause: function (video) {
        video.pause();
    },
    // except: Video
    pauseAll: function (except) {
        $('video').each(function () {
            if ((!except || this !== except) && !this.paused) {
                this.pause();
            }
        });
    }
};
