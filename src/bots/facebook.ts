
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


function webhookHandler(req, res) {
  const body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  fileLog(`\u{1F7EA} Received webhook:`);
  fileLog(body);

  // Check if this is an event from a page subscription
  if (body.object === "page") {
    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(async function (entry) {

      console.log(`\u{1F7EA} Entry:`);
      console.log(entry);
      fileLog(`\u{1F7EA} Entry:`);
      fileLog(entry);
      
      // Iterate over webhook events - there may be multiple
      entry.messaging.forEach(async function (webhookEvent) {
        console.log(`\u{1F7EA} WebhookEvent:`);
        console.log(webhookEvent);
        fileLog(`\u{1F7EA} WebhookEvent:`);
        fileLog(webhookEvent);
      });
    });
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

export function startBotFacebook() {

  app.use(express.json()); // Middleware para parsear JSON


  app.post('/webhook', (req, res) => {
    webhookHandler(req, res);
  });

  app.get('/webhook', (req, res) => {
    // Verificar que el webhook proviene de Facebook
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === validToken) {
  
      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error('La verificación falló. La token no coincide.');
      res.sendStatus(403);
    }
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

