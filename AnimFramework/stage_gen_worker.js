
onmessage = function(e) {
    var data = e.data[1];

    line_change_worker_learn(data);
  }

function line_change_worker_random(data){
    rand_weights(data);
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
    var ind = getRandomInt(0, data.data.length);
    var data_inputs = data.data[ind].inputs;
    var data_outputs = data.data[ind].outputs[0];
    var activations = data.activations;
    var s_error = 0;
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
            var activation = i > 0 ? data.weights[i-1][n].reduce((sum, weight, index) => sum + weight*activations[i-1][index], 0) : data_inputs[n];
            activations[i][n] = activation;
            //var lightness = i == 0 ? parseInt(data_inputs[n]*100) : i == layers.length - 1 ? parseInt(data_outputs[n] * 100) : activation*100;
            var lightness = i == 0 ? parseInt(data_inputs[n]*100) : i == layers.length - 1 ? parseInt(activation * 100) : activation*100;
            if(isNaN(lightness)){
                console.log(data_outputs);
            }

            if(i == layers.length - 1){
                continue;
            }else{
                transitions[layer_name+n] = [layer_name+n, ["fill"], ["hsl(120, 1%, "+lightness+"%)"], [0], [1]];
            }
            // transitions[layer_name+n] = [layer_name+n, ["fill"], [selected.indexOf(n) != -1 ? "hsl(120, 1%, "+rand_percent+"%)" : "hsl(120, 1%, "+rand_percent+"%)"], [0], [1]];
        }
    }
    activations[layers.length - 1] = Softmax(activations[layers.length - 1]);
    for(var n = 0; n <layers[layers.length - 1]; n++){
        var residual = activations[layers.length - 1][n] - data_outputs[n];
        s_error += Math.pow(residual, 2);
        var l_residual = logistic(residual*2);
        var col = "hsl(" + l_residual * 225 +", 100%, 35%)";

        transitions[layer_name+n] = [layer_name+n, ["fill", "stroke"], ["hsl(120, 1%, "+activations[layers.length - 1][n] * 100+"%)", col], [0, 0], [1, 1]];
    }
    stage.element_transitions = transitions;
    postMessage([[stage], s_error]);
}

function line_change_worker_learn(data){
    var layers = [data.num_inputs].concat(data.num_HL.concat(data.num_outputs));
    var stage = {stage_name: "circle_fade_in", stage_duration: 0.2};
    var new_circles = {};
    var transitions = {};

    // Pick a random observation to use
    var ind = getRandomInt(0, data.data.length);
    var data_inputs = data.data[ind].inputs;
    var data_outputs = data.data[ind].outputs[0];

    var activations = data.activations;
    var s_error = 0;

    // Forward pass to calc activations without matricies (cause i want to)
    for(var i = 0; i < layers.length; i++){
        var layer_name = i == 0 ? "input" : i== layers.length-1 ? "output" : "hidden" + (i - 1) + "_";

        for(var n = 0; n <layers[i]; n++){
            var rand_percent = getRandomInt(0, 100);
            var activation = i > 0 ? data.weights[i-1][n].reduce((sum, weight, index) => sum + weight*activations[i-1][index] + data.biases[i-1][n][index], 0) : data_inputs[n];
            activations[i][n] = activation;
        }
    }

    //activations[layers.length - 1] = Softmax(activations[layers.length - 1]);
    for(var n = 0; n <layers[layers.length - 1]; n++){
        var residual = activations[layers.length - 1][n] - data_outputs[n];
        s_error += Math.pow(residual, 2);
    }

    // Backwards pass to update weights.
    var learning_rate = 0.001;
    var node_effects = [];
    var updated_weights = [];
    for(var i = layers.length - 1; i > 0; i--){
        var layer_name = i == 0 ? "input" : i== layers.length-1 ? "output" : "hidden" + (i - 1) + "_";
        node_effects.unshift([]);
        updated_weights.unshift([]);
        for(var n = 0; n <layers[i]; n++){
            updated_weights[0].push([]);

            // First need to calculate how much the output of this node effects the error.
            var node_error_effect = 0;
            if(i == layers.length - 1){
                node_error_effect = activations[layers.length - 1][n] - data_outputs[n];
            }else{
                var node_sum = 0;
                for(var nl = 0; nl < layers[i+1]; nl++){
                    node_sum += (node_effects[1][nl]) * data.weights[i][nl][n];
                }
                node_error_effect = node_sum;
            }
            node_effects[0].push(node_error_effect);

            // Then we need to know how the input effects the output. No activation funcs used so just 1.
            var activation_function_effect = 1;

            // Then we need to know how changing the weight changes the input to the node.
            // Just linear so is the output from the previous node.
            for(var w = 0; w < layers[i-1]; w ++){
                var weight_effect = activations[i-1][w];
                var weight_effect_error = node_error_effect*activation_function_effect*weight_effect;
                updated_weights[0][n].push(data.weights[i-1][n][w] - weight_effect_error * learning_rate);
                data.biases[i-1][n][w] = data.biases[i-1][n][w] - node_error_effect * learning_rate;
            }
        }
    }
    data.weights = updated_weights;

    for(var n = 0; n < layers.length; n++){
        for(var i = 0; i < layers[n]; i++){
            for(var x = 0; x < layers[n+1]; x++){
                if(n != layers.length -1){
                    transitions["layer"+n+"_item" + i +"_line"+x] = ["layer"+n+"_item" + i +"_line"+x,
                                    ["lineWidth"], [data.weights[n][x][i]*5], [0], [1]];
                }

            }
            var layer_name = n == 0 ? "input" : n== layers.length-1 ? "output" : "hidden" + (n - 1) + "_";
            transitions[layer_name+i] = [layer_name+i, ["r", "stroke"], [logistic(activations[n][i])*20, "hsl("+(n > 0 ? logistic(node_effects[n-1][i] * 3) * 225 : 120) +", "+(n > 0 ? "99" : "1") +"%, "+ (n > 0 ? logistic(node_effects[n-1][i]) * 100 : logistic(data_inputs[i]))+"%)"], [0, 0], [1, 1]];
        }
    }
    stage.element_transitions = transitions;
    stage.new_elements = {};
    postMessage([[stage], s_error, data.weights, data.biases]);
}

function logistic(a){
    return (1 / (Math.exp(a) + 1));
}
function Softmax(Xdata){
    var Explist=Xdata.map(Math.exp);
    var Sum=Explist.reduce(function(a, b) {
    return a + b;});
    var SoftmaxData= Explist.map(function(d){return d/Sum});
    return SoftmaxData;
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