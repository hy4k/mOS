import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API
// We use process.env.GEMINI_API_KEY as required by the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseImportText(input: string | { inlineData: { data: string, mimeType: string } }) {
  const contents = typeof input === 'string' 
    ? `Parse the following text and extract it into a list of structured workspace items. 
    Determine the best category ('quick', 'credentials', 'links', 'numbers', 'people') for each item.
    Text: "${input}"`
    : {
        parts: [
          { text: "Parse the following document and extract it into a list of structured workspace items. Determine the best category ('quick', 'credentials', 'links', 'numbers', 'people') for each item." },
          input
        ]
      };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "One of: quick, credentials, links, numbers, people" },
              title: { type: Type.STRING, description: "A short, descriptive title" },
              content: { type: Type.STRING, description: "The main content or notes." },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 relevant tags" },
              metadata: { 
                type: Type.OBJECT, 
                description: "If category is credentials, include 'username' and 'password'. If links, include 'url' and optionally 'notes'. If numbers, include 'bankAccount' and 'phoneNumber'. If people, include 'date' (YYYY-MM-DD).",
                properties: {
                  username: { type: Type.STRING },
                  password: { type: Type.STRING },
                  url: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  bankAccount: { type: Type.STRING },
                  phoneNumber: { type: Type.STRING },
                  date: { type: Type.STRING }
                }
              }
            },
            required: ["category", "title", "content", "tags"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response or fetch from API", e);
    return [];
  }
}

export async function parseMagicInput(input: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following text and extract it into a structured workspace item. 
      Determine the best category ('quick', 'credentials', 'links', 'numbers', 'people').
      Text: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "One of: quick, credentials, links, numbers, people" },
            title: { type: Type.STRING, description: "A short, descriptive title" },
            content: { type: Type.STRING, description: "The main content or notes. For links, this is the description. For people, notes about them. For numbers, context." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 relevant tags" },
            metadata: { 
              type: Type.OBJECT, 
              description: "If category is credentials, include 'username' and 'password'. If links, include 'url' and optionally 'notes'. If numbers, include 'bankAccount' and 'phoneNumber'. If people, include 'date' (YYYY-MM-DD).",
              properties: {
                username: { type: Type.STRING },
                password: { type: Type.STRING },
                url: { type: Type.STRING },
                notes: { type: Type.STRING },
                bankAccount: { type: Type.STRING },
                phoneNumber: { type: Type.STRING },
                date: { type: Type.STRING }
              }
            }
          },
          required: ["category", "title", "content", "tags"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response or fetch from API", e);
    return null;
  }
}
