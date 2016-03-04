function insert_int($node, params) {
    return $node._nud({
        label: params.label,
        placeholder: params.msg,
        default: params.default,
        min: params.min,
        max: params.max,
        step: params.step,
        help: params.help,
        type: "int"
    });
}

function insert_float($node, params) {
    return $node._nud({
        label: params.label,
        placeholder: params.msg,
        default: params.default,
        min: params.min,
        max: params.max,
        step: params.step,
        help: params.help,
        type: "float"
    });
}

function insert_str($node, params) {
    return $node._input({
        label: params.label,
        placeholder: params.msg,
        default: params.default,
        help: params.help,
        replace: params.replace
    });
}

function insert_str_multi($node, params) {
    return $node._input_multi({
        label: params.label,
        placeholder: params.msg,
        default: params.default,
        help: params.help,
        replace: params.replace
    });
}

function insert_combo($node, params) {
    return $node._dropdown({
        label: params.label,
        placeholder: params.msg,
        default: params.default,
        data: params.options,
        data_map: params.options_map,
        help: params.help
    });
}

function insert_bool($node, params) {
    return $node._toggle({
        label: params.label,
        default: params.default,
        help: params.help
    });
}

function insert_color($node, params) {
    return $node._color({
        label: params.label,
        default: params.default,
        help: params.help
    });
}

function insert_multi($node, params) {
    return $node._multi({
        label: params.label,
        default: params.default,
        controls: params.controls,
        help: params.help
    });
}

var insertFuncs = {
    "int": insert_int,
    "float": insert_float,
    "str": insert_str,
    "combo": insert_combo,
    "bool": insert_bool,
    "color": insert_color,
    "str_multi": insert_str_multi,
    "multi": insert_multi,
    "multi_tuple": insert_multi
}

var _divider = '<div class="ui hidden divider short"></div>';

$.fn._multi = function(config) {
    var $node = $(this);
    var id = $node.attr('id');

    $node.val = function(value){
        var cfg = $node.data().config;
        if(value===undefined){
            var res = [];
            $.each(cfg._controls, function(i,v){
                res.push(v.val());
            });
            return res;
        }
        else {
            if(cfg.dyn){
                $.each(cfg._controls, function(i,v){
                    v.remove();
                });
                cfg._controls = [];
                $.each(value, function(i,v){
                    var $n = $node.add();
                    $n.val(v);
                });
            }
            else{
                $.each(value, function(i,v){
                    if(i < cfg._controls.length){
                        cfg._controls[i].val(v);
                    }
                    else{
                        return false;
                    }
                });
            }
        }
    }

    $node.__insertItem = function(v,i){
        if(i===undefined) i = config._controls.length;
        v.id = id + "_" + i;
        var $n = insertFuncs[v.type]($('<div class="item" style="margin-bottom: 0.5em;" id="' + id + '_' + i + '"/>'), v);
        $node.find("#" + id + "_list").append($n);
        config._controls.push($n);
        return $n;
    }

    $node.add = function(){
        var cfg = $node.data().config;
        return $node.__insertItem(cfg.controls);
    }

    $node.remove = function(){
        var cfg = $node.data().config;
        if(cfg._controls.length > 1){
            var $n = cfg._controls.pop();
            $n.remove();
        }
    }

    if (config) {
        var def = 'default' in config && config.default != null;
        if (!def) config.default = [];

        $node.data("config", config);

        config.dyn = !$.isArray(config.controls);

        var html = '\
            <div class="ui" id="@id_grid">\
                <div class="ui input">\
                    <div class="ui label large">@label</div>\
                    @addbtn\
                </div>\
                <div class="ui list" id="@id_list" style="margin-left: 2rem;">\
                </div>\
            </div>\
            ';

        var addbtn = '\
        <div class="ui icon buttons">\
            <button class="ui compact icon button" id="@id_minus" tabindex="-1"><i class="minus icon"></i></button>\
            <button class="ui compact icon button" id="@id_plus" tabindex="-1"><i class="plus icon"></i></button>\
        </div>\
        '

        html = strReplace(html, "@addbtn", config.dyn ? addbtn : "");
        html = strReplace(html, "@label", config.label + ":");
        html = strReplace(html, "@id", $node.attr('id'));


        $node.html(html);
        $node.addToolTip(config.help);
        config._controls = [];


        if(config.dyn){
            $node.__insertItem(config.controls);
            $node.find("#" + id + "_plus").click(function(){$node.add();});
            $node.find("#" + id + "_minus").click(function(){$node.remove();});
        }
        else{
            $.each(config.controls, function(i,v){
                $node.__insertItem(v, i);
            });
        }


        if (def) {
            console.log(config.default);
            $node.val(config.default);
        }
    }

    return $node;
};


