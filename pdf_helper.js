const PDFDocument = require('pdfkit');
class PDFHelper {
    constructor(config, pipe_putput) {
        var options = {
            "size": config["paper"],
            "margins": {
                "top": config["margin_top"],
                "bottom": config["margin_bottom"],
                "left": config["margin_left"],
                "right": config["margin_right"],
            }
        };
        this.doc = new PDFDocument(options);
        this.doc.pipe(pipe_putput);
    }
    draw_element(key, element_layout, element_data, start_y, stop_y, style) {
        var bottom;
        var _key = key.toLowerCase();
        if (/^(image|im|img|i_)/.test(_key)) {
            bottom = this._draw_image_helper(element_layout, element_data, start_y, stop_y, style);
        } else if (/^(text|txt|t_|label|lbl|l_)/.test(_key)) {
            bottom = this._draw_text_helper(element_layout, element_data, start_y, stop_y, style);
        } else if (/^(path|p_)/.test(_key)) {
            bottom = this._draw_path_helper(element_layout["path"], start_y, stop_y, style);
        } else if (/^(line)/.test(_key)) {
            bottom = this._draw_line_helper(element_layout, start_y, style);
        }else if (/^(rect)/.test(_key)) {
            bottom = this._draw_rect_helper(element_layout, start_y, style);
        }
        return bottom;
    }
    _draw_text_helper(element_layout, element_data, start_y, stop_y, style) {
        var bottom = this._draw_text(
            element_data,
            element_layout["x"],
            element_layout["y"] + start_y,
            element_layout["width"],
            element_layout["height"],
            style
        );
        return bottom;
    }
    _draw_image_helper(element_layout, element_data, start_y, stop_y, style) {
        var bottom;
        this._draw_image(
            element_data,
            element_layout["x"],
            element_layout["y"] + start_y,
            element_layout["width"],
            element_layout["height"],
            style
        );
        bottom = element_layout["y"] + start_y + element_layout["height"];
        return bottom;
    }
    _draw_rect_helper(rect, start_y, style) {
        var x = rect["x"];
        var y = rect["y"] + start_y;
        var width = rect["width"];
        var height = rect["height"];
        var bgcolor = rect["bgcolor"];
        this._draw_rect(x, y, width, height,bgcolor, style);
        let bottom = y+height;
        return bottom;
    }
    _draw_line_helper(line_data, start_y, style) {
        var bottom;
        var x = line_data["x"];
        var y = line_data["y"] + start_y;
        var direction = line_data["direction"];
        var length = line_data["length"];
         
        this._draw_line(x, y, direction, length, style);
        if (direction == 'v') {
            bottom = y + length;
        } else {
            bottom = y;
        }
        return bottom;
    }
    _draw_path_helper(element_data, style)  {
        this._draw_path(
            element_data,
            style
        );
        return -1;
    }
    draw_debug_y_line(y)
    {
        this._draw_line(0,y,'h',500,{});
    }
    _draw_text(text, x, y, w, h, options) {
        var bottom;
        let options_ = {
                width:w,height:h,
                lineBreak:false,
                align:options['align']
            }
        let font_size = options['font-size'];
        let font = options["font"];
        let color = options["color"];
        this.doc.font(font)
            .fill(color)
            .fontSize(font_size)
            .text(text, x, y,options_);
        bottom = y + this.doc.heightOfString(text,options_ );
        return bottom;
    }
    _draw_image(image_path, x, y, w, h, options) {
        var bottom;
        this.doc.image(image_path, x, y, { width: w, height: h });
        bottom = y + h;
        return bottom;
    }
    _draw_path(path_pata, style) {
        let stroke_color = style['stroke-color'];
        let line_width = style['line-width'];
        let line_join = style['line-join'];
        this.doc
            .path(path_pata)
            .strokeColor(stroke_color)
            .lineWidth(line_width)
            .lineJoin(line_join)
            .stroke();
    }
    _draw_rect(x,y,w,h,bgcolor,style){
        this.doc
            .rect(x, y, w, h)
            .fill(style['bgcolor']);
    }
    _draw_line(x, y, direction, length, style) {
        let line_path = "M " + x + "," + y +
            " " + direction + " " + length;
        let stroke_color = style['stroke-color'];
        let line_width = style['line-width'];
        let line_join = style['line-join'];
 
        this.doc.path(line_path);
        if(stroke_color!=undefined){
            this.doc.strokeColor(stroke_color)
        }
        if(line_width!=undefined){
            this.doc.lineWidth(line_width)
        }
        if(line_join!=undefined){
            this.doc.lineJoin(line_join)
        }
        this.doc.stroke();
    }
    finish() {
        this.doc.end();
    }
    add_new_page(config) {
        var options = {
            "size": config["paper"],
            "margins": {
                "top": config["margin_top"],
                "bottom": config["margin_bottom"],
                "left": config["margin_left"],
                "right": config["margin_right"],
            }
        };
        this.doc.addPage(options);
    }
}
module.exports = {
    'PDFHelper': PDFHelper,
};
