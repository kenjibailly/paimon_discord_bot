require('dotenv/config');
const consoleColors = require('../helpers/console-colors');

async function DiscordRequest(endpoint, options) {
  const fetch = await import('node-fetch').then(mod => mod.default);
  const url = 'https://discord.com/api/v10/' + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json();
    console.error(consoleColors("red"), res.status);
    throw new Error(JSON.stringify(data));
  }
  return res;
}

async function InstallGuildCommands(appId, commands, guildId) {
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
    console.log(consoleColors("green"), 'Commands registered or updated successfully.');
  } catch (err) {
    console.error(consoleColors("red"), 'Error registering commands:', err);
  }
}

module.exports = { DiscordRequest, InstallGuildCommands };