import "dotenv/config"
import fs from "fs"; // Add this line to import the 'fs' module

import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants"
import { recording, typing } from "./utils/presence"
//import { pipeline, WhisperProcessor, WhisperForConditionalGeneration } from '@xenova/transformers';
import path, { dirname } from "path"
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env?.PORT ?? 3008
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''
/*
const pipe = await pipeline(
    'automatic-speech-recognition'
    , 'openai/whisper-large'
);
*/
const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        await typing(ctx, provider)
        /*let response = await toAsk(ASSISTANT_ID, ctx.body, state)
        console.log("original response:")
        console.log(response)
        response = response.replaceAll(/\[.*?\]/g, '').replaceAll(/【.*?】/g, '')
        console.log("format response:")
        console.log(response)*/

        await responseText(ctx.body, state, flowDynamic)
    })

async function responseText(text: string, state: any, flowDynamic: any) {
    const response = await responseFromAI(text, state)
    const chunks = response.split(/\n\n+/);
    for (const chunk of chunks) {
        await flowDynamic([{ body: chunk.trim() }]);
    }
}

async function responseFromAI(text, state) {
    let response = await toAsk(ASSISTANT_ID, text, state)
    console.log("original response:")
    console.log(response)
    response = response.replaceAll(/\[.*?\]/g, '').replaceAll(/【.*?】/g, '')
    console.log("format response:")
    console.log(response)
    return response
}

const audioFlow = addKeyword<Provider, Database>(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        await recording(ctx, provider)
        console.log(ctx)
        //create a local file temp.ogg
        //const tempPath = createTempFile(__dirname, 'temp.ogg');
        //console.log(tempPath)

        console.log(__dirname)
        //write the audio file
        const localPath = await provider.saveFile(ctx, { path: __dirname + "/tmp" });
        console.log(localPath)

        //const audioDataBuffer = fs.readFileSync(localPath);


        // Asegurarse de que la longitud del Buffer sea un múltiplo de 4
        //const bufferLength = audioDataBuffer.byteLength;
        //const adjustedLength = bufferLength - (bufferLength % 4);
        //const adjustedBuffer = audioDataBuffer.slice(0, adjustedLength);


        //console.log("Hasta aquí funciona")
        //const audioData = new Float32Array(adjustedBuffer);
        //convert the audio file to text
        const text = await speechToText(localPath);
        console.log(text);
        //await flowDynamic([{ body: "En esta demo no se admite audio" }]);
        await responseText(text, state, flowDynamic)
    })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, audioFlow])
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpInject(adapterProvider.server)
    httpServer(+PORT)
}

const openai = new OpenAI();

async function speechToText(filePath) {
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
    });

    //console.log(transcription.text);
    return transcription.text;
}

//main2()
main()
