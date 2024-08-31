const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');

async function handleAwardTeamCommand(interaction, client) {
    const { data, member, guild_id } = interaction;

    // Find each option by name
    const roleOption = data.options.find(opt => opt.name === 'role');
    const amountOption = data.options.find(opt => opt.name === 'amount');
    const reasonOption = data.options.find(opt => opt.name === 'reason');

    // Extract values or set defaults
    const role = roleOption ? roleOption.value : null;
    const amount = amountOption ? amountOption.value : null;
    const reason = reasonOption ? reasonOption.value : "No reason provided"; // Default value if no reason is provided


    const guild = await client.guilds.fetch(guild_id);
    const members = await guild.members.fetch();
    const roleMembers = members.filter(member => member.roles.cache.has(role));
    
    let newWalletEntries = roleMembers.map(member => ({
        updateOne: {
            filter: { user_id: member.user.id, guild_id: guild_id },
            update: { $inc: { amount: amount } },
            upsert: true,
        }
    }));

    try {
        // Fetch the token emoji using getTokenEmoji function
        const tokenEmoji = await getTokenEmoji(interaction.guild_id);
        console.log(tokenEmoji);

        // Check if tokenEmoji is an embed (error case)
        if (tokenEmoji.data) {
            return {
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    embeds: [tokenEmoji],
                    flags: 64,
                },
            };
        }

        const result = await Wallet.bulkWrite(newWalletEntries);
        const title = "Tokens";
        const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@&${role}>!
        \nReason: **${reason}**`;
        const embed = createEmbed(title, description, "");

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    } catch (error) {
        console.error('Error during bulkWrite:', error);

        const title = "Tokens";
        const description = `Failed to add tokens to the database, please try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        return {
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                embeds: [embed],
            },
        };
    }
}

module.exports = handleAwardTeamCommand;
