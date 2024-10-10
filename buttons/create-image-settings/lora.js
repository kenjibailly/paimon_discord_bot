const createEmbed = require('../../helpers/embed');
const { createImageSettingsUsersDataCache, createImageSettingsTemporaryCache, loadUserSettingsIntoCache } = require('../../helpers/create-image-settings-cache');
const data = require('../../AI/data.json');

async function handleLorabutton (interaction, client) {

    let create_image_settings_temporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);

    const loras = [];
    const loras_list = [];
    const create_image_settings_user_data_cache = {};

    if (!create_image_settings_temporary_user_cache) {
        await loadUserSettingsIntoCache(interaction.user.id);
        create_image_settings_temporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);
        if (!create_image_settings_temporary_user_cache) {
            const defaultCheckpoint = Object.values(data).flatMap(model => 
                model.checkpoints.filter(checkpoint => checkpoint.default === true)
            ).map(checkpoint => checkpoint.file)[0]; // Get the file of the first found default checkpoint
    
            if (defaultCheckpoint) {

                create_image_settings_user_data_cache.model = defaultCheckpoint;

                // Find the parent model that corresponds to the selected model
                parentModel = Object.values(data).find(model => 
                    model.checkpoints.some(checkpoint => checkpoint.file === defaultCheckpoint)
                );

                // Get the first dimension from the found parent model
                const dimensions = Object.entries(parentModel.dimensions)[0]; // Get the first dimension entry (e.g., ['1:1 square', '1024x1024'])
                let dimensionValue;
                if (dimensions) {
                    dimensionValue = dimensions[1];
                    // Set model and dimensions in the cache
                    createImageSettingsTemporaryCache.set(interaction.user.id, {
                        model: defaultCheckpoint,
                        dimensions: dimensionValue
                    });
                } else {
                    // output error message
                }

                create_image_settings_user_data_cache.dimensions = dimensionValue;
                create_image_settings_temporary_user_cache = createImageSettingsTemporaryCache.get(interaction.user.id);
            } else {
                // output error message
            }
        }
    }

     // Find the parent model that corresponds to the selected model
     parentModel = Object.values(data).find(model => 
        model.checkpoints.some(checkpoint => checkpoint.file === create_image_settings_temporary_user_cache.model)
    );

    const buttonComponent = {
        type: 1, // Action row type
        components: [
            ...(create_image_settings_temporary_user_cache.lora ? [
                {
                    type: 2, // Button type
                    style: 4, // Danger style (typically red)
                    label: "Remove LoRa",
                    emoji: {
                        name: "🗑️", // Use the name
                    },
                    custom_id: `remove-lora`
                }
            ] : []),
            {
                type: 2, // Button type
                style: 4, // Danger style (typically red)
                label: "Go back",
                custom_id: `create-image-settings`
            }
        ]
    };
    

    if (parentModel) {
        // Loop through each lora for the found parent model
        parentModel.loras.forEach((lora, index) => {
            const loraNumber = loras_list.length + 1; // Keep incrementing for unique numbering across all loras

            // Push the lora details into loras_list
            loras_list.push({
                name: `${loraNumber}. ${lora.name}`, // E.g., "1. Aesthetic Anime V1"
                value: lora.description ? lora.description + `\n[More Information](${lora.link})`  : "No description available.",
                inline: false // You can set this to `true` to display fields inline
            });

            loras.push({ name: lora.name, file: lora.file });
        });
    } else {
        console.warn("No parent model found for the selected checkpoint.");
        const title = "Create Image Settings";
        const description = "Something went wrong. Perhaps the model doesn't exist anymore, choose a new model in the settings menu and try again.";
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed], components: [buttonComponent] });
        return;
    }

    let description;
    const checkpointName = parentModel.checkpoints.find(checkpoint => checkpoint.file === create_image_settings_temporary_user_cache.model)?.name || "Unknown Checkpoint";
    const loraName = parentModel.loras.find(lora => lora.file === create_image_settings_temporary_user_cache.lora)?.name || "";

    if (loras_list.length > 0) {
        description = `Your current model: **${checkpointName}**\n` +
        `${create_image_settings_temporary_user_cache.lora 
        ? `Your current LoRa: **${loraName}**\n` 
        : ``}` +
        `${create_image_settings_temporary_user_cache.lora 
        ? `\nClick the \`Remove LoRa\` button to remove your current set LoRa (**${loraName}**) from your settings.\n` 
        : ``}` + 
        `\nThese are all the LoRas compatible with the **${checkpointName}** model:` +
        `\nPlease reply with the number next to the LoRa to select that LoRA.\n\u200B\n`;
        

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

    await interaction.update({ embeds: [embed], components: [buttonComponent] });
}

module.exports = handleLorabutton;