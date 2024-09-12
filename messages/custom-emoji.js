const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const userExchangeData = require('../helpers/userExchangeData');
const getTokenEmoji = require('../helpers/get-token-emoji');
const getReward = require('../helpers/get-reward');
const sharp = require('sharp');
const axios = require('axios');

async function handleCustomEmoji(message, client) {

    const messageContent = message.content;
    const user_exchange_data = userExchangeData.get(message.author.id);

    const imageBuffer = await validateAndProcessPicture(message);

    if (typeof imageBuffer === 'string') {
        console.log(imageBuffer);
        const title = "Shop";
        const description = `${imageBuffer}\nPlease try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    } else {
        // After processing the image with sharp    
        const processedImageBuffer = await sharp(imageBuffer)
        .resize(128, 128, {
            fit: 'inside',
        })
        .toBuffer();

        // Add the image buffer to user_exchange_data
        user_exchange_data.processedImage = processedImageBuffer;
    }

    const contentValidationError = validateMessageContent(messageContent);
    if (contentValidationError) {
        // Handle message content validation error
        console.log(contentValidationError);
        const title = "Shop";
        const description = `${contentValidationError}\nPlease try again.`;
        const color = "error";
        const embed = createEmbed(title, description, color);

        await message.channel.send({
            embeds: [embed],
        });
        return;
    }


    // const attachment = message.attachments.first();

    // Fetch token emoji using the getTokenEmoji function
    const tokenEmoji = await getTokenEmoji(message.guild.id);
    // Validation when tokenEmoji isn't set
    if (tokenEmoji.data) {
        await message.channel.send({
            embeds: [tokenEmoji],
        });
        return;
    }


    const reward = await getReward(message.guild.id, user_exchange_data.name);

    // user_exchange_data.attachment = attachment;
    user_exchange_data.emojiName = messageContent;
    user_exchange_data.rewardPrice = reward.price;
    user_exchange_data.tokenEmoji = tokenEmoji;

    userExchangeData.set(message.author.id, user_exchange_data);



    if (reward.data) {
        await message.channel.send({
            embeds: [reward],
        });
        return;
    }
    
    // Determine if the emoji is custom or normal
    const emojiDisplay = tokenEmoji.token_emoji_id 
        ? `<:${tokenEmoji.token_emoji_name}:${tokenEmoji.token_emoji_id}>` 
        : tokenEmoji.token_emoji;

    const title = "Shop";
    const description = `
    Do you want to add this custom server emoji?
    This will deduct **${reward.price}** ${emojiDisplay} from your wallet.`;
    const embed = createEmbed(title, description, "");


    // Construct the button component
    const buttonComponent = {
        type: 2, // Button type
        style: 1, // Primary style
        label: "Exchange",
        emoji: {
            name: tokenEmoji.token_emoji_name, // Use the emoji name
            id: tokenEmoji.token_emoji_id // Include the ID if it's a custom emoji
        },
        custom_id: `exchange-custom-emoji`
    };

    // Send the message
    await message.channel.send({
        embeds: [embed],
        components: [
            {
                type: 1, // Action row type
                components: [buttonComponent, {
                    type: 2, // Button type
                    style: 4, // Danger style
                    label: "Cancel",
                    custom_id: "cancel-thread"
                }]
            }
        ]
    });

}


// Function to validate and resize/compress image if necessary
async function validateAndProcessPicture(message) {
    const validExtensions = ['png', 'jpg', 'jpeg', 'gif'];
    const maxSizeInBytes = 256 * 1024; // 256 KB
    const maxDimensions = { width: 128, height: 128 };

    // Check if the message has attachments
    const attachment = message.attachments.first();
    if (!attachment) {
        return "No picture or gif was uploaded.";
    }

    const fileExtension = attachment.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
        return "Invalid file type. Please upload a picture or gif (png, jpg, jpeg, gif).";
    }

    // Fetch the image data from the URL
    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    // Check image dimensions
    const imageMetadata = await sharp(imageBuffer).metadata();
    let processedImageBuffer = imageBuffer;

    if (imageMetadata.width > maxDimensions.width || imageMetadata.height > maxDimensions.height) {
        // console.log("Image is too large, resizing...");

        // Resize the image
        processedImageBuffer = await sharp(imageBuffer)
            .resize(maxDimensions.width, maxDimensions.height, {
                fit: 'inside',
            })
            .toBuffer();

        // console.log("Image has been resized.");
    }

    // After resizing, check if the file is too large
    if (processedImageBuffer.length > maxSizeInBytes) {
        // console.log("Resized image is too large, compressing...");
        
        // Compress the image to reduce size
        processedImageBuffer = await sharp(processedImageBuffer)
            .jpeg({ quality: 80 }) // Adjust compression level as needed
            .toBuffer();

        // console.log("Image has been compressed.");
    }

    // Final size check after processing
    if (processedImageBuffer.length > maxSizeInBytes) {
        return `Even after compression, the file is too large. Please upload a smaller file.`;
    }

    // If everything is fine, return the processed image buffer
    return processedImageBuffer;
}

function validateMessageContent(content) {
    const maxEmojiNameLength = 32; // Discord emoji name length limit
    const validNamePattern = /^[\w-]+$/; // Allows letters, numbers, underscores, and hyphens

    if (!content) {
        return "You didn't add the name of the emoji.";
    }

    if (content.length > maxEmojiNameLength) {
        return `Emoji name is too long. It should be under ${maxEmojiNameLength} characters.`;
    }

    if (!validNamePattern.test(content)) {
        return "Emoji name contains invalid characters. Only letters, numbers, underscores, and hyphens are allowed.";
    }

    // If all checks pass, return null to indicate no errors
    return null;
}

module.exports = handleCustomEmoji;
