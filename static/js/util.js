"use strict";
var util = (function(undefined) {
    var toString = Object.prototype.toString;

    return {
        copy: function(data) {
            if("[object Object]"===toString.call(data) || "[object Array]"===toString.call(data)) {
                return JSON.parse(JSON.stringify(data));
            }

            return data;
        }
    };
}());