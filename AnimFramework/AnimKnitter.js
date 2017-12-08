// Takes in data and 'stages', where each stage is a description of a section of animation. 
// Outputs a list of all elements used, and corresponding initial values and transitions for each stage.each

function knit_animation(data, stages){
    var elements = {};
    var element_attrs = {};
    var animation = {stages:[]};
    var total_duration = 0;
    // Initial pass through stages to get all elements
    for(var s = 0; s < stages.length; s++){
        var stage = stages[s];
        for(var ne = 0; ne < Object.keys(stage.new_elements).length; ne++){
            elements[Object.keys(stage.new_elements)[ne]] = stage.new_elements[Object.keys(stage.new_elements)[ne]].el;
            elements[Object.keys(stage.new_elements)[ne]].init_vals = [[-1, {active:false}]];
            element_attrs[Object.keys(stage.new_elements)[ne]] = {active:false};
        }
        total_duration += stage.stage_duration;
    }
    animation.elements = elements;
    animation.total_duration = total_duration;

    var updated_last_stage = [];
    // Pass through stages again, extracting transitions and tracking ele attrs through stages.
    for(var st = 0; st < stages.length; st++){
        var cur_stage = stages[st];
        animation.stages.push({stage_name:cur_stage.stage_name, stage_duration:cur_stage.stage_duration});

        // Assigning initial values to new elements.
        for(var newe = 0; newe < Object.keys(cur_stage.new_elements).length; newe++){
            element_attrs[Object.keys(cur_stage.new_elements)[newe]] = Object.assign({}, cur_stage.new_elements[Object.keys(cur_stage.new_elements)[newe]].init);
            elements[Object.keys(cur_stage.new_elements)[newe]].init_vals.push([st, Object.assign({}, element_attrs[Object.keys(cur_stage.new_elements)[newe]])]);
        }
        
        // Extracting transitions and updating tracked attrs.
        updated_last_stage = [];
        animation.stages[st].element_transitions = {};
        for(var t = 0; t<Object.keys(cur_stage.element_transitions).length; t++){
            var transition_name = Object.keys(cur_stage.element_transitions)[t];
            var transition = cur_stage.element_transitions[transition_name];
            var interpolators = [];
            for(var attr_i = 0; attr_i < transition[1].length; attr_i++){
                interpolators.push(d3.interpolate(element_attrs[transition_name][transition[1][attr_i]], transition[2][attr_i]));
                element_attrs[transition_name][transition[1][attr_i]] = transition[2][attr_i];
            }

            // Setting the next stages initial values to the updated ones from this transition.
            elements[transition_name].init_vals.push([st+1, Object.assign({}, element_attrs[transition_name])]);
            transition.push(interpolators);
            
            animation.stages[st].element_transitions[transition_name] = transition;
            updated_last_stage.push(transition_name);
        }
    }

    animation.anim_progress_time = anim_progress_time.bind(animation);
    animation.anim_progress_percent = anim_progress_percent.bind(animation);
    return animation;
}

function anim_progress_time(time_since_start){
    time_since_start = Math.min(time_since_start, this.total_duration);
    var stage_index = 0;

    while(time_since_start > this.stages[stage_index].stage_duration){

        time_since_start -= this.stages[stage_index].stage_duration;
        stage_index++;
        if(!this.stages[stage_index]){
            return[this.stages.length -1, 1];
        }
    }
    var prop_through = time_since_start/this.stages[stage_index].stage_duration;

    return[stage_index, prop_through];
}

function anim_progress_percent(percent){
    var time_since_start = percent * this.total_duration;
    return this.anim_progress_time(time_since_start);
}
// Stages should take in data and return:
// return_obj {
// stage_name :
// stage_duration : length stage will play in seconds
// new_elements : dict of elements created in this stage, key is name
// element_transitions : dict (element_name, [name, attribute, transition_to, start, fin]) where start and fin are start/ending percentages [0-1]
//}

//************** ADD NEW STAGES HERE ******************
test_data = [{start: [100,100], end: [200,100], color: "red"},{start: [300,300], end: [400,300], color: "blue"}];

