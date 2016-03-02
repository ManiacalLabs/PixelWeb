function onBrightness(val)
{
    val = Math.ceil((255.0 / 100.0) * val);
    _curConfig.controller.config.masterBrightness = val;
    setBrightness(val);
}

function init_brightness_knob()
{
    $("#brightnessVal").knob({
        'min':0,
        'max':100,
        'angleOffset': -125,
        'angleArc': 250,
        'fgColor': '#F36926',
        'width': 292,
        'height': 292,
        'displayInput': false,
        'release' : onBrightness
    });

    var val = _curConfig.controller.config.masterBrightness;
    val = Math.ceil((100.0 / 255.0) * val)
    $("#brightnessVal").val(val);
}

function init_simple()
{
    init_brightness_knob();
}
