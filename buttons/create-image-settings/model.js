const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../../helpers/embed');
const data = require('../../AI/data.json');
const { createImageSettingsUsersDataCache } = require('../../helpers/create-image-settings-cache');

async function handleModelButton (interaction, client) {
    const models = [];
    const models_list = [];
    // Loop through each model (e.g., SDXL_turbo, SDXL)
    Object.keys(data).forEach((modelKey) => {
        const model = data[modelKey];

        // Get checkpoints for the current model
        model.checkpoints.forEach((checkpoint, index) => {
            const checkpointNumber = models_list.length + 1; // Keep incrementing for unique numbering across all models

            // Push the checkpoint details into models_list
            models_list.push({
                name: `${checkpointNumber}. ${checkpoint.name}`, // E.g., "1. DreamShaper XL Lightning"
                value: checkpoint.description ? checkpoint.description : "No description available.",
                inline: false // You can set this to `true` to display fields inline
            });

            models.push(checkpoint.file);
        });
    });

    // Store interaction data for the specific user
    createImageSettingsUsersDataCache.set(interaction.user.id, {
        name: "choose-model",
        channelId: interaction.channel.id,
        models: models,
    });

    const title = "Create Image Settings";
    const description = `Please reply with the number next to the model to select that model.\n` +
    `These are all the models:\n\u200B\n`;
    const color = "";
    const embed = createEmbed(title, description, color);
    embed.addFields(models_list);

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

    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            components: [buttonComponent],
        },
    };
}

module.exports = handleModelButton;