function one_circle_fade_in(data){
    var stage = {stage_name: "circle_fade_in", stage_duration: 2};
    new_circles = {};
    for(var i =data.length-1; i < data.length; i++){
        new_circles["line"+i] = {el:new AnimElement("line"+i, "line"), init:{x1:data[i].start[0],y1:data[i].start[1],
                                                                            x2:data[i].start[0],y2:parseInt(data[i].start[1]) + Math.random()*20,
                                                                            color:data[i].color, opacity:0, r:10}};
    }
    stage.new_elements = new_circles;

    transitions = {};
    for(var n =data.length-1; n < data.length; n++){
        transitions["line"+n] = ["line"+n, ["opacity"], [1], [0], [1]];
    }
    stage.element_transitions = transitions;
    return stage;
}

function one_hist(bounds, data){
    var stage = {stage_name: "one_hist", stage_duration: 0.5};
    stage.new_elements = draw_histogram_zero(bounds, data);
    var h = draw_histogram(bounds, data);
    transitions = hist_transition(stage.new_elements, h);
    stage.element_transitions = transitions;
    return [stage, h, stage.new_elements];
}

function next_hist(bounds, data, orig_h, orig_h_0){
    var stage = {stage_name: "one_hist", stage_duration: 0.5};
    
    var h = draw_histogram(bounds, data);
    var zero_h = draw_histogram_zero(bounds, data);
    // Elements in new hist but not original
    var new_keys = Object.keys(h).filter(x => Object.keys(orig_h).some(y => x==y) == false);
    stage.new_elements = new_keys.reduce(function(o,a){o[a] = zero_h[a]; return o;}, {});
    transitions = hist_transition(orig_h, h, orig_h_0, zero_h);
    stage.element_transitions = transitions;
    return [stage, h, zero_h];
}

function hist_stages(bounds, data){
    var stages = [];
    var data_cum = [];
    //var one_r = one_hist(bounds, data(1));
    var data_r = data([]);
    var data_hist = data_r[0];
    data_cum = data_r[1];
    var one_r = one_hist(bounds, data_hist);
    stages.push(one_r[0]);
    var last_hist = one_r[1];
    var last_hist_0 = one_r[2];
    for(var i = 0; i < 1000; i++){
        data_r = data(data_cum);
        data_hist = data_r[0];
        data_cum = data_r[1];
        //var two_r = next_hist(bounds, data(i+2), last_hist, last_hist_0);
        var two_r = next_hist(bounds, data_hist, last_hist, last_hist_0);
        stages.push(two_r[0]);
        last_hist = two_r[1];
        last_hist_0 = two_r[2];
    }

    return stages;
}

