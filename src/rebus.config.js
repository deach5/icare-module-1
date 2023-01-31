var rebus = rebus || {};
/**
@name rebus.config
@description
<pre>
    pages - page:
        path: String - a path relative to the current page; e.g. 'p1', '../p1' (go back), '/p2' (go to root)
        title: String
        hideHeader: Boolean
        hideHeaderTitle: Boolean
        redirectIfTopicComplete: String - a path, relative to the orginal page, to redirect to if the topic is complete
                                          e.g. a module assessment may redirect to the module completion page
</pre>
*/
rebus.config = {
    title: 'icare – Respect & Resilience', // Used my progress modal
    id: 'icare-rr-m1-20220929', // Used for generating a unique cookie for local testing
    useLMS: true,
    debug: false,
    debugTypes: '*',
    takeModulesInOrder: true,
    takeTopicsInOrder: true,
    takePagesInOrder: true,
    includeProgressModal: true,
    videosMustBePlayedThrough: true,
    useDefaultPDFViewerForBrowser: false,
    windowResize: 'fullscreen',
    mozillaPDFViewerLinks: 'disabled', // 'disabled' | 'open-new-window'. If not set, they will be active and open in the current window.
    pages: [
        { path: 'course-tips', title: 'Understanding customer misbehaviour', htmlTitle: 'Understanding customer misbehaviour', hideHeader: true },
        { path: 'landing', title: 'Understanding customer misbehaviour', htmlTitle: 'Understanding customer misbehaviour',hideHeader:true},        
        {
            type: 'modules',
            modules: [
                {
                    folder: 'm1',
                    title: 'Understanding customer misbehaviour',
                    pages: [
                        { path: 'menu', title: 'Understanding customer misbehaviour', type: 'menu', hideHeaderTitle: true },
                        {
                            type: 'topics',
                            topics: [
                                {
                                    folder: 't1',
                                    title: 'What is customer misbehaviour?',
                                    duration: 7,
                                    pages: [ { path: 'p1', title: 'What is customer misbehaviour?' } ]
                                },
                                {
                                    folder: 't2',
                                    title: 'Why do customers misbehave?',
                                    duration: 6,
                                    pages: [ { path: 'p1', title: 'Why do customers misbehave?'} ]
                                },
                                {
                                    folder: 't3',
                                    title: 'Tips to get a customer on side',
                                    duration: 10,
                                    pages: [ 
                                        { path: 'p1', title: 'Tips to get a customer on side'},
                                        { path: 'p2', title: 'Tips to get a customer on side'} 
                                    ]
                                } ,
                                {
                                    folder: 't4',
                                    title: 'Summary',
                                    duration: 1,
                                    pages: [ { path: 'p1', title: 'Summary'} ]
                                }                       
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
