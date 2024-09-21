const TrolledUser = require('../models/trolled-users');
const { PermissionsBitField } = require('discord.js');

async function handleTrolledUserJoin(member) {
    try {
        const trolled_user = await TrolledUser.findOne({
            guild_id: member.guild.id,
            user_id: member.id,
        });

        if (trolled_user) {
            const role = member.guild.roles.cache.find(r => r.name === "Trolled");
            const trollChannel = member.guild.channels.cache.get(trolled_user.channel_id);

            if (role) {
                await member.roles.add(role);
                console.log(`Assigned "Trolled" role to ${member.user.tag}`);
            }

            if (trollChannel) {
                // Permissions for the trolled user
                await trollChannel.permissionOverwrites.create(member, {
                    VIEW_CHANNEL: PermissionsBitField.Flags.ViewChannel,
                    SEND_MESSAGES: PermissionsBitField.Flags.SendMessages,
                    ATTACH_FILES: PermissionsBitField.Flags.AttachFiles,
                    READ_MESSAGE_HISTORY: PermissionsBitField.Flags.ReadMessageHistory,
                });

                // Deny the @everyone role from seeing the channel
                await trollChannel.permissionOverwrites.create(member.guild.roles.everyone, {
                    VIEW_CHANNEL: PermissionsBitField.Flags.ViewChannel,
                }, {
                    deny: true,
                });

                console.log(`Granted access to troll channel for ${member.user.tag}`);
            }
        }
    } catch (error) {
        console.error('Error handling trolled user join:', error);
    }
}

module.exports = handleTrolledUserJoin;