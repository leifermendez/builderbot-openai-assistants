
import "dotenv/config"
import express from 'express';
import { stringify } from 'flatted';

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

export function startBotFacebook(){

    app.use(express.json()); // Middleware para parsear JSON

    app.post('/webhook', (req, res) => {
      console.log('Webhook in post recibido:');
      console.log(stringify(req, null, 2));
      console.log('Webhook verificado');
      
      // Verificar que el webhook proviene de Facebook
      if (req.query['hub.mode'] === 'subscribe' &&
          req.query['hub.verify_token'] === validToken) {
            
        res.status(200).send(req.query['hub.challenge']);
      } else {
        console.error('La verificación falló. La token no coincide.');
        res.sendStatus(403);
      }
    });    
    
    app.get('/webhook', (req, res) => {
      console.log('Webhook in get recibido:');
      console.log(req);
      console.log('Webhook verificado');
      // Verificar que el webhook proviene de Facebook
      if (req.query['hub.mode'] === 'subscribe' &&
          req.query['hub.verify_token'] === validToken) {
            
        res.status(200).send(req.query['hub.challenge']);
      } else {
        console.error('La verificación falló. La token no coincide.');
        res.sendStatus(403);
      }

    });

    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}/webhook`);
    });
}