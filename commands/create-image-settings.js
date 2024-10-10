const createEmbed = require('../helpers/embed');

async function handleCreateImageCommand(interaction, client) {
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

    const user = interaction.user;

    // Get the DM channel of the bot
    const botDMChannel = await client.users.createDM(user.id);

    // Check if the interaction is in a DM to the bot itself
    const isDMToBot = !interaction.guildId && interaction.channel.id === botDMChannel.id;

    // Check if the interaction is in a DM with the bot itself
    if (isDMToBot) {
        // If it's a DM with the bot, just send the DM, no message in the channel
        interaction.reply({
            embeds: [embedDM],
            components: [buttonComponent],
            flags: 64, // Ephemeral message
        });
    } else {
        // If it's not a DM with the bot (server channel, thread, group DM, or DM with someone else)
        const messageLink = `https://discord.com/channels/@me/${botDMChannel.id}`;
        const description = `Please continue in the DM I sent you [here](${messageLink}).`;

        // Send a DM to the user
        await sendDMToUser(user, client, embedDM, botDMChannel, buttonComponent);

        // Create the embed with the appropriate message and link
        const embed = createEmbed(title, description, color);
        
        // Send a response in the channel where the command was triggered
        interaction.reply({
                embeds: [embed],
                flags: 64, // Ephemeral message, only visible to the user
        });
    }
}

// Helper function to send a DM to the user
async function sendDMToUser(user, client, message, botDMChannel, buttonComponent) {
    try {
        await botDMChannel.send(
            { 
                embeds: [message],
                components: [buttonComponent]
            }
        );
    } catch (error) {
        console.error(`Failed to send DM: ${error}`);
    }
}

module.exports = handleCreateImageCommand;