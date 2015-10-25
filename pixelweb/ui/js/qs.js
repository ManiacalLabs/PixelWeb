var _qs = {}

function startAnim(){
    var $b = $(this);
    var num = $b.attr('num');

    var item = _qs.data[num];
    var config = null;
    if(item.qs_type == "anim"){
        config = {
            id: item.id,
            config: item.config,
            run: item.run
        }
    }
    else if(item.qs_type == "queue"){
        config = {
            queue: item.data,
            run: {}
        }
    }

    if(config){
        $b.addClass('loading');
        callAPI({
            action: "startAnim",
            config: config
        }, function(result) {
            if (result.status) {

            } else {
                $("#bpErrorMsg").html(result.msg);
                doBasicModal("#BPError");
            }
            $b.removeClass('loading');
        });
    }
}

function loadQS(){
    window.title = "PixelWeb: " + _qs.name;
    $("#header").html(_qs.name);

    $.each(_qs.data, function(i, v){
        var html = '\
            <button class="fluid ui massive green labeled icon button btn qs" num="@num">\
                <i class="@type icon"></i>\
                @name\
            </button>\
        ';

        var type = "";
        if(v.qs_type == "anim") type = "play";
        else if(v.qs_type == "queue") type = "film";
        html = strReplace(html, "@type", type);
        html = strReplace(html, "@name", v.name);
        html = strReplace(html, "@num", i);

        $("#button_list").append(html);
    });

    $(".qs").click(startAnim);
}

function stopAnim(){
    $("#btnStop").addClass('loading');
    callAPI({
        action: "stopAnim"
    }, function(result) {
        if (result.status) {

        } else {
            $("#bpErrorMsg").html(result.msg);
            doBasicModal("#BPError");
        }
        $("#btnStop").removeClass('loading');
    });
}

$(document).ready(function(){
    var name = window.location.pathname.replace('/qs/', '');
    name = decodeURIComponent(name);

    $("#btnStop").click(stopAnim);

    getQS(function(qs){
        if(!qs){
            alert("Unable to find QS");
        }
        else{
            _qs = qs;
            log.debug(_qs);
            getConfig(function(cfg){
                if(cfg.controller.control_type != _qs.type){
                    $("#bpErrorMsg").html("The requested QuickSelect is for a different control type than that which is loaded!");
                    doBasicModal("#BPError");
                }
                else {
                    loadQS();
                }
            });
        }
    }, name);
});
