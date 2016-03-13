var _curConfig = null;

var _configs = {};
var _names = {};

var driverPickers = [];

var $controller = null;

var _animType = null;
var _animRun = null;
var $anims = null;

var $server_config = null;

var _animEditMode = null;
_animEditConfig = null;

var $queueCombo = null;
var _curQueue = [];
var _queues = {};

var _curQS = [];
var _qselects = {};

function getContType(){
    if(_configs.controller[$controller.val().id])
        return _configs.controller[$controller.val().id].control_type;
    else {
        return null;
    }
}

function clearDriverChoosers() {
    $("#driver").empty();
    driverPickers = [];
}

function addDriverChooser(params) {
    var id = "driver_" + driverPickers.length;
    $("#driver").append('<div id="' + id + '" class="param_loader"></div>');
    // $("#driver").append('<div class="ui hidden divider short"></div>');
    var $d = $("#driver").children("#" + id);
    $d = $d.param_loader({
        data: _configs.driver,
        label: "Driver",
        placeholder: "Select Driver...",
        onSaveClick: function($node) {
            showPresetSaveModal("driver", $node);
        },
        onDeleteClick: function($node, preset) {
                showPresetDeleteModal("driver", preset, $node);
            }
            // default: "visualizer"
    });
    if (params) {
        setTimeout(function() {
            $d.val(params);
        }, 5);
    }

    driverPickers.push($d);
    if (driverPickers.length > 1) $("#btnRemoveDriver").removeClass('disabled');
    else $("#btnRemoveDriver").addClass('disabled');
}

function removeDriverChooser() {
    if (driverPickers.length > 1) {
        var $d = driverPickers.pop();
        $d.remove();
    }

    if (driverPickers.length > 1) $("#btnRemoveDriver").removeClass('disabled');
    else $("#btnRemoveDriver").addClass('disabled');
}

function loadAnimOptions(data, run) {
    _enable("#addQueue", false);
    _enable("#addQSAnim", false);
    _enable("#startAnim", false);
    $anims = $("#anims").param_loader({
        data: data,
        run: run,
        label: "Animation",
        placeholder: "Select Animation...",
        onSaveClick: function($node) {
            showPresetSaveModal("anim", $node);
        },
        onDeleteClick: function($node, preset) {
            showPresetDeleteModal("anim", preset, $node);
        },
        onChange: function() {
            var c = getAnimConfig();
            _enable("#addQueue", (c != null));
            _enable("#addQSAnim", (c != null));
            _enable("#startAnim", (c != null));
        }
    });
}

function filterAnims(val) {
    var data = $controller.data('config').data;
    _animType = null;
    var anims = [];
    if (val in data) {
        _animType = data[val].control_type;
        anims = _configs.anim[_animType];
    }

    loadAnimOptions(anims, _animRun);
}

function getCurrentConfig() {
    var drivers = [];
    $.each(driverPickers, function(i, d) {
        drivers.push(d.val());
    });
    var cont = $controller.val();

    return {
        drivers: drivers,
        controller: cont
    };
}

function getAnimConfig() {
    var config = $anims.val();
    if (config.id == null) config = null;
    return config;
}

function displayCurConfig() {
    if (_curConfig.driver) {
        clearDriverChoosers();
        $.each(_curConfig.driver, function(i, d) {
            addDriverChooser(d);
        });
    }
    if (_curConfig.controller) {
        $controller.val(_curConfig.controller);
    }
}

function showBPError(msg) {
    $("#bpErrorMsg").html(msg);
    doBasicModal("#BPError");
}

function doSaveServerConfig() {
    var config = $server_config.val();
    saveServerConfig(config.config, function(result) {
        doBasicModal("#restartServerModal");
    });
}

function showServerConfig() {
    $("#serverConfig").sidebar('toggle');
}

function setLoading(id, state) {
    if (state || state === undefined) {
        $(id).addClass('loading');
    } else {
        $(id).removeClass('loading');
    }
}

