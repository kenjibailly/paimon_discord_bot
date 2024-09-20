const Rewards = require('./models/rewards');
const TokenEmoji = require('./models/token-emoji'); // Import the TokenEmoji model
const deployCommands = require('./commands/deploy-commands');
const ChannelNameConfig = require('./models/channel-name-config');
const consoleColors = require('./helpers/console-colors');

async function botJoinsGuild(client, guild) {
    const guildId = guild.id;
    
    try {
        deployCommands(guildId);

    } catch (error) {
        console.error(consoleColors("red"), 'Deploy Commands Error: ' + error);

        const title = "Deploy Commands Error";
        const description = `I could not deploy some slash commands, please contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        try {
            // Fetch the guild (server) using the guild ID
            const guild = await client.guilds.fetch(guildId);
        
            // Fetch the owner of the guild
            const owner = await guild.fetchOwner();
        
            // Send the embed as a direct message (DM) to the owner
            await owner.send({
                embeds: [embed],
            });
        
            console.log(consoleColors("green"), 'Message sent to the server owner successfully.');
        } catch (error) {
            console.error('Error sending message to the server owner:', error);
        }
    }


    // Define the rewards to add
    const rewardsToAdd = [
        // { guild_id: guildId, name: 'change-nickname' },
        { guild_id: guildId, name: 'change-own-nickname', short_description: 'Change your nickname' },
        { guild_id: guildId, name: 'change-user-nickname', short_description: 'Change someone\'s nickname' },
        { guild_id: guildId, name: 'custom-emoji', short_description: 'Add a custom server emoji' },
        { guild_id: guildId, name: 'custom-channel', short_description: 'Add a custom channel'},
        { guild_id: guildId, name: 'custom-role', short_description: 'Add a custom role name and color'},
        { guild_id: guildId, name: 'choose-game', short_description: 'Choose the next game'},
        { guild_id: guildId, name: 'troll-user', short_description: `Troll someone`, long_description: `This person won't see any channels in the server until a mission on the list is completed. This person can choose their own mission from the list of missions. To see all missions use the \`/troll-missions\` command`},
    ];

    try {
        // Check if each reward already exists, and add it if it doesn't
        for (const reward of rewardsToAdd) {
            const exists = await Rewards.findOne({ guild_id: guildId, name: reward.name });

            if (!exists) {
                await Rewards.create(reward);
                console.log(consoleColors("green"), `Reward "${reward.name}" added for guild ${guildId}`);
            } else {
                console.log(`Reward "${reward.name}" already exists for guild ${guildId}`);
            }
        }

        // Check if token emoji is already set, and add the default if not
        const tokenEmojiEntry = await TokenEmoji.findOne({ guild_id: guildId });

        if (!tokenEmojiEntry) {
            // Create a new entry with the default emoji 🪙
            await TokenEmoji.create({
                guild_id: guildId,
                token_emoji: '🪙', // Default emoji
                token_emoji_name: "🪙",
                token_emoji_id: null,
            });
            console.log(consoleColors("green"), `Default token emoji set for guild ${guildId}`);
        } else {
            console.log(`Token emoji already set for guild ${guildId}`);
        }

    } catch (error) {
        console.error(`Error processing rewards or token emoji for guild ${guildId}:`, error);
    }

    try {
        const ChannelNameConfigEntry = await ChannelNameConfig.findOne({ guild_id: guildId });

        if (!ChannelNameConfigEntry) {
            // Create a new entry with the default emoji 🪙
            await ChannelNameConfig.create({
                guild_id: guildId,
            });
            console.log(consoleColors("green"), `Default channel name configuration set for guild ${guildId}`);
        } else {
            console.log(`Channel Name Configuration already set for guild ${guildId}`);
        }
    } catch (error) {
        console.error(`Error processing channel name configuration for guild ${guildId}:`, error);
    }
}

module.exports = botJoinsGuild;