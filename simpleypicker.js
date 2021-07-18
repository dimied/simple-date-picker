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
        ce: function (t) {
            return document.createElement(t);
        },
        rc: function (e, c) {
            if (e && this.f(e.removeChild)) {
                e.removeChild(c);
            }
        },
        ac: function (parent, child) {
            parent.appendChild(child);
        },
        acls: function (el, className) {
            el.classList.add(className);
        },
        rcls: function (el, className) {
            el.classList.remove(className);
        },
        hcls: function(el, className) {
            return el.classList.contains(className);
        },
        febc: function (className) {
            return this.ebc(className)[0];
        },
        br: function (e) {
            return e.getBoundingClientRect();
        },
        pc: function (calEl, el) {
            var b = this.br(document.body),
                e = this.br(el),
                o = e.top - b.top;

            calEl.style.top = o + e.height + 15 + 'px';
            calEl.style.left = e.left + 'px';
        },
        t: function (d) {
            return d.getTime();
        },
        isDateTodayOrFuture: function (currentDate, checkThisDate) {
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

        getDays: function (passedInDate, date, i, local,startsAtMonday) {
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

function SimplePicker(options) { // eslint-disable-line no-unused-vars
    var cid = (new Date()).getTime(),
        currId,
        h = window.__SimplePickerHelper,
        CiH = false,
        firstBox = options.firstBox,
        lastBox = options.lastBox || {},
        listeners = [],
        initialDateSet = true,
        settings = {
            noAutoFocusLast: !!options.noAutoFocusLast,
            startsAtMonday: !!options.startsAtMonday,
            local: options.local || 'en-US',
            localOpts: options.localOpts || {},
            allowPast: !!options.allowPast,
            months: window.innerWidth > 500 ? options.months || 2 : 1,
            days: options.days || ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            success: options.success || function () {
            },
            err: options.err || function () {
            },
            mhr: options.monthHeaderRenderer || function(m) {
                return m.name + ' ' + m.year;
            }
        };

    if (options.customRenderer) {
        settings.customRenderer = options.customRenderer;
    }

    setDateInEl(options.startDate, firstBox, initialDateSet);
    setDateInEl(options.endDate, lastBox, initialDateSet);

    // Settings and constants
    var today = h.d(h.d().setHours(0, 0, 0, 0)),
        overrideClass = options.overrideClass || '',
        styleClass = overrideClass + '_tinypicker',
        calCN = 'cal',
        div = 'div',
        selectedString = 'sel',
        selectedRangeString = 'spbtw',
        startDate = options.startDate;

    startDate = firstBox.value === ''
        ? today
        : h.d(startDate && startDate.setHours(0, 0, 0, 0) || '');
    var endDate = options.endDate;
    endDate = h.d(endDate && endDate.setHours(0, 0, 0, 0) || '');

    var currentMonths = [];

    function sd(dt, d) {
        // console.log('SET DATE:', dt, d);
        if (dt === 'startdate') {
            startDate = d;
        } else if (dt === 'enddate') {
            endDate = d;
        }
    }

    function elemWithClass(t, className) {
        var el = document.createElement(t);
        className = className || '';
        el.className = className + ' ' + overrideClass;
        return el;
    }

    function ael(target, type, f) {
        if (target) {
            target.addEventListener(type, f);
            listeners.push(function () {
                if (h.f(target.removeEventListener)) {
                    target.removeEventListener(type, f);
                }
            });
        }
    }

    function cleanupEventListeners() {
        listeners.forEach(function (cleanupListener) {
            if (h.f(cleanupListener)) {
                cleanupListener();
            }
        });
    }

    function hoverRange(el, inputClicked) {
        ael(el, 'mouseover', function (e) {
            var i, day, days = document.getElementsByClassName('day'),
                hoverTime = parseInt(e.target.getAttribute('time'), 10),
                startTime = h.t(startDate);
            console.log('MO:', el);

            for (i = 0; i < days.length; i++) {
                day = days[i];
                var elTime = parseInt(day.getAttribute('time'), 10);

                day.classList.remove(selectedString);
                day.classList.remove(selectedRangeString);

                if (inputClicked === lastBox && elTime < hoverTime && elTime > startTime) {
                    h.acls(day, selectedRangeString);
                } else if (hoverTime === elTime || (elTime === startTime && inputClicked !== firstBox)) {
                    h.acls(day, selectedString);
                }
            }
        });
    }

    
    
    function isd(d) {
        return (d instanceof Date);
    }

    function isb(s,e,d) {
        return isd(s) && isd(e) && isd(d) && 
        s.getTime()<d.getTime() && d.getTime() < e.getTime();
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
            h.acls(elem, c);
            sd(c, date);
            setDateInEl(date, clickedElem, false);
        }
    }   

    function createMonthElem(month, clickedElem) {
        var w, e, e2, i, j, dayHeader, weeks,
            monthDiv = elemWithClass(div, 'spmonth'),
            monthHeader = elemWithClass('p', 'hed');

        monthHeader.innerHTML = settings.mhr(month);

        dayHeader = document.createElement('div');

        for (i = 0; i < 7; i++) {
            e = document.createElement('div');
            e.className = 'dHd';
            e.innerHTML = settings.days[i];
            h.ac(dayHeader, e);
        }

        weeks = document.createElement('div');

        for (i = 0; i < month.weeks.length; i++) {
            w = month.weeks[i];
            if (w) {
                e = document.createElement('div');
                e.style = "display:block;";

                for (j = 0; j < 7; j++) {
                    e2 = document.createElement('div');
                    e2.className = 'day';

                    if (w[j] && w[j].date) {
                        var wd = w[j].date;
                        e2.innerHTML = wd.getDate();

                        if (ed(startDate, wd)) {
                            //console.log('ADD-START');
                            h.acls(e2, 'startdate');
                        } else if (ed(endDate, wd)) {
                            h.acls(e2, 'enddate');
                            //console.log('ADD-END');
                        } else if(isb(startDate, endDate, wd)) {
                            h.acls(e2, 'spbtw');
                        }

                        e2.setAttribute('time', wd.getTime());

                        ael(e2, 'click', (function (dd, ce) {
                            return function (e) {
                                e.preventDefault();
                                dateClicked(dd, e.target, ce);
                            };
                        }(wd, clickedElem)));

                        hoverRange(e2, clickedElem);
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


    var removeCal = function () { };

    function currentCal() {
        return document.getElementById(currId);
    }

    function dummyRM() {
        return function () {
            console.log('RM: dummy');
        };
    }

    var removeMonths = dummyRM();

    function renderCal(newStartDate, cal, clickedElem) {
        var local = settings.local,
            w = elemWithClass(div, 'wrapper');

        currentMonths = [];

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
            cal.removeChild(w);
            console.log('Remove months');
            removeMonths = dummyRM();
        };

        return w;
    }

    function getNav() {
        var navWrapper = elemWithClass(div, 'nav');
        function a(s) {
            h.ac(navWrapper, elemWithClass('span', s));
        }
        a('spnext');
        a('spprev');

        ael(navWrapper, 'click', function (e) {
            var cm, nd, monthChange = h.hcls(e.target,'spnext') ? 1 : -1;
            if (currentMonths.length > 0) {
                cm = currentMonths[0];
                nd = h.addMon(new Date(cm.year, cm.num, 1), monthChange);
                renderCal(nd, currentCal());
            }
        });
        return navWrapper;
    }
    function setDates(shadowElement, date) {
        if (shadowElement === firstBox) {
            startDate = date;
            endDate = startDate;
            if (lastBox.nodeType && !settings.noAutoFocusLast) {
                lastBox.value = ''; // If user reenters startDate, force reselect of enddate
                lastBox.innerHTML = '';
                lastBox.focus();
            } else {
                removeCal();
                settings.success(startDate);
            }
        } else {
            endDate = date;
            removeCal();
            shadowElement.classList.remove('err');
            settings.success(startDate, endDate);
        }
    }

    function setDateInEl(date, shadowElement, initial) {
        var v;
        initial = initial || false;
        if (date instanceof Date && shadowElement instanceof HTMLElement) {
            v = date.toLocaleDateString(settings.local, settings.localOpts);

            if (h.f(settings.customRenderer)) {
                v = settings.customRenderer(date);
            }
            shadowElement.value = v;
            shadowElement.innerHTML = v;

            shadowElement.setAttribute('date', h.t(date));
        }
        if (!initial) {
            setDates(shadowElement, date);
        }
    }

    function showCalendar(element, newStartDate) {
        if (!element) {
            return;
        }

        if (!newStartDate) {
            newStartDate = (element === firstBox)
                ? startDate
                : new Date(endDate.getFullYear(), endDate.getMonth());
        }

        newStartDate = h.isDateTodayOrFuture(newStartDate, today) || settings.selectPast ? newStartDate : today;

        console.log('NSD:', newStartDate);

        var cal = elemWithClass(div, calCN);
        currId = 'sc_' + cid;
        cal.id = currId;
        cid++;

        h.ac(cal, getNav());

        //var w = 
        renderCal(newStartDate, cal, element);

        removeCal = function () {
            document.body.removeChild(cal);
            console.log('Remove cal:', cal);
        };

        h.ac(document.body, cal);

        h.pc(cal, element);

        //TODO: Schliessen
        ['click', 'touchend'].forEach(function (event) {
            ael(document, event, function (e) {
                var el = e.target;
                var calendarEl = document.getElementById(currId);
                if (!calendarEl) {
                    return;
                }
                var br = calendarEl.getBoundingClientRect();
                console.log('Clicked', el, calendarEl.getBoundingClientRect());

                var p = el.parentElement;
                var remove = true;
                while (p && p !== document.body) {
                    if (p === calendarEl) {
                        remove = false;
                    }
                    p = p.parentElement;
                }
                var outside = !(e.clientX >= br.x && e.clientX <= br.x + br.width
                    && e.clientY >= br.y && e.clientY <= br.y + br.height);

                console.log('AE:', outside, el !== document.activeElement);

                if (el !== document.activeElement && outside) {
                    console.log('Remove CAL 2', outside);
                    removeCal();
                    removeCal = function () { };

                }

                /*
                if (calendarEl && !calendarEl.contains(el) && el !== document.activeElement) {
                    console.log('Remove CAL');
                    document.removeChild(calendarEl);
                    //h.removeCalendar(calendarClassName);
                }
                */
            });
        });
    }

    function userInputedDateHandler(e) {
        var val = e.value;
        var i = val && h.d(val);
        var id = i instanceof Date;

        if (id || (id && !h.isDateTodayOrFuture(i, startDate))) {
            e.value = '';
            settings.err();
        }
        h.isDateTodayOrFuture(i, today) && setDateInEl(i, e, false);
    }

    // Init listeners to properly display calendar
    this.init = function () {
        [firstBox, lastBox].forEach(function (element) {
            var timer;
            if (!element || !element.nodeType) {
                return;
            }
            ael(element, 'focus', function (e) {
                //!CiH && h.css(overrideClass, styleClass);
                CiH = true;
                showCalendar(e.target);
            });

            ael(element, 'keydown', function (e) {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    userInputedDateHandler(e.target);
                }, 1000);
            });
        });
    };

    this.cleanup = function () {
        removeCal();
        //h.nocss(styleClass);
        cleanupEventListeners();
    };
}