function reloadPresets() {
    $controller.reloadPresets(_configs.controller);
    $.each(driverPickers, function(i, $d) {
        $d.reloadPresets(_configs.driver);
    });
    var data = $controller.data('config').data;
    var val = $controller.val().id;
    var anims = [];
    if (val in data) {
        anims = _configs.anim[data[val].control_type];
        $anims.reloadPresets(anims);
    }

}

function showPresetSaveModal(type, $node) {
    var curVal = $node.presetVal();
    var name = '';
    var desc = '';
    if(curVal){
        name = curVal.name;
        desc = curVal.desc;
    }
    $("#presetSaveBtn").removeClass('loading');
    $("#savePresetName").val(name);
    $("#savePresetDesc").val(desc);
    $("#savePresetModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            $("#presetSaveBtn").addClass('loading');
            var name = $("#savePresetName").val();
            var desc = $("#savePresetDesc").val();
            var data = $node.val();
            if (type == "anim") {
                data.type = _animType;
            }
            data.display = name;
            savePreset(type, name, desc, data, function() {
                pushPreset(type, data);
                reloadPresets();
                $node.presetVal(name);
                $("#savePresetModal").modal('hide');
            });
        },
        onDeny: function() {}
    }).modal('show');
}

function showSaveQSModal() {
    var pre = $qsCombo.val();
    var type = getContType();

    $("#saveQSName").val('');
    $("#saveQSDesc").val('');
    if(pre){
        $("#saveQSName").val(_qselects[pre].name);
        $("#saveQSDesc").val(_qselects[pre].desc);
    }
    $("#saveQSModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            var name = $("#saveQSName").val();
            var desc = $("#saveQSDesc").val();

            var qs = {
                "name": name,
                "desc": desc,
                "data": _curQS,
                "type": type
            }
            saveQS(name, qs, function() {
                _qselects[name] = qs;
                reloadQS();
                $qsCombo.val(name);
                $("#saveQSModal").modal('hide');
            });
        },
        onDeny: function() {}
    }).modal('show');
}

function showSaveQueueModal() {
    var pre = $queueCombo.val();
    var type = getContType();

    $("#queueSaveBtn").removeClass('loading');
    $("#saveQueueName").val('');
    $("#saveQueueDesc").val('');
    if(pre){
        $("#saveQueueName").val(_queues[pre].name);
        $("#saveQueueDesc").val(_queues[pre].desc);
    }
    $("#saveQueueModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            $("#queueSaveBtn").addClass('loading');
            var name = $("#saveQueueName").val();
            var desc = $("#saveQueueDesc").val();

            var q = {
                "name": name,
                "desc": desc,
                "data": _curQueue,
                "type": type
            }

            saveQueue(name, q, function() {
                _queues[name] = q;
                reloadQueues();
                $queueCombo.val(name);
                $("#saveQueueModal").modal('hide');
            });
        },
        onDeny: function() {}
    }).modal('show');
}

function showQueueDeleteModal() {
    var name = $queueCombo.val();
    if(!name) return;
    var msg = "Are you sure you want to delete the following Queue? <b>" + name + "</b>";
    $("#deleteQueueMsg").html(msg);
    $("#deleteQueueModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            deleteQueue(name, function() {
                delete _queues[name];
                reloadQueues();
                $("#deleteQueueModal").modal('hide');
            });
        },
        onDeny: function() {}
    }).modal('show');
}

function showQSDeleteModal() {
    var name = $qsCombo.val();
    if(!name) return;
    var msg = "Are you sure you want to delete the following Quick Select? <b>" + name + "</b>";
    $("#deleteQSMsg").html(msg);
    $("#deleteQSModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            deleteQS(name, function() {
                delete _qselects[name];
                reloadQS();
                $("#deleteQSModal").modal('hide');
            });
        },
        onDeny: function() {}
    }).modal('show');
}

function reloadQueues(){
    var temp = {};
    var type = getContType();
    $.each(_queues, function(k,v){
        if(v.type == type) temp[k] = v;
    });
    $queueCombo.load(temp);
    $("#queue_delete").addClass('disabled');
}

