const StaffRole = require("../models/staff-role");
const createEmbed = require("../helpers/embed");

async function handleStaffRoleCommand(interaction, client) {
  const { guildId } = interaction;
  const staffRoleId = interaction.options.getRole("role").id;

  try {
    // Upsert the staff role for the guild
    await StaffRole.findOneAndUpdate(
      { guild_id: guildId },
      { id: staffRoleId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const title = "Staff Role";
    const description = `✅ Staff role has been set to <@&${staffRoleId}>.`;
    const embed = createEmbed(title, description, "");

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error("Error saving staff role:", error);
    const title = "Staff Role";
    const description = `❌ There was an error saving the staff role.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleStaffRoleCommand;
