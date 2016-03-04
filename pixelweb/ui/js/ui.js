$.fn.addToolTip = function(text){
    var $node = $(this);
    $node.attr("data-content",text);
    $node.attr("data-variation","very wide inverted large");
    $node.attr("data-position", "top left");
    $node.popup({delay:{show:500, hide:0}, duration:100});
}

$.fn._numeric = function(type){
    if(type===undefined) type = 'int'

    var $node = $(this);
    $node.data("last", $node.val());
    $node.data("selected", false);
    var _selected = false;
    var reg = "^-?\d$";
    if(type=="float") reg = "^-?\d+(.\d)$";

    function replace(event) {
        if(!$node.data("selected")){
            var val = $node.val();
            if(type=="float"){
                if(val.match("^-?[0-9]*$"))
                    $node.val(val + ".0");
                else if(val.match("^-?[0-9]+(.)$"))
                    $node.val(val + "0");
                else if(!val.match("^-?[0-9]+(.[0-9]*)$"))
                    $node.val($node.data("last"))
                else
                    $node.data("last", $node.val());
            }
            else {
                if(!val.match("^-?[0-9]*$"))
                    $node.val($node.data("last"))
                else
                    $node.data("last", $node.val());
            }
        }
        $node.data("selected", false);
    }
    // $node.select(function(event){
    //     $node.data("selected", true);
    //     console.log("select");
    // });
    $node.on('input', function(){setTimeout(replace, 10)});

    // $node.focusout(replace);
}

$.fn._dropdown = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    var getNameDesc = function(v){
        var name = "";
        var desc = null;
        if(typeof(v) == "object"){
            name = v.name;
            desc = v.desc;
        }
        else{
            name = v;
        }

        return [name, desc]
    }

    var display_sort = function(a, b){
        if(a.display < b.display) return -1
        else if(a.display > b.display) return 1;
        else return 0;
    }

    $node.load = function(data) {
        var cfg = $node.data().config;
        $node.children(".dropdown").dropdown("restore defaults");
        $node.children(".dropdown").children(".default").html(cfg.placeholder);
        $menu = $node.find(".menu");
        $menu.empty();

        var id_list = [];
        $.each(data, function(k, v) {
            var name = getNameDesc(v)[0];
            id_list.push({key: k, display: name});
        });

        id_list.sort(display_sort);

        $.each(id_list, function(i, v) {
            v = v.key;
            var nd = getNameDesc(data[v]);
            var name = nd[0];
            var desc = nd[1];

            $item = $('<div class="item" data-value="' + v + '">' + name + '</div>');
            $menu.append($item);
            if(desc){
                $item.addToolTip(desc);
            }
        });
        _doSetup();
    };

    $node.add = function(value, text){
        var cfg = $node.data().config;
        cfg.data[value] = text;
        $node.load(cfg.data);
    };

    $node.val = function(value) {
        if(! $node.data()) return null;
        var cfg = $node.data().config;
        if (value != null) {
            setTimeout(function(){
                if(cfg.data_map) {
                    var val = JSON.stringify(value);
                    $.each(cfg.data_map, function(i,v){
                        if(val == JSON.stringify(v)) {
                            value = i;
                            return false;
                        }
                    })
                }
                value = value.toString();
                return $node.children(".dropdown").dropdown("set selected", value);
            }, 10);
        } else {
            var v = $node.children(".dropdown").dropdown("get value");
            if(typeof v == "object") v = null;
            if(cfg && cfg.data_map) {
                v = cfg.data_map[v];
                if(!v) v = null;
            }
            else {
                if(v=="") v=null;
                else {
                    i = parseInt(v)
                    if(!isNaN(i))
                        v = i;
                }
            }
            return v;
        }
    };

    $node.setDefault = function() {
        setTimeout(function(){
            var cfg = $node.data().config;
            if(cfg.default != null){
                 $node.val(cfg.default);
             }
            else $node.children(".dropdown").dropdown("restore defaults");
        }, 5);

    };

    function onChange(){
        var cfg = $node.data().config;
        var val = $node.val();
        if(!isNU(val) && cfg.onChange)
            cfg.onChange(val, $node.attr('id'));
    }

    function _doSetup(){
        $node.children(".dropdown").dropdown({
            transition: 'drop',
            // fullTextSearch: true,
            onChange: onChange
        });
    }

    if (config) {
        if(!('default' in config)) config.default = "";
        if(!('data' in config) || (config.data == null)) config.data = {};
        if(!config.placeholder) config.placeholder = "Choose...";

        $node.data("config", config);

        var html = '\
            <div class="ui label large">@label</div>\
            <div class="ui selection dropdown">\
                <i class="dropdown icon"></i>\
                <div class="default text">@placeholder</div>\
                <div class="menu"></div>\
            </div>\
        ';
        html = strReplace(html, "@placeholder", config.placeholder);
        html = strReplace(html, "@label", config.label)

        $node.html(html);
        if(config.label == null) $node.children(".label").hide();


        $node.load(config.data);
        _doSetup();
        $node.addToolTip(config.help);

        $node.setDefault();
    }

    return $node;
}

