import * as dotenv from "dotenv";
dotenv.config();
import { Configuration, OpenAIApi } from "openai";
import { writeUserData } from "./firebaseDB.js";
import { getHistory, AI_NAME } from "./utils.js";

export const BOT_NUMBER = process.env.BOT_NUMBER + "@c.us";

const configuration = new Configuration({
  organization: process.env.ORGANIZATION_ID,
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

export const getDavinciResponse = async (clientText, messageSender) => {
  const conversation_history = await getHistory(
    BOT_NUMBER,
    messageSender,
    clientText
  ).catch((error) => {
    console.error(error);
  });

  const options = {
    model: "text-davinci-003", // GPT model to use
    prompt: conversation_history, // Text submitted by the user
    temperature: 1, // Variation level of generated responses, 1 is the maximum
    max_tokens: 200, // Number of tokens (words) to be returned by the bot, 4000 is the maximum
  };

  try {
    const response = await openai.createCompletion(options);
    let botResponse = "";
    response.data.choices.forEach(({ text }) => {
      botResponse += text;
    });
    // Trim the Friendly-AI name from the response
    botResponse = botResponse.replace(AI_NAME + ":", "");

    // Save the conversation history to the database if the FIREBASE_DB_URL is set
    process.env.FIREBASE_DB_URL &&
      writeUserData(BOT_NUMBER, messageSender, clientText, botResponse.trim());

    return `Raiden Gpt 🤖\n\n${botResponse.trim()}`;
  } catch (e) {
    return `❌ OpenAI Response Error: ${e.response.data.error.message}`;
  }
};

export const getDalleResponse = async (clientText) => {
  const options = {
    prompt: clientText, // Image description
    n: 1, // // Number of images to be generated
    size: "1024x1024", // Image size
  };

  try {
    const response = await openai.createImage(options);
    return response.data.data[0].url;
  } catch (e) {
    return `❌ OpenAI Response Error: ${e.response.data.error.message}`;
  }
};
