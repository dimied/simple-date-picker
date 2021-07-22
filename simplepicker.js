//Warning: Helper object in global namespace
if (!window.hasOwnProperty('__SimplePickerHelper')) {
    window.__SimplePickerHelper = {
        d: function (val) {
            return val ? new Date(val) : new Date();
        },
        f: function (f) {
            return typeof f === 'function';
        },
        ebc: function (styleClass) {
            return document.getElementsByClassName(styleClass);
        },
        rc: function (e, c) {
            if (e && c && this.f(e.removeChild)) {
                e.removeChild(c);
            }
        },
        ac: function (parent, child) {
            parent && child && parent.appendChild(child);
        },
        acls: function (el, className) {
            el && el.classList.add(className);
        },
        rcls: function (el, className) {
            el && el.classList.remove(className);
        },
        hcls: function (el, className) {
            return el && el.classList.contains(className);
        },
        febc: function (className) {
            return this.ebc(className)[0];
        },
        br: function (e) {
            return e.getBoundingClientRect();
        },
        pc: function (calEl, el) {
            if (calEl, el) {
                var b = this.br(document.body),
                    e = this.br(el),
                    o = e.top - b.top;

                calEl.style.top = o + e.height + 15 + 'px';
                calEl.style.left = e.left + 'px';
            }
        },
        t: function (d) {
            return d.getTime();
        },
        isTodayOrFuture: function (currentDate, checkThisDate) {
            return currentDate && checkThisDate && this.t(currentDate) >= this.t(checkThisDate);
        },
        weekIndex: function (date, startsAtMonday) {
            var d = date.getDate(), wd = date.getDay();
            d = startsAtMonday ? (d - ((wd + 6) % 7)) : (d - 1 - wd);
            return Math.ceil(d / 7);
        },
        mon: function(d) {
            return d.getMonth();
        },
        year: function(d) {
            return d.getFullYear();
        },
        getDays: function (passedInDate, date, i, local, startsAtMonday) {
            var month = {
                name: date.toLocaleString(local, { month: 'long' }),
                year: this.year(date),
                num: this.mon(date),
                weeks: []
            },
            newDate = this.mon(new Date(this.year(passedInDate), this.mon(passedInDate) + i, 1));

            while (date.getMonth() === newDate) {
                var week = this.weekIndex(this.d(date), startsAtMonday),
                    d, day = this.d(date);

                if (!month.weeks[week]) {
                    month.weeks[week] = {};
                }

                d = day.getDay();
                if (startsAtMonday) {
                    d = (d + 6) % 7;
                }

                month.weeks[week][d] = {
                    date: day
                };
                date.setDate(date.getDate() + 1);
            }

            return month;
        },
        addMon: function (date, change) {
            var tc=this,r = new Date(date.getTime());
            function s(m, y) {
                r.setMonth(m);
                y !== 0 && r.setFullYear(tc.year(r) + y);
            }
            if (change === 0) {
                return r;
            }
            var m = this.mon(r) + change;
            if (m === 12) {
                s(0, 1);
            } else if (m < 0) {
                s(11, -1);
            } else {
                s(m, 0);
            }
            return r;
        },
        zeroTime: function(d) {
            return d.setHours(0,0,0,0);
        },
    };
}

