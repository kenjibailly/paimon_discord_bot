const mongoose = require('mongoose');

// Define the CreateImageSettings schema
const createImageSettings = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    model: {
        type: String,
        required: true,
    },
    lora: {
        type: String,
        required: false,
    },
    dimensions: {
        type: String,
        required: true,
    },
}); 

// Create a model using the schema
const CreateImageSettings = mongoose.model('CreateImageSettings', createImageSettings);

module.exports = CreateImageSettings;