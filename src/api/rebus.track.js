var rebus = rebus || {};
rebus._private = rebus._private || {};

/*
    activityData example:
    {
        student:    'Jules',
        c:          '10000'     1st module, of 5, in the course complete
        m0:         '1010'      1st and 3rd topic, of 4 topics, of the 1st module complete
        m0t0:       '1000'      1st page, of 4 pages, of the 1st topic in the 1st module complete
        m0t0p0r0:   '10',       Row 0, Activity 0 is complete & Activity 1 is incomplete. (Note, at present, rows only contain 1 activity)
        m0t0p0r0a0: '1100',     Row 0, Activity 0 is a checkbox activity; the first 2 checkboxes are checked
        m0t0p0r1:   '0'         Row 1, Activity 0 is incomplete
        m0t0p0r1a0: '11110'     Row 1, Activity 0 is a click button activity; 4 of the 5 buttons have been clicked
        m0t0p0r2:   '1'         Row 2, Activity 0 is complete
        m0t0p0r2a0: '3'         Row 2, Activity 0 is a radio button activity; the selected index is 3
    }
*/

var Track = (function () {
    "use strict";

    var SCORMVERSION,
        COMPLETE_VERB = 'completed',
        log = rebus.logger.log,
        api,
        completed,
        courseCommitted;

    var courseTimer = (function () {
        var getLaunchTime = function () {
            var time = sessionStorage.getItem(rebus.config.id + '.launchtime');
            if (time) {
                return JSON.parse(time);
            }
            time = (new Date()).getTime();
            sessionStorage.setItem(rebus.config.id + '.launchtime', JSON.stringify(time));
            return time;
        };
        var ZeroPad = function (intNum, intNumDigits) {
            var strTemp;
            var intLen;
            var i;
            strTemp = new String(intNum);
            intLen = strTemp.length;
            if (intLen > intNumDigits) {
                strTemp = strTemp.substr(0, intNumDigits);
            } else {
                for (i = intLen; i < intNumDigits; i++) {
                    strTemp = "0" + strTemp;
                }
            }
            return strTemp;
        };
        /** ------ SCORM 1.2 and 2004 time conversion ----------- **/
        /* SCORM 2004 only */
        var timestamp = {
            '2004': function (intTotalMilliseconds) {
                var ScormTime;
                var dtm = new Date(intTotalMilliseconds);
                var Year = dtm.getFullYear();
                var Month = dtm.getMonth() + 1;
                var Day = dtm.getDate();
                var Hour = dtm.getHours();
                var Minute = dtm.getMinutes();
                var Second = dtm.getSeconds();
                Month = ZeroPad(Month, 2);
                Day = ZeroPad(Day, 2);
                Hour = ZeroPad(Hour, 2);
                Minute = ZeroPad(Minute, 2);
                Second = ZeroPad(Second, 2);
                ScormTime = Year + "-" + Month + "-" + Day + "T" + Hour + ":" + Minute + ":" + Second;
                return ScormTime;
            },
            '1_2': function (intTotalMilliseconds) {
                var ScormTime;
                sessionTime['1_2'](intTotalMilliseconds);
                return ScormTime;
            }
        };
        var sessionTime = {
            '2004': function (intTotalMilliseconds) {
                var ScormTime = "";
                var HundredthsOfASecond; //decrementing counter - work at the hundreths of a second level because that is all the precision that is required
                var Seconds; // 100 hundreths of a seconds
                var Minutes; // 60 seconds
                var Hours; // 60 minutes
                var Days; // 24 hours
                var Months; // assumed to be an "average" month (figures a leap year every 4 years) = ((365*4) + 1) / 48 days - 30.4375 days per month
                var Years; // assumed to be 12 "average" months
                var HUNDREDTHS_PER_SECOND = 100;
                var HUNDREDTHS_PER_MINUTE = HUNDREDTHS_PER_SECOND * 60;
                var HUNDREDTHS_PER_HOUR = HUNDREDTHS_PER_MINUTE * 60;
                var HUNDREDTHS_PER_DAY = HUNDREDTHS_PER_HOUR * 24;
                var HUNDREDTHS_PER_MONTH = HUNDREDTHS_PER_DAY * (((365 * 4) + 1) / 48);
                var HUNDREDTHS_PER_YEAR = HUNDREDTHS_PER_MONTH * 12;
                HundredthsOfASecond = Math.floor(intTotalMilliseconds / 10);
                Years = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_YEAR);
                HundredthsOfASecond -= (Years * HUNDREDTHS_PER_YEAR);
                Months = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MONTH);
                HundredthsOfASecond -= (Months * HUNDREDTHS_PER_MONTH);
                Days = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_DAY);
                HundredthsOfASecond -= (Days * HUNDREDTHS_PER_DAY);
                Hours = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_HOUR);
                HundredthsOfASecond -= (Hours * HUNDREDTHS_PER_HOUR);
                Minutes = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MINUTE);
                HundredthsOfASecond -= (Minutes * HUNDREDTHS_PER_MINUTE);
                Seconds = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_SECOND);
                HundredthsOfASecond -= (Seconds * HUNDREDTHS_PER_SECOND);
                if (Years > 0) ScormTime += Years + "Y";
                if (Months > 0) ScormTime += Months + "M";
                if (Days > 0) ScormTime += Days + "D";
                //check to see if we have any time before adding the "T"
                if ((HundredthsOfASecond + Seconds + Minutes + Hours) > 0) {
                    ScormTime += "T";
                    if (Hours > 0) ScormTime += Hours + "H";
                    if (Minutes > 0) ScormTime += Minutes + "M";
                    if ((HundredthsOfASecond + Seconds) > 0) {
                        ScormTime += Seconds;
                        if (HundredthsOfASecond > 0) ScormTime += "." + HundredthsOfASecond;
                        ScormTime += "S";
                    }
                }
                if (ScormTime == "") ScormTime = "0S";
                ScormTime = "P" + ScormTime;
                return ScormTime;
            },
            '1_2': function (intTotalMilliseconds) {
                var ScormTime = "";
                var dtm = new Date();
                dtm.setTime(intTotalMilliseconds);
                var h = '000' + Math.floor(intTotalMilliseconds / 3600000);
                var m = '0' + dtm.getMinutes();
                var s = '0' + dtm.getSeconds();
                var cs = '0' + Math.round(dtm.getMilliseconds() / 10);
                ScormTime += h.substr(h.length - 4) + ':' + m.substr(m.length - 2) + ':';
                ScormTime += s.substr(s.length - 2) + '.' + cs.substr(cs.length - 2);
                return ScormTime;
            },
            'xapi': function (intTotalMilliseconds) {
                return 0;
            }
        };
        return {
            setLaunchTimeIfNotSet: function () {
                getLaunchTime();
            },
            getTimeStamp: function () {
                var time = new Date().getTime();
                return timestamp[SCORMVERSION](time);
            },
            getElapsedTime: function () {
                var curr = new Date().getTime();
                var elapse = curr - getLaunchTime();
                return sessionTime[SCORMVERSION](elapse);
            }
        };
    })();
    var handleUnexpectedClose = function () {
        var attachTo = window;
        var handler = function () {
            if (!courseCommitted) {
                rebus.logger.log('type=lms', 'EXIT; COMMIT REQUIRED');
                Track.commit();
            } else {
                rebus.logger.log('type=lms', 'EXIT; no action required');
            }
        };
        if (window === window.parent) {
            // When testing, where there is no parent window, a commit will be performed on every page change
            $(window).on('unload', handler);
        } else {
            do {
                attachTo = attachTo.parent;
                $(attachTo).on('unload', handler);
            } while (attachTo !== attachTo.parent);
        }
    };
    var finalizeInit = function (track) {
        var status;
        // start the course timer
        courseTimer.setLaunchTimeIfNotSet();
        //
        status = '' + track.getData('status');
        // if the status is not attempted, update to incomplete
        if (status === 'not attempted') {
            if (!track.setData('status', 'incomplete')) {
                return false;
            }
        } else {
            completed = status === COMPLETE_VERB;
        }
        // Guard against the user pressing the app back button before saving
        handleUnexpectedClose();
        // suspend on exit
        api.setData('exit', 'suspend');
        // all good
        return true;
    };
    return {
        'init': function (scormVersion, callback) {
            var that = this;
            // see if we are setting a SCORM version (defaults to 1.2)
            SCORMVERSION = scormVersion || SCORMVERSION;
            // assign the LMS or LOCAL api
            api = rebus.config.useLMS ? rebus._private.lms : rebus._private.local;
            // pass the scorm version to the init function
            if (callback) {
                api.init(SCORMVERSION, function (ok) {
                    callback(ok ? finalizeInit(that) : false);
                });
            }
            else {
                if (api.init(SCORMVERSION)) {
                    return finalizeInit(this);
                }
                return false;
            }
        },
        'debug': function (msg) {
            api.debug(msg);
        },
        'commit': function (close) {
            if (this.setData('session_time', courseTimer.getElapsedTime(SCORMVERSION))) {
                log('type=debug', 'completed', '' + completed);
                courseCommitted = true;
                return api.commit(close);
            }
            return false;
        },
        'setInteraction': function (dataarray) {
            var res = api.setInteraction(dataarray);
            log(function () {
                var parsed = dataarray;
                try {
                    parsed = JSON.parse(dataarray);
                } catch (e) { }
                return ['type=lms', 'setInteraction', dataarray, parsed, res];
            });
            return res;
        },
        'setData': function (cmi, data, callback) {
            var res = api.setData(cmi, data, callback);
            log(function () {
                var parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) { }
                return ['type=lms', 'setData', cmi, parsed, res];
            });
            return res;
        },
        'getData': function (cmi, callback) {
            var data = api.getData(cmi, callback);
            log(function () {
                var parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) { }
                return ['type=lms', 'getData', cmi, parsed];
            });
            return data;
        },
        'activityData': (function () {
            var data;
            var merge = function (state) {
                var courseState = '';
                $.each(rebus.navigation.getModules(), function (m_idx) {
                    var moduleState = '';
                    $.each(this.topics, function (t_idx) {
                        var topicState = '';
                        $.each(this.pages, function (p_idx) {
                            var id = 'm' + m_idx + 't' + t_idx,
                                s = state[id];
                            if (s && s.length >= p_idx) {
                                topicState += s[p_idx];
                            }
                            else {
                                topicState += '0';
                            }
                        });
                        state['m' + m_idx + 't' + t_idx] = topicState;
                        moduleState += this.completeSingleStream ? 
                            ((topicState.substring(0,1) === '1' && topicState.substring(1).indexOf('1') !== -1) ? '1' : '0') :
                            topicState.indexOf('0') === -1 ? '1' : '0';                        
                    });
                    state['m' + m_idx] = moduleState;
                    courseState += moduleState.indexOf('0') === -1 ? '1' : '0';
                });
                state['c'] = courseState;
                return state;
            };
            return {
                get: function () {
                    if (data) {
                        return data;
                    }
                    data = Track.getData('suspend_data');
                    if (data) {
                        try {
                            data = JSON.parse(data);
                        } catch (e) {
                            log('type=error', 'Failed to deserialize suspend_data', '' + data);
                            log('type=error', 'Error details', e);
                            log('type=error', 'suspend_data will be set to an empty object');
                            data = {};
                            this.save();
                        }
                    } else {
                        data = {};
                    }
                    data = merge(data);
                    return data;
                },
                set: function (update) {
                    data = update;
                    this.save();
                    return data;
                },
                resetModule: function (moduleIdx) {
                    for (var p in data) {
                        if (p.indexOf('m' + moduleIdx) === 0) {
                            delete data[p];
                        }
                    }
                    data = merge(data);
                    this.save();
                },
                reset: function () {
                    data = merge({});
                    this.save();
                },
                save: function () {
                    if (data) {
                        Track.setData('suspend_data', JSON.stringify(data));
                    }
                    return this;
                }
            };
        })(),
        'custom': (function () {
            return { };
        })(),
        'getScormVersion': function () {
            return SCORMVERSION;
        },
        'setLessonCompleted': function () {
            completed = true;
            //return this.setData('cmi.core.lesson_status', COMPLETE_VERB);
            return this.setData('status', COMPLETE_VERB);
        },
        'isLessonCompleted': function () {
            //return this.getData('cmi.core.lesson_status') + '' === COMPLETE_VERB;
            return this.getData('status', COMPLETE_VERB);
        },
        'setLessonScore': function (score) {
            return this.setData('score', score);
        },
        'getLessonScore': function () {
            return Number(this.getData('score'));
        },
        'courseTimer': courseTimer,
        'environmentCheck': (function () {
            return {
                isRequired: function () {
                    if ('1' !== docCookies.getItem(rebus.config.id + '.' + 'environmentCheck')) {
                        docCookies.setItem(rebus.config.id + '.' + 'environmentCheck', '1');
                        return true;
                    }
                    return false;
                }
            };
        })()
    };
})();

