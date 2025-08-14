const Events = require("../models/events");
const Teams = require("../models/teams");
const TeamAssignments = require("../models/team-assignments");
const createEmbed = require("../helpers/embed");
const getBotChannel = require("../helpers/get-bot-channel");

async function handleCancelEventCommand(interaction, client) {
  const { guildId } = interaction;

  try {
    const event = await Events.findOneAndDelete({ guild_id: guildId });
    if (event) {
      // Call the function to delete the event message from the server
      await deleteEventMessage(
        client,
        event.guild_id,
        event.channel_id,
        event.message_id
      );
    }
    const removeTeamAssignments = await TeamAssignments.deleteMany({
      guild_id: guildId,
    });
    await resetTeams(client, guildId);

    const title = "Event Canceled";

    let description = `The event below has been canceled:`;
    let color = "error";
    let embed = createEmbed(title, description, color);
    const chunks = [];
    const text = event.description || "No description available";
    for (let i = 0; i < text.length; i += 1024) {
      chunks.push(text.slice(i, i + 1024));
    }

    const event_fields = chunks.map((chunk, index) => ({
      name: index === 0 ? event.name.slice(0, 256) : "\u200B", // empty name for subsequent fields
      value: chunk,
      inline: false,
    }));

    embed.addFields(event_fields);

    const bot_channel = await getBotChannel(guildId);
    const botChannel = await client.channels.fetch(bot_channel.channel);
    if (botChannel) {
      await botChannel.send({
        embeds: [embed],
      });
    }

    color = "";
    description = `Event successfully canceled and teams have been reset.`;
    embed = createEmbed(title, description, color);

    try {
      const events = await Events.find({ guild_id: guildId });
      const list_type = "events";
      if (events) {
        let events_list = [];
        events.forEach((event) => {
          const event_info = {
            name: event.name,
            value: event._id.toString(),
          };
          events_list.push(event_info);
        });
      } else {
        throw new Error("Could not find event");
      }
    } catch (error) {
      logger.error("Error Finding Event:", error);
      const title = "Event Error";
      const description = `Event could not be cancelled because I could not find any event.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    logger.error("Error Canceling Event:", error);

    const title = "Event Cancel Error";
    const description = `Event couldn't be canceled, please contact the administrator or try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

async function resetTeams(client, guildId) {
  try {
    const teams = await Teams.findOne({ guild_id: guildId });

    if (teams) {
      const guild = await client.guilds.fetch(guildId);
      const members = await guild.members.fetch(); // Fetch all members in the guild

      for (const member of members.values()) {
        if (member.roles.cache.has(teams.team_1)) {
          await member.roles.remove(teams.team_1); // Remove team_1 role from member
        }
        if (member.roles.cache.has(teams.team_2)) {
          await member.roles.remove(teams.team_2); // Remove team_2 role from member
        }
      }
    }
    return;
  } catch (error) {
    logger.error("Error Reset Teams:", error);
  }
}

async function deleteEventMessage(client, guildId, channelId, messageId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId); // Fetch and delete the message by messageId
    const message = await channel.messages.fetch(messageId);
    if (message) {
      await message.delete();
    } else {
      logger.warn(`Event message with ID ${messageId} not found.`);
    }
  } catch (error) {
    logger.error(`Error deleting message (event) with ID ${messageId}:`, error);
  }
}

module.exports = handleCancelEventCommand;
