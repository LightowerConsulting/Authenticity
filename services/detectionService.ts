import { ContentType, ScanResult } from '../types';

// Helper to convert a File object to a Base64 string.
// This is now used on the client-side to prepare data for the backend proxy.
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The result includes a data URI prefix (e.g., "data:image/jpeg;base64,"),
            // which we need to remove.
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const scanContent = async (type: ContentType, data: File | string | string[], fileName?: string): Promise<ScanResult> => {
    
    let payload: {
        type: ContentType;
        data: string | string[];
        mimeType?: string;
        fileName?: string;
    };

    try {
        if (type === ContentType.IMAGE && data instanceof File) {
            const base64Image = await fileToBase64(data);
            payload = {
                type,
                data: base64Image,
                mimeType: data.type,
                fileName,
            };
        } else if (type === ContentType.TEXT && typeof data === 'string') {
            payload = { type, data, fileName };
        } else if (type === ContentType.VIDEO && Array.isArray(data)) {
            // App.tsx has already converted the video to an array of base64 frames.
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

        const result = await response.json();

        if (!response.ok) {
            // Use the error message from the backend if available, otherwise a generic one.
            throw new Error(result.error || `Request failed with status ${response.status}`);
        }

        return result as ScanResult;

    } catch (error: any) {
        console.error("Error communicating with the backend proxy:", error);
        // Re-throw a user-friendly error to be displayed in the UI.
        throw new Error(error.message || "Failed to communicate with the analysis service. Please try again.");
    }
};