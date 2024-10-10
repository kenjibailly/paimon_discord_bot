const BotChannel = require('../models/bot-channel');
const createEmbed = require('../helpers/embed');


async function handleSetBotChannelCommand (interaction, client) {
    const { guildId } = interaction;

    // Find each option by name
    const channel = interaction.options.getChannel('channel');

    try {
        const result = await BotChannel.findOneAndUpdate(
            { guild_id: guildId }, 
            { channel: channel },
            { upsert: true, new: true } // Create if not exists, return the updated document
        );

        const title = "Bot Channel";
        const description = `You successfully set the bot channel to ${channel}`;
        const color = "";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        logger.error("Bot Channel Error:", error);
        const title = "Bot Channel Error";
        const description = `Something went wrong while setting the bot channel, please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    }

}

module.exports = handleSetBotChannelCommand;