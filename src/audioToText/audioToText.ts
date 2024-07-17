import "dotenv/config"
import fs from "fs"; // Add this line to import the 'fs' module
import OpenAI from "openai";

const IA_ACTIVE = process.env?.IA_ACTIVE ?? 'false'
const isIAActive = IA_ACTIVE === 'true'

const openai = new OpenAI();

export async function speechToText(filePath) {
    if (!isIAActive) {
        return ""
    }
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
    });
    console.log("Transcription:");
    console.log(transcription.text);
    fs.unlinkSync(filePath);
    return transcription.text;
}