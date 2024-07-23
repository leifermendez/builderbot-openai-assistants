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
    const assistant = await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);
    
    // get or create thread for user-client
    const thread = await getThread(userId, clientID);

    
    const stream = await openai.beta.threads.runs.create(
        thread.id,
        { assistant_id: "asst_123", stream: true }
      );
    
      
    // add message to thread using assistant
    const messageAI = await openai.beta.threads.messages.create(
        thread.id,
        {
            role: "user",
            content: message,
        }
    );

    for await (const event of stream) {
        console.log(event);
        fileLog(event);
        return event;
    }
}