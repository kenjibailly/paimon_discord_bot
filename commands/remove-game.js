const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const deployCommands = require('../commands/deploy-commands');

async function handleRemoveGameCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const gameOption = data.options.find(opt => opt.name === 'game');
    const gameId = gameOption ? gameOption.value : null;

    if (gameId) {

        try {
            const game = await Games.findOneAndDelete({ _id: gameId });

            const title = "Game Removed";
            const description = `Game successfully removed`;
            const color = "";
            const embed = createEmbed(title, description, color);

            try {
                const games = await Games.find({ guild_id: guild_id });
                const list_type = "games";
                if(games){
                    let games_list = [];
                    games.forEach(game => {
                        const game_info = {
                            name: game.name,
                            value: game._id,
                        }
                        games_list.push(game_info);
                    });
                    await deployCommands(client, guild_id, games_list, false, list_type);
                } else {
                    await deployCommands(client, guild_id, games_list, true, list_type);
                }
            } catch (error) {
                console.log("Error Games Registering Commands: " + error);
                const title = "Game Remove Error";
                const description = `Game couldn't be removed because of the command register, please contact the administrator or try again later.`;
                const color = "error";
                const embed = createEmbed(title, description, color);
        
                return {
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        embeds: [embed],
                        flags: 64,
                    },
                };
            }
    
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        } catch (error) {
            console.log("Error Removing Game: " + error);

            const title = "Game Remove Error";
            const description = `Game couldn't be removed, please contact the administrator or try again later.`;
            const color = "error";
            const embed = createEmbed(title, description, color);
    
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };
        }
    }
}

module.exports = handleRemoveGameCommand;