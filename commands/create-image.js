const createEmbed = require('../helpers/embed');
const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const workflow = require('../AI/workflow.json');
const { createImageSettingsTemporaryCache, loadUserSettingsIntoCache } = require('../helpers/create-image-settings-cache');
const data_json = require('../AI/data.json');

async function handleCreateImageCommand(interaction, client) {

    let user_id = interaction.user.id;

    let parentModel;

    let create_image_settings_user_data_cache = createImageSettingsTemporaryCache.get(user_id);
    if (!create_image_settings_user_data_cache) {
        await loadUserSettingsIntoCache(user_id);
        create_image_settings_user_data_cache = createImageSettingsTemporaryCache.get(user_id);
        if(!create_image_settings_user_data_cache) {
            const defaultCheckpoint = Object.values(data_json).flatMap(model => 
                model.checkpoints.filter(checkpoint => checkpoint.default === true)
            ).map(checkpoint => checkpoint.file)[0]; // Get the file of the first found default checkpoint
    
            // Find the model that contains the default checkpoint
            parentModel = Object.values(data_json).find(model => 
                model.checkpoints.some(checkpoint => checkpoint.file === defaultCheckpoint)
            );

            // Get the first dimension from the found parent model
            const dimensions = Object.entries(parentModel.dimensions)[0]; // Get the first dimension entry (e.g., ['1:1 square', '1024x1024'])

            if (dimensions) {
                const dimensionValue = dimensions[1];

                // Set model and dimensions in the cache
                createImageSettingsTemporaryCache.set(user_id, {
                    model: defaultCheckpoint,
                    dimensions: dimensionValue
                });
                create_image_settings_user_data_cache = createImageSettingsTemporaryCache.get(user_id);
            } else {
                // output error message
            }
        }
    }

    // Find the model that contains the default checkpoint
    parentModel = Object.values(data_json).find(model => 
        model.checkpoints.some(checkpoint => checkpoint.file === create_image_settings_user_data_cache.model)
    );


    // Find the options for the command
    const prompt = interaction.options.getString('prompt');

    const dimensions = create_image_settings_user_data_cache.dimensions;
    const model = create_image_settings_user_data_cache.model;
    const lora = create_image_settings_user_data_cache.lora;
    const checkpointName = parentModel.checkpoints.find(checkpoint => checkpoint.file === model)?.name || "Unknown Checkpoint";
    const loraName = parentModel.loras.find(lora_data => lora_data.file === lora)?.name || "";


    // Split the string into width and height
    const [width, height] = dimensions.split('x').map(Number); // Convert to numbers

    // Construct the follow-up URL
    const clientId = uuidv4(); // Generate a unique client ID

    let ws;

    try {
      ws = new WebSocket(`ws://${process.env.COMFYUI_ADDRESS}/ws?clientId=${clientId}`); // Connect with the client ID
    } catch (error) {
      logger.error("Could not connect to websocket");      
    }

    try {

        await interaction.deferReply();

        const { previewImageKey } = editWorkflow(prompt, width, height, model, lora);
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

        await interaction.editReply({ embeds: [initialEmbed] });

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
                    const result = await interaction.editReply({ embeds: [initialEmbed] });
                    if (result instanceof Error) {
                        const errorEmbed = createEmbed(
                            "Error",
                            "Something went wrong while creating the image.",
                            "error"
                        );
                
                        await interaction.editReply({ embeds: [errorEmbed] });
                    }
            
                } catch (error) {
                    logger.error('Error updating message:', error.response ? error.response.data : error.message);
                    const title = "Error";
                    const description = "Something went wrong while creating the image.";
                    const color = "error";
                    const errorEmbed = createEmbed(title, description, color);
            
                    await interaction.editReply({ embeds: [errorEmbed] });
                    
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

                    const result = await interaction.editReply({ embeds: [initialEmbed] });
                    if (result instanceof Error) {
                        const title = "Error";
                        const description = "Something went wrong while creating the image.";
                        const color = "error";
                        const errorEmbed = createEmbed(title, description, color);
                
                        await interaction.editReply({ embeds: [errorEmbed] });
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
                        const title = "Image Created";
                        const description = `Model: **${checkpointName}**\n` + 
                        `${loraName 
                        ? `LoRa: **${loraName}**\n` 
                        : ``}` +
                        "\nYour image has been created succesfully!\nTake a look at this master piece!";
                        const color = "";
                        const successEmbed = createEmbed(title, description, color)
                        .setImage(`attachment://${image.filename}`); // Embed image
            
                        // Convert the embed to a plain object using .toJSON()
                        const embedObject = successEmbed.toJSON();
            
                        try {
            
                            // Fetch the image from the local URL
                            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                            const imageBuffer = Buffer.from(response.data, 'binary'); // Convert the response to a buffer
            
                            // Send a follow-up message with the image and embed
                            await interaction.editReply({
                                embeds: [embedObject],
                                files: [{ attachment: imageBuffer, name: image.filename }],
                            });
                            
                            // if (result instanceof Error) {
                            //     const errorEmbed = createEmbed(
                            //         "Error",
                            //         "Something went wrong while creating the image.",
                            //         "error"
                            //     );
                        
                            //     await interaction.editReply({ embeds: [errorEmbed] });
                            // }
                    
                        } catch (error) {
                            logger.error('Error updating message:', error.response ? error.response.data : error.message);
                            logger.error('Error updating message:', error.response.data.errors.embeds);
                            const errorEmbed = createEmbed(
                                "Error",
                                "Something went wrong while creating the image.",
                                "error"
                            );
                    
                            await interaction.editReply({ embeds: [errorEmbed] });
                            
                        }
                    } else {
                        // If image generation failed
                        const errorEmbed = createEmbed(
                            "Image Creation Failed",
                            "Sorry, we couldn't create your image. Please try again later.",
                            "error"
                        );
                
                        await interaction.editReply({ embeds: [errorEmbed] });
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

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}


function getRandomSeed() {
    const max = BigInt('0xffffffffffffffff'); // Maximum value
    const randomNum = BigInt(Math.floor(Math.random() * Number(max + 1n))); // Scale to 0 to max
    return Number(randomNum);
}

function editWorkflow(prompt, width, height, modelFile, loraFile) {
    let previewImageKey = null;
  
    // Function to find model settings dynamically across all parent keys
    function findModelSettings(file) {
      for (const parentKey in data_json) {
        const checkpoints = data_json[parentKey].checkpoints;
        const model = Object.values(checkpoints).find(checkpoint => checkpoint.file === file);
        if (model) return model; // Return as soon as we find it
      }
      return null; // Return null if not found
    }
  
    // Function to find LoRA settings dynamically across all parent keys
    function findLoRASettings(file) {
      for (const parentKey in data_json) {
        const loras = data_json[parentKey].loras;
        const lora = Object.values(loras).find(lora => lora.file === file);
        if (lora) return lora; // Return as soon as we find it
      }
      return null; // Return null if not found
    }
  
    // Find the model and LoRA settings based on the provided file names
    const modelSettings = findModelSettings(modelFile);
    const loraSettings = findLoRASettings(loraFile);
  
    // Iterate through the workflow to find nodes and update their respective values
    Object.keys(workflow).forEach(key => {
      const node = workflow[key];
  
      // Update seed for KSampler node
      if (node.class_type === 'KSampler') {
        node.inputs.seed = getRandomSeed(); // Random seed
        // Update KSampler settings (cfg, steps, sampler_name, scheduler) from the model settings
        if (modelSettings) {
          node.inputs.cfg = modelSettings.settings.cfg;
          node.inputs.steps = modelSettings.settings.steps;
          node.inputs.sampler_name = modelSettings.settings.sampler_name;
          node.inputs.scheduler = modelSettings.settings.scheduler;
        }
      }

    // Update text for CLIPTextEncode (Prompt) Positive node
    if (node.class_type === 'CLIPTextEncode' && node._meta.title === 'CLIP Text Encode (Prompt) Positive') {
        node.inputs.text = prompt; // Update prompt or fallback to the provided one
    }
  
      // Update text for CLIPTextEncode (Prompt) Positive node
      if (node.class_type === 'CLIPTextEncode' && node._meta.title === 'CLIP Text Encode (Prompt) Positive Style') {
        node.inputs.text = modelSettings?.settings.positive_prompt; // Update prompt or fallback to the provided one
      }
  
      // Update text for CLIPTextEncode (Prompt) Negative node
      if (node.class_type === 'CLIPTextEncode' && node._meta.title === 'CLIP Text Encode (Prompt) Negative') {
        node.inputs.text = modelSettings?.settings.negative_prompt; // Update the negative prompt from model settings
      }
      
      // Update width and height for EmptyLatentImage node
      if (node.class_type === 'EmptyLatentImage') {
        node.inputs.width = width;
        node.inputs.height = height;
      }
  
      // Update model for UNETLoader or CheckpointLoaderSimple nodes
      if (node._meta?.title === 'Load Checkpoint' || node.class_type === 'UNETLoader') {
        node.inputs.ckpt_name = modelFile; // Update the checkpoint name with the selected model file
      }
  
      // Update lora settings for CR LoRA Stack
      if (node.class_type === 'CR LoRA Stack' && loraSettings) {
        node.inputs.switch_1 = "On";
        node.inputs.lora_name_1 = loraFile; // Set LoRA file
        node.inputs.model_weight_1 = loraSettings.model_weight || 1; // Set model weight
        node.inputs.clip_weight_1 = loraSettings.clip_weight || 1;   // Set clip weight
      }
  
      // Update stop_at_clip_layer (clip_skip) for CLIPSetLastLayer node
      if (node.class_type === 'CLIPSetLastLayer') {
        node.inputs.stop_at_clip_layer = modelSettings?.settings.clip_skip;
      }
  
      // Find the PreviewImage node
      if (node.class_type === 'PreviewImage') {
        // Check if the title contains "Final"
        if (node._meta.title.includes('Final')) {
          previewImageKey = key; // Store this key
        //   break; // Exit the loop since we found the one with "Final"
        }
        // Otherwise, keep the first PreviewImage node (if no "Final" is found later)
        if (!previewImageKey) {
          previewImageKey = key;
        }
      }
    });
  
    return { previewImageKey };
}


module.exports = handleCreateImageCommand;