
onmessage = function(e) {
    var data = e.data[1];
    rand_weights(data);
    line_change_worker(data);
  }

function line_change_worker(data){
    var layers = [data.num_inputs].concat(data.num_HL.concat(data.num_outputs));
    var stage = {stage_name: "circle_fade_in", stage_duration: 0.2};
    new_circles = {};
    stage.new_elements = new_circles;

    transitions = {};
    for(var n = 0; n < layers.length - 1; n++){
        for(var i = 0; i < layers[n]; i++){
            for(var x = 0; x < layers[n+1]; x++){
                transitions["layer"+n+"_item" + i +"_line"+x] = ["layer"+n+"_item" + i +"_line"+x,
                                ["lineWidth"], [data.weights[n][x][i]], [0], [1]];
            }
        }
    }
    var data_inputs = data.data[data.index].inputs;
    var data_outputs = data.data[data.index].outputs[0];
    for(var i = 0; i < layers.length; i++){
        // var selected = new Array(layers[i]).fill(0);
        // selected = selected.map((item, index) => index);
        // shuffle(selected);
        // var cutoff = getRandomInt(1, layers[i]);
        // selected = selected.slice(0, cutoff);
        // var item_index = getRandomInt(0, layers[i]);
        var layer_name = i == 0 ? "input" : i== layers.length-1 ? "output" : "hidden" + (i - 1) + "_";

        for(var n = 0; n <layers[i]; n++){
            var rand_percent = getRandomInt(0, 100);
            var activation = i > 0 ? data.weights[i-1][n].reduce((sum, weight, index) => sum + weight*data_inputs[index], 0) : 0;
            var lightness = i == 0 ? parseInt(data_inputs[n]*100) : i == layers.length - 1 ? parseInt(data_outputs[n] * 100) : activation*100;
            if(isNaN(lightness)){
                console.log(data_outputs);
            }
            transitions[layer_name+n] = [layer_name+n, ["fill"], ["hsl(120, 1%, "+lightness+"%)"], [0], [1]];
            // transitions[layer_name+n] = [layer_name+n, ["fill"], [selected.indexOf(n) != -1 ? "hsl(120, 1%, "+rand_percent+"%)" : "hsl(120, 1%, "+rand_percent+"%)"], [0], [1]];
        }

    }
    stage.element_transitions = transitions;
    postMessage(stage);
}
function rand_weights(data){
    var layers = [data.num_inputs, ...data.num_HL, data.num_outputs];
    for(var n = 1; n < layers.length; n++){
        for(var i = 0; i < layers[n]; i++){
            for(var x = 0; x < layers[n-1]; x++){
                var old_weight = data.weights[n-1][i][x];
                var new_weight = old_weight + (Math.random()*1 - 0.5);
                data.weights[n-1][i][x] = new_weight;
                
            }
        }
    }
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