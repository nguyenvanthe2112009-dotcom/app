import { GoogleGenAI } from "@google/genai";

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a YouTube thumbnail based on user-uploaded images (optional) and a text prompt.
 * @param apiKey The user-provided Gemini API key.
 */
export const generateThumbnail = async (
  apiKey: string,
  imageFiles: File[],
  title: string,
  description: string,
  style: string,
  aspectRatio: string = "16:9"
): Promise<string> => {
  // Initialize the client with the user-provided key for each request.
  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Prepare Image Parts (if any)
    const imageParts = await Promise.all(
      imageFiles.map(async (file) => ({
        inlineData: {
          data: await fileToGenerativePart(file),
          mimeType: file.type,
        },
      }))
    );

    // 2. Construct Source Image Instructions
    let sourceImageInstructions = "";
    if (imageFiles.length === 0) {
      sourceImageInstructions = "NO SOURCE IMAGE PROVIDED. Create the main subject from scratch based on the description.";
    } else if (imageFiles.length === 1) {
      sourceImageInstructions = "ONE SOURCE IMAGE PROVIDED. Use the person/subject from this image as the MAIN FOCUS. Seamlessly integrate them into the new background.";
    } else {
      sourceImageInstructions = "MULTIPLE SOURCE IMAGES PROVIDED. Skillfully COMBINE elements from the provided images. If one is a person and one is a background, merge them naturally. If both are subjects, arrange them together harmoniously.";
    }

    // 3. Construct Text Instructions (Handle Optional Title)
    let textInstructions = "";
    if (title && title.trim().length > 0) {
      textInstructions = `
      [2] THE TEXT (CRITICAL - SPELLING MUST BE EXACT):
      - Text content: "${title}"
      - STRICT SPELLING RULE: You must render the Vietnamese text EXACTLY as provided, character-for-character.
      - DIACRITICS (DẤU): Pay extreme attention to Vietnamese diacritics (sắc, huyền, hỏi, ngã, nặng, nón, râu). Do not omit or change them.
      - Font Style: Big, Bold, Sans-serif, High Contrast, 3D effect or Outline to make it pop.
      - Position: Place text in negative space, do NOT cover the subject's face.
      `;
    } else {
      textInstructions = `
      [2] THE TEXT:
      - DO NOT RENDER ANY TEXT.
      - This image should be purely visual.
      - Leave some negative space where text could be added later manually if needed.
      `;
    }

    const fullPrompt = `
      ROLE: You are an expert YouTube Thumbnail Designer specializing in high-CTR visuals.
      
      TASK: Create a professional YouTube thumbnail with the following specifications.

      [1] SOURCE MATERIAL HANDLING:
      - ${sourceImageInstructions}
      - Ensure subjects look expressive, well-lit, and high-definition.

      ${textInstructions}

      [3] THE CONCEPT (Context & Background):
      - User's Idea: "${description}"
      - INTELLIGENT ANALYSIS: Visualize a scene that creates a strong emotional hook based on the User's Idea. Add relevant props, icons, or background elements that match this theme.
      - Composition: ${aspectRatio === '9:16' ? 'Vertical composition (TikTok/Shorts). Center elements.' : 'Horizontal composition (YouTube). Use Rule of Thirds.'}

      [4] ARTISTIC STYLE:
      - Style Description: ${style}
      - Aesthetics: High saturation, cinematic lighting, sharp details, 4K resolution look.
    `;

    // 4. Call API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts, // Add all image parts (can be empty)
          { text: fullPrompt },
        ],
      },
      config: {
         imageConfig: {
           aspectRatio: aspectRatio,
         }
      }
    });

    // 5. Extract Result
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64EncodeString}`;
        }
      }
    }

    throw new Error("No image generated in the response.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
      throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại.');
    }
    throw error;
  }
};