const createEmbed = require('../helpers/embed');
const validateNumber = require('../helpers/validate-number');
const { createImageSettingsUsersDataCache, loadUserSettingsIntoCache } = require('../helpers/create-image-settings-cache');
const CreateImageSettings = require('../models/create-image-settings');

async function handleChooseModel(message, client) {

    const create_image_settings_user_data_cache = createImageSettingsUsersDataCache.get(message.author.id);

    const messageContent = message.content;
    const validationError = validateNumber(messageContent, create_image_settings_user_data_cache.models);

    const buttonComponent = {
        type: 1, // Action row type
        components: [
            {
                type: 2, // Button type
                style: 1, // Primary style
                label: "Settings Menu",
                custom_id: `create-image-settings`
            },
        ]
    };

    if (validationError) {
        logger.error("Validation Error:", validationError);
        // Send a confirmation message before closing the thread
        const title = `Input Error`;
        const description = `${validationError}\nPlease try again.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
            components: [buttonComponent],
        });
        return;
    }

    try {
        const newModel = await CreateImageSettings.findOneAndUpdate(
            { user_id: message.author.id }, 
            { $set: { model: create_image_settings_user_data_cache.models[Number(messageContent) - 1] } },
            { upsert: true, new: true }
        );

        const title = `Change Model Success`;
        const description = `I successfully updated your model!`;
        const color = ""; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
            components: [buttonComponent],
        });
        createImageSettingsUsersDataCache.delete(message.author.id);
        await loadUserSettingsIntoCache(message.author.id);
        return;
    } catch (error) {
        logger.error('Choose Model Error', error);
        const title = `Change Model Error`;
        const description = `I couldn't save your new model to the database, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        createImageSettingsUsersDataCache.delete(message.author.id);
        return;
    }

}

module.exports = handleChooseModel;