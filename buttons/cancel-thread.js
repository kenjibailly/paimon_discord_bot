const createEmbed = require("../helpers/embed");

async function handleCancelThreadButton(interaction, client) {
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

    // Immediately defer the update
    try {
      await interaction.deferUpdate();
    } catch {}

    // Send embed and remove members (after 1s)
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
        console.warn(`Failed to send embed or manage members: ${err.message}`);
      }
    }, 1000);

    // Delete the thread (after 20s)
    setTimeout(async () => {
      try {
        console.log(`Owner: ${thread.ownerId}, Bot: ${client.user.id}`);
        console.log(`Archived: ${thread.archived}, Locked: ${thread.locked}`);

        if (thread.archived) {
          await thread.setArchived(false).catch(console.warn);
        }

        if (thread.locked) {
          await thread.setLocked(false).catch(console.warn);
        }

        // Ensure bot is a member
        const botThreadMember = await thread.members
          .fetch(client.user.id)
          .catch(() => null);
        console.log("Bot is thread member:", !!botThreadMember);

        if (!botThreadMember) {
          console.log("Adding bot to thread as member...");
          await thread.members.add(client.user.id).catch(console.warn);
        }

        await thread.delete();
        console.log("Thread deleted successfully.");
      } catch (err) {
        console.warn(`Thread deletion failed: ${err.message}`);
      }
    }, 20000);
  } catch (error) {
    console.error("Failed to close the thread:", error);

    const title = "Exit";
    const description = `An error occurred while trying to close this thread.`;
    const color = "error";
    const embed = createEmbed(title, description, color);

    try {
      await interaction.editReply({
        embeds: [embed],
        flags: 64,
      });
    } catch (editErr) {
      console.warn(`Failed to edit interaction reply: ${editErr.message}`);
    }
  }
}

module.exports = handleCancelThreadButton;
