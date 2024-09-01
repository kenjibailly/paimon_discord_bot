const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const normalizeString = require('../helpers/normalize-string');
const deployCommands = require('../commands/deploy-commands');

async function handleRemoveGameCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const gameOption = data.options.find(opt => opt.name === 'game');
    const game_name = gameOption ? gameOption.value : null;

    if (game_name) {

        try {
            const game = await Games.findOneAndDelete({ guild_id: guild_id, normalized_name: game_name });

            const title = "Game Removed";
            const description = `Game successfully removed`;
            const color = "";
            const embed = createEmbed(title, description, color);

            try {
                const games = await Games.find({ guild_id: guild_id });
                if(games){
                    let games_list = [];
                    games.forEach(game => {
                        const game_info = {
                            name: game.name,
                            value: normalizeString(game.name),
                        }
                        games_list.push(game_info);
                    });
                    deployCommands(client, guild_id, games_list, null);
                } else {
                    deployCommands(client, guild_id, games_list, true);
                }
            } catch (error) {
                console.log("Error Games Registering Commands: " + error);
                const title = "Game Remove Error";
                const description = `Game couldn't be removed because of the command register, please contact the administrator or try again later.`;
                const color = "#FF0000";
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
            const color = "#FF0000";
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