const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');

async function handleExchangeShopButton(interaction, client) {
    // Step 1: Create a thread
    const guild = await client.guilds.fetch(interaction.guild_id);
    const channel = await guild.channels.fetch(interaction.channel_id);

    // Create a private thread that is only visible to the user who clicked the button
    const thread = await channel.threads.create({
        name: `Shop - ${interaction.member.user.global_name}`, // Ensure you use the correct user property
        autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
        reason: 'User initiated exchange shop interaction',
        invitable: false, // Don't allow other users to join the thread
        type: 12, // Private Thread (only visible to members who are added)
    });

    // Add the user who clicked the button to the thread
    await thread.members.add(interaction.member.user.id);

    // Step 2: Post the message in the thread
    let title = "Shop";
    let description = `Please choose one of the following options to redeem:`;
    let embed = createEmbed(title, description, "");

    // Send the message to the thread
    const message = await thread.send({
        content: 'Please select an option from the dropdown below:',
        embeds: [embed],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 3, // Select Menu
                        custom_id: 'exchange-shop-menu',
                        options: [
                            {
                                label: 'Change your nickname',
                                value: 'change-nickname',
                            },
                            {
                                label: 'Change someone\'s nickname',
                                value: 'change-user-nickname',
                            },
                            {
                                label: 'Add custom server emoji',
                                value: 'add-server-emoji',
                            },
                            {
                                label: 'Add custom channel',
                                value: 'add-channel',
                            },
                            {
                                label: 'Choose next game',
                                value: 'choose-game',
                            },
                            {
                                label: 'Add custom role name and color',
                                value: 'add-role',
                            },
                            {
                                label: 'Add custom soundboard sound',
                                value: 'add-sound',
                            },
                        ],
                        placeholder: 'Select an option...',
                    },
                ],
            },
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 4, // Danger style
                        label: "Cancel",
                        custom_id: "cancel-thread"
                    }
                ],
            },
        ],
    });
    

    title = "Shop";
    description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
    embed = createEmbed(title, description, "");
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
            flags: 64,
        },
    };
}

module.exports = handleExchangeShopButton;
