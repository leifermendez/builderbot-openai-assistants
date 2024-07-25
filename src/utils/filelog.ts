import fs from "fs";
import util from "util";
import { mainPath } from "./path";

//get current date
const date = new Date();

const nameFile = `debug_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.log`;

const pathFile = `${mainPath}/logs/${nameFile}`;

//create folder if not exists
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}


const log_file = fs.createWriteStream(pathFile, { flags: 'w' });




export const fileLog = function (d) { //
    log_file.write(util.format(d) + '\n');
    //log_stdout.write(util.format(d) + '\n');
};

export const lastLogPath = pathFile;
export const lastLogName = nameFile;