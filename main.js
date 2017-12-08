var animation;
var nn ={input:[1,2,3,4], hidden:[1,2,3], output:[1,2,3]}
var startup_delay = true;
window.onload = function(){
    animation = new AnimController(document.getElementById("main_display"));
    animation.init_area();
    //var ani = knit_animation(test_data, test_circles(a.container_bounding));
    var layers = JSON.parse(getURLParameter(window.location.href, 'layers'));
    layers = layers != null ? layers : [4, [10, 2], 4];
    var nn_structure = NN_structure(...layers);
    var stages = [draw_nn_circles(animation.container_bounding, nn_structure), ...draw_nn_lines(animation.container_bounding, nn_structure)];
    var ani = knit_animation(test_data, stages);
    //var ani = knit_animation(test_data, [draw_nn_circles(animation.container_bounding, nn_structure)]);    
    animation.load_animation(ani);
    for(var i = 0; i < 0; i++) animation.add_stage(line_change(animation.container_bounding, nn_structure));
    start_animation();
    console.log(animation);
    var stage_gen_worker = new Worker('AnimFramework/stage_gen_worker.js');
    var count = 0;
    var n_data = normalise(iris_data, ["class"]);
    nn_structure.data = n_data;
    nn_structure.index = count;
    stage_gen_worker.postMessage([animation.container_bounding, nn_structure]);
    stage_gen_worker.onmessage = function(stage){
        animation.add_stage(stage.data);
        if(count < n_data.length){
            stage_gen_worker.postMessage([animation.container_bounding, nn_structure]);
            count++;
            nn_structure.index = count;
        }
    }
};

// Returns position data for drawing NN
function NN_structure(num_inputs, num_HL, num_outputs){
    var outer_margin = 50;
    var max_radius = outer_margin;
    var min_margin = 5;

    var bounds = {top:outer_margin, bottom: animation.container_bounding.height - outer_margin,
                left: outer_margin, right: animation.container_bounding.width - outer_margin};
    bounds["height"] = bounds.bottom - bounds.top;
    bounds["width"] = bounds.right - bounds.left;
    bounds["center_x"] = bounds.left + (bounds.width / 2);
    bounds["center_y"] = bounds.top + (bounds.height / 2);

    // Fit radiuses and margins to biggest layer
    max_layer_length = Math.max(...num_HL.concat([num_inputs, num_outputs]));
    space_each_item = bounds.height/(max_layer_length - 1);
    var radius_height = Math.min(max_radius, space_each_item/2);

    space_each_layer = bounds.width/(num_HL.length + 1);
    var radius_width = Math.min(max_radius, space_each_layer/2);

    var radius = Math.min(radius_height, radius_width);

    var layers = [num_inputs, ...num_HL, num_outputs]
    var weights = [];
    var biases = [];
    for(var l = 1; l < layers.length; l++){
        weights.push([]);
        biases.push([])
        for(var l2 = 0; l2 < layers[l]; l2++){
            weights[l-1].push([])
            biases[l-1].push([]);
            for(var l3 = 0; l3 < layers[l-1]; l3++){
                weights[l-1][l2].push(0.5);
                biases[l-1][l2].push(0.5);
            }
        }
        // weights.push(Array(layers[l]).fill(Array(layers[l-1]).fill(0.5)));
        // biases.push(Array(layers[l]).fill(Array(layers[l-1]).fill(0.5)));
    }

    return {bounds:bounds, space_each_item:space_each_item, space_each_layer:space_each_layer, radius:radius, num_inputs:num_inputs,
        num_outputs:num_outputs, num_HL:num_HL, biases:biases, weights:weights};

}

function getURLParameter(url, param){
    var paramValue = null;
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (var i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] == param){
                paramValue = decodeURIComponent(tempArray[i].split('=')[1]);
            }
        }
    }

    return paramValue;
}

function normalise(data, output_var){
    var normed_data = [];
    var columns = {};
    var normed_columns = {};
    var column_types = {};
    for (var i = 0; i < data.length; i++){
        var row = data[i];
        var cols = Object.keys(row);
        for(var c = 0; c< cols.length; c++){
            if (!(cols[c] in columns)) {
                columns[cols[c]] = [];
                column_types[cols[c]] = 'n';
            }
            columns[cols[c]].push(row[cols[c]]);
            if (isNaN(row[cols[c]])) column_types[cols[c]] = 'c';
        }
    }

    var column_names = Object.keys(columns);

    for(var c = 0; c < column_names.length; c++){
        var name = column_names[c];
        var normed_col = [];
        if(column_types[name] == 'c'){
            var category_values = columns[name].reduce((names, value) => names.includes(value) ? names : [...names, value], []);
            normed_col = columns[name].map(x => category_values.map(y => y == x ? 1 : 0));
        }else if(column_types[name] == 'n'){
            var min = Math.min(...columns[name]);
            var max = Math.max(...columns[name]);
            normed_col = columns[name].map(x => (x-min)/(max-min));
        }

        normed_columns[name] = normed_col;
    }

    for (var i = 0; i < data.length; i++){
        var n_row = {inputs:[], outputs:[]};
        for(var c = 0; c < column_names.length; c++){
            var name = column_names[c];
            if(output_var.includes(name)){
                n_row.outputs.push(normed_columns[name][i]);
            }else{
                n_row.inputs.push(normed_columns[name][i]);
            }
        }
        normed_data.push(n_row);
    }
    return normed_data

}