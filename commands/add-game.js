const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const deployCommands = require('../commands/deploy-commands');

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
                            value: game._id,
                        }
                        games_list.push(game_info);
                    });
                    const list_type = "games";
                    await deployCommands(client, guild_id, games_list, false, list_type);
                }
            } catch (error) {
                console.log("Error Games Registering Commands: " + error);

                const title = "Add Game Error";
                const description = `Game couldn't be added because of the command register, please contact the administrator or try again later.`;
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