$.fn._nud = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    $node.val = function(value) {
        var $input = $node.find("#" + id + "_input");
        var cfg = $node.data().config;

        function rangeError(state) {
            var dir = "";
            $error = $node.find("#" + id + "_error");
            if(state){
                //$($node.children(".ui.input")).addClass("error");
                var msg = "Value must be in range: " + cfg.min + " to " + cfg.max;
                if(isNU(cfg.max)) msg = "Value must be >= " + (cfg.min);
                if(isNU(cfg.min)) msg = "Value must be <= " + (cfg.max);
                $node.find("#" + id + "_err_msg").text(msg);
                dir = "in";
            }
            else
            {
                //$($node.children(".ui.input")).removeClass("error");
                if(!$error.hasClass("hidden")) dir = "out";
            }

            if(dir != "") $error.transition('scale ' + dir);
        }

        if (value != undefined) {
            rangeError(false);
            // if (value != "") value = Math.floor(value);
            if(!isNU(cfg.max) && value > cfg.max) {
                value = cfg.max;
                rangeError(true);
            }
            else if(!isNU(cfg.min) && value < cfg.min) {
                value = cfg.min;
                rangeError(true);
            }
            if(cfg.type == "float") value = value.toFixed(2);
            return $input.val(value);
        } else {
            var v = $input.val();
            var val = null;
            if (v=="") val = null;
            else if (cfg.type == "float") val = parseFloat(v);
            else val = parseInt(v);
            return val;
        }
    };

    $node.add = function(value) {
        var v = $node.val();
        v += value;
        $node.val(v);
        return value;
    };

    $node.up = function() {
        var cfg = $node.data().config;
        $node.add(cfg.step);
    };

    $node.down = function() {
        var cfg = $node.data().config;
        $node.add(cfg.step * -1);
    };

    $node.undo = function() {
        var cfg = $node.data().config;
        $node.val(cfg.default);
    };

    function onKey(){
        $node.val($node.val());
    }

    if (config) {
        var def = 'default' in config && config.default != null;
        if (!def) config.default = "";
        if (!config.step) config.step = 1;
        if (!('min' in config)) config.min = null;
        if (!('max' in config)) config.max = null;
        if (!config.placeholder) config.placeholder = "";

        $node.data("config", config);

        var html = '\
            <div class="ui small error message hidden" id="@id_error"><i class="close icon"></i><p id="@id_err_msg"><p></div>\
            <div>\
                <div class="ui labeled @action input">\
                    <div class="ui label">@label</div>\
                    <input type="text" style="" id="@id_input" placeholder="@placeholder">\
                    @default\
                </div>\
                <div class="ui icon buttons">\
                    <button class="ui compact icon button" id="@id_minus" tabindex="-1"><i class="minus icon"></i></button>\
                    <button class="ui compact icon button" id="@id_plus" tabindex="-1"><i class="plus icon"></i></button>\
                </div>\
            </div>\
            ';
        html = strReplace(html, "@action", "action");
        html = strReplace(html, "@default", '<button class="ui icon button" tabindex="-1" id="@id_undo"><i class="undo icon"></i></button>');

        html = strReplace(html, "@label", config.label);
        html = strReplace(html, "@placeholder", config.placeholder);
        html = strReplace(html, "@id", $node.attr('id'));

        $node.html(html);
        $node.find("#" + id + "_minus").click($node.down);
        $node.find("#" + id + "_plus").click($node.up);
        $node.find("#" + id + "_undo").click($node.undo);


        //$node.find("#" + id + "_input").keyup(onKey);

        $node.find("#" + id + "_error")
          .on('click', function() {
            $(this).transition('scale out');
          });

        $node.addToolTip(config.help);

        if (def) {
            $node.val(config.default);
        }

        $node.find("#" + id + "_input")._numeric(config.type);
        //$node.find("#" + id + "_input").keyup(onKey);
    }

    return $node;
};

