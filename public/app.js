import 'dotenv/config';
import express from 'express';

const app = express();
const port = 3009;
function startBotFacebook() {
    app.use(express.json());
    app.post('/webhook', (req, res) => {
        console.log('Webhook recibido:');
        console.log(req);
        res.status(200).send('Webhook recibido');
    });
    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}

startBotFacebook();
