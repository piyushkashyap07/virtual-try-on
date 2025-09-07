
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function tryOn(
  personBase64: string,
  personMimeType: string,
  garmentBase64: string,
  garmentMimeType: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: personBase64,
              mimeType: personMimeType,
            },
          },
          {
            inlineData: {
              data: garmentBase64,
              mimeType: garmentMimeType,
            },
          },
          {
            text: 'Analyze the person in the first image and the clothing item in the second. Realistically and accurately place the garment onto the person, maintaining the original background and the person\'s pose. The output should only be the final image.',
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image was generated in the API response.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
}
