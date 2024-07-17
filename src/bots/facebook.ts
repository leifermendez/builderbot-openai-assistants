
import express from 'express';

const app = express();
const port = 3009;


export function startBotFacebook(){

    app.use(express.json()); // Middleware para parsear JSON

    app.post('/webhook', (req, res) => {
      console.log('Webhook recibido:');
      console.log(req);
      // Aquí puedes procesar el webhook como necesites
      res.status(200).send('Webhook recibido');
    });
    
    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}