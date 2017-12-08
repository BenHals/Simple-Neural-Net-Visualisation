class AnimElementRenderer{
    constructor() {
        this.render_type_map = {"circle":this.render_circle, "line":this.render_line};
    }

    render(ctx, elements){
        var element_names = Object.keys(elements);
        element_names.sort(function(x, y){
            var a = elements[x];
            var b = elements[y];
            if(a.attrs.layer && b.attrs.layer){
                if(a.attrs.layer < b.attrs.layer) return -1;
                if(a.attrs.layer > b.attrs.layer) return 1
                return 0;
            }
            if(a.attrs.layer) return 1;
            if(b.attrs.layer) return -1;
            return 0;
        });
        for(var e = 0; e<element_names.length; e++){
            var element = elements[element_names[e]];
            if(element.attrs.active == false) continue;
            if(element.custom_render != undefined){
                element.custom_render(ctx);
            }else{

                this.render_type_map[element.type](ctx, element);
            }
        }
    }

    render_circle(ctx, element){
        var color = d3.color(element.attrs.color);
        color.opacity = element.attrs.opacity;
        var stroke_color = element.attrs.stroke ? d3.color(element.attrs.stroke) : color;
        stroke_color.opacity = element.attrs["stroke-opacity"] ? element.attrs["stroke-opacity"] : element.attrs.opacity;
        var fill_color = element.attrs.fill ? d3.color(element.attrs.fill) : color;
        if(fill_color == null){
            console.log(element.attrs["fill"]);
        }
        fill_color.opacity = element.attrs["fill-opacity"] ? element.attrs["fill-opacity"] : element.attrs.opacity;
        ctx.fillStyle = fill_color;
        ctx.strokeStyle = stroke_color;
        ctx.lineWidth = element.attrs.lineWidth ? element.attrs.lineWidth : 1;
        ctx.beginPath();
        ctx.arc(parseInt(element.attrs.x),parseInt(element.attrs.y),parseInt(element.attrs.r),0,2*Math.PI);
        if(element.attrs.fill) ctx.fill();
        ctx.stroke();
    }

    render_line(ctx, element){
        var color = d3.color(element.attrs.color);
        color.opacity = element.attrs.opacity;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = element.attrs.lineWidth ? element.attrs.lineWidth : ctx.lineWidth;
        ctx.beginPath();
        ctx.moveTo(parseInt(element.attrs.x1), parseInt(element.attrs.y1));
        ctx.lineTo(parseInt(element.attrs.x2),parseInt(element.attrs.y2));
        ctx.stroke();
    }
}