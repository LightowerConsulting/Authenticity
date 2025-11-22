import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContentType, ScanResult, ApiDetail } from '../types';

// Initialize the client with the API key injected via Vite's define config
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const scanContent = async (
    type: ContentType,
    data: string | string[], // data is always string (text or base64) or string[] (video frames)
    fileName?: string,
    mimeType?: string // mimeType is passed for images
): Promise<ScanResult> => {

    try {
        let contents: any;
        let systemInstruction = "";

        // Define the schema for the structured output using the SDK's Type enum
        const responseSchema: Schema = {
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

        // Execute the request using the correct Gemini 2.5 Flash model
        // Note: For complex reasoning, we rely on 2.5 Flash's speed and multimodal capabilities.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.4, // Lower temperature for more analytical/consistent results
            },
        });

        const jsonText = response.text?.trim();

        if (!jsonText) {
            throw new Error('The AI model returned an empty response. This may be due to content safety filters.');
        }

        let result;
        try {
            result = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", jsonText);
            throw new Error(`Failed to parse analysis results.`);
        }

        const analysis: ApiDetail[] = [{
            provider: 'Gemini AI',
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
        throw new Error(error.message || "Failed to communicate with the analysis service. Please try again.");
    }
};