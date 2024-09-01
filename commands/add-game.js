const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const deployCommands = require('../commands/deploy-commands');
const normalizeString = require('../helpers/normalize-string');

async function handleAddGameCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const gameNameOption = data.options.find(opt => opt.name === 'name');
    const gameDescriptionOption = data.options.find(opt => opt.name === 'description');
    const game_name = gameNameOption ? gameNameOption.value : null;
    const game_description = gameDescriptionOption ? gameDescriptionOption.value : null;

    // If game exists
    if (game_name) {
        try {
            const game = new Games({
                guild_id: guild_id,
                name: game_name,
                description: game_description,
                normalized_name: normalizeString(game_name),
            });
            await game.save();

            const title = "Game Added";
            let description;
            if (game_description) {
                description = `Game successfully added \n\n Name: **${game_name}** \n Description: **${game_description}**`;
            } else {
                description = `Game successfully added \n\n Name: **${game_name}**`;

            }
            const color = "";
            const embed = createEmbed(title, description, color);

            try {
                const games = await Games.find();
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
                }
            } catch (error) {
                console.log("Error Games Registering Commans: " + error);
            }
    
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [embed],
                    flags: 64,
                },
            };

        } catch (error) {
            console.log("Error Games Input: " + error);
            const title = "Game Error";
            const description = `Something went wrong while trying to add a game to the list, please try again later.`;
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

module.exports = handleAddGameCommand;