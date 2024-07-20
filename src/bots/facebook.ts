
import "dotenv/config"
import express from 'express';

const app = express();
const port = 3009;
const validToken = process.env.FACEBOOK_VALIDATION_TOKEN

export function startBotFacebook(){

    app.use(express.json()); // Middleware para parsear JSON

    app.post('/webhook', (req, res) => {
      console.log('Webhook in post recibido:');
      console.log(req);
      console.log('Webhook verificado');
      console.log('Query:');
      console.log(req.query);
      
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