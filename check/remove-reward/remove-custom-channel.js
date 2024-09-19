const createEmbed = require('../../helpers/embed');
const getBotChannel = require('../../helpers/get-bot-channel');

async function removeCustomChannel(client, reward) {
    try {
        const guild = await client.guilds.fetch(reward.guild_id);
        
        const channelName = reward.value;

        const channel = guild.channels.cache.find(c => c.name === channelName);

        if (!channel) {
            console.log("Channel not found to remove")
            return;
        }

        // Try to delete the emoji
        try {
            await channel.delete();
        } catch (error) {
            // Handle any errors that occur during deletion
            console.error('Failed to delete channel:', error);
        }


        const title = "Award Reset";
        const description = `Channel "**${channelName}**" created by <@${reward.user_id}> has been removed. **${reward.time} days** have passed.`;
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
    } catch (error) {
        console.error(`Error resetting nickname:`, error);
        return; // Exit function if there's an error in the try-catch block
    }
}

module.exports = removeCustomChannel;