const {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const game = require("../introduction/game.json");
const DailyCharacterPoll = require("../models/daily-character-poll");

function getTwoRandomCharacters(characters) {
  const shuffled = [...characters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

async function checkDailyCharacterPoll(client) {
  const polls = await DailyCharacterPoll.find({ active: true });

  for (const poll of polls) {
    const { guild_id, channel_id, last_poll_date } = poll;

    const now = new Date();
    const twentyFourHoursMinus15Min = 24 * 60 * 60 * 1000 - 15 * 60 * 1000;

    // Check if it's time to send a new poll
    const needsPoll =
      !last_poll_date ||
      now - new Date(last_poll_date) >= twentyFourHoursMinus15Min;

    if (!needsPoll) continue;

    try {
      const guild = await client.guilds.fetch(guild_id);
      const channel = await guild.channels.fetch(channel_id);

      if (!channel || channel.type !== ChannelType.GuildText) {
        console.warn(`Invalid channel for guild ${guild_id}`);
        continue;
      }

      const [char1, char2] = getTwoRandomCharacters(game.characters);

      await channel.send({
        poll: {
          question: { text: "Who's your favorite?" },
          answers: [{ text: char1.name }, { text: char2.name }],
          allowMultiSelect: false,
          duration: 24,
        },
      });

      // Update the last_poll_date in DB
      poll.last_poll_date = now;
      await poll.save();
    } catch (err) {
      console.error(`❌ Failed to send poll to guild ${guild_id}:`, err);
    }
  }
}

module.exports = checkDailyCharacterPoll;
