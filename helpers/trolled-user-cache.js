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
        logger.error("Error finding trolledUsers", error);
    }

}

// Call this function on startup and at intervals
setInterval(refreshTrolledUserCache, 60000); // every minute

module.exports = {
    get: (userId) => trolledUserCache.get(userId),
    refresh: refreshTrolledUserCache,
    cache: trolledUserCache
};