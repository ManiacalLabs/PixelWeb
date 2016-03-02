function _get(action, callback) {
    callAPI({"action": action}, function(result) {
        if (result.status) {
            if (callback) callback(result.data);
        }
        else {
            showBPError(result.msg);
        }
    });
}

function getDrivers(callback) { _get("getDrivers", callback); }

function getControllers(callback) { _get("getControllers", callback); }

function getAnims(callback) { _get("getAnims", callback); }

function getConfig(callback) { _get("getConfig", callback); }

function getServerConfig(callback) { _get("getServerConfig", callback); }

function getQueues(callback) { _get("getQueues", callback); }

function saveServerConfig(config, callback) {
    callAPI({action: "saveServerConfig", config: config}, function(result) {
        if (result.status) {
            if (callback) callback(result.data);
        }
    });
}

function getStatus(callback) {_get("getStatus", callback);}
function getErrors(callback) {_get("getErrors",  callback);}

function savePreset(type, name, desc, data, callback) {
    name = name.toString();
    data.desc = desc;
    callAPI({
        action: "savePreset",
        name: name,
        data: data,
        type: type
    }, function(result) {
        if (callback) callback();
    });
}

function deletePreset(type, name, callback) {
    name = name.toString();
    callAPI({
        action: "deletePreset",
        name: name,
        type: type
    }, function(result) {
        if (callback) callback();
    });
}

function saveQueue(name, q, callback) {
    name = name.toString();
    callAPI({
        action: "saveQueue",
        name: name,
        data: q
    }, function(result) {
        if (callback) callback();
    });
}

function deleteQueue(name, callback) {
    name = name.toString();
    callAPI({
        action: "deleteQueue",
        name: name
    }, function(result) {
        if (callback) callback();
    });
}

function saveQS(name, qs, callback) {
    name = name.toString();
    callAPI({
        action: "saveQS",
        name: name,
        data: qs
    }, function(result) {
        if (callback) callback();
    });
}

function getQS(callback, name) {
    if(name) name = name.toString();
    var data = {
        action: "getQS"
    };
    if(name) data.name = name;
    callAPI(data, function(result) {
        if (result.status) {
            if (callback) callback(result.data);
        }
        else {
            showBPError(result.msg);
        }
    });
}

function deleteQS(name, callback) {
    name = name.toString();
    callAPI({
        action: "deleteQS",
        name: name
    }, function(result) {
        if (callback) callback();
    });
}

function setBrightness(level, callback) {
    callAPI({
        action: "setBrightness",
        level: level
    }, function(result) {
        if (callback) callback();
    });
}
