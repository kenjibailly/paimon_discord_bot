const createEmbed = require("../../helpers/embed");
const {
  createImageSettingsUsersDataCache,
  loadUserSettingsIntoCache,
  createImageSettingsTemporaryCache,
} = require("../../helpers/create-image-settings-cache");
const createImageSettings = require("../../models/create-image-settings");

async function handleRemoveLoraButton(interaction, client) {
  const buttonComponent = {
    type: 1, // Action row type
    components: [
      {
        type: 2, // Button type
        style: 1, // Primary style
        label: "Settings Menu",
        custom_id: `create-image-settings`,
      },
    ],
  };

  try {
    const userId = interaction.user.id; // Corrected userId reference

    // Unset the lora field from the user's settings in the database
    await createImageSettings.findOneAndUpdate(
      { user_id: userId }, // Query by user_id
      { $unset: { lora: "" } }, // Remove the `lora` field
      { new: true } // Return the updated document
    );

    // Update the cache
    const userCache = createImageSettingsTemporaryCache.get(userId);
    if (userCache) {
      const plainUserCache = userCache.toObject(); // Convert to a plain object
      delete plainUserCache.lora; // Remove lora from the plain object
      createImageSettingsTemporaryCache.set(userId, plainUserCache); // Update cache with plain object
    }

    const title = `Remove LoRa Success`;
    const description = `I successfully removed your LoRa!`;
    const color = ""; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    // Ensure the interaction is updated after deferring
    await interaction.editReply({
      embeds: [embed],
      components: [buttonComponent],
    });
  } catch (error) {
    console.error("Handle Remove Lora Button:", error);

    const title = `Remove LoRa Error`;
    const description = `I couldn't remove your LoRa from the database, please try again later.`;
    const color = "error"; // Changed to hex code for red
    const embed = createEmbed(title, description, color);

    // Ensure error reply is sent only if the interaction wasn't already deferred/replied to
    if (!interaction.replied) {
      await interaction.followUp({
        embeds: [embed],
        components: [buttonComponent],
        flags: 64,
      });
    }
  }
}

module.exports = handleRemoveLoraButton;
