
onmessage = function(e) {
    line_change_worker(e.data[0], e.data[1]);
  }

function line_change_worker(bounds, data){
    var layers = [data.num_inputs].concat(data.num_HL.concat(data.num_outputs));
    var stage = {stage_name: "circle_fade_in", stage_duration: 0.2};
    new_circles = {};
    stage.new_elements = new_circles;

    transitions = {};
    for(var n = 0; n < layers.length - 1; n++){
        //var layer_index = getRandomInt(0, layers.length - 1);
        for(var i = 0; i < layers[n]; i++){
            var selected = new Array(layers[n+1]).fill(0);
            selected = selected.map((item, index) => index);
            shuffle(selected);
            var cutoff = getRandomInt(1, layers[n+1]);
            selected = selected.slice(0, cutoff);
            for(var x = 0; x < layers[n+1]; x++){
                if(selected.includes(x)){
                    transitions["layer"+n+"_item" + i +"_line"+x] = ["layer"+n+"_item" + i +"_line"+x,
                                                                                                            ["lineWidth"], [Math.random()*3], [0], [1]];
                }
            }
        }
    }
    for(var i = 0; i < layers.length; i++){
        var selected = new Array(layers[i]).fill(0);
        selected = selected.map((item, index) => index);
        shuffle(selected);
        var cutoff = getRandomInt(1, layers[i]);
        selected = selected.slice(0, cutoff);
        var item_index = getRandomInt(0, layers[i]);
        var layer_name = i == 0 ? "input" : i== layers.length-1 ? "output" : "hidden" + (i - 1) + "_";

        for(var n = 0; n <layers[i]; n++){
            transitions[layer_name+n] = [layer_name+n, ["fill"], [selected.indexOf(n) != -1 ? "black" : "white"], [0], [1]];
        }

    }
    stage.element_transitions = transitions;
    postMessage(stage);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function shuffle(array, i0, i1) {
    var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
        t,
        i;
  
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0];
      array[m + i0] = array[i + i0];
      array[i + i0] = t;
    }
  
    return array;
  }