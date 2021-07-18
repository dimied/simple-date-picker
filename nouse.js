/*
getMonthsInfoForCalendar: function (passedInDate, monthsToShow, local) {
            var i, date, month, monthsArr = [],
                year = passedInDate.getFullYear(),
                monthNum = passedInDate.getMonth();

            for (i = 0; i < monthsToShow; i++) {
                var ny = year, nm = monthNum + i;
                if (nm >= 12) {
                    ny += nm / 12;
                }
                nm %= 12;
                date = new Date(ny, nm, 1);
                month = this.getDays(passedInDate, date, i, local);
                monthsArr.push(month);
            }

            return monthsArr;
        },
        css: function (overrideClass, styleClass) {
            if (this.ebc(styleClass).length) {
                return;
            }

            var styleEl = this.ce('style');
            styleEl.className = styleClass;
            var css = '.dHd,.day{float:left;text-align:center}.tp-cc{width:auto}.dHd,.day,.hed{pointer-events:none;text-align:center}div.cal,div.cal:after,div.cal:before,.lChev,.rChev{position:absolute}div.cal{background:#fff;max-height:310px;overflow:scroll;width:auto;border:1px solid #ccc;z-index:9999999;padding:0;font-size:10px;border-radius:4px;box-shadow:0 6px 12px rgba(0,0,0,.175);color:#000;font-family:Arial,Helvetica,sans-serif}div.cal:before{top:-7px;left:9px;display:inline-block;border-right:7px solid transparent;border-bottom:7px solid #ccc;border-left:7px solid transparent;border-bottom-color:rgba(0,0,0,.2);content:\'\'}div.cal:after,.lChev:before,.rChev:before{content:"";display:inline-block}div.cal:after{top:-6px;left:10px;border-right:6px solid transparent;border-bottom:6px solid #fff;border-left:6px solid transparent}.hed{font-size:15px;font-weight:500;margin:15px 0 5px}.inBtw{background-color:#bbddf5}.nav{margin:0}.dHd{width:29.5px;color:#bbb;height:30px;line-height:30px;font-size:12px}.mnt{box-sizing:content-box;max-width:210px;width:auto;height:auto;display:inline-block;padding:0 10px 10px}.day{pointer-events:auto;border:none;width:28px;height:28px;line-height:28px;color:#555;cursor:pointer;border-right:1.5px solid #fff;border-bottom:1.5px solid #fff;font-size:14px}.active.sel.day{background-color:#50a5e6}.disb{opacity:.7;color:#888;cursor:default}.lChev:before,.rChev:before{border-style:solid;border-width:3px 3px 0 0;height:7px;width:7px;cursor:pointer}.rChev:before{transform:rotate(45deg)}.lChev:before{transform:rotate(-135deg)}.lChev,.rChev{top:18px}.rChev{right:25px}.lChev{left:20px}';
            if (overrideClass) {
                css = css.replace(/\.[a-z_-][\w-]*(?=[^{}]*{[^{}]*})/ig, function (matched) {
                    return matched + '.' + overrideClass;
                });
            }
            styleEl.innerHTML = css;
            this.ac(document.head, styleEl);
        },
        nocss: function (styleClass) {
            var cssElements = this.ebc(styleClass);
            for (var i = 0; i < cssElements.length; i++) {
                var css = cssElements[i];
                this.rc(css.parentElement, css);
            }
        }
        */

            /*
    function getChevrons(element, calendarObj) {
        var navWrapper = elemWithClass(div, 'nav');
        console.log('CAL', calendarObj);

        h.ac(navWrapper, elemWithClass('span', 'rChev'));
        h.ac(navWrapper, elemWithClass('span', 'lChev'));

        ael(navWrapper, 'click', function (e) {

            var monthChange = e.target.className.contains('spnext') ? 1 : -1;
            console.log('NC:', monthChange, e.target);
            
            // var monthChange = e.target.className === 'rChev ' + overrideClass ? 1 : -1;
            // var firstWeek = calendarObj[0].weeks[0];
            // var date = firstWeek[Object.keys(firstWeek)[0]].date;
            // var newStartDate = h.d(h.addMon(date, monthChange));

            // showCalendar(element, newStartDate);
            
        });
        return navWrapper;
    }
    */

    function createCalInnerWorkings(weeks, sinceDate, element) {
        var calendarBody = elemWithClass(div, 'tp-cc');

        weeks.forEach(function (week) {
            for (var i = 0; i < 7; i++) {
                var currentDate = week[i] && week[i].date;
                var dayOfWeekEl = elemWithClass(div, 'day');

                if (typeof currentDate === 'undefined') {
                    h.ac(calendarBody, dayOfWeekEl);
                } else {
                    dayOfWeekEl.className = 'disb ' + overrideClass;
                    var currentTime = h.t(currentDate);
                    if ((currentDate >= today && element === firstBox) || currentDate >= startDate || settings.selectPast) {
                        dayOfWeekEl.className = 'active ' + overrideClass;
                        ael(dayOfWeekEl, 'click', setDateInEl.bind(this, currentDate, element, false));

                        // Add Highlights to days
                        if (endDate > currentDate && startDate < currentDate) {
                            h.acls(dayOfWeekEl, selectedRangeString);
                        } else if (h.t(endDate) === currentTime || currentTime === h.t(startDate)) {
                            h.acls(dayOfWeekEl, selectedString);
                        }
                    }

                    dayOfWeekEl.innerHTML = currentDate.getDate();
                    dayOfWeekEl.classList.add('day');
                    dayOfWeekEl.setAttribute('time', currentTime);
                    h.ac(calendarBody, dayOfWeekEl);
                    hoverRange(dayOfWeekEl, element);
                }
            }
        });

        return calendarBody;
    }

    function renderCalendar(element, newDate) {
        h.removeCalendar(calendarClassName);
        console.log('Render');

        var calendarObj = h.getMonthsInfoForCalendar(newDate, settings.months, settings.local);
        console.log('CO:', calendarObj);
        var sinceDate = element !== firstBox && h.isDateTodayOrFuture(startDate, today)
            ? startDate
            : today;

        var calendarWidget = elemWithClass(div, calendarClassName);

        h.ac(calendarWidget, getChevrons(element, calendarObj));
        h.ac(document.body, calendarWidget);

        calendarObj.forEach(function (month) {
            var monthDiv = elemWithClass(div, 'mnt'),
                monthHeader = elemWithClass('p', 'hed');

            monthHeader.innerHTML = month.name;// + ' ' + month.year;
            h.ac(monthDiv, monthHeader);

            var calendarContainer = elemWithClass(div, 'tp-cc');

            settings.days.forEach(function (day) {
                var dayEl = elemWithClass(div, 'dHd');
                dayEl.innerHTML = day;
                h.ac(calendarContainer, dayEl);
            });

            h.ac(calendarContainer, createCalInnerWorkings(month.weeks, sinceDate, element));
            h.ac(monthDiv, calendarContainer);
            h.ac(calendarWidget, monthDiv);
        });
    }