$.fn.param_loader = function(config) {
    var $node = $(this);
    var id = $node.attr('id');
    var _onChanged = null;
    var options = {};

    $node._onSaveClick = null;

    function showParams($n, params, run) {
        var cfg = $node.data().config;
        cfg.control_map = {};
        cfg.run_map = {};
        $n.empty();

        //$n.append(_divider);
        $n.append('<div class="ui styled accordion" id="' + id + '_view"></div>');
        var $accordion = $n.children("#" + id + "_view");

        var _html = '\
            <div class="title" id="@id_@group_title">\
                <i class="dropdown icon"></i> @group\
            </div>\
            <div class="content ui list" id="@id_@group_content"></div>\
        ';

        var paramMap = {
            "Basic": []
        };

        if (params.length > 0) {
            $.each(params, function(i, v) {
                $c = $('<div id="' + v.id + '"></div>');
                $c.addClass("ui_input");
                $c.addClass("item");
                if (!v.group)
                    v.group = "Basic";
                if (!(v.group in paramMap)) paramMap[v.group] = []
                paramMap[v.group].push($c);
                cfg.control_map[v.id] = insertFuncs[v.type]($c, v);
            });
        } else {
            paramMap["Basic"].push($('<div class="ui segment">There are no modifiabled parameters to be set.</div>'))
        }
        $.each(paramMap, function(k, v) {
            var html = strReplace(_html, "@id", id)
            html = strReplace(html, "@group", k)
            $accordion.append(html);
            $section = $accordion.children("#" + id + "_" + k + "_content");
            $.each(v, function(i, p) {
                $section.append(p);
            });
        });

        if (run) {
            var run_html = '\
                <div class="title" id="@id_run_title">\
                    <i class="dropdown icon"></i> Run Parameters\
                </div>\
                <div class="active content ui list" id="@id_run_content"></div>\
            ';
            run_html = strReplace(run_html, "@id", id)
            var run_controls = [];
            $.each(run, function(i, v) {
                $c = $('<div id="' + v.id + '"></div>');
                $c.addClass("ui_input");
                $c.addClass("item");
                run_controls.push($c);
                cfg.run_map[v.id] = insertFuncs[v.type]($c, v);
            });
            $accordion.append(run_html);
            $run = $accordion.children("#" + id + "_run_content");
            $.each(run_controls, function(i, $c) {
                //$adv.append($(_divider));
                $run.append($c);
            });
        }

        $n.children('#' + id + "_view").accordion({
            exclusive: false
        }).accordion("open", 0);
    }

    function reloadPresetCombo() {
        var cfg = $node.data().config;
        if (cfg) {
            var val = $node.val().id;
            var p = {};
            if (val in config.presets) {
                p = config.presets[val];
            }

            if (cfg.presetCombo) {
                cfg.presetCombo.load(p);
            }
        }
    }

    function optionChanged(val) {
        var cfg = $node.data().config;
        $node.find("#" + id + "_param_save").removeClass("disabled");
        $node.find("#" + id + "_param_delete").addClass("disabled");
        if (cfg.curVal != val && cfg.data[val]) {
            showParams($("#" + id + "_params"), cfg.data[val].params, cfg.run);

            $desc = $node.children("#" + id + "_desc");
            if (cfg.data[val].desc) {
                $desc.html('<p>' + cfg.data[val].desc + '</p>');
                $desc.show();
            } else {
                $desc.empty();
                $desc.hide();
            }

            reloadPresetCombo();

            cfg.curVal = val;
            if (_onChanged) _onChanged(val);
        }
    }

    function presetChanged(val) {
        var cfg = $node.data().config;
        var cur = $node.val();
        if (cur.id in cfg.presets && cfg.presets[cur.id][val]) {
            $node.val(cfg.presets[cur.id][val].data);
            $node.find("#" + id + "_param_delete").removeClass("disabled");
        }
    }

    $node.presetVal = function(value){
        var cfg = $node.data().config;
        var cur = $node.val();
        if(value === undefined){
            var v = cfg.presetCombo.val();
            if(v !== null){
                return cfg.presets[cur.id][v];
            }
            else{
                return null;
            }
        }
        else{
            var p = cfg.presets[cur.id];
            var id = -1;
            $.each(p, function(i,v){
                if(value == v.name){
                    id = i;
                    return false;
                }
            });

            if(id >= 0){
                cfg.presetCombo.val(id);
            }
        }
    }

    $node.val = function(value) {
        if (value === undefined) {
            var cfg = $node.data().config;
            var config = {};
            $.each(cfg.control_map, function(k, v) {
                config[k] = v.val();
            });
            var run = {};
            $.each(cfg.run_map, function(k, v) {
                run[k] = v.val();
            });
            var idval = $node.children("#" + id + "_combo")._dropdown().val();
            if (cfg.disable_option) idval = cfg.data[0].id;
            var result = {
                id: idval,
                config: config
            };
            if (Object.keys(run).length > 0) result.run = run
            return result;
        } else {
            var cfg = $node.data().config;
            $node.children("#" + id + "_combo")._dropdown().val(value.id)

            function setParams() {
                if (value.config) {
                    $.each(value.config, function(k, v) {
                        if (k in cfg.control_map) {
                            cfg.control_map[k].val(v);
                        }
                    });
                }
                if (value.run) {
                    $.each(value.run, function(k, v) {
                        if (k in cfg.run_map) {
                            cfg.run_map[k].val(v);
                        }
                    });
                }
            }
            setTimeout(setParams, 0);
        }
    };

    $node.reloadPresets = function(data) {
        var cfg = $node.data().config;
        cfg.data = data;
        $.each(cfg.data, function(k, v) {
            options[k] = {
                name: v.display,
                desc: v.desc
            };
            if ("presets" in v) {
                cfg.presets[k] = [];
                $.each(v.presets, function(i, v) {
                    cfg.presets[k].push({
                        name: v.display,
                        desc: v.desc,
                        data: v
                    });
                })
            }
        });

        reloadPresetCombo();
    }

    if (config) {
        config.control_map = {};
        config.run_map = {};
        config.curVal = config.default;
        $node.data("config", config);

        $node._onSaveClick = config.onSaveClick;
        $node._onDeleteClick = config.onDeleteClick;

        $node.empty();
        $node.append('<div class="paramCombo" id="' + id + '_combo"></div>\
                      <button class="ui disabled icon button" id="' + id + '_param_save" tabindex="-1"><i class="save icon"></i></button>\
                      <div class="paramCombo" id="' + id + '_preset_combo"></div>\
                      <button class="ui disabled icon button" id="' + id + '_param_delete" tabindex="-1"><i class="trash icon"></i></button>\
                      <div class="ui inverted segment" id="' + id + '_desc"></div>\
                      <div id="' + id + '_params" class="params_box"></div>\
                    ');

        //<button class="ui icon button presetLoadBtn" id="' + id + '_param_open"><i class="Folder Open Outline icon"></i></button>\

        $node.children("#" + id + "_desc").hide();
        config.presets = {};
        if (!config.data) config.data = {};

        $node.reloadPresets(config.data);

        $node.children("#" + id + "_combo")._dropdown({
            data: options,
            label: config.label,
            placeholder: config.placeholder,
            default: config.default,
            onChange: optionChanged
        });

        config.presetCombo = $node.children("#" + id + "_preset_combo")._dropdown({
            data: null,
            label: null,
            placeholder: "Select Preset",
            default: null,
            onChange: presetChanged
        });

        $node.find("#" + id + "_param_save").click(function() {
            if ($node._onSaveClick) $node._onSaveClick($node);
        })

        $node.find("#" + id + "_param_delete").click(function() {
            var val = config.presetCombo.val();
            var cfg = $node.data().config;
            var cur = $node.val();
            if (cur.id in cfg.presets && cfg.presets[cur.id][val]) {
                if ($node._onDeleteClick) $node._onDeleteClick($node, cfg.presets[cur.id][val]);
            }

        })

        $node.find("#" + id + "_param_delete").addClass('disabled');

        if (config.disable_option) {
            $node.children("#" + id + "_combo").hide();
            $node.children("#" + id + "_param_save").hide();
            $node.children("#" + id + "_param_delete").hide();
            $node.children("#" + id + "_preset_combo").hide();
            //setTimeout(function(){$node.children("#" + id + "_combo").hide();}, 5);
        }

        _onChanged = config.onChange;
    }

    return $node;
}

