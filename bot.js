require('dotenv/config');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const handleSlashCommand = require('./handlers.js');

const mongoose = require('mongoose');
const mongodb_URI = require('./mongodb/URI');


mongoose.connect(mongodb_URI)
.then(() => {
  console.log('DB connected!')
})
.catch((err) => {
  console.log(err);
})

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Express server setup for handling interactions
const app = express();
const PORT = process.env.PORT || 3000;

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
    // console.log('Received interaction:', req.body);

    const { type } = req.body;

  if (type === InteractionType.APPLICATION_COMMAND) {
    const response = await handleSlashCommand(req.body, client);
    return res.send(response);
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Express server listening on port', PORT);
});

client.login(process.env.DISCORD_TOKEN);