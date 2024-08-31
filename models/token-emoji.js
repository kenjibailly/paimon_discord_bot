const mongoose = require('mongoose');

// Define the TokenEmoji schema
const tokenEmojiSchema = new mongoose.Schema({
    guild_id: {
        type: String,
        required: true,
        unique: true, // Ensures only one document per guild_id
    },
    token_emoji_name: {
        type: String,
        required: true,
    },
    token_emoji_id: {
        type: String, // ID of the custom emoji
        required: false,
    },
    token_emoji: {
        type: String, // Full emoji string (e.g., <:primogem:1279456896105054348>)
        required: true,
    },
});

// Create a model using the schema
const TokenEmoji = mongoose.model('TokenEmoji', tokenEmojiSchema);

module.exports = TokenEmoji;
