import "dotenv/config"

import { startBotWhatsApp } from "./services/whatsapp";
import { startBotFacebook } from "./services/facebook";

const activeWhatsApp = process.env.BOT_WHATSAPP_SUPPORT;
if (activeWhatsApp === 'true') {
    startBotWhatsApp();
}

const activeFacebook = process.env.BOT_FACEBOOK_SUPPORT;
if (activeFacebook === 'true') {
    startBotFacebook();
}

