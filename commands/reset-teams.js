const Teams = require("../models/teams");
const createEmbed = require("../helpers/embed");

async function handleResetTeamsCommand(interaction, client) {
  const { guildId } = interaction;

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

      const title = "Reset Teams";
      const description = `You have reset the teams succesfully.`;
      const color = "";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], flags: 64 });
    } else {
      const title = "Error Teams";
      const description = `I could not find any teams, please set your teams using the \`/set-teams\` command.`;
      const color = "error";
      const embed = createEmbed(title, description, color);

      await interaction.editReply({ embeds: [embed], flags: 64 });
    }
  } catch (error) {
    logger.error("Error Reset Teams:", error);
  }
}

module.exports = handleResetTeamsCommand;
