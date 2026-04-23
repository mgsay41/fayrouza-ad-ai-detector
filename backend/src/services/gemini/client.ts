import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export function getModel(modelName?: string) {
  return genAI.getGenerativeModel({ model: modelName ?? config.geminiModel });
}
