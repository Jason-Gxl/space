"use strict";
var animation = (function() {
    var toString = Object.prototype.toString;
    var lineList = [], lineMap = {};
    var pointList = [], pointMap = {};
    var lineGroup = {}, pointGroup = {};
    var canvas = null, ctx = null;
    var fpsCount = 0;

    // 各浏览器的兼容
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(call) {
        setTimeout(function() {
            callback();
        }, 1000/60);
    };

    var util = {
        // 解释SVG获取所有的路径
        getPoints: function(path) {
            var pathPoints = [];
            var dataStr = path.getAttribute("d");  // 获取路径数据字符串
            var dataArr = dataStr.match(/[a-zA-a][\d\.,\s]*(?=\s[a-zA-a])?/g);

            dataArr.forEach(function(item) {
                var point = {
                    type: item.substring(0, 1),  // 路径的类型
                    point: item.substring(1).split(/\s(?=\b)|,/)
                };

                "Z"!=point.type && pathPoints.push(point);
            });

            return pathPoints;
        },
        copy: function(obj) {
            var self = this;

            if(-1===["[object Object]", "[object Array]"].indexOf(toString.call(obj))) {
                return obj;
            }

            if("[object Object]"===toString.call(obj)) {
                var c = {};

                for(var key in obj) {
                    if(obj.hasOwnProperty(key)) {
                        c[key] = self.copy(obj[key]);
                    }
                }
            }

            if("[object Array]"===toString.call(obj)) {
                var c = [];

                obj.forEach(function(item) {
                    c.push(self.copy(item));
                });
            }

            return c;
        },
        M: function(p) {
            ctx.moveTo(this.parseInt(p[0]), this.parseInt(p[1]));
        },
        L: function(p) {
            ctx.lineTo(this.parseInt(p[0]), this.parseInt(p[1]));
        },
        C: function(p) {
            ctx.bezierCurveTo(this.parseInt(p[0]), this.parseInt(p[1]), this.parseInt(p[2]), this.parseInt(p[3]), this.parseInt(p[4]), this.parseInt(p[5]));
        },
        arc: function(p) {
            ctx.arc(this.parseInt(p[0]), this.parseInt(p[1]), 3, 0, 2*Math.PI);
        },
        parseInt: function(num) {
            return (+num + 0.5) | 0;
        },
        getRgb: function(colorStr) {
            if(!/rgb|#/.test(colorStr)) return [255, 255, 255];
            var arr = [];

            if(/rgb/.test(colorStr)) {
                arr = colorStr.match(/\d+/g);
            } else {
                colorStr = colorStr.substring(1);
            
                for(var i=0, len=6; i<=6; i+=2) {
                    var str = colorStr.substring(i, i+2);
                    str && arr.push(parseInt("0x"+str));
                }
            }

            return arr;
        }
    };

    function Animation() {
        if(!this instanceof Animation) {
            return new Animation();
        }

        this.index = 0;
    }

    Animation.prototype = {
        constructor: Animation
    };

    function LightLine(params) {
        if(!this instanceof LightLine) {
            return new LightLine(params);
        }

        var path = params.path;
        params.points = util.getPoints(path);
        params.status = void(0)!=params.status?params.status:1;

        Object.defineProperties(this, {
            params: {
                get: function() {
                    return params;
                }
            },
            status: {
                set: function(val) {
                    params.status = val;
                },
                get: function() {
                    return params.status;
                }
            }
        });

        this.render();
    }

    LightLine.prototype = new Animation();
    LightLine.prototype.constructor = LightLine;

    LightLine.prototype.render = function() {
        var self = this;
        var params = self.params;
        var points = params.points;
        var lastPoint = null;
        var count = 0;
        var dv = 0;

        if(!params.status) return ;

        ctx.save();
        ctx.strokeStyle = params.lineColor.toString();
        ctx.lineWidth = params.lineWidth;

        do {
            if(0===count) {
                if(0===util.parseInt((params.speed || 0)/(1000/60))) {
                    var point = points.shift();
                    points.push(point);
                    dv = 1;
                } else {
                    if(0===fpsCount%(util.parseInt((params.speed || 0)/(1000/60)))) {
                        var point = points.shift();
                        points.push(point);
                        dv = 1;
                    } else {
                        var point = points[count-dv];
                    }
                }
            } else {
                var point = points[count-dv];
            }
            
            ctx.beginPath();

            if(lastPoint) {
                util.M(lastPoint.point);

                if("M"===point.type) {
                    util.L(lastPoint.point);
                } else {
                    util.L(point.point);
                }

                ctx.globalAlpha = count/params.len;
                ctx.stroke();
            }

            lastPoint = point;
        } while(++count<params.len);

        if(lastPoint) {
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = 0.3;
            util.arc(lastPoint.point);
            ctx.fill();
        }
        
        ctx.restore();
    };

    function TwinklePoint(params) {
        if(!this instanceof TwinklePoint) {
            return new TwinklePoint(params);
        }

        params.lineWidth = params.lineWidth || 2;
        params.r = params.r || 5;
        params.index = this.index;
        params.color = util.getRgb(params.color);
        params.level = params.level || 1;
        params.size = params.r*params.level/(params.speed/(1000/60));
        params.hasParent = false;
        params.textSize = util.parseInt(ctx.measureText(params.text).width);
        
        Object.defineProperties(this, {
            params: {
                get: function() {
                    return params;
                }
            },
            status: {
                set: function(val) {
                    params.status = val;
                },
                get: function() {
                    return params.status;
                }
            }
        });

        params.status = void(0)!=params.status?params.status:0;
        this.render();
    }

    TwinklePoint.prototype = new Animation();
    TwinklePoint.prototype.constructor = TwinklePoint;

    TwinklePoint.prototype.render = function() {
        var self = this;
        var params = self.params;
        var point = params.point;
        ctx.save();

        if(params.status) {
            ctx.beginPath();
            ctx.font="20px Verdana";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", 1)";
            ctx.fillText(params.text, util.parseInt(point[0]), util.parseInt(point[1]) - 20);

            if(params.hasParent) {
                ctx.beginPath();
                var grd = ctx.createRadialGradient(util.parseInt(point[0]), util.parseInt(point[1]), params.r, util.parseInt(point[0]), util.parseInt(point[1]), params.r*params.level);
                grd.addColorStop(0, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", 0)");
                grd.addColorStop(0.4, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", 0)");
                grd.addColorStop(1, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", "+ (1 - params.size * params.index/(params.r*params.level)) +")");
                ctx.fillStyle = grd;
                ctx.arc(util.parseInt(point[0]), util.parseInt(point[1]), +params.r + params.r*params.level, 0, 2*Math.PI);
                ctx.fill();
            }

            ctx.beginPath();
            var grd = ctx.createRadialGradient(util.parseInt(point[0]), util.parseInt(point[1]), params.r, util.parseInt(point[0]), util.parseInt(point[1]), +params.r + (params.size * params.index));
            grd.addColorStop(0, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", " + (1 - params.size * params.index/(params.r*params.level)) + ")");
            grd.addColorStop(0.4, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", " + (1 - params.size * params.index/(params.r*params.level)) + ")");
            grd.addColorStop(1, "rgba(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ", 1)");
            ctx.fillStyle = grd;
            ctx.arc(util.parseInt(point[0]), util.parseInt(point[1]), +params.r + (params.size * params.index), 0, 2*Math.PI);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = "rgb(" + params.color[0] + ", " + params.color[1] + ", " + params.color[2] + ")";
        ctx.arc(util.parseInt(point[0]), util.parseInt(point[1]), params.r, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
        params.index++;

        if(params.size*params.index>=params.r*params.level) {
            params.index = 0;
            params.hasParent = true;
        }
    };

    return {
        // 初始化
        init: function(params) {
            if(!params || !params.canvas) return ;

            if(!canvas || !ctx) {
                canvas =  params.canvas;
                ctx = canvas.getContext("2d");
            }

            if("point"===params.type) {
                if("[object Array]"!=toString.call(params.point[0])) {
                    params.point = [params.point];
                }

                if(void(0)!=params.level && "[object Array]"!=toString.call(params.level)) {
                    params.level = [params.level];
                }

                if(void(0)!=params.r && "[object Array]"!=toString.call(params.r)) {
                    params.r = [params.r];
                }

                if(void(0)!=params.text && "[object Array]"!=toString.call(params.text)) {
                    params.text = [params.text];
                }

                params.point.forEach(function(point, index) {
                    var _params = util.copy(params);
                    _params.point = point;
                    _params.level = params.level?(params.level[index]||params.level[0]):0;
                    _params.r = params.r?(params.r[index] || params.r[0]):5;
                    _params.text = params.text?params.text[index]:"";

                    var pointObj = new TwinklePoint(_params);

                    if(_params.id) {
                        pointMap[_params.id] = pointObj;
                    }

                    if(void(0)!=_params.groupId) {
                        if(!pointGroup[_params.groupId]) {
                            pointGroup[_params.groupId] = [pointObj];
                        } else {
                            pointGroup[_params.groupId].push(pointObj);
                        }
                    }

                    pointList.push(pointObj);
                });
            } else {
                params.paths.forEach(function(path) {
                    var _params = util.copy(params);
                    _params.path = path;
                    var lineObj = new LightLine(_params);

                    if(_params.id) {
                        lineMap[_params.id] = lineObj;
                    }

                    if(void(0)!=_params.groupId) {
                        if(!lineGroup[_params.groupId]) {
                            lineGroup[_params.groupId] = [pointObj];
                        } else {
                            lineGroup[_params.groupId].push(pointObj);
                        }
                    }

                    lineList.push(lineObj);
                });
            }

            (function main() {
                window.requestAnimationFrame(function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    lineList.forEach(function(line) {
                        line.render();
                    });

                    pointList.forEach(function(point) {
                        point.render();
                    });
                    
                    fpsCount++;
                    main();
                });
            }());
        },
        // 通过索引获取点
        getPointByIndex: function(index) {
            if(void(0)===index) return null;
            return pointList[index];
        },
        // 通过id获取点，创建点时需要加入id属性
        getPointById: function(id) {
            if(void(0)===id) return null;
            return pointMap[id];
        },
        // 通过索引获取线
        getLineByIndex: function(index) {
            if(void(0)===index) return null;
            return lineList[index];
        },
        // 通过id获取线，创建线时需要加入id属性
        getLineById: function(id) {
            if(void(0)===id) return null;
            return lineMap[id];
        },
        // 通过组id获取所有线，创建线时需要加入groupId属性
        getLinesByGroupId: function(groupId) {
            if(void(0)===groupId) return null;
            return lineGroup[groupId];
        },
        // 通过组id获取所有点，创建点时需要加入groupId属性
        getPointsByGroupId: function(groupId) {
            if(void(0)===groupId) return null;
            return pointGroup[groupId];
        }
    };
}());

// export default animation;