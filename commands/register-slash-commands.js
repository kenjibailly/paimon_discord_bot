const registerCommands = require("../commands/deploy-commands");
const createEmbed = require("../helpers/embed");

async function handleRegisterSlashCommandsCommand(interaction) {
  const guild = interaction.guild;
  const guildId = interaction.guildId;

  try {
    logger.log(
      `Registering commands for guild: ${guild.name} (ID: ${guildId})`
    );

    // Register the commands
    await registerCommands(guildId);

    // Success embed
    const embed = createEmbed(
      "Commands Registered",
      `✅ Slash commands successfully registered for **${guild.name}**.`,
      ""
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    logger.error(`Failed to register commands for ${guild.name}:`, err);

    // Error embed
    const embed = createEmbed(
      "Registration Failed",
      `❌ Could not register commands for **${guild.name}**.`,
      "error"
    );
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = handleRegisterSlashCommandsCommand;
