
import "dotenv/config"
import express from 'express';
import { fileLog, lastLogName, lastLogPath } from "~/utils/filelog";
import { mainPath } from "~/utils/path";

const app = express();
const port = 3009;
const validToken = process.env.FACEBOOK_VALIDATION_TOKEN


function printDeep(object, level = 0) {
  if (level > 5) {
    return null;
  }
  Object.keys(object).forEach(function (key) {
    if (object[key] !== null && typeof object[key] === 'object') {
      fileLog('key:');
      fileLog(key)
      printDeep(object[key], level + 1);
    }
  });
  fileLog('object:');
  fileLog(object);
}


function webhookHandler(req, res, method) {
  //console.log('Webhook in post recibido:');
  //console.log(stringify(req, null, 2));
  //console.log('Webhook verificado');

  // Crear txt con el contenido del request
  console.log('Creando archivo con el contenido del request');
  //console.log("Console log")
  //console.log(req);
  //console.log("stringify")
  //console.log(stringify(req, null, 2));
  printDeep(req);
  console.log(`Archivo ${lastLogName} creado`);
  //console.log("Main log");
  //console.log(req);
  /*fs.writeFile(method + '_webhook.txt', stringify(req, null, 2), function (err) {
    if (err) throw err;
    console.log(`Archivo ${method}_webhook.txt creado`);
  });*/

  // Verificar que el webhook proviene de Facebook
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === validToken) {

    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('La verificación falló. La token no coincide.');
    res.sendStatus(403);
  }
}

export function startBotFacebook() {

  app.use(express.json()); // Middleware para parsear JSON


  app.post('/webhook', (req, res) => {
    webhookHandler(req, res, 'post');
  });

  app.get('/webhook', (req, res) => {
    webhookHandler(req, res, 'get');
  });

  app.get('/downloadLog', (req, res) => {
    const fileName = req.query['fileName']
    const path = !fileName ? `${lastLogPath}` : `${mainPath}/logs/${fileName}`
    res.download(path);
  });

  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}/webhook`);
  });
}

