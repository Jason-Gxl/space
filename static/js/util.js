"use strict";
var util = (function(undefined) {
    var toString = Object.prototype.toString;
    var monthDate = {
    	1: 31,
    	3: 31,
    	4: 30,
    	5: 31,
    	6: 30,
    	7: 31,
    	8: 31,
    	9: 30,
    	10: 31,
    	11: 30,
    	12: 31
    };

    return {
        copy: function(data) {
            if("[object Object]"===toString.call(data) || "[object Array]"===toString.call(data)) {
                return JSON.parse(JSON.stringify(data));
            }

            return data;
        },
        countWeek: function(date, type) {
        	var i = 1,
				d = new Date(date),
        		year = d.getFullYear(),
        		arr = [];

        	monthDate["2"] = 0===year%4?29:28;

        	if("y"===type) {
        		d.setMonth(0);
        		d.setDate(1);

        		var _day = d.getDay(),
        			time = d.getTime() - (_day - 1) * 24 * 60 *60 * 1000,
        			lastTime = new Date(year + "-12-31").getTime();
        	} else {
        		d.setDate(1);

        		var _day = d.getDay(),
        			time = d.getTime() - (_day - 1) * 24 * 60 *60 * 1000,
        			lastTime = new Date(d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + monthDate[d.getMonth()+1]).getTime();
        	}

        	do {
    			d.setTime(time);
    			var firstDay = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    			time = time + 6 * 24 * 60 * 60 * 1000;
    			d.setTime(time);
    			var lastDay = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    			time = time + 24 * 60 * 60 * 1000;
    			arr.push({number: i, start: firstDay, end: lastDay});
    			i++;
    		} while(time<=lastTime);

        	return arr;
        }
    };
}());