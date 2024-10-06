const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../helpers/embed');
const { createImageSettingsUsersDataCache, createImageSettingsTemporaryCache, loadUserSettingsIntoCache } = require('../../helpers/create-image-settings-cache');
const data = require('../../AI/data.json');

async function handleLorabutton (interaction, client) {

    let create_image_settings_termporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);

    const loras = [];
    const loras_list = [];
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
        // Loop through each lora for the found parent model
        parentModel.loras.forEach((lora, index) => {
            const loraNumber = loras_list.length + 1; // Keep incrementing for unique numbering across all loras

            // Push the lora details into loras_list
            loras_list.push({
                name: `${loraNumber}. ${lora.name}`, // E.g., "1. Aesthetic Anime V1"
                value: lora.description ? lora.description : "No description available.",
                inline: false // You can set this to `true` to display fields inline
            });

            loras.push(lora.file);
        });
    } else {
        console.warn("No parent model found for the selected checkpoint.");
        const title = "Create Image Settings";
        const description = "Something went wrong. Perhaps the model doesn't exist anymore, choose a new model in the settings menu and try again.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                components: [buttonComponent],
            },
        };
    }

    let description;
    const checkpointName = parentModel.checkpoints.find(checkpoint => checkpoint.file === create_image_settings_termporary_user_cache.model)?.name || "Unknown Checkpoint";

    if (loras_list.length > 0) {
        description = `Please reply with the number next to the lora to select that lora.\n\n` +
        `These are all the loras compatible with the **${checkpointName}** model:\n\u200B\n`;

        create_image_settings_user_data_cache.name = "choose-lora";
        create_image_settings_user_data_cache.channelId = interaction.channel.id;
        create_image_settings_user_data_cache.loras = loras;

        // Store interaction data for the specific user
        createImageSettingsUsersDataCache.set(interaction.user.id, create_image_settings_user_data_cache);
    } else {
        description = `There are no compatible LoRAs for model: **${checkpointName}**`;

    }

    const title = "Create Image Settings";
    const color = "";
    const embed = createEmbed(title, description, color);

    if (loras_list.length > 0) {
        embed.addFields(loras_list);
    }

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            components: [buttonComponent],
        },
    };
}

module.exports = handleLorabutton;