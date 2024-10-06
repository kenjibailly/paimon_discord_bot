const CreateImageSettings = require('../models/create-image-settings');

// Original cache for DM data exchange
const createImageSettingsUsersDataCache = new Map();

// New cache for user settings with 24-hour expiration
const createImageSettingsTemporaryCache = new Map();

// Function to set user settings in the temporary cache with 24-hour expiration
function cacheUserSettings(user_id, settings) {
    // Add user settings to the temporary cache
    createImageSettingsTemporaryCache.set(user_id, settings);

    // Set a timeout to remove the user settings after 24 hours (86400000 milliseconds)
    setTimeout(() => {
        createImageSettingsTemporaryCache.delete(user_id);
    }, 24 * 60 * 60 * 1000);
}

// Function to fetch user settings from the database and add them to the cache
async function loadUserSettingsIntoCache(user_id) {
    try {
        const userSettings = await CreateImageSettings.findOne({ user_id });
        if (userSettings) {
            cacheUserSettings(user_id, userSettings);
        }
    } catch (error) {
        console.error(`Failed to load user settings for user_id ${user_id}: ${error}`);
    }
}

module.exports = {
    createImageSettingsUsersDataCache,
    createImageSettingsTemporaryCache,
    cacheUserSettings,
    loadUserSettingsIntoCache,
};