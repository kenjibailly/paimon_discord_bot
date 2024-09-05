const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const normalizeString = require('../helpers/normalize-string');
const deployCommands = require('../commands/deploy-commands');

async function handleUpdateGameCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const gameOption = data.options.find(opt => opt.name === 'game');
    const gameChangeNameOption = data.options.find(opt => opt.name === 'name');
    const gameChangeDescriptionOption = data.options.find(opt => opt.name === 'description');

    const game_name = gameOption ? gameOption.value : null;
    const game_change_name = gameChangeNameOption ? gameChangeNameOption.value : null;
    const game_change_description = gameChangeDescriptionOption ? gameChangeDescriptionOption.value : null;

    // Validate that at least one of name or description is provided
    if (!game_change_name && !game_change_description) {
        const title = "Game Update Error";
        const description = `At least one of the fields (name or description) must be provided for update.`;
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
    
    // Prepare the update object with only provided fields
    const updateFields = {};
    if (game_change_name) {
        updateFields.name = game_change_name;
        updateFields.normalized_name = normalizeString(game_change_name);
    }
    if (game_change_description) {
        updateFields.description = game_change_description;
    }
    
    // Update the game in the database
    const game = await Games.findOneAndUpdate(
        { guild_id: guild_id, normalized_name: game_name },
        { $set: updateFields },
        { new: true } // This option returns the updated document
    );

    if (game) {

        try {
            const game = await Games.findOneAndUpdate({ guild_id: guild_id, normalized_name: game_name });

            const title = "Game Updated";
            // Initialize an array to hold the description lines
            let descriptionLines = ['Game successfully updated'];

            // Conditionally add the name and description if they were provided
            if (game_change_name) {
            descriptionLines.push(`Name: **${game_change_name}**`);
            }
            if (game_change_description) {
            descriptionLines.push(`Description: **${game_change_description}**`);
            }

            // Join the lines with newlines to form the final description string
            const description = descriptionLines.join('\n\n');
            const color = "";
            const embed = createEmbed(title, description, color);

            try {
                const games = await Games.find({ guild_id: guild_id });
                if(games){
                    let games_list = [];
                    games.forEach(game => {
                        const game_info = {
                            name: game.name,
                            value: normalizeString(game.name), // ToDo: use game._id instead
                        }
                        games_list.push(game_info);
                    });
                    deployCommands(client, guild_id, games_list, null);
                }
            } catch (error) {
                console.log("Error Games Registering Commands: " + error);
                const title = "Game Update Error";
                const description = `Game couldn't be updated because of the command register, please contact the administrator or try again later.`;
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
            console.log("Error Update Game: " + error);

            const title = "Game Update Error";
            const description = `Game couldn't be updated, please contact the administrator or try again later.`;
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

module.exports = handleUpdateGameCommand;