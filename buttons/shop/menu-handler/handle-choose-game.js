const createEmbed = require('../../../helpers/embed');
const userExchangeData = require('../../../helpers/userExchangeData');
const Games = require('../../../models/games');
const handleCancelThread = require('../../cancel-thread');

async function handleChooseGame(name, interaction, client) {
    let title = "Shop";
    let description = "Please reply with the number next to the the game you want to choose to play next.\n\u200B\n";
    let color = "";
    let games;
    let games_list;

    try {
        games = await Games.find({ guild_id: interaction.guildId });
        games_list = [];
        if (games.length > 0) {
            games.forEach((game, index) => {
                const missionNumber = index + 1; // +1 to start counting from 1
                // Create a field for each game
                games_list.push({
                    name: `${missionNumber}. ${game.name}`,
                    value: game.description ? game.description : "No description available.",
                    inline: false // You can set this to `true` to display fields inline
                });
            });
    
            // Store interaction data for the specific user
            userExchangeData.set(interaction.member.user.id, {
                threadId: interaction.channelId,
                name: name,
                games: games,
            });
    
        } else {
            title = "No Games Added Yet";
            description = "The staff hasn't added any games yet, please ask them to add some games.";
            color = "error";
            const embed = createEmbed(title, description, color);
            await interaction.editReply({ embeds: [embed] });
            handleCancelThread(interaction, client);
            return;
        }
    } catch (error) {
        logger.error('Error Finding Games', error);
        title = "Error Finding Games";
        description = "I couldn't retrieve the list of games, please try again later.";
        color = "error";
        const embed = createEmbed(title, description, color);
        await interaction.editReply({ embeds: [embed] });
        handleCancelThread(interaction, client);
        return;
    }

    const embed = createEmbed(title, description, color);
    if (games.length > 0) {
        embed.addFields(games_list);
    }

    await interaction.editReply({
        embeds: [embed],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 4,
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ]
            }
        ],
    });
}

module.exports = handleChooseGame;