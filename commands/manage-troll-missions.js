const createEmbed = require("../helpers/embed");

async function handleManageTrollMissionsCommand(interaction, client) {
  const { guildId, channelId } = interaction;

  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(channelId);

  // Create a private thread that is only visible to the user who clicked the button
  const thread = await channel.threads.create({
    name: `Manage Troll Missions - ${interaction.member.user.globalName}`, // Ensure you use the correct user property
    autoArchiveDuration: 60, // Archive the thread after 60 minutes of inactivity
    reason: "User initiated manage troll missions interaction",
    invitable: false, // Don't allow other users to join the thread
    type: 12, // Private Thread (only visible to members who are added)
  });

  // Add the user who clicked the button to the thread
  await thread.members.add(interaction.member.user.id);

  // Post the message in the thread
  let title = "Manage Troll Missions";
  let description = `Do you want to create, update or remove a troll mission?`;
  let embed = createEmbed(title, description, "");

  // Send the message to the thread
  const message = await thread.send({
    embeds: [embed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 3, // Green style (for adding a troll mission)
            label: "Add",
            emoji: { name: "➕" }, // Emoji for add
            custom_id: "add-troll-mission-name",
          },
          {
            type: 2, // Button
            style: 1, // Primary style (for updating a troll mission)
            label: "Update",
            emoji: { name: "🖊️" }, // Pencil emoji for updating
            custom_id: "update-troll-mission",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a troll mission)
            label: "Remove",
            emoji: { name: "🗑️" }, // Trash bin emoji for removing
            custom_id: "remove-troll-mission",
          },
          {
            type: 2, // Button
            style: 4, // Danger style (for removing a troll mission)
            label: "Cancel",
            custom_id: "cancel-thread",
          },
        ],
      },
    ],
  });

  title = "Manage Troll Missions";
  description = `Please continue in the private thread I created [here](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}).`;
  embed = createEmbed(title, description, "");
  await interaction.editReply({ embeds: [embed], flags: 64 });
}

module.exports = handleManageTrollMissionsCommand;
