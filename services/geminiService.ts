import { GoogleGenAI } from "@google/genai";

export const generateWorldContent = async (
  type: 'description' | 'rules' | 'lore' | 'character',
  contextName: string,
  specificContext: string,
  worldName: string,
  genre: string
): Promise<string | null> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing from environment variables");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "";
    switch (type) {
      case "description":
        prompt = `为名为"${worldName}"的世界写一段引人入胜的简介。风格：${genre}。包含地理、魔法/科技水平和社会概况。请直接输出内容，不要带 Markdown 标题。`;
        break;
      case "rules":
        prompt = `为"${worldName}"世界中的概念"${specificContext}"生成详细的规则或设定说明。风格：${genre}。`;
        break;
      case "lore":
        prompt = `为"${worldName}"世界中的词条"${specificContext}"生成一段详细的历史渊源或功能描述。风格：${genre}。`;
        break;
      case "character":
        prompt = `为"${worldName}"世界中的角色"${contextName}" (${specificContext}) 生成一段详细的背景故事和性格描述。风格：${genre}。`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};