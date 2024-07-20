import "dotenv/config";

const activeFacebook = process.env.BOT_FACEBOOK_SUPPORT;
const activeWhatsApp = process.env.BOT_WHATSAPP_SUPPORT;

async function startBots() {
  if (activeWhatsApp === 'true') {
    const { startBotWhatsApp } = await import("./bots/whatsapp");
    startBotWhatsApp();
  }

  if (activeFacebook === 'true') {
    const { startBotFacebook } = await import("./bots/facebook");
    startBotFacebook();
  }
}

startBots();