function showPresetDeleteModal(type, preset, $node) {
    var id = $node.val().id;
    var p = findPreset(type, preset, id);
    if (p) {
        if (!p[1][p[0]].locked) {
            var msg = "Are you sure you want to delete the following preset? <b>" + preset.name + "</b>";
            $("#deletePresetMsg").html(msg);
            $("#deletePresetModal").modal({
                blurring: true,
                closable: false,
                dimmerSettings: _dimSettings,
                onApprove: function() {
                    deletePreset(type, preset.name, function() {
                        p[1].splice(p[0], 1);
                        reloadPresets();
                        $("#deletePresetModal").modal('hide');
                    });
                },
                onDeny: function() {}
            }).modal('show');
        } else {
            showWarning("Unable to Delete", "The selected preset is part of a pre-configred module and cannot be deleted.");
        }
    }
}

function showWarning(header, msg) {
    $("#warnHeader").html(header);
    $("#warnMsg").html(msg);
    $("#genericWarning").modal({
        blurring: true,
        closable: true,
        dimmerSettings: _dimSettings,
    }).modal('show');
}

function findPreset(t, p, id) {
    var c = _configs[t];
    if (t == "anim") {
        c = c[p.data.type];
    }

    if (c != undefined && id in c) {
        if (("presets") in c[id]) {
            $.each(c[id].presets, function(i, v) {
                if (v.display == p.data.display) {
                    index = i;
                    return false;
                }
            })
            if (index >= 0) {
                return [index, c[id].presets]
            }
        }
    }

    return null;
}

function pushPreset(t, v) {
    var c = _configs[t];
    if (t == "anim") {
        c = c[v.type];
    }
    if (c != undefined && v.id in c) {
        if (!(("presets") in c[v.id]))
            c[v.id].presets = [];

        var id = -1;
        $.each(c[v.id].presets, function(i,p){
            if(p.display == v.display){
                id = i;
                return false;
            }
        });
        if(id >= 0){
            c[v.id].presets[id] = v;
        }
        else{
            c[v.id].presets.push(v);
        }

    }
}

function loadConsoleStatus() {
    setLoading("#paneConsole", true);
    getStatus(function(result) {
        var html = buildFeed(result);
        $("#statusFeed").html(html);
        setLoading("#paneConsole", false);
    });
}

function updateQueueCount(){
    if(_curQueue.length > 0){
        $("#queueCount").html(_curQueue.length);
        $("#queueCount").removeClass("hidden");
    }
    else {
        $("#queueCount").addClass("hidden");
    }
}

function loadAnimQueue(config) {
    var isEdit = config != undefined;
    if(config)
        _animEditMode = config.type;
    else
        _animEditMode = null;

    _show("#saveQSQueueEdit", _animEditMode == "qs");
    _show("#cancelQSQueueEdit", _animEditMode == "qs");
    _show("#startQ", true);
    $("#startQ").html(isEdit ? "Test" : "Start");
    setLoading("#startQ", false);
    _show("#stopQ", true);
    setLoading("#stopQ", false);
    _show("#addQSQueue", !isEdit);

    _animEditConfig = config;
    if (_animEditMode) {
        _curQueue = config.config.data;
        $queueCombo.setDefault();
    }

    var q_sort = function(event, ui) {
        var num = 0;
        var temp = [];
        $.each($("#queueList").children(), function(i, v) {
            num = $(v).attr('num');
            temp.push(_curQueue[num]);
        });

        _curQueue = temp;
        if(_animEditConfig){_animEditConfig.config.data = _curQueue;}
        loadAnimQueue(_animEditConfig);
    };

    $("#queueList").empty();

    var html = "No animations! Go to the Animation pane and add some";
    if (_curQueue.length > 0) {
        html = buildQueueFeed(_curQueue);
        _enable("#startQ", true);
        _enable("#addQSQueue", true);
        _enable("#queue_save", true);
    } else {
        _enable("#startQ", false);
        _enable("#addQSQueue", false);
        _enable("#queue_save", false);
    }

    $("#queueList").html(html);

    if (_curQueue.length > 0) {
        $("#queueList").sortable({
            update: q_sort,
            placeholder: "sort_placeholder"
        });

        $("#queueList .q_edit").click(function() {
            var n = $(this).closest('.item').attr('num');
            activatePane("Anim", {
                "config": _curQueue[n],
                "index": n,
                "type": "queue",
                "sub": _animEditConfig
            });
        });

        $("#queueList .q_remove").click(function() {
            var n = $(this).closest('.item').attr('num');
            _curQueue.splice(n, 1);
            loadAnimQueue(_animEditConfig);
        });
    }

    updateQueueCount();
}