// Never call this directly; use 'Track'
rebus._private.lms = (function () {
    "use strict";
    // private
    var internal = {
        'cmi': {
            '2004': {
                'datamodel': {
                    'status': 'cmi.completion_status',
                    'success': 'cmi.success_status',
                    'score': 'cmi.score.raw',
                    'score.min': 'cmi.score.min',
                    'score.max': 'cmi.score.max',
                    'score.scaled': 'cmi.score.scaled',
                    /* 0 - 1 */
                    'suspend_data': 'cmi.suspend_data',
                    /* (characterstring (SPM: 64000), RW) */
                    'session_time': 'cmi.session_time',
                    /* (timeinterval (second,10,2), WO)  */
                    'location': 'cmi.location',
                    'learner_name': 'cmi.learner_name',
                    'exit': 'cmi.exit',
                    /* (timeout, suspend, logout, normal, , WO) Indicates how or why the learner left the SCO */
                    'interaction': {
                        'count': 'cmi.interactions._count',
                        'id': 'cmi.interactions.{n}.id',
                        /* (long_identifier_type (SPM: 4000), RW) Unique label for the interaction */
                        'type': 'cmi.interactions.{n}.type',
                        /* (true-false, choice, fill-in, long-fill-in, matching, performance, sequencing, likert, numeric or other, RW) */
                        'learner_response': 'cmi.interactions.{n}.learner_response',
                        'weighting': 'cmi.interactions.{n}.weighting',
                        'correct_responses': 'cmi.interactions.{n}.correct_responses.{i}.pattern',
                        'correct_responses_count': 'cmi.interactions.{n}.correct_responses._count',
                        'result': 'cmi.interactions.{n}.result',
                        /* (correct, incorrect, unanticipated, neutral) */
                        'description': 'cmi.interactions.{n}.description',
                        /* (localized_string_type (SPM: 250), RW) Brief informative description of the interaction */
                        'timestamp': 'cmi.interactions.{n}.timestamp' /* (time(second,10,0), RW) Point in time at which the interaction was first made available to the learner */
                    },
                    'objective': {
                        'count': 'cmi.objectives._count',
                        'id': 'cmi.objectives.{n}.id',
                        /* (long_identifier_type (SPM: 4000), RW) Unique label for the objective */
                        'score_scaled': 'cmi.objectives.{n}.score.scaled ',
                        'score_raw': 'cmi.objectives.{n}.score.raw ',
                        'score_min': 'cmi.objectives.{n}.score.min ',
                        'score_max': 'cmi.objectives.{n}.score.max ',
                        'success_status': 'cmi.objectives.{n}.success_status',
                        /*(passed, failed, unknown, RW) Indicates whether the learner has mastered the objective*/
                        'completion_status': 'cmi.objectives.{n}.completion_status',
                        /*(completed, incomplete, not attempted, unknown, RW) Indicates whether the learner has completed the associated objective*/
                        'progress_measure': 'cmi.objectives.{n}.progress_measure',
                        /*(real (10,7) range (0..1), RW) Measure of the progress the learner has made toward completing the objective*/
                        'description': 'cmi.objectives.{n}.description'
                        /* (localized_string_type (SPM: 250), RW) Provides a brief informative description of the objective */
                    }
                },
                'method': {
                    'Initialize': 'Initialize',
                    'Terminate': 'Terminate',
                    'GetValue': 'GetValue',
                    'SetValue': 'SetValue',
                    'Commit': 'Commit',
                    'GetLastError': 'GetLastError',
                    'GetErrorString': 'GetErrorString',
                    'GetDiagnostic': 'GetDiagnostic'
                },
                /* just capture the acceptable errors so we can continue, everything else we can fail on */
                'error': {
                    'initialized': 103,
                    /* API Already Initialized */
                    'notinitialized': 142,
                    /* API Not Initialized */
                    'datanotinitialized': 403 /* Data Model Element Value Not Initialized */
                }

            },
            '1_2': {
                'datamodel': {
                    'status': 'cmi.core.lesson_status',
                    'success': false,
                    'score': 'cmi.core.score.raw',
                    /* 0 - 100 */
                    'score.min': 'cmi.core.score.min',
                    'score.max': 'cmi.core.score.max',
                    'score.scaled': false,
                    'suspend_data': 'cmi.suspend_data',
                    /* (CMIString (SPM: 4096), RW) */
                    'session_time': 'cmi.core.session_time',
                    'location': 'cmi.core.lesson_location',
                    'learner_name': 'cmi.core.learner_name',
                    'exit': 'cmi.core.exit',
                    /* (time-out, suspend, logout, , WO) Indicates how or why the learner left the SCO */
                    'interaction': {
                        'count': 'cmi.interactions._count',
                        'id': 'cmi.interactions.{n}.id',
                        /* (CMIIdentifier, WO) Unique label for the interaction */
                        'type': 'cmi.interactions.{n}.type',
                        /* (true-false, choice, fill-in, matching, performance, sequencing, likert, numeric, WO) */
                        'learner_response': 'cmi.interactions.{n}.learner_response',
                        'weighting': 'cmi.interactions.{n}.weighting',
                        'correct_responses': 'cmi.interactions.{n}.correct_responses.{i}.pattern',
                        'correct_responses_count': 'cmi.interactions.{n}.correct_responses._count',
                        'result': 'cmi.interactions.{n}.result',
                        /* (correct, incorrect, unanticipated, neutral, x.x [CMIDecimal], WO)  */
                        'description': false,
                        'timestamp': 'cmi.interactions.{n}.time' /* (CMITime, WO) Point in time at which the interaction was first made available to the student for student interaction and response */
                    },
                    'objective': false
                },
                'method': {
                    'Initialize': 'LMSInitialize',
                    'Terminate': 'LMSFinish',
                    'GetValue': 'LMSGetValue',
                    'SetValue': 'LMSSetValue',
                    'Commit': 'LMSCommit',
                    'GetLastError': 'LMSGetLastError',
                    'GetErrorString': 'LMSGetErrorString',
                    'GetDiagnostic': 'LMSGetDiagnostic'
                },
                /* just capture the acceptable errors so we can continue, everything else we can fail on */
                'error': {
                    'initialized': 101,
                    /* API Already Initialized */
                    'notinitialized': 301,
                    /* API Not Initialized */
                    'datanotinitialized': 0 /* Data Model Element Value Not Initialized (not support in 1.2, default to no error 0) */
                }
            },
            'xapi': {
                'datamodel': {
                    'session_time': 'cmi.core.session_time'
                },
                'method': {
                    'Initialize': 'doInitialize',
                    'Terminate': 'doTerminate',
                    'GetValue': 'doSetValue',
                    'SetValue': 'doGetValue',
                    'Commit': 'doCommit',
                    'GetLastError': 'doGetLastError',
                    'GetErrorString': 'doGetErrorString',
                    'GetDiagnostic': 'doGetDiagnostic'
                }
            }
        },
        'scormVersion': '1_2',
        'log': rebus.logger.log,
        'debug': function (msg) {
            // this.log('type=lms', 'rebus._private.lms.debug', msg);
        },
        'throwError': function (msg) {
            $('#content-page article.content').empty().append([
                '<div class="container">',
                '<h1 style="margin-top:60px;" class="text-danger">A problem has occurred with the LMS API</h1>',
                '<p>Please exit the course and try launching it again.</p>',
                '<h3 style="margin-top:20px;">Details:</h2>',
                '<p>' + msg + '</p>',
                '</div>'
            ].join('\n'));
            $('#page-loading-mask').remove();
            // this.log('type=error', 'rebus._private.lms.throwError', msg);
            //('type=error', 'rebus._private.lms.throwError', msg);
        },
        'initialised': false, // BOOLEAN: Assume the API has been initialised
        'api': null, // OBJECT: Reference the communication API, for either Local or SCORM communication
        'error': false, // BOOLEAN: Track errors with SCORM communication
        //'maxTries': 10, // NUMBER: Maximum attempts to connect to SCORM API
        'apiFail': false, // BOOLEAN: Determines if there is an API available for tracking;
        'errorWindow': null,
        'findAPITries': 0, // current number of attempts to find api
        'maxTries': 500, // maximum number of attempts to find the api, too deeply nested if over 500
        // 
        'useLMS': function () {
            return this.api !== null;
        },
        'getSessionInitialised': function () {
            return this.initialised;
        },
        'setSessionInitialised': function (bool) {
            this.initialised = bool;
        },
        // connect to the API
        'scanAPI': function (win) {
            //
            var api = (this.scormVersion === '1_2' ? 'API' : 'API_1484_11');
            while ((win[api] == null) && (win.parent != null) && (win.parent != win)) {
                this.findAPITries++;
                if (this.findAPITries > this.maxTries) return null;
                win = win.parent;
            }
            return win[api];
        },
        // find API in windows
        'findAPI': function (win) {
            this.debug('findAPI()');
            var api;
            if ( this.scormVersion === 'xapi' )
                return scorm2004_xapi_wrapper;
            if ((win.parent != null) && (win.parent != win)) api = this.scanAPI(win.parent);
            if ((api == null) && (win.opener != null)) api = this.scanAPI(win.opener);
            return api;
        },
        'connectAPI': function (params) {
            var api = null;
            api = this.findAPI(window);
            api = (api == null || !api) ? null : api;
            if (api == null) {
                this.setAPIFail(true);
                this.throwError('LMS API is not found; the course cannot communicate with the LMS.');
            } else {
                this.setAPI(api);
            }
            if (params.initcomms) {
                if (params.callback) {
                    if (this.getAPIFail()) {
                        params.callback(false);
                    }
                    else {
                        this.initComms(params.callback);
                    }
                }
                else {
                    return !this.getAPIFail() ? this.initComms() : false;
                }
            }
            else {
                return !this.getAPIFail();
            }
        },
        'setAPIFail': function (bool) {
            this.apiFail = bool;
        },
        'getAPIFail': function () {
            return this.apiFail;
        },
        // 
        'initComms': function (callback) {
            var api, ok, error,
                that = this;
            api = this.getAPI();
            //check to see if intialize is needed
            ok = api[this.cmi[this.scormVersion].method["Initialize"]]("");
            error = api[this.cmi[this.scormVersion].method["GetLastError"]]();
            // maybe already initialised? let this one go
            var okinited = this.cmi[this.scormVersion].error.initialized;

            /*
            if(okinited){
                // xAPI Extensions
                var config = {
                    lrs:{
                        endpoint:"<LRS Endpoint>",
                        user:"<LRS User>",
                        password:"<LRS Password>"
                    },
                    courseId:"<Course IRI>",
                    lmsHomePage:"<LMS Home Page>",
                    isScorm2004:false
                }; // isSCORM2004:true above - to convert SCORM 2004 courses
                xapi.setConfig(config);
                xapi.initializeAttempt();
            }
            */

            // set the active session flag
            this.setSessionInitialised(error == okinited || error == '0');
            if (error != '0' && error != okinited) { // LMS already intialised
                this.commsError(error, 'Failed to complete [LMS]Initialize("")');
                return false;
            }
            // initialise the lesson status
            if (this.getData("status") == "not attempted" || this.getData("status") == "unknown") {
                this.setData("status", "incomplete");
            }
            // ensure the session is suspended on exit
            this.setData("exit", "suspend");
            // execute callback
            if(callback) callback(ok);
            //
            return true;
        },
        // 
        'setAPI': function (api) {
            this.api = api;
        },
        'getAPI': function () {
            if (this.api != null && this.api != 'undefined') {
                return this.api;
            } else {
                this.connectAPI({
                    'initcomms': false
                });
                return this.getAPI();
            }
        },
        // 
        'getError': function () {
            return this.error;
        },
        // 
        'setError': function (_error) {
            this.error = _error;
        },
        // 
        'commsError': function (_error, _data1, _data2) {
            this.setError(_error);
            var msg, api;
            api = this.getAPI();
            msg = api[this.cmi[this.scormVersion].method["GetErrorString"]](_error);
            msg += ' \r\n(' + _data1;
            if (_data2 != '') msg += ', ' + _data2;
            msg += ')\r\n';
            msg += ': ';
            msg += api[this.cmi[this.scormVersion].method["GetDiagnostic"]](_error);
            this.throwError(msg);
        },
        // 
        'getMaxTries': function () {
            return this.maxTries;
        },
        'sanitiseData': function (data, type) {
            if (type === 'choice') {
                // multiple values separated by dilmiter
                if (data.indexOf('[,]') !== -1) {
                    var arr = data.split('[,]');
                    var newarr = [];
                    for (var i = 0; i < arr.length; i++) {
                        newarr.push(arr[i].replace(/ /g, '_').replace(/[^\w\s\-]/g, ''));
                    }
                    return newarr.join('[,]');
                } else {
                    if(typeof data != 'string')
                    {
                        for(var i=0;i<data.length;i++)
                        {
                            data[i] = data[i].replace(/ /g, '_').replace(/[^\w\s\-]/g, '');
                        }
                        return data;
                    }else{
                        return data.replace(/ /g, '_').replace(/[^\w\s\-]/g, '');
                    }
                }
            }
            return data;
        },
        // { id: String, type: 'true-false' | 'choice' | 'long-fill-in' | 'preformance' | 'other', question: String, answer: String }
        /*var setInteraction = function (obj) {
            Track.setInteraction([{
                id: obj.id,
                type: obj.type,
                description: obj.question,
                learner_response: cleanValue(obj.answer)
                //correct_responses: cleanValue(obj.answer),
                //result: 'correct'
            }]);
        }; */
        'setInteraction': function (dataarray) {
            var scope = this;
            for (var x = 0; x < dataarray.length; x++) {
                var data = dataarray[x];
                data.timestamp = Track.courseTimer.getTimeStamp();
                // flag determines if we are creating a new entry or updating an existing one.
                data.update = data.update || false;
                // sanitise data
                data.learner_response = this.sanitiseData(data.learner_response, data.type);
                data.correct_responses = this.sanitiseData(data.correct_responses, data.type);
                this.debug('sanitized data.learner_response: ' + data.learner_response);
                //this.debug('sanitized data.correct_responses: ' + data.correct_responses);
                // create new entry
                if (!data.update) {
                    var that = this,
                        fields = this.cmi[this.scormVersion].datamodel.interaction,
                        index = Number(this.getData(fields.count)); // the next interaction index
                    var getFieldId = function (id) {
                        return fields[id].replace('{n}', index);
                    };
                    var setDataValue = function (id, defaultValue) {
                        that.setData(getFieldId(id), data[id] || defaultValue);
                    };
                    // send to the LMS
                    setDataValue('id');
                    setDataValue('type');
                    setDataValue('timestamp');
                    setDataValue('learner_response');
                    if (data.learner_response || data.weighting) setDataValue('weighting', (data.weighting ? data.weighting : 1)); // default to weighting 1 if not provided
                    if (data.description) setDataValue('description');
                    if (data.correct_responses) this.setData(getFieldId('correct_responses').replace('{i}', 0), data.correct_responses); // assumes only one correct response pattern
                    if (data.result) setDataValue('result'); // not supported in SCORM 1.2   
                } else {
                    // future implementation, if updating an existing entry
                }
            }
        },
        // Set LMS Data
        'setData': function (cmi, data, callback) {
            this.debug('setData(' + cmi + ', ' + data + ')');
            var api = this.getAPI(),
                error, result,
                vTry = 0,
                vMaxTry = this.getMaxTries();
            // update CMI with correct datamodel (NOTE: Interaction string is preformatted, not conversion necassary)
            cmi = (cmi.indexOf('interaction') === -1) ? this.cmi[this.scormVersion].datamodel[cmi] : cmi;
            this.debug('setData CMI: ' + cmi);
            if (callback) {
                return api[this.cmi[this.scormVersion].method["SetValue"]](cmi, data, callback);
            }
            while (vTry < vMaxTry && error !== 0) {
                result = api[this.cmi[this.scormVersion].method["SetValue"]](cmi, data);
                error = Number(api[this.cmi[this.scormVersion].method["GetLastError"]]());
                vTry++;
            }
            this.debug('SCORM [LMS]SetValue(' + cmi + ',' + data + ') [error=' + error + ']');
            if (error !== 0) {
                if (error === this.cmi[this.scormVersion].error.notinitialized) {
                    this.initComms();

                    // xAPI Extension
                    xapi.saveDataValue(cmi, value);

                    return this.setData(cmi, data);
                } else {
                    this.commsError(error, cmi, data);
                }
            }
            return (error === 0);
        },
        // Get LMS Data
        'getData': function (cmi, callback) {
            var api = this.getAPI();
            var data, error;
            var vTry = 0,
                vMaxTry = this.getMaxTries();
            // update CMI with correct datamodel (NOTE: Interaction string is preformatted, not conversion necassary)
            cmi = (cmi.indexOf('interaction') === -1) ? this.cmi[this.scormVersion].datamodel[cmi] : cmi;
            this.debug('getData CMI: ' + cmi);
            if (callback) {
                return api[this.cmi[this.scormVersion].method["GetValue"]](cmi, callback);
            }
            while (vTry < vMaxTry && (error !== 0 && error !== this.cmi[this.scormVersion].error.datanotinitialized)) {
                data = api[this.cmi[this.scormVersion].method["GetValue"]](cmi);
                error = Number(api[this.cmi[this.scormVersion].method["GetLastError"]]());
                vTry++;
            }
            this.debug('SCORM [LMS]GetValue(' + cmi + '): ' + data + ' [error=' + error + ']');
            if (error !== 0 && error !== this.cmi[this.scormVersion].error.datanotinitialized) {
                // API is not initialized
                if (error === this.cmi[this.scormVersion].error.notinitialized) {
                    // initialize
                    this.initComms();
                    return this.getData(cmi);
                } else {
                    this.commsError(error, cmi, '');
                }
            }
            return data;
        },
        // commit (and close LMS comms (save session time))
        'commit': function (close) {
            var api = this.getAPI(),
                redirectTo;
            api[this.cmi[this.scormVersion].method["Commit"]]("");
            // set the success status
            /*if(this.cmi[this.scormVersion].datamodel.success !== false) {
                   this.setData("success","unknown");
            }*/
            // close comms and exit
            if (close) {
                api[this.cmi[this.scormVersion].method["Terminate"]]("");

                // api.terminateAttempt();

                redirectTo = rebus.config.onSaveAndExitRedirectTo;
                if (redirectTo) {
                    parent.document.location.replace(redirectTo === 'origin' ? window.location.origin : redirectTo);
                }
                else {
                    try {
                        window.close();
                    } catch (e) { }
                    try {
                        parent.close();
                    } catch (e) { }
                    try {
                        top.close();
                    } catch (e) { }
                    window.setTimeout(function () {
                        rebus.controls.modal.show({
                            body: "<p>We've saved your progress, please use the App navigation to return to your course structure.</p>",
                            preventDismiss: true
                        });
                    }, 5000);
                }
                return true;
            }
            return false;
        },
        // initialise
        'init': function (scormVersion, callback) {
            this.scormVersion = scormVersion;
            // connect to the API and initialise comms;
            return this.connectAPI({
                'initcomms': true,
                callback: callback
            });
        }
    };

    // base xapi on 2004
    internal.cmi.xapi = Object.assign( {}, internal.cmi['2004'], internal.cmi.xapi );

    // public
    return {
        'debug': function (msg) {
            internal.debug(msg);
        },
        'init': function (scormVersion, callback) {
            return internal.init(scormVersion, callback);
        },
        'setInteraction': function (dataarray) {
            return internal.setInteraction(dataarray);
        },
        'setObjective': function (dataarray) {
            return internal.setObjective(dataarray);
        },
        'getData': function (name, callback) {
            return internal.getData(name, callback);
        },
        'setData': function (name, val, callback) {
            return internal.setData(name, val, callback);
        },
        'commit': function (close) {
            return internal.commit(close);
        },
        'getSessionInitialised': function () {
            return internal.getSessionInitialised();
        },
        'useLMS': function () {
            return internal.useLMS();
        }
    };
})();

