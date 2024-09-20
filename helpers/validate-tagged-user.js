function validateTaggedUser(content) {
    // Define the regex pattern to match a user tag
    const userTagRegex = /<@(\d+)>/;

    // Test the content against the regex pattern
    const match = content.match(userTagRegex);

    // If there is no match, return an error message
    if (!match) {
        return "No valid user tag found in the message.";
    }

    // If there is a match, return null indicating no error
    return null;
}

module.exports = validateTaggedUser;