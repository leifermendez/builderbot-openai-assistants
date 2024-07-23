import "dotenv/config"

import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants"
import { typing } from "../utils/presence"
//import { pipeline, WhisperProcessor, WhisperForConditionalGeneration } from '@xenova/transformers';
import { dirname } from "path"
import { fileURLToPath } from "url";
import { ImagePathList } from "../ImagePathList";
import { speechToText } from "../audioToText/audioToText"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env?.PORT ?? 3008
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''
const IA_ACTIVE = process.env?.IA_ACTIVE ?? 'false'
const isIAActive = IA_ACTIVE === 'true'

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        try {
            /*console.log("Welcome Flow")
            console.log(ctx)
            //console.log(state)
            //console.log(provider)
            console.log(ctx.message)
            console.log(ctx.message.extendedTextMessage)
            console.log(ctx.message.extendedTextMessage.contextInfo)*/

            await typing(ctx, provider)
            await responseText(ctx.body, state, flowDynamic, getQuoted(ctx))
        } catch (error) {
            console.error(error)
        }
    })


async function responseText(text: string, state: any, flowDynamic: any, quotedMessage: string | null = null) {
    //console.log("Response Text Start")
    const response = await responseFromAI(text, state, quotedMessage)
    if (response == "") {
        await flowDynamic([{ body: "Ahora mismo no puedo responder" }])
        return
    }
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

    if (formatChunk.trim() == "") {
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

async function responseFromAI(text, state, quotedMessage) {
    if (!isIAActive) {
        return ""
    }
    const dialog = quotedMessage ? `{quote: ${quotedMessage}, text: ${text}}` : text
    const response = await toAsk(ASSISTANT_ID, dialog, state)
    return response
}

const audioFlow = addKeyword<Provider, Database>(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        try {
            await typing(ctx, provider)
            //console.log(ctx)

            ///mnt/f/Proyectos/builderbot-openai-assistants/src/bots
            //remove last folder
            const path = __dirname.split('/').slice(0, -1).join('/')
            //console.log(path)

            //write the audio file
            const localPath = await provider.saveFile(ctx, { path: path + "/tmp" });
            //console.log(localPath)

            const text = await speechToText(localPath);
            if (text == "") {
                await showResponseFlowDynamic("Ahora mismo no puedo escuchar", flowDynamic)
                return
            }

            //const text2 = await speechToText(localPath);
            //console.log(text);
            //await flowDynamic([{ body: "En esta demo no se admite audio" }]);
            await responseText("(Audio: " + text + ")", state, flowDynamic, getQuoted(ctx))
        } catch (error) {
            await showResponseFlowDynamic("Ahora mismo no puedo escuchar", flowDynamic)
        }
    })


const documentFlow = addKeyword<Provider, Database>(EVENTS.DOCUMENT)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Document Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })

const locationFlow = addKeyword<Provider, Database>(EVENTS.LOCATION)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Location Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })

const mediaFlow = addKeyword<Provider, Database>(EVENTS.MEDIA)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Media Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })

const orderFlow = addKeyword<Provider, Database>(EVENTS.ORDER)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Order Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })

const templateFlow = addKeyword<Provider, Database>(EVENTS.TEMPLATE)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Template Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })


const actionFlow = addKeyword<Provider, Database>(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        console.log("Action Flow")
        console.log(ctx)
        console.log(state)
        console.log(provider)
    })



function getQuoted(ctx) {
    try {
        let conversation = ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim();
        conversation = conversation === undefined || conversation === "" ? null : conversation;
        let caption = ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption.trim();
        caption = caption === undefined || caption === "" ? null : caption;

        //console.log("Conversation: ")
        //console.log(conversation)
        //console.log("Caption: ")
        //console.log(caption)
        //console.log("CTX: ")
        //console.log(ctx)
        //console.log("quotedMessage: ")
        //console.log(ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage)
        let quotedMessage = conversation !== undefined || conversation !== null || conversation !== "" ? conversation : null;
        if (quotedMessage == null) {
            quotedMessage = caption !== undefined || caption !== null ? caption : null;
        }

        //console.log("quoted: ")
        //console.log(quotedMessage)
        return quotedMessage;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
export const startBotWhatsApp = async () => {
    const adapterFlow = createFlow([welcomeFlow, audioFlow, documentFlow, locationFlow, mediaFlow, orderFlow, templateFlow, actionFlow])
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

