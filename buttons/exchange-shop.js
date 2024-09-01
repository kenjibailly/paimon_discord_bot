const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const Rewards = require('../models/rewards');

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

    let options_list = [];
    try {
        const rewards = await Rewards.find();
        rewards.forEach(reward => {
            if (reward.enable === true) {
                const add_reward = {
                    label: reward.description,
                    value: reward.name,
                }
                options_list.push(add_reward);
            }
        });
    } catch (error) {
        const title = "Error Rewards";
        const description = `I could not find the rewards in the database. Pleae contact the administrator.`;
        const embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }
    

    // Post the message in the thread
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
                        options: options_list,
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
