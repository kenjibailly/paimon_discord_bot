const createEmbed = require('../../../helpers/embed');
const checkRequiredBalance = require('../../../helpers/check-required-balance');
const handleCancelThread = require('../../cancel-thread');
const userExchangeData = require('../../../helpers/userExchangeData');
const NextGames = require('../../../models/next-games');

async function handleExchangeChooseGameButton(interaction, client) {

    const user_exchange_data = userExchangeData.get(interaction.member.user.id);
    userExchangeData.delete(interaction.member.user.id);
        
    let next_game_position;
    let next_games;
    let wallet;

    const guild = await client.guilds.fetch(interaction.guildId);
    const thread = await guild.channels.fetch(interaction.channelId);

    try {

        wallet = await checkRequiredBalance(interaction, client, user_exchange_data.rewardPrice, thread);
        if(!wallet) { // if wallet has return error message
            await interaction.deferUpdate();
        }

        const newNextGame = new NextGames({
            guild_id: interaction.guildId,
            game_id: user_exchange_data.game._id,
            user_id: interaction.member.user.id,
        });

        const savedNextGame = await newNextGame.save();
        next_games = await NextGames.find({ guild_id: interaction.guildId });
        next_game_position = next_games.length;

        if (!savedNextGame) {
            // If the result is falsy, throw an error
            throw new Error('New event could not be saved.');
        }
    } catch (error) {
        logger.error("Error Adding Next Game:", error);
        const title = "Error Adding Next Game";
        const description = `I could not add the game to the database. Please contact your administrator, or try again later.`;
        const color = "error";
        const embed = createEmbed(title, description, color);
        // Send a confirmation message before closing the thread
        await interaction.editReply({
            embeds: [embed],
            components: []  // Ensure this is an empty array
        });        
        handleCancelThread(interaction, client);
        return;
    }

    // Step 1: Combine next_games with corresponding game details from user_exchange_data.games
    const combined_games = next_games.map(next_game => {
        // Find the corresponding game in user_exchange_data.games
        const corresponding_game = user_exchange_data.games.find(game => game._id.toString() === next_game.game_id.toString());

        return {
            date: next_game.date,
            name: corresponding_game ? corresponding_game.name : "Unknown Game",
            description: corresponding_game ? corresponding_game.description : "No description available."
        };
    });

    // Step 2: Sort the combined games by the `date` field in ascending order
    const sorted_games = combined_games.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Step 3: Populate the `next_games_list` with sorted games
    const next_games_list = [];
    sorted_games.forEach((game, index) => {
        const missionNumber = index + 1; // +1 to start counting from 1
        // Create a field for each game
        next_games_list.push({
            name: `${missionNumber}. ${game.name}`,
            value: game.description ? game.description : "No description available.",
            inline: false // You can set this to `true` to display fields inline
        });
    });

    const title = "Shop";
    const description = `Your game has been added to the list of upcoming games list. Your game is currently number ${next_game_position} on the list.\n` +
    `You now have **${wallet.amount}** ${user_exchange_data.tokenEmoji.token_emoji} in your wallet.\n\n` +
    `These are all the upcoming games:\n\u200B\n`;
    const color = "";
    const embed = createEmbed(title, description, color);
    embed.addFields(next_games_list);

    // Send success message before canceling the thread message
    await interaction.editReply({
        embeds: [embed],
        components: []
    });

    await handleCancelThread(interaction, client);
    
    // Send message to the parent channel if available
    const parentChannel = thread.parent;
    if (parentChannel) {
        const parentTitle = "Shop";
        const parentDescription = `<@${interaction.member.user.id}> has queud up a game to play next.\n` + 
        `This is the list of games to play next:\n\u200B\n`;
        const color = "";
        const parentEmbed = createEmbed(parentTitle, parentDescription, color);
        parentEmbed.addFields(next_games_list);
        
        await parentChannel.send({
            embeds: [parentEmbed],
        });
    }
}

module.exports = handleExchangeChooseGameButton;