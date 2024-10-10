const createEmbed = require('./embed');

async function checkPermissions(interaction, client, permission, guild){
    const botMember = await guild.members.fetch(client.user.id);
    if (!botMember.permissions.has(permission)) {
        const title = "Permissions Error";
        const description = `I don't have permission to manage custom emojis in this server. Please contact a server admin.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        return embed;
    } else {
        return null;
    }
}

module.exports = checkPermissions;