function loadAnim(config) {
    var isEdit = config != undefined;
    if(config)
        _animEditMode = config.type;
    else
        _animEditMode = null;

    _show("#saveQSAnimEdit", _animEditMode == "qs");
    _show("#saveQueueEdit", _animEditMode == "queue");
    _show("#cancelAnimEdit", _animEditMode == "qs" || _animEditMode == "queue");
    _show("#addQueue", !isEdit);
    _show("#addQSAnim", !isEdit);
    _show("#startAnim", true);
    $("#startAnim").html(isEdit ? "Test" : "Start");
    setLoading("#startAnim", false);
    _show("#stopAnim", true);
    setLoading("#stopAnim", false);

    _animEditConfig = config;
    if (_animEditMode) {
        $anims.val(config.config);
    }
}

var _paneLoadFuncs = {
    "Console": loadConsoleStatus,
    "Queue": loadAnimQueue,
    "Anim": loadAnim,
    "QS": loadQSPane,
}

function activatePane(id, option) {
    var menu = "mnu" + id;
    var pane = "pane" + id;
    $('.side_menu').removeClass('active');
    $('#' + menu).addClass('active');
    $('.ui_pane').hide();

    if (id in _paneLoadFuncs) {
        _paneLoadFuncs[id](option);
    }

    $('#' + pane).fadeIn();
}

function handleSideMenu() {
    var $m = $(this);
    if($m.hasClass('disabled')) return;
    var id = $m.attr('id').replace("mnu", "");
    activatePane(id);
}

function _startAnim(anim) {
    setLoading("#startAnim");

    callAPI({
        action: "startAnim",
        config: anim
    }, function(result) {
        if (result.status) {

        } else {
            showBPError(result.msg);
        }
        setLoading("#startAnim", false);
        setLoading("#startQ", false);
    });
}

function startAnim() {
    var params = getAnimConfig();
    _startAnim(params);
}

function stopAnim() {
    setLoading("#stopAnim");
    setLoading("#stopQ");
    var params = getAnimConfig();
    callAPI({
        action: "stopAnim"
    }, function(result) {
        if (result.status) {

        } else {
            showBPError(result.msg);
        }
        setLoading("#stopAnim", false);
        setLoading("#stopQ", false);
    });
}

function startQ() {
    setLoading("#startQ", true);
    _startAnim({
        'queue': _curQueue,
        'run': {}
    });
}

function _loadDrivers(callback){
    getDrivers(function(drivers) {
        _configs.driver = drivers.drivers;
        _names.driver = drivers.names;
        clearDriverChoosers();
        addDriverChooser();
        callback();
    });
}

function _loadControllers(callback){
    getControllers(function(controllers) {
        _configs.controller = controllers.controllers;
        _names.controller = controllers.names;
        $controller = $("#controller").param_loader({
            data: _configs.controller,
            label: "Controller",
            placeholder: "Select Controller...",
            default: null,
            onChange: filterAnims,
            onSaveClick: function($node) {
                showPresetSaveModal("controller", $node);
            },
            onDeleteClick: function($node, preset) {
                showPresetDeleteModal("controller", preset, $node);
            },
            onLoadClick: function($node) {
                showPresetLoadModal("controller", $node);
            }
        });
        callback();
    });
}

