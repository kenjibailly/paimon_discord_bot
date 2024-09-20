const { InteractionResponseType } = require('discord-interactions');
const Games = require('../models/games');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function handleGamesCommand(interaction, client) {
    const { guild_id } = interaction;
    try {
        let games_list = "";
        const games = await Games.find({guild_id: guild_id });

        if(games.length === 0) {
            const title = "Games";
            const description = `I couldn't find any games.`;
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

        games.forEach(game => {
            if (game.description) {
                games_list += `- Name: **${game.name}**\n Description: **${game.description}**\n\n`;
            } else {
                games_list += `- Name: **${game.name}**\n\n`;
            }
            
        });

        const title = "Games";
        const description = `These are all the games:\n\n ${games_list}`;
        const embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };

    } catch (error) {
        console.error(consoleColors("red"), 'Games error: ' + error);

        const title = "Games Error";
        const description = `Something went wrong while trying to get the games list, please contact the administrator.`;
        const color = "#FF0000";
        const embed = createEmbed(title, description, color);
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        }
    }
}

module.exports = handleGamesCommand;