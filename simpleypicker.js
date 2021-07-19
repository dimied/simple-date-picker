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
        removeCalendar: function (className) {
            var e = this.febc(className);
            e && document.body.removeChild(e);
        },
        getNumberOfWeeks: function (date, startsAtMonday) {
            if (startsAtMonday) {
                return Math.ceil((date.getDate() - ((date.getDay() + 6) % 7)) / 7);
            }
            return Math.ceil((date.getDate() - 1 - date.getDay()) / 7);
        },

        getDays: function (passedInDate, date, i, local, startsAtMonday) {
            var month = {
                name: date.toLocaleString(local, { month: 'long' }),
                year: date.getFullYear(),
                num: date.getMonth(),
                weeks: []
            };
            var newDate = new Date(passedInDate.getFullYear(), passedInDate.getMonth() + i, 1).getMonth();

            while (date.getMonth() === newDate) {
                var week = this.getNumberOfWeeks(this.d(date), startsAtMonday),
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
            var r = new Date(date.getTime());
            function s(m, y) {
                r.setMonth(m);
                y !== 0 && r.setFullYear(r.getFullYear() + y);
            }
            if (change === 0) {
                return r;
            }
            var m = r.getMonth() + change;
            if (m === 12) {
                s(0, 1);
            } else if (m < 0) {
                s(11, -1);
            } else {
                s(m, 0);
            }
            return r;
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
        today = h.d(h.d().setHours(0, 0, 0, 0)),
        overrideClass = options.overrideClass || '',
        calCN = 'spcal',
        div = 'div',
        selectedString = 'sel',
        rangeCN = 'spbtw',
        startDate = options.startDate,
        endDate = options.endDate,
        currentMonths = [];

    if (startDate) {
        startDate = h.d(startDate.setHours(0, 0, 0, 0) || '');
    }
    if (endDate) {
        endDate = h.d(endDate.setHours(0, 0, 0, 0) || '');
    }

    if (options.customRenderer) {
        settings.customRenderer = options.customRenderer;
    }

    dateInElem(options.startDate, firstBox, initialDateSet);
    dateInElem(options.endDate, lastBox, initialDateSet);

    function sd(dt, d) {
        if (dt === 'startdate') {
            startDate = d;
        } else if (dt === 'enddate') {
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
                    console.log('AEL', elemType);
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
        console.log('REL', elemType, nr);
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


    function dateClicked(date, elem, clickedElem) {
        var e, c;

        if (clickedElem === firstBox) {
            c = 'startdate';
        } else if (clickedElem == lastBox) {
            c = 'enddate';
        }
        console.log('Clicked:::', c, date, elem, clickedElem);

        if (c) {
            e = h.febc(c);
            e && h.rcls(e, c);
            elem && h.acls(elem, c);
            sd(c, date);
            dateInElem(date, clickedElem, false);
        }
    }
    function ta(e) {
        return parseInt(e.getAttribute('time'), 10)
    }

    function createMonthElem(month, clickedElem) {
        var w, e, e2, i, j, dayHeader, weeks,
            monthDiv = elemWithClass(div, 'spmonth'),
            monthHeader = elemWithClass('p', 'spmonthhead');

        monthHeader.innerHTML = settings.mhr(month);

        dayHeader = elemWithClass('div', '');

        for (i = 0; i < 7; i++) {
            e = elemWithClass('div', 'spdayhead');
            e.innerHTML = settings.days[i];
            h.ac(dayHeader, e);
        }

        weeks = elemWithClass('div', '');

        for (i = 0; i < month.weeks.length; i++) {
            w = month.weeks[i];
            if (w) {
                e = elemWithClass('div', '');
                e.style = "display:block;";

                for (j = 0; j < 7; j++) {
                    e2 = elemWithClass('div', 'spday');

                    if (w[j] && w[j].date) {
                        var wd = w[j].date;
                        e2.innerHTML = wd.getDate();

                        if (ed(startDate, wd)) {
                            //console.log('ADD-START');
                            h.acls(e2, 'startdate');
                        } else if (ed(endDate, wd)) {
                            h.acls(e2, 'enddate');
                            //console.log('ADD-END');
                        } else if (isb(startDate, endDate, wd)) {
                            h.acls(e2, 'spbtw');
                        }
                        if (ed(wd, today)) {
                            h.acls(e2, 'sptoday');
                        }

                        e2.setAttribute('time', wd.getTime());

                        ael(e2, 'click', (function (dd, ce) {
                            return function (e) {
                                e.preventDefault();
                                dateClicked(dd, e.target, ce);
                            };
                        }(wd, clickedElem)), 'day');

                        ael(e2, 'mouseover',
                            (function (inputClicked) {
                                return function (e) {
                                    var i, day, days = h.ebc('day'),
                                        hoverTime = ta(e.target),
                                        startTime = startDate ? h.t(startDate) : 0;

                                    console.log('MO:', e.target);

                                    for (i = 0; i < days.length; i++) {
                                        day = days[i];
                                        var elTime = ta(day);

                                        h.rlcs(day, selectedString);
                                        h.rlcs(day, rangeCN);

                                        if (inputClicked === lastBox &&
                                            elTime < hoverTime &&
                                            elTime > startTime) {
                                            h.acls(day, rangeCN);
                                        } else if (hoverTime === elTime ||
                                            (elTime === startTime &&
                                                inputClicked !== firstBox)) {
                                            h.acls(day, selectedString);
                                        }
                                    }
                                }
                            }(clickedElem)), 'day');
                    }
                    h.ac(e, e2);
                }
                h.ac(weeks, e);
            }
        }

        h.ac(monthDiv, monthHeader);
        h.ac(monthDiv, dayHeader);

        h.ac(monthDiv, weeks);

        return monthDiv;
    }

    var lastClicked, calVisible = false;

    function currentCal() {
        return document.getElementById(currId);
    }

    function removeCal() {
        rel('all');
        var c = currentCal();
        h.rc(document.body, c);
        lastClickedIdx = null;
    };

    function dummyRM() {
        return function () { };
    }

    var removeMonths = dummyRM();

    function renderCal(newStartDate, cal, clickedElem) {
        var local = settings.local,
            w = elemWithClass(div, 'wrapper');

        currentMonths = [];
        listeners['day1'] = listeners['day'];
        listeners['day'] = [];

        for (var mi = 0; mi < settings.months; mi++) {
            var md = h.addMon(newStartDate, mi);
            md.setDate(1);

            month = h.getDays(md, md, 0, local, settings.startsAtMonday);

            currentMonths.push(month);

            var el = createMonthElem(month, clickedElem);
            h.ac(w, el);
        }

        removeMonths();

        h.ac(cal, w);

        removeMonths = function () {
            rel('day1');
            cal.removeChild(w);
            console.log('Remove months');
            removeMonths = dummyRM();
        };

        return w;
    }

    function getNav() {
        var nc = 'spnav', navWrapper = elemWithClass(div, nc);
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

    function setDates(elem, date) {
        if (elem === firstBox) {
            startDate = date;
            endDate = startDate;
            if (lastBox.nodeType && !settings.noAutoFocusLast) {
                lastBox.value = '';
                lastBox.innerHTML = '';
                lastBox.focus();
            } else {
                removeCal();
                settings.success(startDate);
            }
        } else {
            endDate = date;
            removeCal();
            h.rcls(elem, 'err');
            settings.success(startDate, endDate);
        }
    }

    function dateInElem(date, el, initial) {
        var v;
        initial = initial || false;
        if (date instanceof Date && el instanceof HTMLElement) {
            v = h.f(settings.customRenderer)
                ? settings.customRenderer(date)
                : date.toLocaleDateString(settings.local, settings.localOpts);

            el.value = v;
            el.innerHTML = v;

            el.setAttribute('date', h.t(date));
        }
        if (!initial) {
            setDates(el, date);
        }
    }

    var lastClickedIdx;

    function showCalendar(element, idx, newStartDate) {
        if (!element) {
            return;
        }
        if (lastClickedIdx === idx) {
            console.log('Same clicked');
            return;
        }

        removeCal();

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

        var cal = elemWithClass(div, calCN);
        currId = 'sc_' + cid;
        cal.id = currId;
        cid++;

        h.ac(cal, getNav());

        renderCal(newStartDate, cal, element);

        h.ac(document.body, cal);

        h.pc(cal, element);
        function iso(e, oe) {
            var br;
            if (e && oe) {
                br = oe.getBoundingClientRect();
                console.log('ISO:', e, oe, br);

                return !(e.clientX >= br.x && e.clientX <= br.x + br.width
                    && e.clientY >= br.y && e.clientY <= br.y + br.height);
            }
            return false;
        }

        ['click', 'touchend'].forEach(function (event) {
            ael(document, event, function (e) {
                var br, outside, el = e.target;
                var calEl = currentCal();
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

                console.log('AE:',
                    outside,
                    outsideInput,
                    el !== document.activeElement,
                    document.activeElement
                );

                if ((el !== document.activeElement || outsideInput) && outside) {
                    console.log('Remove CAL 2', outside);
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

            ael(el, 'keydown', function (e) {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    onUserInput(e.target);
                }, 1000);
            }, fc);
        });
        return this;
    };

    this.cleanup = function () {
        removeCal();
        rel('field');
    };
}