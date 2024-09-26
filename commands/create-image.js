const { InteractionResponseType } = require('discord-interactions');
const createEmbed = require('../helpers/embed');
const axios = require('axios'); // You can use axios for HTTP requests
const FormData = require('form-data'); // If needed to upload data
const WebSocket = require('ws'); // Ensure you have the ws package installed
const { v4: uuidv4 } = require('uuid');


async function handleCreateImageCommand(interaction, client, res) {
    const { data, guild_id } = interaction;

    // Find the 'status' option for the prompt
    const promptOption = data.options.find(opt => opt.name === 'prompt');
    const prompt = promptOption ? promptOption.value : 'default prompt';

    // Your application ID and the token from the interaction
    const applicationId = process.env.APP_ID; // Replace with your application ID

    // Use the interaction token directly from the interaction payload
    const token = interaction.token; // The interaction token

    // Construct the follow-up URL
    const followUpUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`;

    const clientId = uuidv4(); // Generate a unique client ID
    const ws = new WebSocket(`ws://${process.env.COMFYUI_ADDRESS}/ws?clientId=${clientId}`); // Connect with the client ID

    try {

        // Send a deferred response
        await res.send({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });

        // Modify the workflow for the ComfyUI API request
        const workflow = {
            "1": {
              "inputs": {
                "seed": getRandomSeed(),
                "steps": 20,
                "cfg": 7,
                "sampler_name": "euler_ancestral",
                "scheduler": "normal",
                "denoise": 1,
                "model": [
                  "9",
                  0
                ],
                "positive": [
                  "7",
                  0
                ],
                "negative": [
                  "5",
                  0
                ],
                "latent_image": [
                  "14",
                  0
                ]
              },
              "class_type": "KSampler",
              "_meta": {
                "title": "KSampler"
              }
            },
            "3": {
              "inputs": {
                "ckpt_name": "ponyDiffusionV6XL_v6StartWithThisOne.safetensors"
              },
              "class_type": "CheckpointLoaderSimple",
              "_meta": {
                "title": "Load Checkpoint"
              }
            },
            "4": {
              "inputs": {
                "text": "score_9, score_8_up, score_7_up, anime",
                "clip": [
                  "9",
                  1
                ]
              },
              "class_type": "CLIPTextEncode",
              "_meta": {
                "title": "CLIP Text Encode (Prompt) Positive Style"
              }
            },
            "5": {
              "inputs": {
                "text": "low-res, bad anatomy, bad hands, text, error, missing \u0003fingers, extra digit, fewer digits, cropped, worst quality, \u0003low quality, normal quality, jpeg artifacts, signature, \u0003watermark, username, blurry, artist name,(deformed, \u0003distorted, disfigured:1.3), poorly drawn, bad anatomy, \u0003wrong anatomy, extra limb, missing limb, floating limbs, \u0003(mutated hands and fingers:1.4), disconnected limbs, \u0003mutation, mutated, ugly, disgusting, blurry, amputation",
                "clip": [
                  "9",
                  1
                ]
              },
              "class_type": "CLIPTextEncode",
              "_meta": {
                "title": "CLIP Text Encode (Prompt) Negative"
              }
            },
            "6": {
              "inputs": {
                "text": prompt,
                "clip": [
                  "9",
                  1
                ]
              },
              "class_type": "CLIPTextEncode",
              "_meta": {
                "title": "CLIP Text Encode (Prompt) Positive"
              }
            },
            "7": {
              "inputs": {
                "conditioning_to": [
                  "4",
                  0
                ],
                "conditioning_from": [
                  "6",
                  0
                ]
              },
              "class_type": "ConditioningConcat",
              "_meta": {
                "title": "Conditioning (Concat)"
              }
            },
            "8": {
              "inputs": {
                "switch_1": "Off",
                "lora_name_1": "None",
                "model_weight_1": 1,
                "clip_weight_1": 1,
                "switch_2": "Off",
                "lora_name_2": "None",
                "model_weight_2": 1,
                "clip_weight_2": 1,
                "switch_3": "Off",
                "lora_name_3": "None",
                "model_weight_3": 1,
                "clip_weight_3": 1
              },
              "class_type": "CR LoRA Stack",
              "_meta": {
                "title": "💊 CR LoRA Stack"
              }
            },
            "9": {
              "inputs": {
                "model": [
                  "3",
                  0
                ],
                "clip": [
                  "12",
                  0
                ],
                "lora_stack": [
                  "8",
                  0
                ]
              },
              "class_type": "CR Apply LoRA Stack",
              "_meta": {
                "title": "💊 CR Apply LoRA Stack"
              }
            },
            "11": {
              "inputs": {
                "samples": [
                  "1",
                  0
                ],
                "vae": [
                  "3",
                  2
                ]
              },
              "class_type": "VAEDecode",
              "_meta": {
                "title": "VAE Decode"
              }
            },
            "12": {
              "inputs": {
                "stop_at_clip_layer": -2,
                "clip": [
                  "3",
                  1
                ]
              },
              "class_type": "CLIPSetLastLayer",
              "_meta": {
                "title": "CLIP Set Last Layer"
              }
            },
            "13": {
                "inputs": {
                  "images": [
                    "11",
                    0
                  ]
                },
                "class_type": "PreviewImage",
                "_meta": {
                  "title": "Preview Image Step 5"
                }
              },
            "14": {
              "inputs": {
                "width": 768,
                "height": 768,
                "batch_size": 1
              },
              "class_type": "EmptyLatentImage",
              "_meta": {
                "title": "Empty Latent Image"
              }
            }
        }

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

        try {
            // Update the original message using the follow-up URL
            await axios.patch(followUpUrl, {
                embeds: [initialEmbed],
            });
    
        } catch (error) {
            logger.error('Error updating message:', error.response ? error.response.data : error.message);
            throw new Error('Error updating message:', error.response ? error.response.data : error.message);
            
        }

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
                    await axios.patch(followUpUrl, {
                        embeds: [initialEmbed],
    
                    });
            
                } catch (error) {
                    logger.error('Error updating message:', error.response ? error.response.data : error.message);
                    throw new Error('Error updating message:', error.response ? error.response.data : error.message);
                    
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

                    try {
                        // Update the original message using the follow-up URL
                        await axios.patch(followUpUrl, {
                            embeds: [initialEmbed],
        
                        });
                
                    } catch (error) {
                        logger.error('Error updating message:', error.response ? error.response.data : error.message);
                        throw new Error('Error updating message:', error.response ? error.response.data : error.message);
                        
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
                        const output = history.outputs["13"]; // Node ID where the image is saved
                        
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
            
                            // Update the original message using the follow-up URL
                            await axios.patch(followUpUrl, formData, {
                                headers: {
                                    ...formData.getHeaders() // Include necessary headers for multipart/form-data
                                }
                            });
                    
                        } catch (error) {
                            logger.error('Error updating message:', error.response ? error.response.data : error.message);
                            logger.error('Error updating message:', error.response.data.errors.embeds);
                            throw new Error(error.response.data.errors.embeds);
                            
                        }
                    } else {
                        // If image generation failed
                        const errorEmbed = createEmbed(
                            "Image Creation Failed",
                            "Sorry, we couldn't create your image. Please try again later.",
                            "error"
                        );
            
                        try {
                            // Update the original message using the follow-up URL
                            await axios.patch(followUpUrl, {
                                embeds: [errorEmbed],
            
                            });
                    
                        } catch (error) {
                            logger.error('Error updating message:', error.response ? error.response.data : error.message);
                            throw new Error('Error updating message:', error.response ? error.response.data : error.message);
                            
                        }
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

        try {
            // Update the original message using the follow-up URL
            await axios.patch(followUpUrl, {
                embeds: [errorEmbed],
            });
    
        } catch (error) {
            logger.error('Error updating message:', error.response ? error.response.data : error.message);
        }
    }
}


function getRandomSeed() {
    const max = BigInt('0xffffffffffffffff'); // Maximum value
    const randomNum = BigInt(Math.floor(Math.random() * Number(max + 1n))); // Scale to 0 to max
    return randomNum.toString();
}

module.exports = handleCreateImageCommand;