const { InteractionResponseType } = require('discord-interactions');
const Teams = require('../models/teams');
const createEmbed = require('../helpers/embed');
const { ActivityType } = require('discord.js');
const consoleColors = require('../helpers/console-colors');

async function handleSetStatusCommand(interaction, client) {
    const { data, guild_id } = interaction;

    // Find each option by name
    const statusOption = data.options.find(opt => opt.name === 'status');

    const status = statusOption ? statusOption.value : null;

    try {
        client.user.setPresence({
            activities: [{ type: ActivityType.Custom, name: status, state: status }], // Custom status message
            status: 'online', // Bot status (can be 'online', 'idle', 'dnd', 'invisible')
        });
    
        const title = "Status Set";
        const description = `You have succesfully set a new status for Paimon.\n\n **${status}**`;
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
        console.error(consoleColors("red"), "Set Status Error: " + error);
        const title = "Status Set Error";
        const description = `Something went wrong, please try again later.`;
        const color = "";
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

module.exports = handleSetStatusCommand;