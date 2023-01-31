// activities (from old pageInit)
import accordion from './activities/accordion.js';
import assessment from './activities/assessment.js';
import audio from './activities/audio.js';
import carousel from './activities/carousel.js';
//import carouselSelect from './activities/carouselSelect.js'; // used mostly in games
//import chooseHotspots from './activities/chooseHotspots.js';
import clickAndReveal from './activities/clickAndReveal.js';
//import clickAreas from './activities/clickAreas.js';
import clickBtns from './activities/clickBtns.js';
//import dropDown from './activities/dropDown.js';
import flipCards from './activities/flipCards.js';
//import generic from './activities/generic.js';
import keyMessage from './activities/keyMessage.js';
import matchBtns from './activities/matchBtns.js';
import multiChoiceQuiz from './activities/multiChoiceQuiz.js';
import slider from './activities/slider.js';
import sortableQuiz from './activities/sortableQuiz.js';
import tabs from './activities/tabs.js';
import textInput from './activities/textInput.js';
import video from './activities/video.js';

/**
@name activities
@namespace
@memberof rebus
*/
export default {
    accordion: accordion,
    assessment: assessment,
    audio: audio,
    carousel: carousel,
    //carouselSelect: carouselSelect,
    //chooseHotspots: chooseHotspots,
    clickAndReveal: clickAndReveal,
    //clickAreas: clickAreas,
    clickBtns: clickBtns,    
   // dropDown: dropDown,
    flipCards: flipCards,
    //generic: generic,
    keyMessage: keyMessage,
    matchBtns: matchBtns,
    multiChoiceQuiz: multiChoiceQuiz,
    sortableQuiz: sortableQuiz,
    slider: slider,
    tabs: tabs,
    textInput: textInput,
    video: video,
};
