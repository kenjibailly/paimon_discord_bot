function validateNumber(messageContent, list) {
    // Trim any whitespace from the message
    const trimmedContent = messageContent.trim();
    
    // Check if the content is a valid number and within the range
    const number = parseInt(trimmedContent, 10);
    
    // Ensure the message is a valid number, and it's in the range of 1 to list.length
    if (!isNaN(number) && number >= 1 && number <= list.length && trimmedContent === number.toString()) {
        return;
    }
    
    return "Invalid number. Please choose a number from the list."; // Invalid number
}

module.exports = validateNumber;