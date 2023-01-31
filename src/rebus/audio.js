var audioFiles = {},
    activeAudio;
var pauseActiveAudio = function (resetTime) {
    if (activeAudio) {
        activeAudio.off('load').off('end');
        $('html').removeClass('audio-buffering');
        if (resetTime) {
            activeAudio.stop();
        } else {
            activeAudio.pause();
        }
        activeAudio = null;
    }
};
var timeUpdate = function (id, ended) {
    var that = this;
    if (ended) {
        $('body').trigger('timeupdate', {
            id: id,
            time: this.duration(),
            ratio: 1
        });
    } else {
        // if the time is 0, ignore because it resets to 0 when the audio ends.
        var seek = this.seek();
        if (seek) {
            $('body').trigger('timeupdate', {
                id: id,
                time: seek,
                ratio: seek / this.duration()
            });
        }
    }
    if (!ended && this.playing()) {
        requestAnimationFrame(function () {
            timeUpdate.call(that, id);
        });
    }
};
Howler.mobileAutoEnable = true;
export default {
    add: function (id) {
        if (!audioFiles[id]) {
            audioFiles[id] = new Howl({
                src: 'content/audio/' + id + '.mp3',
                html5: rebus.features.iOS(),
                onplay: function () {
                    var that = this;
                    requestAnimationFrame(function () {
                        timeUpdate.call(that, id);
                    });
                }
            });
        }
    },
    toggle: function (id) {
        var audio = audioFiles[id];
        if (audio.playing()) {
            pauseActiveAudio();
        } else if (audio !== activeAudio) {
            // audio !== activeAudio is tested because it may have been clicked but still loading so audio.playing() is false
            rebus.video.pauseAll();
            pauseActiveAudio(true);
            if (audio.state() !== 'loaded') {
                $('html').addClass('audio-buffering');
                audio.off('load').on('load', function () {
                    $('html').removeClass('audio-buffering');
                    audio.off('end').on('end', function () {
                        activeAudio = null;
                        $('body').trigger('audioend', {
                            id: id
                        });
                        timeUpdate.call(this, id, true);
                    }).play();
                    $('body').trigger('audioplay', {
                        id: id
                    });
                });
            } else {
                audio.off('end').on('end', function () {
                    activeAudio = null;
                    $('body').trigger('audioend', {
                        id: id
                    });
                    timeUpdate.call(this, id, true);
                }).play();
                $('body').trigger('audioplay', {
                    id: id
                });
            }
            activeAudio = audio;
        }
    },
    pause: pauseActiveAudio
};
