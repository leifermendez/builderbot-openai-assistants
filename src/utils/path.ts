

import { dirname } from "path"
import { fileURLToPath } from "url";

// GetMainDir

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function GetMainDir(){
    const splitDir = __dirname.split("/");
    splitDir.pop();
    return splitDir.join("/");
}

export const mainPath = GetMainDir();