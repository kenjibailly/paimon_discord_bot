const TokenEmoji = require('../models/token-emoji');
const createEmbed = require('../helpers/embed');


async function handleSetTokenEmojiCommand(interaction, client) {
    const { guildId } = interaction;

    // Find the token emoji option
    const tokenEmoji = interaction.options.getString('token_emoji');

    // Validate that token emoji is provided
    if (!tokenEmoji) {
        const title = "Invalid Input";
        const description = "A token emoji must be provided.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {
        // Determine if the emoji is custom or normal
        let tokenEmojiName;
        let tokenEmojiId = null;

        // Regex to detect custom emoji (e.g., <:_name_:123456789012345678>)
        const customEmojiRegex = /^<:(\w+):(\d+)>$/;
        const match = tokenEmoji.match(customEmojiRegex);

        if (match) {
            // Custom emoji
            tokenEmojiName = match[1];
            tokenEmojiId = match[2];
        } else {
            // Normal emoji
            tokenEmojiName = tokenEmoji;
        }

        // Prepare the update object
        const update = {
            token_emoji_name: tokenEmojiName,
            token_emoji_id: tokenEmojiId,
            token_emoji: tokenEmojiId ? `<:${tokenEmojiName}:${tokenEmojiId}>` : tokenEmojiName, // Set the full emoji string
        };

        // Upsert operation: find one by guild_id and update it, or create if not exists
        const result = await TokenEmoji.findOneAndUpdate(
            { guild_id: guildId }, 
            update,
            { upsert: true, new: true } // Create if not exists, return the updated document
        );

        const description = `The token emoji has been set to ${result.token_emoji}`;
        const title = "Token Emoji Updated";
        const color = "";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });


    } catch (error) {
        logger.error('Error updating token emoji:', error);

        const title = "Error";
        const description = `An error occurred while updating the token emoji. Please try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], ephemeral: true });

    }
}

module.exports = handleSetTokenEmojiCommand;
