const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const axios = require('axios'); // You can use axios for HTTP requests
const FormData = require('form-data'); // If needed to upload data
const WebSocket = require('ws'); // Ensure you have the ws package installed
const { v4: uuidv4 } = require('uuid');
const workflow = require('../AI/ponyXL_lora.json');

async function handleCreateImageCommand(interaction, client, res) {
    const { data, guild_id } = interaction;

    // Find the options for the command
    const promptOption = data.options.find(opt => opt.name === 'prompt');
    const prompt = promptOption ? promptOption.value : 'default prompt';

    const dimensionsOption = data.options.find(opt => opt.name === 'dimensions');
    const dimensions = dimensionsOption ? dimensionsOption.value : '768x768';

    // Split the string into width and height
    const [width, height] = dimensions.split('x').map(Number); // Convert to numbers

    // Your application ID and the token from the interaction
    const applicationId = process.env.APP_ID; // Replace with your application ID

    // Use the interaction token directly from the interaction payload
    const token = interaction.token; // The interaction token

    // Construct the follow-up URL
    const followUpUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`;
    const clientId = uuidv4(); // Generate a unique client ID

    let ws;

    try {
      ws = new WebSocket(`ws://${process.env.COMFYUI_ADDRESS}/ws?clientId=${clientId}`); // Connect with the client ID
    } catch (error) {
      logger.error("Could not connect to websocket");      
    }

    try {

        // Send a deferred response
        await res.send({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });

        const { previewImageKey } = editWorkflow(prompt, width, height);

        // Make the POST request to ComfyUI API to queue the image generation
        const response = await axios.post(`http://${process.env.COMFYUI_ADDRESS}/prompt`, {
            prompt: workflow,
            client_id: clientId // Include client ID here
        });

        const promptId = response.data.prompt_id; // The prompt ID from your previous API call

        const title = "Create Image";
        let pendingQueue;
        try {
            const queueResponse = await axios.get(`http://${process.env.COMFYUI_ADDRESS}/queue`);
            // Accessing queue_pending from the correct place
            pendingQueue = queueResponse.data.queue_pending;
        } catch (error) {
            logger.error('Error fetching queue:', error.message);
        }
        let description = `Generating your image... Please wait.\n`;
        let pendingQueueLength = pendingQueue.length;
        let queuDescription = `Your place in queue: **${pendingQueueLength}**`;
        const initialDescription = description + queuDescription + "\n\nProgress: **0%**";
        const color = "";

        // Send an initial response to indicate that the image is being generated
        const initialEmbed = createEmbed(title, initialDescription, color);

        await updateMessageWithRetry(followUpUrl, initialEmbed);

        ws.on('message', async (data) => {
            const message = JSON.parse(data);

            let image = null;
            let imageUrl = null;
        
            // Check if the message indicates that the execution is complete for this prompt
            if (message.type === 'progress' && message.data.prompt_id === promptId) {
                try {
                    const percentage_progress = Math.floor((message.data.value / message.data.max) * 100);
                    const updatedDescription = description + "\nProgress: **" + percentage_progress + "%**";
                    const initialEmbed = createEmbed(title, updatedDescription, color);
                    // Update the original message using the follow-up URL
                    const result = await updateMessageWithRetry(followUpUrl, initialEmbed);
                    if (result instanceof Error) {
                        const errorEmbed = createEmbed(
                            "Error",
                            "Something went wrong while creating the image.",
                            "error"
                        );
                
                        await updateMessageWithRetry(followUpUrl, errorEmbed);
                    }
            
                } catch (error) {
                    logger.error('Error updating message:', error.response ? error.response.data : error.message);
                    const errorEmbed = createEmbed(
                        "Error",
                        "Something went wrong while creating the image.",
                        "error"
                    );
            
                    await updateMessageWithRetry(followUpUrl, errorEmbed);
                    
                }
            }

            if (message.type === 'execution_success') {
                if (!message.type === 'execution_success' && message.data.prompt_id === promptId) {
                    pendingQueueLength = pendingQueueLength - 1;
                    if(pendingQueueLength < 0) {
                        pendingQueueLength = 0;
                    }
                    let queuDescription = `Your place in queue: **${pendingQueueLength}**`;
                    const initialDescription = description + queuDescription + "\n\nProgress: **0%**";
                    // Send an initial response to indicate that the image is being generated
                    const initialEmbed = createEmbed(title, initialDescription, color);

                    const result = await updateMessageWithRetry(followUpUrl, initialEmbed);
                    if (result instanceof Error) {
                        const errorEmbed = createEmbed(
                            "Error",
                            "Something went wrong while creating the image.",
                            "error"
                        );
                
                        await updateMessageWithRetry(followUpUrl, errorEmbed);
                    }
                }
            }
            
            // Check if the execution is done
            if (message.type === 'execution_success' && message.data.prompt_id === promptId) {
                try {
                    const historyResponse = await axios.get(`http://${process.env.COMFYUI_ADDRESS}/history/${promptId}`);
                    // Check if the image generation is complete
                    const history = historyResponse.data[promptId];
                    if (history && history.outputs) {
                        const output = history.outputs[previewImageKey]; // Node ID where the image is saved
                        
                        if (output && output.images && output.images.length > 0) {
                            image = output.images[0]; // Get the first image
                            imageUrl = `http://${process.env.COMFYUI_ADDRESS}/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                        }
                    }
                    

                    if (imageUrl) {
                        const successEmbed = createEmbed(
                            "Image Created",
                            "Your image has been created succesfully!\nTake a look at this master piece!",
                            ""
                        )
                        .setImage(`attachment://${image.filename}`); // Embed image
            
                        // Convert the embed to a plain object using .toJSON()
                        const embedObject = successEmbed.toJSON();
            
                        try {
            
                            // Fetch the image from the local URL
                            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                            const imageBuffer = Buffer.from(response.data, 'binary'); // Convert the response to a buffer
            
                            // Create a new FormData instance
                            const formData = new FormData();
            
                            // Add the image buffer to formData with the expected "files" key
                            formData.append('files[0]', imageBuffer, { filename: image.filename });
            
                            // Add the embed to formData, converted to a JSON string
                            formData.append('payload_json', JSON.stringify({
                                embeds: [embedObject],
                                flags: 64 // Only visible to the user
                            }));
            
                            const result = await updateFormDataWithRetry(followUpUrl, formData);
                            if (result instanceof Error) {
                                const errorEmbed = createEmbed(
                                    "Error",
                                    "Something went wrong while creating the image.",
                                    "error"
                                );
                        
                                await updateMessageWithRetry(followUpUrl, errorEmbed);
                            }
                    
                        } catch (error) {
                            logger.error('Error updating message:', error.response ? error.response.data : error.message);
                            logger.error('Error updating message:', error.response.data.errors.embeds);
                            const errorEmbed = createEmbed(
                                "Error",
                                "Something went wrong while creating the image.",
                                "error"
                            );
                    
                            await updateMessageWithRetry(followUpUrl, errorEmbed);
                            
                        }
                    } else {
                        // If image generation failed
                        const errorEmbed = createEmbed(
                            "Image Creation Failed",
                            "Sorry, we couldn't create your image. Please try again later.",
                            "error"
                        );
                
                        await updateMessageWithRetry(followUpUrl, errorEmbed);
                    }
                } catch (error) {
                    logger.error('Error fetching image from history:', error.message);
                }

                ws.close(); // Close the connection when execution is done
            }
        });

    } catch (error) {
        logger.error("Error creating image:", error);
        const errorEmbed = createEmbed(
            "Error",
            "Something went wrong while creating the image.",
            "error"
        );

        await updateMessageWithRetry(followUpUrl, errorEmbed);
    }
}


