import OpenAI from "openai";
import { fileLog } from "~/utils/filelog";

const openai = new OpenAI();

const threadList = [];

async function getThread(userId, clientID) {
    let thread = threadList[`user_${userId}_client_${clientID}`];
    if (!thread) {
        thread = await openai.beta.threads.create();
        threadList[`user_${userId}_client_${clientID}`] = thread;
    }
    return thread;
}

export async function askIA(userId, clientID, message) {
    // get assistant
    //const assistant = await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);
    
    // get or create thread for user-client
    console.log("askIA-1");
    const thread = await getThread(userId, clientID);

    
    // add message to thread using assistant
    console.log("askIA-2");
    console.log("message: ", message);
    const messageAI = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: message
        }
    );
    
    // run assistant on thread
    console.log("askIA-3");
    const stream = await openai.beta.threads.runs.create(
        thread.id,
        { 
            assistant_id: process.env.ASSISTANT_ID,
            stream: true
        }
    );

    // get response from assistant
    console.log("askIA-4");
    for await (const event of stream) {
        console.log(event);
        fileLog(event);
        return event;
    }
}