const { GoogleGenAI } = require('@google/genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

let genAIClient = null;
let generativeAIClient = null;
let defaultModelName = 'gemini-2.5-flash';

if (apiKey) {
  try {
    genAIClient = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('GoogleGenAI SDK initialization notice:', e.message);
  }

  try {
    generativeAIClient = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.warn('GoogleGenerativeAI SDK initialization notice:', e.message);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not found in environment variables. Running in offline/fallback mode.');
}

const generateText = async (prompt, systemInstruction = '', modelName = null) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment.');
  }

  const modelList = modelName 
    ? [modelName] 
    : [
        process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
      ];

  let lastError = null;

  for (const currentModel of modelList) {
    console.log(`[Gemini Client] Attempting generation with model: ${currentModel}`);
    
    // 1. Try official @google/genai SDK
    if (genAIClient) {
      try {
        const response = await genAIClient.models.generateContent({
          model: currentModel,
          contents: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
        });
        if (response && response.text) {
          console.log(`[Gemini Client] Generation succeeded with model: ${currentModel} (@google/genai)`);
          return response.text;
        }
      } catch (err) {
        console.warn(`@google/genai generateContent failed for model ${currentModel}:`, err.message);
        lastError = err;
      }
    }

    // 2. Try @google/generative-ai SDK fallback
    if (generativeAIClient) {
      try {
        const model = generativeAIClient.getGenerativeModel({ model: currentModel });
        const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        if (text) {
          console.log(`[Gemini Client] Generation succeeded with model: ${currentModel} (@google/generative-ai)`);
          return text;
        }
      } catch (err) {
        console.warn(`@google/generative-ai generateContent failed for model ${currentModel}:`, err.message);
        lastError = err;
      }
    }
  }

  throw new Error(
    lastError 
      ? `The AI service is temporarily unavailable. Details: ${lastError.message}` 
      : 'Gemini API client unavailable.'
  );
};

/**
 * Generate content with multimodal inputs (Image / PDF base64)
 */
const generateMultimodal = async (prompt, mimeType, base64Data, systemInstruction = '', modelName = null) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment.');
  }

  const modelList = modelName 
    ? [modelName] 
    : [
        process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
      ];

  let lastError = null;

  for (const currentModel of modelList) {
    console.log(`[Gemini Client] Attempting multimodal generation with model: ${currentModel}`);
    
    // 1. Try official @google/genai SDK
    if (genAIClient) {
      try {
        const response = await genAIClient.models.generateContent({
          model: currentModel,
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });
        if (response && response.text) {
          console.log(`[Gemini Client] Multimodal succeeded with model: ${currentModel} (@google/genai)`);
          return response.text;
        }
      } catch (err) {
        console.warn(`@google/genai generateMultimodal failed for model ${currentModel}:`, err.message);
        lastError = err;
      }
    }

    // 2. Try @google/generative-ai SDK fallback
    if (generativeAIClient) {
      try {
        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'image/jpeg',
          },
        };
        const model = generativeAIClient.getGenerativeModel({ model: currentModel });
        const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
        const result = await model.generateContent([fullPrompt, imagePart]);
        const text = result.response.text();
        if (text) {
          console.log(`[Gemini Client] Multimodal succeeded with model: ${currentModel} (@google/generative-ai)`);
          return text;
        }
      } catch (err) {
        console.warn(`@google/generative-ai generateMultimodal failed for model ${currentModel}:`, err.message);
        lastError = err;
      }
    }
  }

  throw new Error(
    lastError 
      ? `The AI service is temporarily unavailable. Details: ${lastError.message}` 
      : 'Gemini Multimodal Client unavailable.'
  );
};

module.exports = {
  apiKey,
  hasApiKey: () => Boolean(apiKey),
  genAIClient,
  generativeAIClient,
  generateText,
  generateMultimodal,
};