function getRandomSeed() {
    const max = BigInt('0xffffffffffffffff'); // Maximum value
    const randomNum = BigInt(Math.floor(Math.random() * Number(max + 1n))); // Scale to 0 to max
    return randomNum.toString();
}

function editWorkflow(prompt, width, height) {
  let previewImageKey = null;
  // Iterate through the workflow to find nodes and update their respective values
  for (const key in workflow) {
    const node = workflow[key];

    // Update seed for KSampler node
    if (node.class_type === 'KSampler') {
      node.inputs.seed = getRandomSeed();
    }

    // Update text for CLIPTextEncode (Prompt) Positive node
    if (node.class_type === 'CLIPTextEncode' && node._meta.title === 'CLIP Text Encode (Prompt) Positive') {
      node.inputs.text = prompt;
    }

    // Find the PreviewImage node
    if (node.class_type === 'PreviewImage') {
      // Check if the title contains "Final"
      if (node._meta.title.includes('Final')) {
        previewImageKey = key; // Store this key
        break; // Exit the loop since we found the one with "Final"
      }
      // Otherwise, keep the first PreviewImage node (if no "Final" is found later)
      if (!previewImageKey) {
        previewImageKey = key;
      }
    }

    // Update width and height for EmptyLatentImage node
    if (node.class_type === 'EmptyLatentImage') {
      node.inputs.width = width;
      node.inputs.height = height;
    }

  }
  return { previewImageKey };
}

async function updateMessageWithRetry(followUpUrl, initialEmbed, retries = 3) {
  try {
      await axios.patch(followUpUrl, {
          embeds: [initialEmbed],
      });
  } catch (error) {
      if (retries > 0 && error.response?.data?.code === 10015) { // Webhook error
          logger.warn('Retrying message update...');
          return updateMessageWithRetry(followUpUrl, initialEmbed, retries - 1);
      }
      logger.error('Error updating message:', error.response ? error.response.data : error.message);
      return error;
  }
}


async function updateFormDataWithRetry(followUpUrl, formData, retries = 3) {
  try {
      await axios.patch(followUpUrl, formData, {
          headers: {
              ...formData.getHeaders() // Include necessary headers for multipart/form-data
          }
      });
  } catch (error) {
      if (retries > 0 && error.response?.data?.code === 10015) { // Webhook error
          logger.warn('Retrying form data message update...');
          return updateFormDataWithRetry(followUpUrl, formData, retries - 1);
      }
      logger.error('Error updating form data message:', error.response ? error.response.data : error.message);
      return error;
  }
}


module.exports = handleCreateImageCommand;