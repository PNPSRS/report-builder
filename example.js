const fs = require('fs');
const { ReportBuilder } = require('./report_builder.js');
const OUTPUT_TARGET = fs.createWriteStream('test.pdf');
let your_layout1 = fs.readFileSync('layout1.json');
let your_layout2 = fs.readFileSync('layout2.json');
let config = fs.readFileSync('config.json');
const layout1 = JSON.parse(raw_layout1);
const data = [{your_data_object1},{your_data_object2}];
let layouts = [layout1, layout2];
////////////////////////MAIN PROGRAM//////////////////////
let reportBuilder = new ReportBuilder(config, OUTPUT_TARGET);
reportBuilder.set_data(data);
reportBuilder.set_layout(layouts);
reportBuilder.build();