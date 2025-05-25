const Games = require("../models/games");
const createEmbed = require("../helpers/embed");

async function handleGamesCommand(interaction, client) {
  const { guildId } = interaction;
  await interaction.deferReply({ ephemeral: false });
  try {
    const games = await Games.find({ guild_id: guildId });

    if (games.length === 0) {
      const title = "Games";
      const description = `I couldn't find any games.`;
      const color = "error";
      const embed = createEmbed(title, description, color);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
      return;
    }

    const games_list = [];
    games.forEach((game) => {
      // Create a field for each game
      games_list.push({
        name: game.name,
        value: game.description ? game.description : "No description available",
        inline: false, // You can set this to `true` to display fields inline
      });
    });

    const title = "Games";
    const description = "These are all the games:\n\u200B\n";
    const embed = createEmbed(title, description, "");
    embed.addFields(games_list); // Add the fields to the embed

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Games error: ", error);

    const title = "Games Error";
    const description = `Something went wrong while trying to get the games list, please contact the administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);
    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = handleGamesCommand;