function SimplePicker(options) {
    var cid = (new Date()).getTime(),
        currId,
        h = window.__SimplePickerHelper,
        firstBox = options.firstBox,
        lastBox = options.lastBox || {},
        listeners = {},
        flisteners = [],
        initialDateSet = true,
        settings = {
            noAutoFocusLast: !!options.noAutoFocusLast,
            startsAtMonday: !!options.startsAtMonday,
            local: options.local || 'en-US',
            localOpts: options.localOpts || {},
            allowPast: !!options.allowPast,
            months: window.innerWidth > 520 ? options.months || 2 : 1,
            days: options.days || ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            success: options.success || function () {
            },
            err: options.err || function () {
            },
            mhr: options.monthHeaderRenderer || function (m) {
                return m.name + ' ' + m.year;
            }
        },
        today = h.d(h.zeroTime(h.d())),
        overrideClass = options.overrideClass || '',
        calCN = 'spcal',
        SD = 'startdate',
        ED = 'enddate',
        rangeCN = 'spbtw',
        startDate = options.startDate,
        endDate = options.endDate,
        currentMonths = [],
        lastClickedIdx;

    if (startDate) {
        startDate = h.zeroTime(h.d(startDate));
    }
    if (endDate) {
        endDate = h.zeroTime(h.d(endDate));
    }

    if (options.customRenderer) {
        settings.customRenderer = options.customRenderer;
    }

    dateInElem(startDate, 0, initialDateSet);
    dateInElem(endDate, 1, initialDateSet);

    function pd(e) {
        if(e && e.value) {
            var v = e.value;
            v = v.split('.');

            if(v.length>=2) {
                var d = new Date();
                d.setMonth(parseInt(v[1], 10)-1);
                d.setDate(parseInt(v[0], 10));
                if(v.length>=3) {
                    //TODO: years   
                }
                h.zeroTime(d);
                return d;
            }
        }
        return '';        
    }

    function cd(idx, date) {
        if(idx == 0 && firstBox instanceof HTMLElement) {
            return pd(firstBox);
        }
        if(idx == 1 && lastBox instanceof HTMLElement) {
            return pd(lastBox);
        }
        return date;
    }

    startDate = cd(0, startDate);
    endDate = cd(1, endDate);

    // console.log('INPUT:S:', startDate);
    // console.log('INPUT:E:', endDate);

    function sd(dt, d) {
        if (dt === SD) {
            startDate = d;
        } else if (dt === ED) {
            endDate = d;
        }
    }

    function elemWithClass(t, className) {
        var el = document.createElement(t);
        className = className || '';
        className = (className + ' ' + overrideClass).trim();
        if (className) {
            el.className = className;
        }
        return el;
    }

    function ael(target, type, f, elemType) {
        if (target && h.f(target.addEventListener)) {
            target.addEventListener(type, f);
            elemType = elemType || 'common';

            if (h.f(target.removeEventListener)) {
                if (elemType !== 'field') {
                    if (!listeners[elemType]) {
                        listeners[elemType] = [];
                    }
                    //console.log('AEL', elemType);
                    listeners[elemType].push(function () {
                        target.removeEventListener(type, f);
                    });
                    return;
                }
                flisteners.push(function () {
                    target.removeEventListener(type, f);
                });
            }
        }
    }

    function rel(elemType) {
        var nr = 0;
        if (elemType === 'all') {
            for (elemType in listeners) {
                rel(elemType);
            }
            listeners = {};
        }
        if (listeners.hasOwnProperty(elemType) && listeners[elemType]) {
            nr = listeners[elemType].length;
            listeners[elemType].forEach(function (l) {
                l();
            });
            listeners[elemType] = [];
        }
        if (elemType === 'field') {
            flisteners.forEach(function (l) {
                l();
            });
        }
        // console.log('REL', elemType, nr);
    }

    function isd(d) {
        return (d instanceof Date);
    }

    function isb(s, e, d) {
        return isd(s) && isd(e) && isd(d) &&
            s.getTime() < d.getTime() && d.getTime() < e.getTime();
    }

    function ed(d1, d2) {
        return isd(d1) && isd(d2)
            && d1.getDate() === d2.getDate()
            && d1.getMonth() === d2.getMonth();
    }


    function dateClicked(date, elem, clickedElemIdx) {
        var e, c;

        if (clickedElemIdx === 0) {
            c = 'startdate';
        } else if (clickedElemIdx == 1) {
            c = 'enddate';
        }
        // console.log('Clicked:::', c, date, elem, clickedElemIdx);

        if (c) {
            e = h.febc(c);
            e && h.rcls(e, c);
            elem && h.acls(elem, c);
            sd(c, date);
            dateInElem(date, clickedElemIdx, false);
        }
    }
    function ta(e) {
        return parseInt(e.getAttribute('time'), 10);
    }

    function createMonthElem(month, clickedElemIdx) {
        var w, e, e2, i, j, dayHeader, weeks,
            monthDiv = elemWithClass('div', 'spmonth'),
            monthHeader = elemWithClass('p', 'spmonthhead');

        monthHeader.innerHTML = settings.mhr(month);

        dayHeader = elemWithClass('div');

        for (i = 0; i < 7; i++) {
            e = elemWithClass('div', 'spdayhead');
            e.innerHTML = settings.days[i];
            h.ac(dayHeader, e);
        }

        weeks = elemWithClass('div', 'spweeks');

        for (i = 0; i < month.weeks.length; i++) {
            w = month.weeks[i];

            if (w) {
                e = elemWithClass('div', 'spweek');

                for (j = 0; j < 7; j++) {
                    e2 = elemWithClass('div', 'spday');

                    if (w[j] && w[j].date) {
                        var wd = w[j].date;
                        e2.innerHTML = wd.getDate();

                        if (ed(startDate, wd)) {
                            h.acls(e2, 'startdate');
                        } else if (ed(endDate, wd)) {
                            h.acls(e2, 'enddate');
                        } else if (isb(startDate, endDate, wd)) {
                            h.acls(e2, 'spbtw');
                        }
                        if (ed(wd, today)) {
                            h.acls(e2, 'sptoday');
                        }

                        e2.setAttribute('time', wd.getTime());

                        //h.acls(e2, 'spday_'+wd.getMonth()+'_'+wd.getDate());

                        ael(e2, 'click', (function (dd, ce) {
                            return function (e) {
                                e.preventDefault();
                                dateClicked(dd, e.target, ce);
                            };
                        }(wd, clickedElemIdx)), 'day');

                        ael(e2, 'mouseover',
                            (function (inputClicked,h) {
                                return function (e) {
                                    var i, elTime, day, days = h.ebc('spday'),
                                        hoverTime = ta(e.target),
                                        startTime = startDate ? h.t(startDate) : 0;

                                        /*
                                    console.log('MO:', 
                                    e.target, 
                                    hoverTime, 
                                    startTime,
                                    inputClicked);
                                    */
                                    

                                    for (i = 0; i < days.length; i++) {
                                        day = days[i];
                                        if(day.hasAttribute('empty')) {
                                            continue;
                                        }
                                        if(day.classList &&
                                            day.classList.contains('spday_empty')) {
                                            //console.log('Skip');
                                            continue;
                                        }
                                        
                                        elTime = ta(day);

                                        //console.log('EL:', elTime);
                                        

                                        if (inputClicked === 1 &&
                                            elTime <= hoverTime &&
                                            elTime > startTime) {
                                            h.acls(day, rangeCN);
                                        } else {
                                            h.rcls(day, rangeCN);
                                        }
                                        /*
                                         else if (hoverTime === elTime ||
                                            (elTime === startTime &&
                                                inputClicked !== 0)) {
                                            h.acls(day, selectedString);
                                        }
                                        */
                                    }
                                }
                            }(clickedElemIdx,h)), 'day');
                    } else {
                        //h.acls(e2, 'spday_empty');
                        e2.setAttribute('empty', '1');
                        e2.innerHTML = "";
                    }
                    h.ac(e, e2);
                }
                h.ac(weeks, e);
            }
        }

        var ef = elemWithClass('div', 'spweek_fill');
            h.ac(weeks, ef);
            ef = elemWithClass('div', 'spweek_fill');
            h.ac(weeks, ef);

        h.ac(monthDiv, monthHeader);
        h.ac(monthDiv, dayHeader);

        h.ac(monthDiv, weeks);

        return monthDiv;
    }

    function currentCal() {
        return document.getElementById(currId);
    }

    function removeCal() {
        rel('all');
        var c = currentCal();
        h.rc(document.body, c);
        lastClickedIdx = null;
    };

    var monthControl = {
        remove: function(){}
    };

    function renderCal(newStartDate, cal, clickedElemIdx) {
        var local = settings.local,
            w = elemWithClass('div', 'wrapper');

        currentMonths = [];

        clickedElemIdx = clickedElemIdx || lastClickedIdx;

        listeners['day1'] = listeners['day'];
        listeners['day'] = [];

        for (var mi = 0; mi < settings.months; mi++) {
            var md = h.addMon(newStartDate, mi);
            md.setDate(1);

            month = h.getDays(md, md, 0, local, settings.startsAtMonday);

            currentMonths.push(month);

            var el = createMonthElem(month, clickedElemIdx);
            h.ac(w, el);
        }

        monthControl.remove();

        h.ac(cal, w);

        monthControl.remove = (function(c){
            return function () {
                rel('day1');
                cal.removeChild(c);
                //console.log('Remove months');
            }
        }(w));

        return w;
    }

    function getNav() {
        var nc = 'spnav', navWrapper = elemWithClass('div', nc);
        function a(s) {
            h.ac(navWrapper, elemWithClass('span', s));
        }
        a('spnext');
        a('spprev');

        ael(navWrapper, 'click', function (e) {
            var cm, nd, monthChange = h.hcls(e.target, 'spnext') ? 1 : -1;
            if (currentMonths.length > 0) {
                cm = currentMonths[0];
                nd = h.addMon(new Date(cm.year, cm.num, 1), monthChange);
                renderCal(nd, currentCal());
            }
        }, nc);
        return navWrapper;
    }

    function setDates(elemIdx, date) {
        if (elemIdx === 0) {
            startDate = date;
            removeCal();
            settings.success(startDate);
        } else if (elemIdx === 1) {
            endDate = date;
            removeCal();
            settings.success(startDate, endDate);
        }
    }

    function sdi(idx, v, date) {
        var el;
        if(idx === 0) {
            el = firstBox;
        }else if(idx === 1) {
            el = lastBox;
        } else {
            return;
        }

        el.value = v;
        el.innerHTML = v;

        el.setAttribute('date', h.t(date));
    }

    function dateInElem(date, elIdx, initial) {
        var v;
        initial = initial || false;
        if (date instanceof Date) {
            v = h.f(settings.customRenderer)
                ? settings.customRenderer(date)
                : date.toLocaleDateString(settings.local, settings.localOpts);
                sdi(elIdx, v, date);            
        }
        if (!initial) {
            setDates(elIdx, date);
        }
    }

    function showCalendar(element, idx, newStartDate) {
        if (!element) {
            return;
        }
        if (lastClickedIdx === idx) {
            console.log('Same clicked');
            return;
        }

        removeCal();

        startDate = cd(0, startDate);
        endDate = cd(1, endDate);

        lastClickedIdx = idx;

        if (!newStartDate) {
            if (idx === 0) {
                newStartDate = h.d(startDate);
            } else {
                newStartDate = h.d(endDate);
                newStartDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth());
            }
        }

        newStartDate = h.isTodayOrFuture(newStartDate, today) || settings.allowPast ? newStartDate : today;

        // console.log('NSD:', newStartDate);

        var cal = elemWithClass('div', calCN);
        currId = 'sc_' + cid;
        cal.id = currId;
        cid++;

        h.ac(cal, getNav());

        renderCal(newStartDate, cal, lastClickedIdx);

        h.ac(document.body, cal);

        h.pc(cal, element);

        function iso(e, oe) {
            var br;
            if (e && oe) {
                br = oe.getBoundingClientRect();
                //console.log('ISO:', e, oe, br);

                return !(e.clientX >= br.x && e.clientX <= br.x + br.width
                    && e.clientY >= br.y && e.clientY <= br.y + br.height);
            }
            return false;
        }

        ['click', 'touchend'].forEach(function (event) {
            ael(document, event, function (e) {
                var br, outside, el = e.target, calEl = currentCal();

                if (!calEl) {
                    return;
                }
                br = calEl.getBoundingClientRect();

                outside = iso(e, calEl);
                var outsideInput = true;
                [firstBox, lastBox].forEach(function (el) {
                    if (el) {
                        outsideInput &&= iso(e, el);
                    }
                });

                /*
                console.log('AE:',
                    outside,
                    outsideInput,
                    el !== document.activeElement,
                    document.activeElement
                );
                */

                if ((el !== document.activeElement || outsideInput) && outside) {
                    //console.log('Remove CAL 2', outside);
                    removeCal();
                }
            }, 'doc');
        });
    }

    function onUserInput(e) {
        var val = e.value;
        var i = val && h.d(val);
        var id = i instanceof Date;

        if (id || (id && !h.isTodayOrFuture(i, startDate))) {
            e.value = '';
            settings.err();
        }
        h.isTodayOrFuture(i, today) && dateInElem(i, e, false);
    }

    // Init listeners to properly display calendar
    this.init = function () {
        [firstBox, lastBox].forEach(function (el, idx) {
            var fc = 'field', timer;
            if (!el || !el.nodeType) {
                return;
            }
            // console.log('Init:', idx);
            ael(el, 'focus', function (e) {
                showCalendar(e.target, idx);
            }, fc);
            
            //TODO: When user modifies date in input.

            /*
            ael(el, 'keydown', function (e) {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    onUserInput(e.target);
                }, 1000);
            }, fc);
            */
        });
        return this;
    };

    this.cleanup = function () {
        removeCal();
        rel('field');
    };
}

window.SimplePickerLoaded = true;