function draw_nn_circles(bounds, data){
    var stage = {stage_name: "circle_fade_in", stage_duration: 2};
    new_circles = {};
    var layer_index = 0;
    var item_index = 0;
    for(var i =0; i < data.num_inputs; i++){
        var center_offset_index = ((data.num_inputs - 1) / 2) - i;
        var y = data.bounds.center_y - data.space_each_item * center_offset_index;
        new_circles["input"+i] = {el:new AnimElement("input"+i, "circle"), init:{x:data.bounds.left + (data.space_each_layer * layer_index),
                                                                                y:y,
                                                                                 color:"black" , opacity:0, r:10, lineWidth:2, fill:"white", layer: 2}};
    }
    layer_index++;
    for(var i =0; i < data.num_HL.length; i++){
        for(var n = 0; n < data.num_HL[i]; n++){
            var center_offset_index = ((data.num_HL[i] - 1) / 2) - n;
            var y = data.bounds.center_y - data.space_each_item * center_offset_index;
            new_circles["hidden"+i+"_"+n] = {el:new AnimElement("hidden"+i+"_"+n, "circle"), init:{x:data.bounds.left + (data.space_each_layer * layer_index),
                                                                                                y:y, 
                                                                                                color:"black" , opacity:0, r:10, lineWidth:2, fill:"white", layer: 2}};
        }
        layer_index++
    }
    for(var i =0; i < data.num_outputs; i++){
        var center_offset_index = ((data.num_outputs - 1) / 2) - i;
        var y = data.bounds.center_y - data.space_each_item * center_offset_index;
        new_circles["output"+i] = {el:new AnimElement("output"+i, "circle"), init:{x:data.bounds.left + (data.space_each_layer * layer_index),
                                                                                y:y,
                                                                                color:"black" , opacity:0, r:10, lineWidth:2, fill:"white", layer: 2}}; 
    }
    stage.new_elements = new_circles;

    transitions = {};
    for(var n =0; n < data.num_inputs; n++){
        transitions["input"+n] = ["input"+n, ["opacity"], [1], [0], [1]];
    }
    for(var i =0; i < data.num_HL.length; i++){
        for(var n = 0; n < data.num_HL[i]; n++){
            transitions["hidden"+i+"_"+n] = ["hidden"+i+"_"+n, ["opacity"], [1], [0], [1]];
        }
    }
    for(var n =0; n < data.num_outputs; n++){
        transitions["output"+n] = ["output"+n, ["opacity"], [1], [0], [1]];
    }
    stage.element_transitions = transitions;
    return stage;
}
function draw_nn_lines(bounds, data){
    var layers = [data.num_inputs].concat(data.num_HL.concat(data.num_outputs));
    var total_nodes = layers.reduce((a, c) => a+c);
    var total_duration = 2;
    var stage = {stage_name: "circle_fade_in", stage_duration: 1};
    var stages = [];
    new_circles = {};
    var count = 0;
    var layer_index = 0;
    for(var l =0; l < layers.length - 1; l++){
        for(var i = 0; i < layers[l]; i++){
            stage = {stage_name: "circle_fade_in", stage_duration: total_duration/total_nodes};
            new_circles = {};
            transitions = {};
            var center_offset_index_start = ((layers[l] - 1) / 2) - i;
            var y_start = data.bounds.center_y - data.space_each_item * center_offset_index_start;
            for(var n = 0; n < layers[l+1]; n++){
                var center_offset_index_end = ((layers[l+1] - 1) / 2) - n;
                var y_end = data.bounds.center_y - data.space_each_item * center_offset_index_end;
                new_circles["layer"+l+"_item" + i +"_line"+n] = 
                    {el:new AnimElement("layer"+l+"_item" + i +"_line"+n, "line"), init:{x1:data.bounds.left + (data.space_each_layer * l),
                                                                                            y1:y_start,
                                                                                            x2:data.bounds.left + (data.space_each_layer * (l + 1)),
                                                                                            y2:y_end,
                                                                                            color:"black" , opacity:0, lineWidth:3, layer: 1}};
                transitions["layer"+l+"_item" + i +"_line"+n] = ["layer"+l+"_item" + i +"_line"+n, ["opacity"], [1], [0], [1]];
            }
            stage.new_elements = new_circles;
            stage.element_transitions = transitions;
            stages.push(stage);
        }
    }
    return stages;
}

function line_change(bounds, data){
    var layers = [data.num_inputs].concat(data.num_HL.concat(data.num_outputs));
    var stage = {stage_name: "circle_fade_in", stage_duration: 0.2};
    new_circles = {};
    stage.new_elements = new_circles;

    transitions = {};
    for(var n = 0; n < 10; n++){
        var layer_index = getRandomInt(0, layers.length - 1);
        var item_index = getRandomInt(0, layers[layer_index]);
        var connection_index = getRandomInt(0, layers[layer_index + 1]);
        transitions["layer"+layer_index+"_item" + item_index +"_line"+connection_index] = ["layer"+layer_index+"_item" + item_index +"_line"+connection_index,
                                                                                        ["lineWidth"], [Math.random()*3], [0], [1]];
    }
    for(var i = 0; i < layers.length; i++){
        var item_index = getRandomInt(0, layers[i]);
        var layer_name = i == 0 ? "input" : i== layers.length-1 ? "output" : "hidden" + (i - 1) + "_";

        for(var n = 0; n <layers[i]; n++){
            transitions[layer_name+n] = [layer_name+n, ["fill"], [n==item_index ? "black" : "white"], [0], [1]];
        }

    }
    stage.element_transitions = transitions;
    return stage;
}

function many_line_changes(bounds, data){
    var stages = [];
    for(var i = 0; i < 1000; i++){
        stages.push(line_change(bounds, data));
    }
    return stages;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }