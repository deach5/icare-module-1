import { $body, page } from '../globals.js';


var ALLOW_EXPAND = false,
    // If true, the course and module progress is based on the number of pages complete; otherwise module progress is based on the number of
    // topics complete and course progress on the number of modules complete.
    BASE_ON_PAGES_COMPLETE = false;

var appendTitleAndProgress = function (html, level, title, progress, target, btnState) {
    html.push('<div class="progress-item ' + level + '">');
    html.push('<div class="row d-flex align-items-end">');
    html.push('<div class="col-sm-6">');
    if (target && ALLOW_EXPAND) {
        html.push('<div class="location-indicator"><img src="content/images/icons/pin.svg" alt="Current location"/></div><div class="title-container"><a class="title" data-dismiss="modal" data-toggle="collapse" data-navigate="topic ' + target + '" '+ btnState+' >' + title + ' <span class="sr-only">'+progress+'% complete</span></a></div>');
    } else {
        html.push('<div class="location-indicator"><img src="content/images/icons/pin.svg" alt="Current location"/></div><div class="title-container"><a class="title" data-dismiss="modal" data-toggle="collapse" data-navigate="topic ' + target + '" '+ btnState+' >' + title + ' <span class="sr-only">'+progress+'% complete</span></a></div>');
    } 
    html.push('</div>');
    html.push('<div class="col-sm-6">');
    html.push('<div class="progress-modal-bar"><div data-percentage="' + progress + '"><div style="width:' + progress + '%"><span class="ost">'+progress+'%</span></div></div></div>');
    html.push('</div>');
    html.push('</div>');
    if (level === 'course') {
        html.push('<div class="progress-item-divider"><div></div></div>');
    }
    html.push('</div>');
};

var drawHTML = function (page, modules, returningFromBookmark) {

    var html = [],
        state = rebus.stateHelper.get(),
        courseState = state['c'],
        singleModule = modules.length === 1,
        course = {
            modules: [],
            completeModules: 0,
            totalPages: 0,
            completePages: 0
        },
        progress;

    html.push('<h1 tabindex="-1">My progress</h1>');

    // First calculate the number of pages completed for topic, module and course levels
    $.each(modules, function (m_idx) {
        var moduleState = state['m' + m_idx],
            topics = this.topics,
            module = {
                topics: [],
                title: this.title,
                idx: m_idx,
                completeTopics: 0,
                totalPages: 0,
                completePages: 0
            };
        course.modules.push(module);
        if (courseState[m_idx] === '1') {
            course.completeModules++;
        }
        $.each(topics, function (t_idx) {
            var topicState = state['m' + m_idx + 't' + t_idx],
                topic = {
                    pages: [],
                    title: this.title,
                    idx: t_idx,
                    completePages: 0,
                    completeSingleStream:  (this.completeSingleStream || false),
                    buttonState: (rebus.stateHelper.isTopicComplete(m_idx, t_idx) || !rebus.config.takeTopicsInOrder) ? '' : 'disabled'
                };
            module.topics.push(topic);
            if (moduleState[t_idx] === '1') {
                module.completeTopics++;
            }
            $.each(topics[t_idx].pages, function (p_idx) {
                topic.pages.push({
                    title: this.title,
                    idx: p_idx
                });
                module.totalPages++;
                course.totalPages++;
                if (topicState[p_idx] === '1') {
                    topic.completePages++;
                    module.completePages++;
                    course.completePages++;
                }
            });
        });
    });

    // Now we have the calculations, add the HTML

    progress = BASE_ON_PAGES_COMPLETE ?
        Math.round(course.completePages / course.totalPages * 100) :
        singleModule ?
        Math.round(course.modules[0].completeTopics / course.modules[0].topics.length * 100) :
        Math.round(course.completeModules / course.modules.length * 100);
    html.push('<div class="course-container' + (!page.module || singleModule ? ' current-location' : '') + '">');
    appendTitleAndProgress(html, 'course', rebus.config.title, progress);
    $.each(course.modules, function () {
        var m_idx = this.idx,
            expandModuleId = 'progress-m' + m_idx;
        progress = BASE_ON_PAGES_COMPLETE ?
            Math.round(this.completePages / this.totalPages * 100) :
            Math.round(this.completeTopics / this.topics.length * 100);
        html.push('<div class="module-container' + (page.module && page.module.idx === this.idx && !page.topic ? ' current-location' : '') + '">');
        appendTitleAndProgress(html, 'module', this.title, progress, expandModuleId, this.idx);
        if (singleModule) {
            html.push('<div id="' + expandModuleId + '">');
        } else {
            html.push('<div class="collapse" id="' + expandModuleId + '">');
        } 
        $.each(this.topics, function () {
            var expandTopicId = expandModuleId + 't' + this.idx;
            html.push('<div class="topic-container' + (page.topic && page.topic.idx === this.idx && page.module.idx === m_idx ? ' current-location' : '') + '">');
            progress = this.completeSingleStream ? 
                (this.completePages >= 2 ? 100 : (this.completePages > 0 ? 50 : 0)) : 
                Math.round(this.completePages / this.pages.length * 100);
            appendTitleAndProgress(html, 'topic', this.title, progress, this.idx, this.buttonState);
            html.push('</div>');
        });
        html.push('</div></div>');
    });

    html.push('</div>');
    html.push([
        '<div id="progress-modal-close-btn-container" class="clearfix">',
        '<div>',

        '<button class="btn btn-primary" data-dismiss="modal">Close</button>',
        '</div>',
        '</div>'
    ].join('\n'));
    return html.join('\n');
};

export default {
    // options: { page: Object, onShown: Function, onClosed: Function, returningFromBookmark: Boolean, $focusOnClosed: jQuery }
    show: function (options) {
        var modules = rebus.navigation.getModules();
        rebus.controls.modal.show({
            'class': 'progress-modal full-width max-width-content' + (modules.length === 1 ? ' single-module' : ''),
            body: drawHTML(options.page, modules, options.returningFromBookmark),
            onShown: function () {
                if (modules.length > 1 && options.page.module) {
                    $('.module-container').eq(options.page.module.idx).addClass('expanded');
                    $('#progress-m' + options.page.module.idx).collapse('show');
                }
                if (options.onShown) {
                    options.onShown();
                }
            },
            onClosed: options.onClosed,
            focusOnClosed: options.$focusOnClosed
        });
    }
};