function _loadAnims(callback){
    getAnims(function(anims) {
        _configs.anim = anims.anims;
        _names.anim = anims.names;
        _animRun = anims.run;
        loadAnimOptions(null);
        callback();
    });
}

function _loadPresets(callback) {
    callAPI({
        action: "getPresets"
    }, function(result) {
        if (result.status) {
            $.each(result.data, function(t, v) {
                if (t in _configs) {
                    var cfg = _configs[t];
                    $.each(v, function(p, val) {
                        pushPreset(t, val);
                    });
                }
            });
            reloadPresets();
            callback();
        } else {
            showBPError(result.msg);
        }
    });
}

function _loadConfig(callback){
    getConfig(function(config) {
        _curConfig = config;
        displayCurConfig();
        callback();
    });
}

function _loadServerConfig(callback){
    getServerConfig(function(srv) {
        $server_config = $("#server_config").param_loader({
            data: [srv.setup],
            label: "",
            placeholder: "",
            disable_option: true,
            default: "server_config"
        });

        setTimeout(function() {
            $server_config.val(srv.config);
        }, 5);

        callback();
    });
}

function _loadQueues(callback){
    getQueues(function(q){
        _queues = q;
        callback();
    })
}

function _loadQS(callback){
    getQS(function(q){
        _qselects = q;
        callback();
    })
}

function _loadEgg(callback){
    setTimeout(callback, 250);
}

var _loadFuncs = [
    [_loadDrivers, "Drivers"],
    [_loadControllers, "Controllers"],
    [_loadServerConfig, "Server Config"],
    [_loadAnims, "Animations"],
    [_loadEgg, "Additional Pylons"],
    [_loadQueues, "Queues"],
    [_loadQS, "Quick Selects"],
    [_loadPresets, "Presets"],
    [_loadConfig, "Current Setup"],
    [_loadEgg, "Death Ray"],
]

function _checkRunning(){
    var _requireRun = ['mnuAnim', 'mnuQueue', 'mnuQS'];
    $.each(_requireRun, function(i,v){
        _enable("#"+v, _curConfig.running);
    });
    return _curConfig.running;
}

function _doNeedConfig(){
    doBasicModal("#needConfigModal");
    activatePane("Config");
}

function _finalLoad(){
    $('html').addClass('loaded_style');
    $('#main_window').show();
    reloadQueues();
    reloadQS();
    // init_simple();
    if(_checkRunning()){
        activatePane("Anim");
        setTimeout(hideLoader, 250);
    }
    else {
        setTimeout(_doNeedConfig, 250);
    }
}

var _loadIndex = 0;
function loadInitData() {
    var nextLoad = function(){
        _loadIndex += 1;
        if(_loadIndex >= _loadFuncs.length){
            _finalLoad()
        }
        else{
            incLoad(_loadFuncs[_loadIndex][1]);
            _loadFuncs[_loadIndex][0](nextLoad);
        }
    }

    incLoad(_loadFuncs[_loadIndex][1]);
    _loadFuncs[_loadIndex][0](nextLoad);
}

function showLoader(){
    $("#progLabel").html("Loading...");
    $("#loadProg").progress({
        percent: 0,
    });
    $("#load_modal").modal({
        closable: false,
        dimmerSettings: {
            opacity: 1
        },
        // transition: null,
        duration: 0
    }).modal('show');
}

function hideLoader(){
    $("#load_modal")
        .modal({
            duration:400,
            transition: 'fade',
        })
        .modal('hide');
}

function incLoad(msg){
    msg = "Loading " + msg + "...";
    // $("#loadProg").progress('increment');
    $("#progLabel").html(msg);
    $("#loadProg").progress({
        percent: ((_loadIndex+1)/_loadFuncs.length)* 100,
    });
}

function onQueueChange(val){
    if(val in _queues){
        _curQueue = _clone(_queues[val].data);
        loadAnimQueue();
        $("#queue_delete").removeClass('disabled');
    }
}

