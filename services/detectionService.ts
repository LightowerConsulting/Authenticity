
import { ContentType, ScanResult, ApiDetail } from '../types';

// Helper to convert a File object to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

const manualTips = {
    [ContentType.TEXT]: [
        "Check for repetitive sentence structures.",
        "Look for overly complex words used unnecessarily.",
        "Does the text lack a personal voice or anecdotes?",
        "Verify factual claims from independent sources."
    ],
    [ContentType.IMAGE]: [
        "Zoom in on details like hands, teeth, and text.",
        "Examine shadows and reflections for consistency.",
        "Look for strange blurring or texture mismatches.",
        "Reverse image search to find its origin."
    ],
    [ContentType.VIDEO]: [
        "Pay attention to lip-sync and blinking.",
        "Watch for unnatural movements or 'puppet-like' motion.",
        "Listen for robotic-sounding audio or weird background noise.",
        "Check the source of the video. Is it a reputable poster?"
    ]
};

const pollJobResult = async (jobId: string, apiKey: string): Promise<any> => {
    const resultEndpoint = `https://api.edenai.run/v2/video/jobs/${jobId}`;
    const headers = { 'Authorization': `Bearer ${apiKey}` };

    while (true) {
        const response = await fetch(resultEndpoint, { headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Polling failed: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        
        if (result.status === 'finished') {
            return result;
        } else if (result.status === 'failed') {
            throw new Error(`Video processing failed. Please check the file or URL and try again.`);
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }
};

export const scanContent = async (type: ContentType, data: File | string): Promise<ScanResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    const apiKey = process.env.API_KEY;

    const jsonHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    let requestBody: any;
    let endpoint: string;

    if (type === ContentType.TEXT) {
        endpoint = 'https://api.edenai.run/v2/text/ai_detection';
        requestBody = {
            providers: 'winstonai,originalityai',
            text: data,
            fallback_providers: ""
        };
    } else if (type === ContentType.IMAGE && data instanceof File) {
        endpoint = 'https://api.edenai.run/v2/image/ai_detection';
        const base64Image = await fileToBase64(data);
        requestBody = {
            providers: 'winstonai,illuminarty',
            file: base64Image,
            fallback_providers: ""
        };
    } else if (type === ContentType.VIDEO) {
        const jobEndpoint = 'https://api.edenai.run/v2/video/ai_detection_async';
        let jobId: string;

        try {
            let launchResponse;
            if (data instanceof File) {
                const formData = new FormData();
                formData.append('providers', 'sensity');
                formData.append('file', data);
                formData.append('fallback_providers', '');
                launchResponse = await fetch(jobEndpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                    body: formData,
                });
            } else { // data is a URL string
                const urlRequestBody = {
                    providers: 'sensity',
                    file_url: data,
                    fallback_providers: ""
                };
                launchResponse = await fetch(jobEndpoint, {
                    method: 'POST',
                    headers: jsonHeaders,
                    body: JSON.stringify(urlRequestBody),
                });
            }

            if (!launchResponse.ok) {
                const errorData = await launchResponse.json();
                throw new Error(errorData.error?.message || 'Failed to start video processing job.');
            }
            const launchResult = await launchResponse.json();
            jobId = launchResult.public_id;
        } catch (err: any) {
            console.error("Error launching video job:", err);
            throw new Error(err.message || "Could not start the video analysis.");
        }

        const finalResult = await pollJobResult(jobId, apiKey);
        
        const sensityResult = finalResult.results?.sensity;
        if (!sensityResult || sensityResult.status !== 'success') {
            throw new Error('Video analysis provider failed or returned no data.');
        }

        const score = (sensityResult.ai_score || 0) * 100;
        const analysis: ApiDetail[] = [{
            provider: 'Sensity AI',
            score: score,
            details: score > 40 ? [`AI markers detected with confidence ${sensityResult.ai_score.toFixed(2)}`] : ["No significant AI markers detected."]
        }];

        return {
            overallScore: parseFloat(score.toFixed(2)),
            contentType: ContentType.VIDEO,
            analysis,
            manualInspectionTips: manualTips[ContentType.VIDEO],
            fileName: data instanceof File ? data.name : 'Video from URL',
        };
    } else {
        throw new Error("Invalid content type or data provided.");
    }
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch data from AI detection service.');
    }

    const result = await response.json();
    
    const providers = Object.keys(result);
    const analysis: ApiDetail[] = providers
      .filter(p => result[p].status === 'success')
      .map(provider => ({
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        score: (result[provider].ai_score || 0) * 100,
        details: result[provider].ai_score > 0.4 ? [`AI markers detected with confidence ${result[provider].ai_score.toFixed(2)}`] : ["No significant AI markers detected."]
      }));

    if (analysis.length === 0) {
        throw new Error("None of the AI detection providers were successful.");
    }
      
    const overallScore = analysis.reduce((acc, curr) => acc + curr.score, 0) / analysis.length;

    return {
        overallScore: parseFloat(overallScore.toFixed(2)),
        contentType: type,
        analysis: analysis,
        manualInspectionTips: manualTips[type],
        fileName: data instanceof File ? data.name : undefined,
    };
};