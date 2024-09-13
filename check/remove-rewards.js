const removeNickname = require('./remove-reward/remove-nickname');
const removeCustomEmoji = require('./remove-reward/remove-custom-emoji');
const removeCustomRole = require('./remove-reward/remove-custom-role');
const createEmbed = require('../helpers/embed');
const AwardedReward = require('../models/awarded-reward');
const Rewards = require('../models/rewards');

async function checkRemoveRewards(client) {
    const old_rewards = await findOldRewards();
    for (const reward of old_rewards) {
        switch (reward.reward) {
            case "change-own-nickname":
                await removeNickname(client, reward);
                await removeReward(client, reward);
                break;
            case "change-user-nickname":
                await removeNickname(client, reward);
                await removeReward(client, reward);
                break;
            case "custom-emoji":
                await removeCustomEmoji(client, reward);
                await removeReward(client, reward);
                break;
            case "custom-role":
                await removeCustomRole(client, reward);
                await removeReward(client, reward);
                break;
            default:
                break;
        }
    }
}

async function removeReward(client, reward) {
    try {
        // Await the findOneAndDelete operation
        const removed_reward = await AwardedReward.findOneAndDelete({ _id: reward._id });
        if (removed_reward) {
            console.log("Reward removed from database");
        } else {
            console.log("No reward found with that ID");
        }
    } catch (error) {
        console.error('Error removing reward from database:', error);

        const title = "Award Reset Error";
        const description = `I could not remove reward with id \`${reward._id}\`, please contact your administrator.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        try {
            // Fetch the guild (server) using the guild ID
            const guild = await client.guilds.fetch(reward.guild_id);
        
            // Fetch the owner of the guild
            const owner = await guild.fetchOwner();
        
            // Send the embed as a direct message (DM) to the owner
            await owner.send({
                embeds: [embed],
            });
        
            console.log('Message sent to the server owner successfully.');
        } catch (error) {
            console.error('Error sending message to the server owner:', error);
        }
    }
}

async function findOldRewards() {
    let rewardsMap = new Map();

    try {
        // Fetch all rewards
        const rewards = await Rewards.find();

        // Map each reward to its time value
        rewards.forEach(reward => {
            rewardsMap.set(reward.name, reward.time); // Use reward.name or another unique identifier
        });

        // Initialize array to hold old awarded rewards
        let oldAwardedRewards = [];

        // Fetch all awarded rewards
        const awardedRewards = await AwardedReward.find();

        for (const awardedReward of awardedRewards) {
            const rewardTime = rewardsMap.get(awardedReward.reward);
            if (rewardTime !== undefined) {
                // Calculate the date based on the reward's time value
                const rewardDate = new Date();
                rewardDate.setDate(rewardDate.getDate() - rewardTime);

                // Check if the awardedReward's date is older than the calculated date
                if (awardedReward.date < rewardDate) {
                    oldAwardedRewards.push({
                        ...awardedReward.toObject(), // Convert Mongoose document to plain object
                        time: rewardTime
                    });
                }
            }
        }

        // console.log('Old Awarded Rewards:', oldAwardedRewards);
        return oldAwardedRewards;
    } catch (error) {
        console.error('Error finding old rewards:', error);
        // Handle error appropriately
    }
}

module.exports = checkRemoveRewards;