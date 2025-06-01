const Teams = require("../models/teams");
const createEmbed = require("../helpers/embed");
const { ActivityType } = require("discord.js");

async function handleSetStatusCommand(interaction, client) {
  // Find each option by name
  const status = interaction.options.getString("status");

  try {
    client.user.setPresence({
      activities: [{ type: ActivityType.Custom, name: status, state: status }], // Custom status message
      status: "online", // Bot status (can be 'online', 'idle', 'dnd', 'invisible')
    });

    const title = "Status Set";
    const description = `You have succesfully set a new status for Paimon.\n\n **${status}**`;
    const color = "";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
  } catch (error) {
    logger.error("Set Status Error:", error);
    const title = "Status Set Error";
    const description = `Something went wrong, please try again later.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], flags: 64 });
  }
}

module.exports = handleSetStatusCommand;
