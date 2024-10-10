const createEmbed = require('../../helpers/embed');
const { createImageSettingsUsersDataCache } = require('../../helpers/create-image-settings-cache');

async function handleCreateImageSettingsButton (interaction, client) {

    if (createImageSettingsUsersDataCache.get(interaction.userId)) {
        createImageSettingsUsersDataCache.delete(interaction.userId);
    }

    const title = "Create Image Settings";
    const description = `Change a model, a LoRa or dimensions.\n\n` + 
    `- **Model**: A foundational AI framework trained on extensive data, shaping the overall style of your creations.\n` + 
    `- **LoRa**: A lightweight model focusing on specific styles or characters. It enhances the main model by adding unique traits not covered in the general training.\n` +   
    `- **Dimensions**: Specify the width and height of the image.\n`;
    const color = "";
    const embedDM = createEmbed(title, description, color);
    const buttonComponent = {
        type: 1, // Action row type
        components: [
            {
                type: 2, // Button type
                style: 1, // Primary style
                label: "Model",
                custom_id: `model`
            },
            {
                type: 2, // Button type
                style: 1, // Primary style
                label: "LoRa",
                custom_id: `lora`
            },
            {
                type: 2, // Button type
                style: 1, // Primary style
                label: "Dimensions",
                custom_id: `dimensions`
            },
        ]
    };

    await interaction.update({ embeds: [embedDM], components: [buttonComponent] });
}

module.exports = handleCreateImageSettingsButton;