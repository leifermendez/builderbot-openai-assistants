
import "dotenv/config"
import express from 'express';
import { stringify } from 'flatted';
import fs from "fs"; // Add this line to import the 'fs' module

const app = express();
const port = 3009;
const validToken = process.env.FACEBOOK_VALIDATION_TOKEN

function cloneObjectWithProperties(originalObject, newObject) {
  for (const key in originalObject) {
    // eslint-disable-next-line no-prototype-builtins
    if (originalObject.hasOwnProperty(key)) {
      // check if the property/key is object
      if (typeof originalObject[key] === 'object') {
        // call the function recursively
        newObject[key] = {};
        cloneObjectWithProperties(originalObject[key], newObject[key]);
      } else {
        newObject[key] = originalObject[key];
      }
    }
  }
}

function webhookHandler(req, res, method) {
  //console.log('Webhook in post recibido:');
  //console.log(stringify(req, null, 2));
  //console.log('Webhook verificado');

  // Crear txt con el contenido del request
  fs.writeFile(method + '_webhook.txt', stringify(req, null, 2), function (err) {
    if (err) throw err;
    console.log(`Archivo ${method}_webhook.txt creado`);
  });
  
  // Verificar que el webhook proviene de Facebook
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === validToken) {
        
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('La verificación falló. La token no coincide.');
    res.sendStatus(403);
  }
}

export function startBotFacebook(){

    app.use(express.json()); // Middleware para parsear JSON

    
    app.post('/webhook', (req, res) => {
      webhookHandler(req, res, 'post');
    });
    
    app.get('/webhook', (req, res) => {
      webhookHandler(req, res, 'get');
    });

    app.get('/downloadPost', (req, res) => {
      res.download('post_webhook.txt');
    });
    
    app.get('/downloadGet', (req, res) => {
      res.download('get_webhook.txt');
    });

    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}/webhook`);
    });
}