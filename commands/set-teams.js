const { InteractionResponseType } = require('discord-interactions');
const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');
const consoleColors = require('../helpers/console-colors');

async function handleSetTeamsCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const team1Option = data.options.find(opt => opt.name === 'team_1');
    const team2Option = data.options.find(opt => opt.name === 'team_2');

    const team_1 = team1Option ? team1Option.value : null;
    const team_2 = team2Option ? team2Option.value : null;

    // Validate that both teams are provided
    if (team_1 === null || team_2 === null) {
        const title = "Invalid Input";
        const description = "Both team roles must be provided.";
        const color = "#ff0000";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }

    try {
        // Prepare the update object
        const update = {
            team_1: team_1,
            team_2: team_2,
        };

        // Upsert operation: find one by guild_id and update it, or create if not exists
        const result = await Teams.findOneAndUpdate(
            { guild_id: guild_id },
            update,
            { upsert: true, new: true } // Create if not exists, return the updated document
        );

        const description = `Teams have been set or updated successfully:\n` +
                            `**Team 1:** <@&${result.team_1}>\n` +
                            `**Team 2:** <@&${result.team_2}>`;

        const title = "Teams Updated";
        const color = "";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };

    } catch (error) {
        console.error(consoleColors("red"), 'Error updating teams:', error);

        const title = "Error";
        const description = `An error occurred while updating the teams. Please try again later.`;
        const color = "#ff0000";
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

module.exports = handleSetTeamsCommand;