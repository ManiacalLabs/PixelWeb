var MatrixRotation = {
    ROTATE_0: 0, //no rotation
    ROTATE_90: 3, //rotate 90 degrees
    ROTATE_180: 2, //rotate 180 degrees
    ROTATE_270: 1, //rotate 270 degrees
}

function rotateMatrix(matrix) {
    var result = [];
    for (var i = 0; i < matrix[0].length; i++) {
        result.push([]);
    }
    $.each(matrix, function(i, r) {
        $.each(r, function(i, c) {
            result[i].unshift(c);
        });
    });

    return result;
}

function flipMatrix(matrix) {
    var result = [];
    $.each(matrix, function(i, r) {
        result.unshift(r);
    });

    return result;
}

function _printMap(map) {
    var s = "";
    $.each(map, function(i, r) {
        s += r.join() + "\n";
    });
    return s;
}

function mapGen(width, height, serpentine, offset, rotation, vert_flip) {
    serpentine = _def(serpentine, true);
    offset = _def(offset, 0);
    rotation = _def(rotation, MatrixRotation.ROTATE_0);
    vert_flip = _def(vert_flip, false);

    var result = [];
    for (var y = 0; y < height; y++) {
        if (!serpentine || y % 2 == 0) {
            var r = [];
            for (var x = 0; x < width; x++) {
                r.push((width * y) + x + offset);
            }
            result.push(r);
        } else {
            var r = [];
            for (var x = 0; x < width; x++) {
                r.push(((width * (y + 1)) - 1) - x + offset);
            }
            result.push(r);
        }
    }

    for (var i = 0; i < rotation; i++) result = rotateMatrix(result);
    if(vert_flip) result = flipMatrix(result)
    return result;
}

function MultiMapBuilder(){
    this._map = []
    this.offset = 0

    this.addRow = function(){
        maps = arguments;
        var yOff = this._map.length;
        var lengths = [];
        $.each(maps, function(i,m){
            lengths.push(m.length)
        });
        var h = _max(lengths);
        if(_min(lengths) != h){throw "All maps in row must be the same height!";}

        var offsets = [0 + this.offset];
        var count = 0;
        $.each(maps, function(i,m){
            offsets.push(h*m[0].length + offsets[count])
            count += 1
        });

        for(var y=0;y<h;y++){
            this._map.push([]);
            for(var x=0;x<maps.length;x++){
                var n = [];
                $.each(maps[x][y], function(c,i){
                    n.push(i+offsets[x]);
                });
                this._map[y+yOff] = $.merge(this._map[y+yOff], n);
            }
        }

        this.offset = offsets[offsets.length-1]
    }
}