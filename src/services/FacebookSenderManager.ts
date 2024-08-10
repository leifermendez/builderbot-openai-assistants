import { fileLog } from '~/utils/filelog';
import { formatAIResponse } from './formatAIResponse';
import { ISenderManager } from './ResponseManager';

const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${process.env.FACEBOOK_APLICATION_TOKEN}`;

class FacebookSenderManager implements ISenderManager {
    formatChunk(chunk: string) {
        return formatAIResponse(chunk);
    }
    getImages(chunk: string) {
        let imagesChunk = chunk.replaceAll(/!\[.*?]\(attachment:(.*?)\)/g, '[image:$1]');
        imagesChunk = imagesChunk.replaceAll(/!\[.*?]\(image:(.*?)\)/g, '[image:$1]');
        const images = imagesChunk.match(/\[image:(.*?)\]/g)

        
        const imageList = [...(images || [])].filter(Boolean)

        const imagesURL = imageList.map(image => {
           
            console.log('Path Image: ' + pathImage)
            const formatImage = image
                .replaceAll('[image:', '')
                .replaceAll(']', '')
                .replaceAll(/\[.*?\]/g, '')

            const pathImage = ImagePathList[formatImage]

            return image.replaceAll('[image:', '').replaceAll(']', '')
        });

        return imagesURL;
    }

    //sendText: (text: string, from: string, to: string) => Promise<any>
    sendText(text: string, from: string, to: string) {
        const data = {
            "recipient": {
                "id": to
            },
            "messaging_type": "RESPONSE",
            "message": {
                "text": text
            }
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        return fetch(url, options)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                fileLog(data);
            })
            .catch((error) => {
                console.error('Error:', error);
                fileLog(error);
            });


    }


    //sendImage: (url: string, from: string, to: string) => Promise<any>;
    sendImage(url: string, from: string, to: string) {
        const data = {
            "recipient": {
                "id": to
            },
            "messaging_type": "RESPONSE",
            "message": {
                "attachment": {
                    "type": "image",
                    "payload": {
                        "url": url,
                        "is_reusable": true
                    }
                }
            }
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        return fetch(url, options)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                fileLog(data);
            })
            .catch((error) => {
                console.error('Error:', error);
                fileLog(error);
            });

    }
    sendImageAndText: (text: string, url: string) => Promise<any>;

}