const NextGames = require("../models/next-games");
const Games = require("../models/games");
const createEmbed = require("../helpers/embed");

async function handleNextGamesCommand(interaction, client) {
  const { guildId } = interaction;
  await interaction.deferReply();
  try {
    const upcoming_games = await NextGames.find({ guild_id: guildId }).sort({
      date: 1,
    }); // Sort by date ascending
    if (upcoming_games.length === 0) {
      const title = "Upcoming Games";
      const description = `I couldn't find any upcoming games.`;
      const color = "error";
      const embed = createEmbed(title, description, color);
      await interaction.editReply({ embeds: [embed], flags: 64 });
      return;
    }

    // Get only the required game IDs from upcoming games
    const gameIds = upcoming_games.map((game) => game.game_id);

    // Fetch only the games with those IDs
    const games = await Games.find({
      guild_id: guildId,
      _id: { $in: gameIds },
    });

    // Create a lookup map of games by their _id
    const gameMap = new Map();
    games.forEach((game) => gameMap.set(game._id.toString(), game));

    const upcoming_games_list = [];
    upcoming_games.forEach((upcoming) => {
      const game = gameMap.get(upcoming.game_id.toString());
      if (game) {
        upcoming_games_list.push({
          name: game.name,
          value: game.description
            ? game.description
            : "No description available.",
          inline: false,
        });
      }
    });

    const title = "Upcoming Games";
    const description = "These are all the upcoming games:\n\u200B\n";
    const embed = createEmbed(title, description, "");
    embed.addFields(upcoming_games_list); // Add the fields to the embed

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error("Upcoming Games error: ", error);

    const title = "Upcoming Games Error";
    const description = `Something went wrong while trying to get the upcoming games list, please contact the administrator.`;
    const color = "error";
    const embed = createEmbed(title, description, color);
    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = handleNextGamesCommand;