function onQSChange(val){
    if(val in _qselects){
        _curQS = _clone(_qselects[val].data);
        loadQSPane();
        $("#qs_delete").removeClass('disabled');
        $("#launchQS").removeClass("disabled");
    }
    else {
        $("#launchQS").addClass("disabled");
    }
}

function showAddQueueModal() {
    var params = getAnimConfig();
    if (!params.run.untilComplete && !params.run.max_steps && !params.run.seconds) {
        showWarning("Add to Queue Warning",
            'Queued animations require a stop condition, otherwise the animation will run forever.<br/>\
             Please either set Max Frames, Run Seconds, or Until Complete and Max Cycles.<br \>\
             Note: Not all animations support Until Complete but Max Frames or Run Seconds will always work.')
    } else {
        if (_animEditMode) {
            $("#addQueueHeader").html("Edit Queue Item");
            $("#addQueueBtn").html("Save");
            $("#addQueueDesc").val(_animEditConfig.config.desc);
        } else {
            $("#addQueueHeader").html("Add to Queue");
            $("#addQueueBtn").html("Add");
            $("#addQueueDesc").val('');
        }

        $("#addQueueModal").modal({
            blurring: true,
            closable: false,
            dimmerSettings: _dimSettings,
            onApprove: function() {
                var desc = $("#addQueueDesc").val();

                params.desc = desc;
                if (_animEditMode) {
                    _curQueue[_animEditConfig.index] = params;
                    activatePane("Queue", _animEditConfig.sub);
                } else {
                    _curQueue.push(params);
                }
                $("#addQueueModal").modal('hide');

                updateQueueCount();
            },
            onDeny: function() {}
        }).modal('show');
    }
}
function cancelQSQueueEdit(){
    activatePane("QS");
}

function cancelAnimEdit(){
    if(_animEditMode == "qs"){
        activatePane("QS");
    }
    else if(_animEditMode == "queue"){
        activatePane("Queue", _animEditConfig.sub);
    }
}

function showAddQSModal(type) {
    var qs = null;
    var header = "";
    if(type=="anim"){
        header = "Add Animation to Quick Select";
        qs = getAnimConfig();
        qs.qs_type = "anim";
        qs.type = _animType;
    }
    else if(type=="queue"){
        header = "Add Queue to Quick Select";
        var type = getContType();
        var data = _clone(_curQueue);
        qs = {
            qs_type: "queue",
            type: type,
            data: data
        };
    }

    if(!qs) return; //TODO: Error here

    if (_animEditMode == "qs") {
        $("#addQSHeader").html("Edit Quick Select Item");
        $("#addQSBtn").html("Save");
        $("#addQSDesc").val(_animEditConfig.config.desc);
        $("#addQSName").val(_animEditConfig.config.name);
    } else {
        $("#addQSHeader").html(header);
        $("#addQSBtn").html("Add");
        $("#addQSDesc").val('');
        $("#addQSName").val('');
    }

    $("#addQSModal").modal({
        blurring: true,
        closable: false,
        dimmerSettings: _dimSettings,
        onApprove: function() {
            var name = $("#addQSName").val();
            var desc = $("#addQSDesc").val();

            qs.name = name;
            qs.desc = desc;

            if (_animEditMode == "qs") {
                _curQS[_animEditConfig.index] = qs;
                activatePane("QS");
            } else {
                _curQS.push(qs);
            }
            $("#addQSModal").modal('hide');

            updateQSCount();
        },
        onDeny: function() {}
    }).modal('show');
}

function updateQSCount(){
    if(_curQS.length > 0){
        $("#qsCount").html(_curQS.length);
        $("#qsCount").removeClass("hidden");
    }
    else {
        $("#qsCount").addClass("hidden");
    }
}

