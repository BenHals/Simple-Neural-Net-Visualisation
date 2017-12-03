var animation;
var nn ={input:[1,2,3,4], hidden:[1,2,3], output:[1,2,3]}
window.onload = function(){
    animation = new AnimController(document.getElementById("main_display"));
    animation.init_area();
    //var ani = knit_animation(test_data, test_circles(a.container_bounding));
    var nn_structure = NN_structure(4, [2], 3);
    var ani = knit_animation(test_data, [draw_nn_circles(animation.container_bounding, nn_structure)].concat(draw_nn_lines(animation.container_bounding, nn_structure)));
    //var ani = knit_animation(test_data, [draw_nn_circles(animation.container_bounding, nn_structure)]);    
    animation.load_animation(ani);
    start_animation();
    console.log(animation);
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

    return {bounds:bounds, space_each_item:space_each_item, space_each_layer:space_each_layer, radius:radius, num_inputs:num_inputs,
        num_outputs:num_outputs, num_HL:num_HL};

}