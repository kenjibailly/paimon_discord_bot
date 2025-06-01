const createEmbed = require("../helpers/embed");

async function handleCancelThreadButton(interaction, client) {
  console.log("Deleting thread");
  try {
    const guild = await client.guilds.fetch(interaction.guildId);

    let thread;
    try {
      thread = await guild.channels.fetch(interaction.channelId);
    } catch (err) {
      console.warn(
        `Thread fetch failed: ${
          err.code === 10003 ? "Unknown Channel" : err.message
        }`
      );
      return interaction.reply({
        content: "This thread no longer exists.",
        flags: 64, // EPHEMERAL
      });
    }

    const title = "Exit";
    const description = `This thread will be closed shortly.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    setTimeout(async () => {
      try {
        await thread.send({ embeds: [embed] });

        const members = await thread.members.fetch();

        for (const member of members.values()) {
          if (member.id !== client.user.id) {
            try {
              await thread.members.remove(member.id);
            } catch (removeErr) {
              console.warn(
                `Failed to remove member ${member.id}: ${removeErr.message}`
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          `Failed to send embed or fetch/remove members: ${err.message}`
        );
      }
    }, 1000);

    setTimeout(async () => {
      if (!thread) {
        console.warn("Thread is undefined.");
        return;
      }

      try {
        if (thread.archived) {
          console.log("Thread is archived, unarchiving...");
          await thread.setArchived(false);
        }

        console.log(`Attempting to delete thread: ${thread.id}`);
        await thread.delete();
        console.log(`Thread ${thread.id} deleted successfully`);
      } catch (err) {
        console.warn(`Thread deletion failed: ${err.message}`);
      }
    }, 20000);

    try {
      await interaction.deferUpdate();
    } catch {}
  } catch (error) {
    console.error("Failed to close the thread:", error);

    const title = "Exit";
    const description = `An error occurred while trying to close this thread.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    try {
      await interaction.editReply({
        embeds: [embed],
        flags: 64, // EPHEMERAL
      });
    } catch (editErr) {
      console.warn(`Failed to edit interaction reply: ${editErr.message}`);
    }
  }
}

module.exports = handleCancelThreadButton;
