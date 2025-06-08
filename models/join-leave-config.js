const mongoose = require("mongoose");

// Define the JoinLeaveConfig schema
const joinLeaveConfigSchema = new mongoose.Schema({
  guild_id: {
    type: String,
    required: true,
    unique: true, // Ensures only one document per guild_id
  },
  channel: {
    type: String,
    required: true,
  },
});

// Create a model using the schema
const JoinLeaveConfig = mongoose.model(
  "JoinLeaveConfig",
  joinLeaveConfigSchema
);

module.exports = JoinLeaveConfig;
