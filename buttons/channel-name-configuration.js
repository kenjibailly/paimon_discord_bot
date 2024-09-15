const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const ChannelNameConfig = require('../models/channel-name-config');
const userExchangeData = require('../helpers/userExchangeData');
const cancelThread = require('./cancel-thread');

async function handleChannelNameConfiguration(interaction, client) {
    try {
        let emoji;
        if(interaction.data.custom_id == "channel-name-config-emoji-yes") {
            emoji = true;
        } else if (interaction.data.custom_id == "channel-name-config-emoji-no") {
            emoji = false;
        }

        // Store interaction data for the specific user
        userExchangeData.set(interaction.member.user.id, {
            threadId: interaction.channel_id,
            name: "channel-name-config",
            emoji: emoji,
        });

        const title = `Channel Name Configuration`;
        const description = `Please reply with your channel separator symbol, if you don't have any then please press **No**.\n\nExamples of separators being used:\n\n"┋" is the separator in this example:\n\`\`\`\n#💡┋info\`\`\`\n\n"-" is the separator in this example:\n\`\`\`\n#-info\`\`\``;
        const embed = createEmbed(title, description, "");
        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2, // Button
                                style: 4, // Danger style (for removing a game)
                                label: "No",
                                custom_id: "channel-name-config-separator-no"
                            },
                            {
                                type: 2, // Button
                                style: 4, // Danger style (for removing a game)
                                label: "Cancel",
                                custom_id: "cancel-thread"
                            }
                        ],
                    },
                ],
                flags: 64,
            },
        };

    } catch (error) {
        console.log('Channel Name Configuration Error: ' + error);
        const title = "Error";
        const description = `Something went wrong, please try again later or contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }
}

async function handleChannelNameConfigurationFinish(interaction, client) {

    try {
        // Store interaction data for the specific user
        const user_exchange_data = userExchangeData.get(interaction.member.user.id);
        await ChannelNameConfig.findOneAndUpdate(
            { guild_id: interaction.guild_id},
            { 
                emoji: user_exchange_data.emoji,
                separator: "",
            }
        );

        let example;
        if (user_exchange_data.emoji) {
            example = "#💡info";
        } else {
            example = "#info";
        }

        const title = "Channel Name Configuration";
        const description = `You have successfully set your channel name configuration to:\n- Emoji: ${user_exchange_data.emoji ? 'Yes' : 'No'}\n- Separator: ${user_exchange_data.separator || 'None'}\n\nExample:\n\`\`\`\n${example}\n\`\`\``;
        const color = "";
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    } catch (error) {
        const title = "Channel Name Configuration Error";
        const description = `I could not save the configuration to the database, please try again later or contact the administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        userExchangeData.delete(interaction.member.user.id); // Remove the user's data entirely
        cancelThread(interaction, client);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
                flags: 64,
            },
        };
    }
}

module.exports = { handleChannelNameConfiguration,  handleChannelNameConfigurationFinish };