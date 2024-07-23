import fs from "fs";
import util from "util";

//get current date
const date = new Date();

const nameFile = `debug_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.log`;

const pathFile = `./logs/${nameFile}`;
const log_file = fs.createWriteStream(pathFile, {flags : 'w'});


export const fileLog = function(d) { //
    log_file.write(util.format(d) + '\n');
    //log_stdout.write(util.format(d) + '\n');
};

export const lastFilePath = pathFile;