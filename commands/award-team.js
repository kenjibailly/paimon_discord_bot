const { InteractionResponseType } = require('discord-interactions');
const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');

async function handleAwardTeamCommand(res, client) {
    const { data, guild_id } = res;
    const { options } = data;
    const role = options.find(option => option.name === 'role').value;
    const amount = options.find(option => option.name === 'amount').value;

    const guild = await client.guilds.fetch(guild_id);
    const members = await guild.members.fetch();
    const roleMembers = members.filter(member => member.roles.cache.has(role));
    
    let newWalletEntries = roleMembers.map(member => ({
        updateOne: {
            filter: { user_id: member.user.id },
            update: { $inc: { amount: amount } },
            upsert: true,
        }
    }));

    try {
        const result = await Wallet.bulkWrite(newWalletEntries);
        const title = "Tokens";
        const description = `Awarded **${amount}** tokens to <@&${role}>!`;
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
        const color = "#ff0000";
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
