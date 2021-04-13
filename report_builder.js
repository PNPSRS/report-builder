const { PDFHelper } = require('./pdf_helper.js');
const { Utils } = require('./utils.js');
class ReportBuilder {
    constructor(options, pipe_output) {
        this.pdf = new PDFHelper(options, pipe_output);
        this.current_page = 0;
        this.page_count = 0;
        this.the_layout_estimated = {}
        this.the_layout_estimated["number_of_page"] = 1;
        this.the_layout_estimated["n_row_per_page"] = 1;
        this.current_row = 0;
    }
    set_data(data) {
        this.data = data;
    }
    set_layout(layouts) {
        this.layouts = layouts;
    }
    transform_text(raw_text) {
        var transformed_text;
        transformed_text = raw_text
            .replace('{{total_page}}', this.the_layout_estimated["number_of_page"])
            .replace('{{current_page}}', this.current_page)
            .replace('{{current_page-1}}', this.current_page - 1)
            .replace('{{current_page+1}}', this.current_page + 1);
        return transformed_text;
    }
    transform_if(raw_text) {
        var output = true;
        let eol = this.current_page == this.the_layout_estimated['number_of_page'];
        let neol = !eol;
        if (raw_text == '{{end_of_list}}') {
            output = eol;
        } else if (raw_text == '{{not_end_of_list}}') {
            output = neol;
        }
        return output;
    }
    printout_hf(part, page_i, layout, data_, styles) {
        this.current_page = page_i;
        var stop_y = 0;
        var elements = layout[part]["children"];
        Object.keys(elements).forEach(key => {
            var if_ = true;
            if (Utils.is_not_null(elements[key]["if"])) {
                if_ = this.transform_if(elements[key]["if"]);
            }
            if (if_) {
                if (Utils.is_null(elements[key]["style"])) {
                    if (key.startsWith("line") || key.startsWith("path")) {
                        elements[key]["style"] = "style-line";
                    } else {
                        elements[key]["style"] = "style-normal";
                    }
                }
                var text = ' ';
                if (elements[key]["text"]) {
                    text = this.transform_text(elements[key]["text"]);
                } else {
                    text = data_[key];
                }
                var bottom = this.pdf.draw_element(
                    key, elements[key],
                    text,
                    layout[part]["start_y"],
                    layout[part]["stop_y"],
                    styles[elements[key]["style"]]
                );
                stop_y = Math.max(stop_y, bottom);
            }
        });
        return stop_y;
    }
    printout_list_header(i, layout, start_y, data_, styles) {
        layout["list_header"]["y"] += start_y;
        layout["list_header"]["start_y"] = start_y;
        var stop_y = this.printout_hf("list_header", i, layout, data_, styles)
        return stop_y;
    }
    printout_list_footer(i, layout, start_y, data_, styles) {
        layout["list_footer"]["y"] += start_y;
        layout["list_footer"]["start_y"] = start_y;
        var stop_y = this.printout_hf("list_footer", i, layout, data_, styles);
        return stop_y;
    }
    printout_list_row(page_i, layout, start_y, list_rows_stop_y, data_, fixed, styles) {
        layout["list_row"]["y"] += start_y;
        layout["list_row"]["start_y"] = start_y;
        var stop_y = start_y;
        var bottom = 0;
        var elements = layout["list_row"]["children"];
        var data_source = layout["list_row"]["data_source"];
        let data_table = data_[data_source];
        var i = 0;
        while (i < this.the_layout_estimated["n_row_per_page"]) {
            start_y = stop_y;
            Object.keys(elements).forEach(key => {
                if (Utils.is_null(elements[key]["style"])) {
                    if (key.startsWith("line") || key.startsWith("path")) {
                        elements[key]["style"] = "style-line";
                    } else {
                        elements[key]["style"] = "style-normal";
                    }
                }
                if (key.startsWith("text_")) {
                    if (this.current_row < data_table.length) {
                        let data_field = elements[key]["data_field"]
                        var text = data_table[this.current_row][data_field];
                        bottom = this.pdf._draw_text(
                            text,
                            elements[key]["x"],
                            elements[key]["y"] + start_y,
                            elements[key]["width"],
                            elements[key]["height"],
                            styles[elements[key]["style"]]
                        );
                    } else {
                        if (fixed) {
                            bottom = this.pdf._draw_text(
                                '',
                                elements[key]["x"],
                                elements[key]["y"] + start_y,
                                elements[key]["width"],
                                elements[key]["height"],
                                styles[elements[key]["style"]]
                            );
                        }
                    }
                } else {
                    bottom = this.pdf.draw_element(
                        key, elements[key],
                        data_[key],
                        start_y,
                        layout["list_row"]["stop_y"],
                        styles[elements[key]["style"]]
                    );
                }
                stop_y = Math.max(stop_y, bottom);
            });
            if (i == 0 && page_i == 1) {
                let single_row_height = stop_y - start_y;
                let all_list_height = list_rows_stop_y - start_y - layout["list_footer"]["height"];
                this.the_layout_estimated["n_row_per_page"] = Math.abs(Math.floor(all_list_height / single_row_height)) + 1;
                this.the_layout_estimated["number_of_page"] = Math.abs(Math.ceil(data_table.length / this.the_layout_estimated["n_row_per_page"]));
            }
            this.current_row++;
            i++;
        }
        return stop_y;
    }
 
