import { GoogleGenAI, Type } from "@google/genai";
import { ContentType, ScanResult, ApiDetail } from '../types';

// Declare the global constant injected by Vite
declare const __GEMINI_API_KEY__: string;

// Safely retrieve the API key.
const getApiKey = (): string => {
    try {
        if (typeof __GEMINI_API_KEY__ !== 'undefined') {
            return __GEMINI_API_KEY__;
        }
    } catch (e) {
        // Ignore error
    }
    return '';
};

const apiKey = getApiKey();
// Initialize AI only if key exists. We validate it strictly inside scanContent.
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

const MANUAL_TIPS = {
    [ContentType.TEXT]: [
        "Check for repetitive sentence structures or phrases.",
        "Look for overly complex words used unnecessarily.",
        "Does the text lack a personal voice, emotion, or anecdotes?",
        "Verify factual claims from independent, reputable sources."
    ],
    [ContentType.IMAGE]: [
        "Zoom in on details like hands, teeth, and text in the background.",
        "Examine shadows, reflections, and light sources for consistency.",
        "Look for strange blurring, unnatural textures, or mismatched patterns.",
        "Use a reverse image search to find the image's origin or similar versions."
    ],
    [ContentType.VIDEO]: [
        "Check for unnatural facial movements or blinking patterns.",
        "Listen for robotic-sounding speech or audio that doesn't match the lip movements.",
        "Look for flickering or distortions around the edges of objects or people.",
        "Are there any weird blurs or 'morphing' effects during movement?"
    ]
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scanContent = async (
    type: ContentType,
    data: string | string[], // data is always string (text or base64) or string[] (video frames)
    fileName?: string,
    mimeType?: string // mimeType is passed for images
): Promise<ScanResult> => {

    // 1. Validate API Key exists before making a request
    if (!apiKey || apiKey === 'dummy-key') {
        throw new Error("System Error: API Key is missing. Please ensure the 'GEMINI_API_KEY' environment variable is set in your Vercel Project Settings.");
    }

    try {
        let contents: any;
        let systemInstruction = "";

        // Define the schema structure implicitly to avoid import errors
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                aiScore: { type: Type.NUMBER, description: "A score from 0 (definitely human) to 100 (definitely AI)." },
                reasoning: { type: Type.STRING, description: "A concise explanation for the score." },
                evidence: {
                    type: Type.ARRAY,
                    description: "A list of specific evidence found (e.g., 'Inconsistent lighting on left hand', 'Repetitive sentence structure').",
                    items: { type: Type.STRING }
                }
            },
            required: ["aiScore", "reasoning", "evidence"],
        };

        if (type === ContentType.TEXT && typeof data === 'string') {
            systemInstruction = "You are a forensic AI text analyst. Analyze the following text for signs of AI generation. Look for low perplexity, high uniformity in sentence length, lack of specific anecdotes, 'hallucinated' facts, and common AI-isms (e.g., 'delve', 'tapestry', 'testament'). Be skeptical. Return a JSON object.";
            contents = {
                parts: [
                    { text: "Analyze this text for AI generation:" },
                    { text: data }
                ]
            };
        } else if (type === ContentType.IMAGE && typeof data === 'string') {
            systemInstruction = "You are a forensic image analyst specializing in detecting AI-generated synthesis. Analyze the image for: 1) Physical inconsistencies (lighting, shadows, reflections). 2) Anatomical errors (hands, eyes, teeth). 3) Text rendering failures (gibberish background text). 4) 'Painterly' or overly smooth textures typical of diffusion models. Be skeptical. Return a JSON object.";
            contents = {
                parts: [
                    { text: "Analyze this image for AI generation artifacts:" },
                    { inlineData: { mimeType: mimeType || 'image/jpeg', data: data } }
                ]
            };
        } else if (type === ContentType.VIDEO && Array.isArray(data)) {
            systemInstruction = "You are a video forensics expert. You are viewing a sequence of frames from a single video. Analyze them for: 1) Temporal inconsistency (objects morphing or flickering between frames). 2) Unnatural physics or movement. 3) Static backgrounds with moving foregrounds that don't match. 4) AI generation artifacts in individual frames. Provide a single assessment for the video. Return a JSON object.";
            const parts: any[] = [{ text: "Here is a sequence of video frames to analyze:" }];
            data.forEach(frameBase64 => {
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: frameBase64 } });
            });
            contents = { parts };
        } else {
             throw new Error("Invalid data format for the selected content type.");
        }

        // 2. Implement Retry Logic for handling 500/503 errors
        let response;
        let lastError;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents,
                    config: {
                        systemInstruction,
                        responseSchema,
                        temperature: 0.4, 
                    },
                });
                break; // Success, exit loop
            } catch (err: any) {
                lastError = err;
                console.warn(`Attempt ${attempt} failed:`, err.message);
                // Check for common overloaded errors
                if (err.message?.includes('503') || err.message?.includes('500') || err.message?.includes('Overloaded')) {
                    if (attempt < maxRetries) {
                        // Exponential backoff: 1s, 2s, 4s...
                        await wait(1000 * Math.pow(2, attempt - 1));
                        continue;
                    }
                }
                throw err; // Throw immediately if it's not a server error (e.g. 400 Bad Request)
            }
        }

        if (!response) {
            throw lastError || new Error("Failed to connect to the AI service after multiple attempts.");
        }

        let jsonText = response.text?.trim();

        if (!jsonText) {
            throw new Error('The AI model returned an empty response. This usually indicates the content triggered safety filters.');
        }

        // Remove markdown code blocks if present (```json ... ```)
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        let result;
        try {
            result = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", jsonText);
            throw new Error(`Failed to parse analysis results. The model output was not valid JSON.`);
        }

        const analysis: ApiDetail[] = [{
            provider: 'Gemini 3.0',
            score: Number(result.aiScore),
            details: [result.reasoning, ...result.evidence]
        }];
        
        const scanResult: ScanResult = {
            overallScore: parseFloat(Number(result.aiScore).toFixed(2)),
            contentType: type,
            analysis: analysis,
            manualInspectionTips: MANUAL_TIPS[type],
            fileName: fileName,
        };

        return scanResult;

    } catch (error: any) {
        console.error("Error in detection service:", error);
        // Provide a more user-friendly error message for specific codes
        if (error.message.includes('503') || error.message.includes('Overloaded')) {
             throw new Error("The AI analysis server is currently experiencing high traffic. Please wait a few seconds and try again.");
        }
        if (error.message.includes('400')) {
            throw new Error("The content was rejected by the AI model. It might be too large or contain prohibited content.");
        }
        throw new Error(error.message || "Failed to communicate with the analysis service. Please try again.");
    }
};
