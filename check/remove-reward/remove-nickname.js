const createEmbed = require('../../helpers/embed');
const getBotChannel = require('../../helpers/get-bot-channel');

async function removeNickname(client, reward) {
    try {
        const guild = await client.guilds.fetch(reward.guild_id);
        const member = await guild.members.fetch(reward.awarded_user_id);

        if (member) {
            await member.setNickname(null);

            const title = "Award Reset";
            const description = `<@${reward.awarded_user_id}>'s nickname has been reset. **${reward.time} days** have passed.`;
            const color = "";
            const embed = createEmbed(title, description, color);
            const bot_channel = await getBotChannel(reward.guild_id);

            if (bot_channel && bot_channel.channel) {
                try {
                    const channel = await client.channels.fetch(bot_channel.channel);
                    await channel.send({ embeds: [embed] });
                    
                    console.log('Message sent to the bot channel successfully.');
                    return; // Ensure the function exits here
                } catch (error) {
                    console.error('Error sending message to the bot channel:', error);
                    return; // Exit function if there's an error
                }
            } else {
                console.error('Bot channel not found or not set.');
                return; // Exit function if the bot channel is not found
            }
        } else {
            console.log(`Member with ID ${reward.awarded_user_id} not found.`);
            return; // Exit function if the member is not found
        }
    } catch (error) {
        console.error(`Error resetting nickname:`, error);
        return; // Exit function if there's an error in the try-catch block
    }
}

module.exports = removeNickname;