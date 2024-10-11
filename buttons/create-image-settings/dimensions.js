const createEmbed = require('../../helpers/embed');
const { createImageSettingsUsersDataCache, createImageSettingsTemporaryCache, loadUserSettingsIntoCache } = require('../../helpers/create-image-settings-cache');
const data = require('../../AI/data.json');

async function handleDimensionsButton (interaction, client) {
    let create_image_settings_termporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);

    const dimensions = [];
    const dimensions_list = [];
    const create_image_settings_user_data_cache = {};

    if (!create_image_settings_termporary_user_cache) {
        await loadUserSettingsIntoCache(interaction.user.id);
        create_image_settings_termporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);
        if (!create_image_settings_termporary_user_cache) {
            const defaultCheckpoint = Object.values(data).flatMap(model => 
                model.checkpoints.filter(checkpoint => checkpoint.default === true)
            ).map(checkpoint => checkpoint.file)[0]; // Get the file of the first found default checkpoint
    
            if (defaultCheckpoint) {
                createImageSettingsTemporaryCache.set(interaction.user.id, {
                    model: defaultCheckpoint,
                });
                create_image_settings_user_data_cache.model = defaultCheckpoint;
                create_image_settings_termporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);
            }
        }
    }

    // Find the parent model that corresponds to the selected model
    const parentModel = Object.values(data).find(model => 
        model.checkpoints.some(checkpoint => checkpoint.file === create_image_settings_termporary_user_cache.model)
    );

    const buttonComponent = {
        type: 1, // Action row type
        components: [
            {
                type: 2, // Button type
                style: 4, // Primary style
                label: "Go back",
                custom_id: `create-image-settings`
            },
        ]
    };

    if (parentModel) {
        // Loop through each dimension for the found parent model
        Object.entries(parentModel.dimensions).forEach(([key, value], index) => {
            const dimensionNumber = dimensions_list.length + 1; // Keep incrementing for unique numbering across all dimensions

            // Push the dimension details into dimensions_list
            dimensions_list.push({
                name: `${dimensionNumber}. ${key}`, // E.g., "1. 1:1 square"
                value: value, // The dimension value (e.g., "768x768")
                inline: false // You can set this to `true` to display fields inline
            });

            // If you need to store the dimensions themselves in an array, you can also push them
            dimensions.push({ name: key, value: value });
        });
    } else {
        console.warn("No parent model found for the selected checkpoint.");
        const title = "Create Image Settings";
        const description = "Something went wrong. Perhaps the model doesn't exist anymore, choose a new model in the settings menu and try again.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.editReply({ embeds: [embed], components: [buttonComponent] });
        return;
    }

    let description;
    const create_image_settings_temporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);
    const checkpointName = parentModel.checkpoints.find(checkpoint => checkpoint.file === create_image_settings_termporary_user_cache.model)?.name || "Unknown Checkpoint";
    const loraName = parentModel.loras.find(lora => lora.file === create_image_settings_temporary_user_cache.lora)?.name || "";

    if (dimensions_list.length > 0) {
        description = `Your current model: **${checkpointName}**\n` +
        `${create_image_settings_temporary_user_cache.lora 
        ? `Your current LoRa: **${loraName}**\n` 
        : ``}` +
        `${create_image_settings_temporary_user_cache.dimensions 
            ? `Your current dimensions: **${create_image_settings_temporary_user_cache.dimensions }**\n` 
            : ``}` +
        `\nThese are all the dimensions (width x height) compatible with the **${checkpointName}** model:\n` + 
        `Please reply with the number next to the dimension to select that dimension.\n\u200B\n`;

        create_image_settings_user_data_cache.name = "choose-dimensions";
        create_image_settings_user_data_cache.channelId = interaction.channel.id;
        create_image_settings_user_data_cache.dimensions = dimensions;

        // Store interaction data for the specific user
        createImageSettingsUsersDataCache.set(interaction.user.id, create_image_settings_user_data_cache);
    } else {
        description = `There are no compatible dimensions for model: **${checkpointName}**`;

    }

    const title = "Create Image Settings";
    const color = "";
    const embed = createEmbed(title, description, color);

    if (dimensions_list.length > 0) {
        embed.addFields(dimensions_list);
    }

    await interaction.editReply({ embeds: [embed], components: [buttonComponent] });
}

module.exports = handleDimensionsButton;