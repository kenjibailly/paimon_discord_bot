async function validateTaggedUser(content, message) {
    // Define the regex pattern to match a user tag
    const userTagRegex = /<@(\d+)>/;

    // Test the content against the regex pattern
    const match = content.match(userTagRegex);

    // If there is no match, return an error message
    if (!match) {
        return "No valid user tag found in the message.";
    }

    // Extract the user ID from the match
    const userId = match[1];

    try {
        // Fetch the user object using the user ID
        const user = await message.guild.members.fetch(userId);

        // If the user is a bot, return an error message
        if (user.user.bot) {
            return "You cannot tag a bot.";
        }

        // If the user is valid and not a bot, return null indicating no error
        return null;

    } catch (error) {
        logger.error("Validate Tagged User Error", error);
        // If the user ID is invalid or not found, return an error message
        return "The tagged user is not a valid member of this server.";
    }
}

module.exports = validateTaggedUser;