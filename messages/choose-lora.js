const createEmbed = require('../helpers/embed');
const validateNumber = require('../helpers/validate-number');
const { createImageSettingsUsersDataCache, loadUserSettingsIntoCache } = require('../helpers/create-image-settings-cache');
const CreateImageSettings = require('../models/create-image-settings');

async function handleChooseLora(message, client) {

    const create_image_settings_user_data_cache = createImageSettingsUsersDataCache.get(message.author.id);

    const messageContent = message.content;
    const validationError = validateNumber(messageContent, create_image_settings_user_data_cache.loras);

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
        const updateData = { 
            lora: create_image_settings_user_data_cache.loras[Number(messageContent) - 1] 
        };
        
        // Check if model exists in create_image_settings_user_data_cache and add it to the update data
        if (create_image_settings_user_data_cache.model) {
            updateData.model = create_image_settings_user_data_cache.model;
        }
        
        const newLora = await CreateImageSettings.findOneAndUpdate(
            { user_id: message.author.id }, 
            { $set: updateData }, // Use the updateData object
            { upsert: true, new: true }
        );

        const title = `Change Lora Success`;
        const description = `I successfully updated your lora!`;
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
        logger.error('Choose Lora Error', error);
        const title = `Change Lora Error`;
        const description = `I couldn't save your new lora to the database, please try again later.`;
        const color = "error"; // Changed to hex code for red
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        createImageSettingsUsersDataCache.delete(message.author.id);
        return;
    }

}

module.exports = handleChooseLora;