var os, osVersion,
    browser, browserVersion,
    iOS, android, wp, isApp;

var createVersionParts = function (version) {
    var parts = version.split('.');
    return {
        major: parseInt(parts[0], 10),
        minor: parts.length > 1 ? parseInt(parts[1], 10) : 0,
        build: parts.length > 2 ? parseInt(parts[2], 10) : 0
    };
};

var getIsSupportedEnvironment = function () {
    // 7, 8.1, 10
    var isValidWindows = function () {
        if (os.indexOf('windows') !== -1) {
            rebus.logger.log('type=sniffer', 'WINDOWS, major, minor, is it valid?', osVersion.major, osVersion.minor, osVersion.major === 7 || osVersion.major >= 10 || (osVersion.major === 8 && osVersion.minor >= 1));
            return osVersion.major === 7 || osVersion.major >= 10 || (osVersion.major === 8 && osVersion.minor >= 1);
        }
        return false;
    };
    // >= El Capitan (10.11.6)
    var isValidMac = function () {
        if (os.indexOf('mac') !== -1) {
            rebus.logger.log('type=sniffer', 'MAC, major, minor, is it valid?', osVersion.major, osVersion.minor, osVersion.major > 10 || (osVersion.major === 10 && (osVersion.minor > 11 || (osVersion.minor === 11 && osVersion.build >= 6))));
            if (osVersion.major > 10) {
                return true;
            }
            return osVersion.major === 10 && (osVersion.minor > 11 || (osVersion.minor === 11 && osVersion.build >= 6));
        }
        return false;
    };
    // Chrome, Edge, >= IE10, firefox
    var isValidBrowser = function () {
        rebus.logger.log('type=sniffer', 'BROWSER, major, minor, is it valid?', browser, osVersion.major, osVersion.minor, (browser.indexOf('chrome') !== -1 || browser.indexOf('edge') !== -1 || browser.indexOf('chrome') !== -1 || browser.indexOf('mozilla') !== -1 || browser.indexOf('firefox') !== -1 || (browser.indexOf('ie') !== -1 && browserVersion.major >= 10) || (browser.indexOf('safari') !== -1 && browserVersion.major >= 9)));
        return browser.indexOf('chrome') !== -1 ||
            browser.indexOf('edge') !== -1 ||
            browser.indexOf('mozilla') !== -1 ||
            browser.indexOf('firefox') !== -1 ||
            (browser.indexOf('ie') !== -1 && browserVersion.major >= 10) ||
            (browser.indexOf('safari') !== -1 && browserVersion.major >= 9);
    };
    if (wp) {
        rebus.logger.log('type=sniffer', 'Invalid device - windows phone');
        return false;
    }
    if (android) {
        rebus.logger.log('type=sniffer', 'ANDROID, major, minor, is it valid?', osVersion.major, osVersion.minor, osVersion.major > 4 || (osVersion.major === 4 && osVersion.minor >= 4));
        return osVersion.major > 4 || (osVersion.major === 4 && osVersion.minor >= 4);
    }
    if (iOS) {
        rebus.logger.log('type=sniffer', 'IOS, major, is it valid?', osVersion.major, osVersion.major >= 9);
        return osVersion.major >= 9;
    }
    return (isValidWindows() || isValidMac()) && isValidBrowser();
};

export default {
    init: function () {
        var parser = new UAParser(),
            res = parser.getResult(),
            classes = [];
        os = res.os.name.toLowerCase();
        osVersion = createVersionParts(res.os.version);
        browser = res.browser.name.toLowerCase();
        browserVersion = createVersionParts(res.browser.version);
        iOS = os.indexOf('ios') !== -1;
        android = os.indexOf('android') !== -1;
        wp = os.indexOf('windows phone') !== -1;
        isApp = top !== self;
        //isApp = true; iOS = true;
        //android = true;
        if (browser) {
            classes.push('browser-' + browser.split(' ').join('-'));
            if (browserVersion && browserVersion.major); {
                classes.push('browser-version-' + browserVersion.major);
            }
        }
        if (iOS) {
            classes.push('iOS');
        } else {
            if (isApp) {
                classes.push('not-iOS');
            }
            if (android) {
                classes.push('android');
            } else if (wp) {
                classes.push('windows-phone');
            }
        }
        if (isApp) {
            classes.push('isApp');
        } else {
            classes.push('isNotApp');
        }
        if (classes.length) {
            $('html').addClass(classes.join(' '));
        }
        // append media query detector to page
        $( 'body' ).append( '<span id="mq-detector"><span class="visible-xs"></span><span class="visible-sm"></span><span class="visible-md"></span><span class="visible-lg"></span></span>' );
    },
    iOS: function () {
        return iOS;
    },
    android: function () {
        return android;
    },
    isApp: function () {
        return isApp;
    },
    isSupportedEnvironment: function () {
        return getIsSupportedEnvironment();
    },
    isSize: function ( size ) {
        return $( '#mq-detector .visible-' + size + ':visible' ).length > 0;
    }
};