$.fn._toggle = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    $node.val = function(value){
        if(value != undefined){
            return $node.checkbox(value ? "check" : "uncheck");
        }
        else{
            return $node.checkbox("is checked");
        }
    };

    if (config) {
        var def = 'default' in config && config.default != null;
        if (!def) config.default = false;
        if(!(config.help)) config.help = "";

        $node.data("config", config);

        $node.addClass("ui toggle checkbox");

        var html = '\
            <label>@label</label>\
            <input type="checkbox">\
            ';
        html = strReplace(html, "@label", config.label);

        $node.html(html);

        $node.checkbox();
        $node.addToolTip(config.help);

        $node.val(config.default);
    }

    return $node;
}

$.fn._textReplacer = function(rep) {
    var $node = $(this);
    function replace() {
        var val = $node.val();
        $.each(rep, function(k, v){
            val = val.split(k).join(v);
        });
        $node.val(val);
    }
    //$node.keyup(replace);
    $node.change(replace);
    //$node.focusout(replace);
}

$.fn._input = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    $node.val = function(value) {
        var $input = $node.find("#" + id + "_input");
        var cfg = $node.data().config;

        if (value != undefined) {
            return $input.val(value);
        } else {
            var val = $input.val();
            if(val == "" && cfg.default === null)
                val = null;

            return val;
        }
    };

    $node.undo = function() {
        var cfg = $node.data().config;
        $node.val(cfg.default);
    };

    if (config) {
        if(config.default == undefined) config.default = null;
        if (!config.placeholder) config.placeholder = "";

        $node.data("config", config);

        var html = '\
            <div class="ui labeled @action input">\
                <div class="ui label">@label</div>\
                <input type="text" class="str_input" style="" id="@id_input" placeholder="@placeholder">\
                <button class="ui icon button" tabindex="-1" id="@id_undo"><i class="undo icon"></i></button>\
            </div>\
            ';
        html = strReplace(html, "@action", "action");
        html = strReplace(html, "@label", config.label);
        html = strReplace(html, "@placeholder", config.placeholder);
        html = strReplace(html, "@id", $node.attr('id'));

        $node.html(html);
        $node.find("#" + id + "_undo").click($node.undo);
        if(config.replace){
            $node.find("#" + id + "_input")._textReplacer(config.replace);
        }
        $node.addToolTip(config.help);

        $node.val(config.default);
    }

    return $node;
};

