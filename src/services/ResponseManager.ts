import { promises } from "dns";
import { speechToText } from "~/audioToText/audioToText";


export interface ISenderManager {
    formatChunk: (chunk: string) => string
    getImages: (chunk: string) => string[]
    sendText: (text: string, from: string, to: string) => Promise<any>
    sendImage: (url: string, from: string, to: string) => Promise<any>
    sendImageAndText: (text: string, url: string) => Promise<any>
}

export interface IAgentManager {
    ask: (text: string, from: string, to: string) => Promise<string>
}


export class ResponseManager {
    sender: ISenderManager;
    agent: IAgentManager;

    constructor(sender: ISenderManager, agent: IAgentManager) {
        this.sender = sender;
        this.agent = agent;
    }

    getChunks(text: string) {
        return text.split(/\n\n+/);
    }

    async responseText(text: string, from: string, to: string) {
        await this.agent.ask(text, from, to);

        const chunks = this.getChunks(text);
        chunks.map(async (chunk) => {
            const formatChunk = this.sender.formatChunk(chunk);
            const images = this.sender.getImages(chunk);
            if (images.length == 1) {
                if (formatChunk == "") {
                    this.sender.sendImage(images[0], from, to);
                } else {
                    this.sender.sendImageAndText(formatChunk, images[0]);
                }
            } else {
                if (images.length > 1) {
                    this.sender.sendText(formatChunk, from, to);
                    images.map(async (image) => {
                        this.sender.sendImage(image, from, to);
                    });
                }
            }
        });
    }


    async responseAudio(path: string, from: string, to: string) {
        const text = await speechToText(path);
        this.responseText(text, from, to);
    }
}
