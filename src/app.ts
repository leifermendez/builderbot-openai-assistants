import "dotenv/config";

const activeWhatsApp = process.env.BOT_WHATSAPP_SUPPORT;
if (activeWhatsApp === 'true') {
    const { startBotWhatsApp } = await import("./bots/whatsapp");
    startBotWhatsApp();
}

const activeFacebook = process.env.BOT_FACEBOOK_SUPPORT;
if (activeFacebook === 'true') {
    const { startBotFacebook } = await import("./bots/facebook");
    startBotFacebook();
}
