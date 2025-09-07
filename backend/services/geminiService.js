const { GoogleGenAI, Modality } = require('@google/genai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Use environment variable for API key
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function tryOn(
  personBase64,
  personMimeType,
  garmentBase64,
  garmentMimeType,
  angle = 'front'
) {
  try {
    const model = "gemini-2.5-flash-image-preview";

    const anglePrompts = {
      front: `Analyze the person in the first image and the clothing item in the second. Create a realistic virtual try-on showing the person wearing the garment from the FRONT VIEW. Maintain the person's pose, body proportions, and background. The garment should fit naturally and look realistic. Output only the final image.`,
      
      back: `Analyze the person in the first image and the clothing item in the second. Create a realistic virtual try-on showing the person wearing the garment from the BACK VIEW. Rotate the person to show their back while maintaining their body proportions and the garment's fit. The garment should look natural from behind. Output only the final image.`,
      
      side: `Analyze the person in the first image and the clothing item in the second. Create a realistic virtual try-on showing the person wearing the garment from the SIDE VIEW (profile view). Show the person in a side pose that clearly displays how the garment fits and drapes on their body. Maintain realistic proportions and natural garment flow. Output only the final image.`
    };

    const prompt = anglePrompts[angle] || anglePrompts.front;

    const response = await ai.models.generateContent({
      model: model,
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
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Find the image in the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image was generated. The model may have refused the request.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate try-on image: " + error.message);
  }
}

async function generateMultiAngleTryOn(
  personBase64,
  personMimeType,
  garmentBase64,
  garmentMimeType
) {
  try {
    const angles = ['front', 'back', 'side'];
    const results = {};

    // Generate all three angles
    for (const angle of angles) {
      try {
        results[angle] = await tryOn(personBase64, personMimeType, garmentBase64, garmentMimeType, angle);
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating ${angle} view:`, error);
        results[angle] = null;
      }
    }

    return results;
  } catch (error) {
    console.error("Error generating multi-angle try-on:", error);
    throw new Error("Failed to generate multi-angle try-on: " + error.message);
  }
}

module.exports = { tryOn, generateMultiAngleTryOn };