function loadQSPane() {
    var q_sort = function(event, ui) {
        var num = 0;
        var temp = [];
        $.each($("#qsList").children(), function(i, v) {
            num = $(v).attr('num');
            temp.push(_curQS[num]);
        });

        _curQS = temp;
        loadQSPane();
    };

    $("#qsList").empty();

    var html = "No Quick Selects! Go to the Animation or Queue pane and add some, or choose a saved Quick Select menu from above.";
    if (_curQS.length > 0) {
        html = buildQSFeed(_curQS);
        _enable("#qs_save", true);
    } else {
        _enable("#qs_save", false);
    }

    $("#qsList").html(html);

    if (_curQS.length > 0) {
        $("#qsList").sortable({
            update: q_sort,
            placeholder: "sort_placeholder"
        });

        $("#qsList .q_edit").click(function() {
            var n = $(this).closest('.item').attr('num');
            var qs = _clone(_curQS[n]);
            if(qs.qs_type == "anim"){
                activatePane("Anim", {
                    "config": qs,
                    "index": n,
                    "type": "qs"
                });
            }
            else if(qs.qs_type == "queue"){
                activatePane("Queue", {
                    "config": qs,
                    "index": n,
                    "type": "qs"
                });
            }
        });

        $("#qsList .q_remove").click(function() {
            var n = $(this).closest('.item').attr('num');
            _curQS.splice(n, 1);
            loadQSPane();
        });
    }

    updateQSCount();
}


function reloadQS(){
    var temp = {};
    var type = getContType();
    $.each(_qselects, function(k,v){
        if(v.type == type) temp[k] = v;
    });
    $qsCombo.load(temp);
    $("#qs_delete").addClass('disabled');
}

function resetOnStart(){
    reloadQS();
    reloadQueues();
    _curQS = [];
    updateQSCount();
    _curQueue = [];
    updateQueueCount();
    _checkRunning();
}
function launchQS(){
    var name = $qsCombo.val();
    window.open(window.location.href + "qs/" + name, "QS");
}

$(document)
    .ready(function() {
        showLoader();
        setTimeout(loadInitData, 500);
        // loadInitData();

        $("#startDriver").click(function() {

            setLoading("#startDriver");
            var config = getCurrentConfig();
            config.action = "startConfig"
            callAPI(config, function(result) {
                if (result.status) {
                    _curConfig.running = true;
                    resetOnStart();
                } else {
                    showBPError(result.msg);
                }
                setLoading("#startDriver", false);
            });
        });

        $queueCombo = $("#queueCombo")._dropdown({
            label: "Saved Queues",
            placeholder: "Select Queue...",
            default: null,
            data: null,
            onChange: onQueueChange
        });

        $qsCombo = $("#qsCombo")._dropdown({
            label: "Saved QS",
            placeholder: "Select QS...",
            default: null,
            data: null,
            onChange: onQSChange
        });

        $("#btnSettings").click(showServerConfig);
        $("#saveServerConfig").click(doSaveServerConfig);
        $("#btnAddDriver").click(addDriverChooser);
        $("#btnRemoveDriver").click(removeDriverChooser);
        $(".side_menu").click(handleSideMenu);
        $("#addQueue").click(showAddQueueModal);
        $("#startAnim").click(startAnim);
        $("#stopAnim").click(stopAnim);
        $("#startQ").click(startQ);
        $("#stopQ").click(stopAnim);
        $("#saveQueueEdit").click(showAddQueueModal);
        $("#queue_save").click(showSaveQueueModal);
        $("#queue_delete").click(showQueueDeleteModal);
        $("#addQSAnim").click(function(){showAddQSModal("anim")});
        $("#addQSQueue").click(function(){showAddQSModal("queue")});
        $("#saveQSAnimEdit").click(function(){showAddQSModal("anim")});
        $("#cancelAnimEdit").click(cancelAnimEdit);
        $("#saveQSQueueEdit").click(function(){showAddQSModal("queue")});
        $("#cancelQSQueueEdit").click(cancelQSQueueEdit);

        $("#qs_save").click(showSaveQSModal);
        $("#qs_delete").click(showQSDeleteModal);

        $("#launchQS").click(launchQS);

        $( "#paneSimple" ).load( "simple.html" );
    });
