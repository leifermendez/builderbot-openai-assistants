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
        console.log("askIA-5");
        fileLog("askIA-5");

        console.log(event);
        fileLog(event);
        if (event.event == "thread.message.completed") {
            const data = event.data;
            //data: {"id":"msg_001","object":"thread.message","created_at":1710330641,"assistant_id":"asst_123","thread_id":"thread_123","run_id":"run_123","status":"completed","incomplete_details":null,"incomplete_at":null,"completed_at":1710330642,"role":"assistant","content":[{"type":"text","text":{"value":"Hello! How can I assist you today?","annotations":[]}}],"metadata":{}}

            // get text from content
            const content = data.content;
            console.log("content: ", content);
            fileLog("askIA content: ");
            fileLog(content);

            let response = "";
            for (const item of content) {
                if (item.type == "text") {
                    response += item.text.value;
                }
            }

            console.log("response: ", response);
            fileLog("askIA response: ");
            fileLog(response);

            return response;            
        }
    }
}