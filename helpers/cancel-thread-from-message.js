const createEmbed = require("../helpers/embed");

async function cancelThreadFromMessage(guildId, channelId, client) {
  try {
    const guild = await client.guilds.fetch(guildId);
    let thread;

    try {
      thread = await guild.channels.fetch(channelId);
    } catch (err) {
      logger.warn(
        `Thread fetch failed: ${
          err.code === 10003 ? "Unknown Channel" : err.message
        }`
      );
      return;
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
              logger.warn(
                `Failed to remove member ${member.id}: ${removeErr.message}`
              );
            }
          }
        }
      } catch (err) {
        logger.warn(
          `Failed to send embed or fetch/remove members: ${err.message}`
        );
      }
    }, 1000);

    setTimeout(async () => {
      if (!thread) {
        logger.warn("Thread is undefined.");
        return;
      }

      try {
        if (thread.archived) {
          await thread.setArchived(false);
        }

        await thread.delete();
        logger.log(`Thread ${thread.id} deleted successfully`);
      } catch (err) {
        logger.warn(`Thread deletion failed: ${err.message}`);
      }
    }, 20000);
  } catch (err) {
    logger.error(`Failed to cancel thread from message: ${err.message}`);
  }
}

module.exports = cancelThreadFromMessage;
