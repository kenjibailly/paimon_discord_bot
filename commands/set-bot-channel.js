const { InteractionResponseType } = require('discord-interactions');
const BotChannel = require('../models/bot-channel');
const createEmbed = require('../helpers/embed');

async function handleSetBotChannelCommand (interaction, client) {
    const { data, guild_id } = interaction;

    // Ensure data.options is defined
    const options = data.options || [];

    // Find each option by name
    const channelOption = options.find(opt => opt.name === 'channel');

    const channel = channelOption ? channelOption.value : null;

    try {
        const result = await BotChannel.findOneAndUpdate(
            { guild_id: guild_id }, 
            { channel: channel },
            { upsert: true, new: true } // Create if not exists, return the updated document
        );

        const title = "Bot Channel";
        const description = `You successfully set the bot channel to <#${channel}>`;
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
        console.log(error);
        const title = "Bot Channel Error";
        const description = `Something went wrong while setting the bot channel, please try again later.`;
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

module.exports = handleSetBotChannelCommand;