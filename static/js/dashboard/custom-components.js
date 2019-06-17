"use strict";
(function(undefined) {
    var toString = Object.prototype.toString,
        componentMap = {};

    function Echart(wrap) {
        if(!(this instanceof Echart)) {
            return new Echart(wrap);
        }

        this.name = "Echart";
        this._wrap = wrap;
    }

    Echart.prototype = {
        constructor: Echart,
        setOption: function(options) {
            options.wrap = this._wrap;
            var obj = componentMap[options.type].init(options);

            if(obj) {
                this.chart = obj;
            }
        },
        on: function() {},
        resize: function() {}
    };

    var customComponents = {
        extend: function(name, obj) {
            componentMap[name] = "[object Function]"===toString.call(obj)?obj():obj;

            Object.defineProperty(this, name, {
                get: function() {
                    return componentMap[name];
                }
            });
        },
        init: function(wrap) {
            if(!wrap) return ;
            return new Echart(wrap);
        },
        getAbleOption: function(name) {
            return this[name].ableOption;
        }
    };

    window.customComponents = window.customComponents || customComponents;
}());

// 自定义表组件
customComponents.extend("table", (function(undefined){
    var tbTpl = '\
        <table cellspacing=1 class="custom-components-table">\
            <thead>$THEAD$</thead>\
            <tbody>$TBODY$</tbody>\
        </table>';
    var trTpl = '<tr>$TR$</tr>';
    var tdTpl = '<td>$TD$</td>';
    var thTpl = '<th>$TH$</th>';

    var _util = {
        sortData: function(data) {
            var theadList = [], tbodyList = [];

            for(var key in data) {
                theadList.push(key);
                
                data[key].forEach(function(d, index) {
                    tbodyList[index] = tbodyList[index] || [];
                    tbodyList[index].push(-1!=[null, undefined].indexOf(d)?"":d);
                });
            }

            return {
                theadList: theadList,
                tbodyList: tbodyList
            };
        }
    };

    function Table(params) {
        if(!(this instanceof Table)) {
            return new Table(params);
        }

        this.name = "Table";
        var data = _util.sortData(params.data),
            headStr = "",
            bodyStr = "";

        if(params.showOrder) {
            data.theadList.unshift("序号");
        }

        if(!params.hideTitle) {
            data.theadList.forEach(function(item) {
                headStr += thTpl.replace(/\$TH\$/, item);
            });
    
            headStr = trTpl.replace(/\$TR\$/, headStr);
        }

        data.tbodyList.forEach(function(line, index) {
            var lineStr = "";

            if(params.showOrder) {
                lineStr += tdTpl.replace(/\$TD\$/, index+1);
            }

            line.forEach(function(item) {
                lineStr += tdTpl.replace(/\$TD\$/, item);
            });

            bodyStr += trTpl.replace(/\$TR\$/, lineStr);
        });

        var _tbTpl = tbTpl.replace(/\$THEAD\$/, headStr).replace(/\$TBODY\$/, bodyStr);
        params.wrap.innerHTML = _tbTpl;

        if(params.style) {
            if(params.style.head) {
                for(var key in params.style.head) {
                    if(params.style.head.hasOwnProperty(key)) {
                        params.wrap.getElementsByTagName("thead")[0].style.setProperty("--" + key, params.style.head[key]);
                    }
                }
            }

            if(params.style.body) {
                for(var key in params.style.body) {
                    if(params.style.body.hasOwnProperty(key)) {
                        params.wrap.getElementsByTagName("tbody")[0].style.setProperty("--" + key, params.style.body[key]);
                    }
                }
            }
        }
    }

    return {
        init: function(params) {
            if(!params.data || !params.wrap) return ;
            return new Table(params);
        },
        getAableOption: function() {
            return {
                global: [
                    {key: "hideTitle", label: "隐藏表头", inputType:"checkbox", type: 0, default: false},
                    {key: "showOrder", label: "显示序号", inputType:"checkbox", type: 0, default: false}
                ],
                head: [
                    {key: "background", label: "背景", inputType:"color", type: 1, default: "rgba(0, 0, 0, 0)"},
                    {key: "color", label: "字体颜色", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"}
                ],
                body: [
                    {key: "background", label: "背景", inputType:"color", type: 1, default: "rgba(0, 0, 0, 0)"},
                    {key: "color", label: "字体颜色", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"}
                ]
            }
        }
    };
}()));

// 自定义数据板组件
customComponents.extend("plack", function() {
    var tpl = '<ul class="plack-wrap">$ITEMTPL$</ul>',
        itemTpl = '\
            <div class="plack-item">\
                <div class="plack-item-wrap">\
                    <label class="plack-item-title">$LABEL$</label>\
                    <span class="plack-item-data">$DATA$</span>\
                </div>\
            </div>';

    return {
        /**
         * 数据板初始化
         * @param   wrap    数据板初始化生成的dom节点容器
         * @param   data    需要展示的数据
         * @param   lineCount   分几行显示
         * @param   separateLine    显示分割线
         * @param   style   样式表
         */
        init: function(params) {
            if(!params.data || !params.wrap) return ;

            if("[object Object]"===toString.call(params.data)) {
                var arr = [];

                for(var key in params.data) {
                    if(params.data.hasOwnProperty(key)) {
                        arr.push({
                            name: key, 
                            value: params.data[key]
                        });
                    }
                }

                params.data = arr;
            }

            params.lineCount = params.lineCount || 1;

            var _itemTpl = "", 
                total = params.data.length,
                len = (total/params.lineCount + 0.5) | 0;

            for(var i=0; i<params.lineCount; i++) {
                _itemTpl += '<li class="plack-row">';

                for(var j=0; j<len; j++) {
                    var d = params.data[i*len+j];

                    if(d) {
                        _itemTpl += itemTpl.replace(/\$LABEL\$/, d.name).replace(/\$DATA\$/, d.value);
                    }
                }

                _itemTpl += "</li>";
            }
    
            params.wrap.innerHTML = tpl.replace(/\$ITEMTPL\$/, _itemTpl);

            if(params.separateLine) {
                params.wrap.firstChild.className = params.wrap.firstChild.className + " separate-line";
            }

            params.wrap.firstChild.style.setProperty("--width", 100/len + "%");

            if(params.style) {
                for(var key in params.style) {
                    if(params.style.hasOwnProperty(key)) {
                        if("head"===key || "body"===key) continue;
                        params.wrap.getElementsByClassName("plack-wrap")[0].style.setProperty("--"+key, params.style[key]);
                    }
                }

                if(params.style.head) {
                    for(var key in params.style.head) {
                        if(params.style.head.hasOwnProperty(key)) {
                            [].slice.call(params.wrap.getElementsByClassName("plack-item-title"), 0).forEach(function(item) {
                                item.style.setProperty("--" + key, params.style.head[key]);
                            });
                        }
                    }
                }
    
                if(params.style.body) {
                    for(var key in params.style.body) {
                        if(params.style.body.hasOwnProperty(key)) {
                            [].slice.call(params.wrap.getElementsByClassName("plack-item-data"), 0).forEach(function(item) {
                                item.style.setProperty("--" + key, params.style.body[key]);
                            }); 
                        }
                    }
                }
            }
        },
        // 获取所以用户可配置属性
        getAableOption: function() {
            return {
                global: [
                    {key: "separateLine", label: "显示分割线", inputType:"checkbox", type: 0, default: false},
                    {key: "borderColor", label: "分割线颜色", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"},
                    {key: "lineCount", label: "分行显示", inputType:"number", type: 0, default: 1},
                    {key: "background", label: "背景", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"}
                ],
                head: [
                    {key: "color", label: "字体颜色", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"},
                    {key: "fontSize", label: "字体大小", inputType:"text", type: 1, default: "16px"}
                ],
                body: [
                    {key: "color", label: "字体颜色", inputType:"color", type: 1, default: "rgba(0, 0, 0, 1)"},
                    {key: "fontSize", label: "字体大小", inputType:"text", type: 1, default: "26px"}
                ]
            };
        }
    };
});