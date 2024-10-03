const TrolledUser = require('../models/trolled-users');

const trolledUserCache = new Map();

async function refreshTrolledUserCache() {
    try {
        const trolledUsers = await TrolledUser.find({ mission_id: null });
        trolledUserCache.clear(); // Clear the existing cache
        trolledUsers.forEach(user => {
            trolledUserCache.set(user.user_id, user);
        });
    } catch (error) {
        // logger.warn("Error finding trolledUsers", error);
    }

}

// Refresh the cache for a single user
async function refreshSingleUser(userId) {
    try {
        const user = await TrolledUser.findOne({ user_id: userId });
        if (user) {
            trolledUserCache.set(userId, user); // Update or add the user in the cache
        } else {
            trolledUserCache.delete(userId); // Remove the user from the cache if not found
        }
    } catch (error) {
        // logger.warn(`Error refreshing cache for user: ${userId}`, error);
    }
}

// Call this function on startup and at intervals
setInterval(refreshTrolledUserCache, 60000); // every minute

module.exports = {
    get: (userId) => trolledUserCache.get(userId),
    refresh: refreshTrolledUserCache,
    refreshSingleUser: refreshSingleUser,
    cache: trolledUserCache
};