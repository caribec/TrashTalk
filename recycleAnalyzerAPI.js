const { GoogleGenAI } = require("@google/genai");
const fs = require("node:fs");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

const prompt = "Analyze the image, which should be a piece of waste or something similar. If it is, determine if it is recyclable or not and explain how to. Keep it only to a few sentences"

async function recycleAnalyzer(imagePath) {
  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  const base64ImageFile = fs.readFileSync(imagePath, { encoding: "base64" });
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    { text: prompt },
  ];
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  });
  return response.text;
}

module.exports = { recycleAnalyzer };