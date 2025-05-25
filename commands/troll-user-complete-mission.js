const TrolledUser = require("../models/trolled-users");
const TrollMissions = require("../models/troll-missions");
const createEmbed = require("../helpers/embed");
const getBotChannel = require("../helpers/get-bot-channel");
const { ChannelType } = require("discord.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function handleTrollUserCompleteMissionCommand(interaction, client) {
  const { guildId } = interaction;

  await interaction.deferReply({ ephemeral: false });

  // Find each option by name
  const complete_user = interaction.options.getUser("user").id;
  const message_link = interaction.options.getString("message-link");

  let channelId;
  let channel;
  try {
    const trolled_user = await TrolledUser.findOne({
      guild_id: guildId,
      user_id: complete_user,
    });

    if (trolled_user) {
      // Get the channel_id from the deleted document
      channelId = trolled_user.channel_id;

      // Delete the channel using the Discord API
      channel = await client.channels.fetch(channelId);
    } else {
      throw new Error("No troll user found to delete.");
    }

    let messageId;
    if (message_link) {
      messageId = extractChannelAndMessageId(message_link);
    } else {
      const last_message_link = await getLastMessageLink(
        channelId,
        trolled_user.user_id,
        client
      );
      messageId = extractChannelAndMessageId(last_message_link);
    }
    if (channel) {
      const message = await channel.messages.fetch(messageId);
      if (message) {
        const completed_troll_mission = await TrollMissions.findOne({
          _id: trolled_user.mission_id,
        });
        const title = `Troll Mission Completed`;
        const description =
          `<@${message.author.id}> has completed their troll mission and has regained access to the server. More info on the completed troll mission:\n\n` +
          `- **${completed_troll_mission.name}**\n` +
          (completed_troll_mission.description
            ? `  ${completed_troll_mission.description}\n`
            : "") +
          "\n" +
          `<@${message.author.id}>'s troll mission entry:\n\n` +
          (message.content ? `***"${message.content}"***` : "");
        const color = "";
        const embed = createEmbed(title, description, color);

        const bot_channel = await getBotChannel(guildId);
        const botChannel = await client.channels.fetch(bot_channel.channel);

        const attachmentImage = message.attachments.first();
        if (attachmentImage) {
          const imageUrl = attachmentImage.url;
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error("Failed to fetch image");
          const attachmentBuffer = await response.buffer();
          const attachmentName = message.attachments.first().name;
          // Set the image in the embed using the attachment URL
          embed.setImage(`attachment://${attachmentName}`);

          if (botChannel) {
            await botChannel.send({
              embeds: [embed],
              files: [{ attachment: attachmentBuffer, name: attachmentName }],
            });
          }
        } else {
          if (botChannel) {
            await botChannel.send({
              embeds: [embed],
            });
          }
        }

        if (channel) {
          await channel.delete("Trolled user mission completed.");
        } else {
          throw new Error("Channel not found to remove.");
        }

        // Remove the "Trolled" role from the user
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(complete_user); // Ensure `guild` is your Guild object
        const role = guild.roles.cache.find((role) => role.name === "Trolled");
        if (role && member) {
          await member.roles.remove(role);
          // Add back all the previous roles
          for (const roleId of trolled_user.previous_roles) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
              await member.roles.add(role);
              logger.success(
                `Successfully added role "${role.name}" to user ${member.user.tag}`
              );
            } else {
              logger.warn(
                `Role with ID ${roleId} no longer exists in the guild.`
              );
            }
          }
          logger.success(`Removed 'Trolled' role from user: ${complete_user}`);
        } else {
          throw new Error("Role not found or user not found.");
        }
        await TrolledUser.deleteOne({
          guild_id: guildId,
          user_id: complete_user,
        });
      } else {
        throw new Error("Message not found.");
      }
    } else {
      throw new Error("Channel not found.");
    }
  } catch (error) {
    logger.error("Troll Missions error: ", error);

    const title = "Troll User Complete Mission Error";
    const description = `I could not complete the troll mission, please try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);
    await interaction.editReply({ embeds: [embed] });
  }
}

function extractChannelAndMessageId(messageLink) {
  const regex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
  const match = messageLink.match(regex);
  if (match) {
    const messageId = match[3];
    return messageId;
  }
  throw new Error("Invalid message link format");
}

async function getLastMessageLink(channelId, user_id, client) {
  try {
    // Fetch the channel using the channelId
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Channel not found or is not a text channel.");
    }

    // Fetch messages in the channel and filter by user_id
    const messages = await channel.messages.fetch({ limit: 10 }); // Increase limit to fetch more messages if needed
    const userMessage = messages.find(
      (message) => message.author.id === user_id
    );

    if (!userMessage) {
      return null; // No messages found from the specified user
    }

    // Return the link to the last message from the specified user
    return `https://discord.com/channels/${channel.guild.id}/${channel.id}/${userMessage.id}`;
  } catch (error) {
    logger.error("Error retrieving last message link from user:", error);
    return null; // Handle errors appropriately
  }
}

module.exports = handleTrollUserCompleteMissionCommand;
