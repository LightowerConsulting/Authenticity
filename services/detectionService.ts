import { ContentType, ScanResult } from '../types';

// The file-to-base64 conversion and resizing is now handled in App.tsx before calling this service.
export const scanContent = async (
    type: ContentType,
    data: string | string[], // data is now always string (text or base64) or string[] (video frames)
    fileName?: string,
    mimeType?: string // mimeType is passed for images
): Promise<ScanResult> => {

    let payload: {
        type: ContentType;
        data: string | string[];
        mimeType?: string;
        fileName?: string;
    };

    try {
        if (type === ContentType.IMAGE && typeof data === 'string') {
            payload = {
                type,
                data, // This is now the pre-resized base64 string
                mimeType,
                fileName,
            };
        } else if (type === ContentType.TEXT && typeof data === 'string') {
            payload = { type, data, fileName };
        } else if (type === ContentType.VIDEO && Array.isArray(data)) {
            payload = { type, data, fileName };
        } else {
             throw new Error("Invalid data format for the selected content type.");
        }

        const response = await fetch('/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                // Try parsing it as JSON first, as our backend sends structured errors
                const result = JSON.parse(errorText);
                throw new Error(result.error || `Request failed with status ${response.status}`);
            } catch (e) {
                // If it's not JSON, it's likely a proxy error (like payload too large)
                console.error("Non-JSON error response from server:", errorText);
                throw new Error(`A server error occurred (status: ${response.status}). This can happen if the uploaded file is too large or corrupt. Please try a smaller file.`);
            }
        }

        const result = await response.json();
        return result as ScanResult;

    } catch (error: any) {
        console.error("Error communicating with the backend proxy:", error);
        throw new Error(error.message || "Failed to communicate with the analysis service. Please try again.");
    }
};
