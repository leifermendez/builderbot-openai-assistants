import "dotenv/config"
import fs from "fs"; // Add this line to import the 'fs' module

import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants"
import { recording, typing } from "./utils/presence"
//import { pipeline, WhisperProcessor, WhisperForConditionalGeneration } from '@xenova/transformers';
import path, { dirname, join } from "path"
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ImagePathList } from "./ImagePathList";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env?.PORT ?? 3008
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        try {
            await typing(ctx, provider)
            await responseText(ctx.body, state, flowDynamic)
        } catch (error) {
            console.error(error)
        }
    })

async function responseText(text: string, state: any, flowDynamic: any) {
    //console.log("Response Text Start")
    const response = await responseFromAI(text, state)
    //console.log("Response From AI")
    const chunks = response.split(/\n\n+/);
    for (const chunk of chunks) {
        await showResponseFlowDynamic(chunk, flowDynamic);
    }
}

async function showResponseFlowDynamic(chunk, flowDynamic) {
    //Original chunk: Antonella - Tallas 27 al 33, Precio: $4,400, Color: Negro ![Antonella](attachment:3-Antonella)
    //Format chunk:  Antonella - Tallas 27 al 33, Precio: $4,400, Color: Negro
    let formatChunk = chunk
        //.replaceAll(/\[.*?\]/g, '')
        .replaceAll(/【.*?】/g, '')
        //remove ![Antonella](attachment:3-Antonella)
        //.replaceAll(/!\[.*?]\(.*?\)/g, '')
        .replaceAll(/!\[.*?]\(image:(.*?)\)/g, '')
        //remove [image:9-Stefany]
        .replaceAll(/\[image:[^\]]+\]/g, '')
        .replaceAll(": .", ':')
        .replaceAll(":.", ':')
        .trim()
        ;

    // Format from
    //\[ 120 \text{ pares} \times \$14,000 \text{ por par} = \$1,680,000 \]
    //to 
    // 120 pares x $14,000 por par = $1,680,000
     // Paso 1: Remover los delimitadores de LaTeX
     formatChunk = formatChunk.replaceAll(/\\\[/g, '').replace(/\\\]/g, '');
    
    // Paso 2: Remover \text{...}
    formatChunk = formatChunk.replaceAll(/\\text\{([^}]+)\}/g, '$1');
    
    // Paso 3: Reemplazar \times con x
    formatChunk = formatChunk.replaceAll(/\\times/g, 'x');
    formatChunk = formatChunk.replaceAll('**', '*');
    
    //if format chunk termina en - Imagen: remove
    formatChunk = formatChunk.replace(/- Imagen:$/, '')

    //if formatChunk termina en - remove
    formatChunk = formatChunk.replace(/-$/, '')

    // if formatChunk termina en : remove
    formatChunk = formatChunk.replace(/:$/, '')

    //if formatChunk is empty change

    if (formatChunk.trim() == ""){
        formatChunk = "."
    }

    //get Images

    // reformat from ![Antonella](attachment:3-Antonella) to [image:3-Antonella]
    let imagesChunk = chunk.replaceAll(/!\[.*?]\(attachment:(.*?)\)/g, '[image:$1]');
    imagesChunk = imagesChunk.replaceAll(/!\[.*?]\(image:(.*?)\)/g, '[image:$1]');
    const images1 = imagesChunk.match(/\[image:(.*?)\]/g)

    const images = [...(images1 || [])].filter(Boolean)

    console.log('Original')
    console.log(chunk)
    console.log('Format')
    console.log(formatChunk)
    console.log('Images')
    console.log(images)
    // if number of images is 0 then show text
    if (images == null || images.length === 0 || images.length > 1) {
        await flowDynamic([{ body: formatChunk.trim() }]);
    }

    if (images == null || images.length === 0) {
        return
    }

    // if number of images is 1 then show only a flow Dynamic    
    if (images.length === 1) {
        console.log("Print one image")
        const formatImage = images[0].replaceAll('[image:', '').replaceAll(']', '')
            //remove ()[]
            .replaceAll(/\[.*?\]/g, '')
        const pathImage = ImagePathList[formatImage]
        console.log('Path Image: ' + pathImage)
        await flowDynamic(
            [{
                body: formatChunk.trim(),
                media: pathImage
            }]);
    }

    // if number of images is more then show first a flow Dynamic with text and imagen and then show a flow Dynamic for each image
    if (images.length > 1) {
        console.log("Print multiple images")
        for (const image of images) {
            const formatImage = image.replaceAll('[image:', '').replaceAll(']', '')
            const pathImage = ImagePathList[formatImage]
            console.log('Path Image: ' + pathImage)
            await flowDynamic(
                [{
                    body: '.',
                    media: pathImage
                }]);
        }
    }

}

async function responseFromAI(text, state) {
    const response = await toAsk(ASSISTANT_ID, text, state)
    //console.log("original response:")
    //console.log(response)
    //response = response.replaceAll(/\[.*?\]/g, '').replaceAll(/【.*?】/g, '')
    //console.log("format response:")
    //console.log(response)
    return response
}

const audioFlow = addKeyword<Provider, Database>(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        try {
            await recording(ctx, provider)
            console.log(ctx)

            console.log(__dirname)
            //write the audio file
            const localPath = await provider.saveFile(ctx, { path: __dirname + "/tmp" });
            console.log(localPath)

            const text = await speechToText(localPath);
            //const text2 = await speechToText(localPath);
            //console.log(text);
            //await flowDynamic([{ body: "En esta demo no se admite audio" }]);
            await responseText("(Audio: " + text + ")", state, flowDynamic)
        } catch (error) {
            await showResponseFlowDynamic("El audio no se puede escuchar", flowDynamic)
        }
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
    console.log("Transcription:");
    console.log(transcription.text);
    return transcription.text;
}

main()