// Never call this directly; use 'Track'
rebus._private.local = (function () {
    "use strict";
    return {
        log: rebus.logger.log,
        init: function (version, callback) {
            if (callback) {
                callback(true);
            }
            return true;
        },
        debug: function (msg) {
            this.log('type=lms', 'rebus._private.local.debug', msg);
        },
        setInteraction: function (data, update) {
            var interactions = this.getData('cmi.interactions');
            interactions = interactions ? JSON.parse(interactions) : {};
            // Although data is an array, we'll just assume it's a single item for now...
            interactions[data[0].id] = data[0];
            this.setData('cmi.interactions', JSON.stringify(interactions));
            return true;
        },
        setObjective: function (data, update) {
            var objectives = this.getData('cmi.objectives');
            objectives = objectives ? JSON.parse(objectives) : {};
            // Although data is an array, we'll just assume it's a single item for now...
            objectives[data[0].id] = data[0];
            this.setData('cmi.objectives', JSON.stringify(objectives));
            return true;
        },
        setData: function (cmi, data, callback) {
            var that = this;
            sessionStorage.setItem(rebus.config.id + '.' + cmi, data);
            if (callback) {
                window.setTimeout(function () {
                    callback(JSON.stringify({ success: true }));
                }, cmi === 'transcripts' ? 1000 : 0);
            }
            return true;
        },
        getData: function (cmi, callback) {
            var res;
            res = sessionStorage.getItem(rebus.config.id + '.' + cmi);
            if (callback) {
                callback(res);
            }
            else {
                return res;
            }
        },
        commit: function (close) {
            var redirectTo = rebus.config.onSaveAndExitRedirectTo;
            if (redirectTo) {
                parent.document.location.replace(redirectTo === 'origin' ? window.location.origin : redirectTo);
            }
            else {
                //console.log('Close browser window');
            }
            return true;
        },
        getSessionInitialised: function () {
            return true;
        }
    };
})();
// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie/Simple_document.cookie_framework

/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #1 - September 4, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
    'getItem': function (sKey) {
        if (!sKey) {
            return null;
        }
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    'setItem': function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            return false;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    'removeItem': function (sKey, sPath, sDomain) {
        if (!this.hasItem(sKey)) {
            return false;
        }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
        return true;
    },
    'hasItem': function (sKey) {
        if (!sKey) {
            return false;
        }
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    'keys': function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
            aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
        }
        return aKeys;
    }
};