$.fn._input_multi = function(config) {
    var $node = $(this);
    var id = $node.attr('id');
    var _divider = '<div class="ui hidden divider tiny"></div>';
    $node.val = function(value) {
        var $input = $node.find("#" + id + "_input");
        var cfg = $node.data().config;

        if (value != undefined) {
            $.each(cfg.inputs, function(i,input){
                input.remove();
            });
            cfg.inputs = [];
            $.each(value, function(i,val){
                $node.add(val);
            });
        } else {
            var result = [];
            $.each(cfg.inputs, function(i,v){
                result.push(v.find("#" + id + "_input")[0].value);
            });
            return result;
        }
    };

    $node.add = function(value) {
        if(!value) value = "";
        var cfg = $node.data().config;
        var html = '\
            <div class="ui action fluid input multi_input" id="@id_@guid">\
                <input type="text" class="multi_input_text" id="@id_input" placeholder="@placeholder">\
                <button class="ui icon button" tabindex="-1" id="@id_input_multi_remove"><i class="minus icon"></i></button>\
            </div>\
            ';

        html = strReplace(html, "@placeholder", cfg.placeholder);
        html = strReplace(html, "@id", $node.attr('id'));
        var _guid = guid();
        html = strReplace(html, "@guid", _guid);
        $input = $(html);
        $node.append($input);
        cfg.inputs.push($input);

        $remove = $input.find("#" + id + "_input_multi_remove");
        $remove.click(function(){
            var index = -1;
            $.each(cfg.inputs, function(i, v){
                if(v.attr("id") == id + "_" + _guid)
                    index = i;
            });

            if (index >= 0) {
                console.log(index);
                cfg.inputs[index].remove();
                cfg.inputs.splice( index, 1 );
            }
        });

        $input.find("#" + id + "_input")[0].value = value;
        if(cfg.replace){
            $($input.find("#" + id + "_input")[0])._textReplacer(cfg.replace);
        }
    };

    if (config) {
        if(!config.default) config.default = [""]
        if (!config.placeholder) config.placeholder = "";
        config.inputs = [];

        $node.data("config", config);

        var html = '\
            <div class="ui labeled @action input">\
                <div class="ui label">@label</div>\
                <button class="ui icon button" tabindex="-1" id="@id_input_multi_add"><i class="plus icon"></i></button>\
            </div>\
            ';
        html = strReplace(html, "@action", "action");
        html = strReplace(html, "@label", config.label);
        html = strReplace(html, "@placeholder", config.placeholder);
        html = strReplace(html, "@id", $node.attr('id'));

        //<input type="text" style="" id="@id_input" placeholder="@placeholder">\

        $node.html(html);
        $node.find("#" + id + "_input_multi_add").click(function(){$node.add();});

        $node.addToolTip(config.help);

        if (config.default) {
            $node.val(config.default);
        }
    }

    return $node;
};

$.fn._color = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    $node.val = function(value){
        if(value != undefined){
            var c = "rgb(" + value[0] + "," + value[1] + "," + value[2] + ")";
            return $($node.children("#" + id + "_color")[0]).spectrum("set", c);
        }
        else{
            var c = $($node.children("#" + id + "_color")[0]).spectrum("get");
            c = c.toRgb();
            return [c.r, c.g, c.b]
        }
    };

    function onChange(color){
        var cfg = $node.data().config;
        if(cfg.onChange) cfg.onChange(color);
    }

    if (config) {
        var def = 'default' in config && config.default != null;
        if (!def) config.default = [0,0,0];
        if(!(config.help)) config.help = "";

        $node.data("config", config);

        $node.addClass("ui labeled input");

        var html = '\
                <div class="ui label">@label</div>\
                <input type="text" id="@id_color">\
            ';
        html = strReplace(html, "@label", config.label);
        html = strReplace(html, "@id", id);

        $node.html(html);

        $($node.children("#" + id + "_color")[0]).spectrum({
            // color: "#f00"
            preferredFormat: "rgb",
            // showInitial: true,
            showInput: true,
            showButtons: false,
            change: onChange,
            // flat: true,
        });
        $node.addToolTip(config.help);

        $node.val(config.default);
    }

    return $node;
}