    printout_body_list(i, layout_body, data_, styles) {
        var next_y = layout_body["start_y"];
        var body_stop_y = layout_body["stop_y"];
        next_y = this.printout_list_header(i, layout_body["children"], next_y, data_, styles);
        next_y = this.printout_list_row(i, layout_body["children"], next_y, body_stop_y, data_, true, styles);
        next_y = this.printout_list_footer(i, layout_body["children"], next_y, data_, styles);
    }
    printout_header(i, layout, data_, styles) {
        this.printout_hf("header", i, layout, data_, styles);
    }
    printout_footer(i, layout, data_, styles) {
        this.printout_hf("footer", i, layout, data_, styles);
    }
    printout_body(i, layout, data_, body_start_y, body_stop_y, styles) {
        layout["body"]["start_y"] = body_start_y;
        layout["body"]["stop_y"] = body_stop_y;
        if ("list_row" in layout["body"]["children"]) {//list style
            this.printout_body_list(i, layout["body"], data_, styles);
        } else {//none list style
            this.printout_hf("body", i, layout, data_, styles);
        }
    }
    build_layout_pages(layout, data_) {
        var styles = layout["styles"];
        var i = 1;
        this.current_page = 0;
        while (i <= this.the_layout_estimated["number_of_page"]) {
            var body_start_y, body_stop_y;
            body_start_y = layout["header"]["stop_y"];
            body_stop_y = layout["footer"]["start_y"];
            this.printout_body(i, layout, data_, body_start_y, body_stop_y, styles);
            this.printout_header(i, layout, data_, styles);
            this.printout_footer(i, layout, data_, styles);
            if (i < this.the_layout_estimated["number_of_page"]) {
                this.pdf.add_new_page(layout['config']);
            }
            i++;
        }
    }
    build() {
        for (var i = 0; i < this.layouts.length; i++) {
            this.current_row = 0;
            if (i > 0) {
                this.pdf.add_new_page(this.layouts[i]['config']);
            }
            this.build_layout_pages(this.layouts[i], this.data[i]);
        }
        this.pdf.finish();
    }
}
module.exports = {
    'ReportBuilder': ReportBuilder,
};
//page size https://github.com/foliojs/pdfkit/blob/b13423bf0a391ed1c33a2e277bc06c00cabd6bf9/lib/page.coffee#L72-L122
//LETTER: [612.00, 792.00]
//A4: [595.28, 841.89]