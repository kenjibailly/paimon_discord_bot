const Rewards = require('./models/rewards');
const TokenEmoji = require('./models/token-emoji'); // Import the TokenEmoji model

async function botJoinsGuild(client, guild) {
    const guildId = guild.id;

    // Define the rewards to add
    const rewardsToAdd = [
        { guild_id: guildId, name: 'change-own-nickname' },
        { guild_id: guildId, name: 'change-user-nickname' },
        { guild_id: guildId, name: 'custom-emoji' },
        { guild_id: guildId, name: 'custom-channel' },
        { guild_id: guildId, name: 'custom-role' },
        { guild_id: guildId, name: 'custom-soundboard' },
        { guild_id: guildId, name: 'choose-game' },
    ];

    try {
        // Check if each reward already exists, and add it if it doesn't
        for (const reward of rewardsToAdd) {
            const exists = await Rewards.findOne({ guild_id: guildId, name: reward.name });

            if (!exists) {
                await Rewards.create(reward);
                console.log(`Reward "${reward.name}" added for guild ${guildId}`);
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
            });
            console.log(`Default token emoji set for guild ${guildId}`);
        } else {
            console.log(`Token emoji already set for guild ${guildId}`);
        }

    } catch (error) {
        console.error(`Error processing rewards or token emoji for guild ${guildId}:`, error);
    }
}

module.exports = botJoinsGuild;