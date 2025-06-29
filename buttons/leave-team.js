const { EmbedBuilder } = require("discord.js");
const createEmbed = require("../helpers/embed");
const TeamAssignments = require("../models/team-assignments");
const Events = require("../models/events");

async function handleLeaveTeamButton(interaction, client) {
  const customIdParts = interaction.customId.split(":");
  const eventId = customIdParts[1];

  try {
    const user = interaction.member.user;

    // Ensure the event exists
    const event = await Events.findOne({ _id: eventId });
    if (!event) {
      const embed = createEmbed(
        "Leave Event Error",
        "This event does not exist or has been removed.",
        "error"
      );
      await interaction.followUp({ embeds: [embed], flags: 64 });
      return;
    }

    // Check if the user is part of the event
    const assignment = await TeamAssignments.findOneAndDelete({
      guild_id: interaction.guildId,
      event_id: eventId,
      user: user.id,
    });

    if (!assignment) {
      const embed = createEmbed(
        "Leave Event Error",
        "You are not currently signed up for this event.",
        "error"
      );
      await interaction.followUp({ embeds: [embed], flags: 64 });
      return;
    }

    // Update embed to remove the user
    await removeUserFromEmbed(interaction, client, user);

    const embed = createEmbed(
      "Left Event",
      "You have successfully left the event.",
      ""
    );
    await interaction.followUp({ embeds: [embed], flags: 64 });
  } catch (error) {
    logger.error("Leave Event Error:", error);
    const embed = createEmbed(
      "Leave Event Error",
      "Something went wrong while trying to leave the event. Please try again later.",
      "error"
    );
    await interaction.followUp({ embeds: [embed], flags: 64 });
  }
}

async function removeUserFromEmbed(interaction, client, user) {
  try {
    const channel = await client.channels.fetch(interaction.channel.id);
    const message = await channel.messages.fetch(interaction.message.id);

    if (!message.embeds || message.embeds.length === 0) {
      throw new Error("No embeds found in the message.");
    }

    const embed = new EmbedBuilder(message.embeds[0].toJSON());

    if (embed.data.fields) {
      const field = embed.data.fields.find((f) => f.name === "Applied Members");

      if (field) {
        // Remove user from list
        const lines = field.value.split("\n").filter((line) => {
          return !line.includes(user.globalName);
        });

        if (lines.length > 0) {
          field.value = lines.join("\n");
        } else {
          // If no one left, remove the field
          embed.spliceFields(
            embed.data.fields.findIndex((f) => f.name === "Applied Members"),
            1
          );
        }

        await message.edit({ embeds: [embed] });
      }
    }
  } catch (error) {
    logger.error("Error removing user from embed:", error);
  }
}

module.exports = handleLeaveTeamButton;
