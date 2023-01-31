/*
        Call getElementDetails to return the following object: { storeId: String, state: String }
        The store id is useful for generating unique ids for elements within an activity.

        Call setElementState to set the state or state flag of an element. Pass and index parameter to set a flag:
        
            setElementState($activity, '4'); // Mark the selected radio button as number 5.
            setElementState($activity, '1', 2); mark the 3rd button of a click-btns activity as clicked -or- mark the 3rd checkbox of a multiple-choice-quiz as checked.

            

*/
var _internal;
var internal = function () {
    if (!_internal) {
        _internal = Track.activityData.get();
    }
    return _internal;
};
var replaceStringChar = function (str, idx, replacement) {
    return str.substr(0, idx) + replacement + str.substr(idx + replacement.length);
};
export default {
    get: internal,
    set: function(prop, value = null){
        internal()[prop] = value;
        this.save();
    },
    save: function () {
        Track.activityData.save();
        return this;
    },
    resetModule: function (idx) {
        Track.activityData.resetModule(idx);
        return this;
    },
    isPageComplete: function (page) {
        return internal()['m' + page.module.idx + 't' + page.topic.idx][page.idxWithinTopic] === '1';
    },
    isTopicComplete: function (moduleIdx, topicIdx) {
        return internal()['m' + moduleIdx + 't' + topicIdx].indexOf('0') === -1;
    },
    isModuleComplete: function (idx) {
        return internal()['m' + idx].indexOf('0') === -1;
    },
    isCourseComplete: function () {
        return internal()['c'].indexOf('0') === -1;
    },
    areNoPagesCompleteYet: function () {
        var state = internal();
        for (var p in state) {
            if (p.indexOf('m') === 0 && p.indexOf('t') !== -1 && state[p].index('1') !== -1) {
                return false;
            }
        }
        return true;
    },
    setPageAsComplete: function (page) {
        var id;
        // Only do for pages within a topic
        if (page.topic) {
            id = 'm' + page.module.idx + 't' + page.topic.idx;
            internal()[id] = replaceStringChar(internal()[id], page.idxWithinTopic, '1');
            if (this.isTopicComplete(page.module.idx, page.topic.idx)) {
                id = 'm' + page.module.idx;
                internal()[id] = replaceStringChar(internal()[id], page.topic.idx, '1');
                if (this.isModuleComplete(page.module.idx)) {
                    internal()['c'] = replaceStringChar(internal()['c'], page.module.idx, '1');
                }
            }
        }
        return this;
    },

    setElementState: function ($element, val, idx, supplementary) {
        var id = $element.data('storeid');
        var state = (idx === undefined || idx === null ? val : replaceStringChar(internal()[id], idx, val));
        if(state.indexOf('~|~') !== -1) state = state.split('~|~')[0];
        internal()[id] = state + (supplementary !== undefined ? '~|~'+supplementary : '');
        $element.attr('data-state', state);
        return this;
    },
    isElementStateAllSet: function ($element) {
        return internal()[$element.data('storeid')].indexOf('0') === -1;
    },
    isPanelComplete: function ($panel) {
        var completion = $panel.data('activity-completion');
        if ('any' === completion && internal()[$panel.data('storeid')].indexOf('1') !== -1) {
            return true;
        }
        return this.isElementStateAllSet($panel);
    },
    elementHasAtLeastOneStateSet: function ($element) {
        return internal()[$element.data('storeid')].indexOf('1') !== -1;
    },
    // { storeId: String, state: String }
    getElementDetails: function ($element) {
        var storeId = $element.data('storeid');
        return { storeId: storeId, state: internal()[storeId] };
    },
    getNoOfElementStateFlagsSet: function ($element) {
        var res = 0,
            state = this.getElementDetails($element).state;
        for (var i = 0; i < state.length; i++) {
            if (state[i] !== '0') {
                res++;
            }
        }
        return res;
    }
};