function genQueueFeedItem(item, num) {

    var html = "\
    <div class='item grabber' num='@num'>\
        <div class='right floated content'>\
            <button class='ui button q_edit'><i class='pencil icon'></i>Edit</button>\
            <button class='ui red button q_remove'><i class='remove icon'></i>Remove</button>\
        </div>\
        <i class='play icon'></i>\
        <div class='content'>\
            <div class='header'>@name</div>\
            <div class='description'>@desc</div>\
        </div>\
    </div>\
    ";

    html = strReplace(html, "@num", num);
    var name = _names.anim[item.id]
    html = strReplace(html, "@name", name);
    html = strReplace(html, "@desc", item.desc);
    return html;
}

function buildQueueFeed(items) {
    var html = '';
    $.each(items, function(i, v) {
        html += genQueueFeedItem(v, i);
    })
    return html;
}

function genFeedItem(item) {
    var html = "\
    <div class='event'>\
        <div class='content'>\
            <div class='summary'>@summary</div>\
        </div>\
    </div>\
    ";

    // <div class='date'>@date</div>\

    // html = strReplace(html, "@date", item.timestamp);
    html = strReplace(html, "@summary", item.timestamp + ": " + item.msg);
    return html;
}

function buildFeed(items) {
    var html = '';
    $.each(items, function(i, v) {
        html += genFeedItem(v);
    })
    return html;
}

function genQSFeedItem(item, num) {

    var html = "\
    <div class='item grabber' num='@num'>\
        <div class='right floated content'>\
            <button class='ui button q_edit'><i class='pencil icon'></i>Edit</button>\
            <button class='ui red button q_remove'><i class='remove icon'></i>Remove</button>\
        </div>\
        <i class='@type icon'></i>\
        <div class='content'>\
            <div class='header'>@name</div>\
            <div class='description'>@desc</div>\
        </div>\
    </div>\
    ";

    var type = "";
    if(item.qs_type == "queue") type = "film";
    else if(item.qs_type == "anim") type = "play"
    html = strReplace(html, "@type", type);
    html = strReplace(html, "@num", num);

    html = strReplace(html, "@name", item.name);
    html = strReplace(html, "@desc", item.desc);
    return html;
}

function buildQSFeed(items) {
    var html = '';
    $.each(items, function(i, v) {
        html += genQSFeedItem(v, i);
    })
    return html;
}
