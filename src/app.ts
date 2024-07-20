import "dotenv/config"

import { startBotWhatsApp } from "./bots/whatsapp";
import { startBotFacebook } from "./bots/facebook";

const activeWhatsApp = process.env.BOT_WHATSAPP_SUPPORT;
if (activeWhatsApp === 'true') {
    startBotWhatsApp();
}

const activeFacebook = process.env.BOT_FACEBOOK_SUPPORT;
if (activeFacebook === 'true') {
    startBotFacebook();
}

