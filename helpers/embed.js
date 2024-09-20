const { EmbedBuilder } = require('discord.js');

function createEmbed (title, description, color) {
    if(!color) {
        color = "#00FF00";
    }
    if(color == "error") {
        color = "#FF0000";
    }
    const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);

    return embed;
}

module.exports = createEmbed;