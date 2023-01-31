import { $body } from './globals.js';

// old rebus.logger modules
import entitySerializer from './entitySerializer.js';
import logger from './logger.js';
import rebus_console from './console.js';

// old rebus.navigation modules
import stateHelper from './stateHelper.js';
import navigation from './navigation.js';

// components
import components from './components.js';

// panels
import panels from './panels.js';

// activities
import activities from './activities.js';

// old functions.js modules
import appFixes from './appFixes.js';
import features from './features.js';
import pageInit from './pageInit.js';
import video from './video.js';
import audio from './audio.js';
import gui from './gui.js';
import controls from './controls.js';
import utils from './utils.js';
import admin from './admin.js';
import pdf from './pdf.js';

// import feature modules here
//import './path/to/module.js';

/**
@name rebus
@namespace
*/
export default {
    components: components,
    panels: panels,
    activities: activities,
    entitySerializer: entitySerializer,
    logger: logger,
    console: rebus_console,
    stateHelper: stateHelper,
    navigation: navigation,
    appFixes: appFixes,
    features: features,
    pageInit: pageInit,
    video: video,
    audio: audio,
    gui: gui,
    controls: controls,
    utils: utils,
    admin: admin,
    pdf: pdf,
    config: rebus.config || {}
};
