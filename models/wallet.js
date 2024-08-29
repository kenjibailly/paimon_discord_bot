const mongoose = require('mongoose');

// Define the Wallet schema
const walletSchema = new mongoose.Schema({
    user_id: {
        type: String,
        unique: true,
        required: true,
    },
    amount: Number,
});

// Create a model using the schema
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;