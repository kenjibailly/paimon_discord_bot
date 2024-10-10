const Wallet = require('../models/wallet');
const createEmbed = require('../helpers/embed');
const getTokenEmoji = require('../helpers/get-token-emoji');


async function handleAwardTeamCommand(interaction, client) {
    const { member, guildId } = interaction;

    // Find each option by name
    const role = interaction.options.getRole('role').id;
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') ? interaction.options.getString('reason') : "No reason provided";

    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch();
    const roleMembers = members.filter(member => member.roles.cache.has(role));
    
    let newWalletEntries = roleMembers.map(member => ({
        updateOne: {
            filter: { user_id: member.user.id, guild_id: guildId },
            update: { $inc: { amount: amount } },
            upsert: true,
        }
    }));

    try {
        // Fetch the token emoji using getTokenEmoji function
        const tokenEmoji = await getTokenEmoji(interaction.guildId);

        // Check if tokenEmoji is an embed (error case)
        if (tokenEmoji.data) {
            await interaction.reply({ embeds: [tokenEmoji], ephemeral: true });
            return;
        }

        const result = await Wallet.bulkWrite(newWalletEntries);
        const title = "Tokens";
        const description = `<@${member.user.id}> awarded **${amount}** ${tokenEmoji.token_emoji} to <@&${role}>!\n` +
        `\nReason: **${reason}**`;
        const embed = createEmbed(title, description, "");

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        logger.error('Error during bulkWrite:', error);

        const title = "Tokens";
        const description = `Failed to add tokens to the database, please try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = handleAwardTeamCommand;
