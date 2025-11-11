import React, { useState, useEffect, useCallback } from 'react';
import { ContentType, ScanResult } from './types';
import { scanContent } from './services/detectionService';
import Header from './components/Header';
import UploadForm from './components/UploadForm';
import ResultsDisplay from './components/ResultsDisplay';
import Spinner from './components/Spinner';
import { LOADING_MESSAGES } from './constants';

/**
 * Extracts a specified number of frames from a video file or URL as base64-encoded JPEGs.
 * @param videoSource The video file or URL string to process.
 * @param frameCount The number of frames to extract.
 * @returns A promise that resolves to an array of base64 strings.
 */
const extractFramesFromVideo = (videoSource: File | string, frameCount: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: string[] = [];

        video.crossOrigin = 'anonymous'; // Attempt to load cross-origin videos for canvas processing
        video.preload = 'metadata';

        const sourceUrl = videoSource instanceof File ? URL.createObjectURL(videoSource) : videoSource;
        video.src = sourceUrl;
        
        const cleanup = () => {
            if (videoSource instanceof File) {
                URL.revokeObjectURL(sourceUrl);
            }
        };

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            if (duration === 0 || !isFinite(duration)) {
                cleanup();
                reject(new Error("Cannot process video. Its duration is invalid or it may be a live stream."));
                return;
            }

            const step = duration / (frameCount + 1);
            let currentTime = step;

            const captureFrame = () => {
                if (frames.length >= frameCount || currentTime > duration) {
                    cleanup();
                    resolve(frames);
                    return;
                }
                video.currentTime = currentTime;
            };

            video.onseeked = () => {
                if (context) {
                    try {
                        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
                        frames.push(base64);
                    } catch (e) {
                        cleanup();
                        reject(new Error('Could not analyze video frames. This is likely due to browser security restrictions (CORS). Please try downloading the video to your device and using the "Upload File" option.'));
                        return;
                    }
                }
                currentTime += step;
                captureFrame();
            };
            
            video.onerror = (e) => {
                cleanup();
                reject(new Error("An error occurred while processing the video frames. The file may be corrupt or in an unsupported format."));
            }

            captureFrame();
        };

        video.onerror = () => {
            cleanup();
            let errorMessage = "Failed to load video. Please check if the file is valid and supported.";
            if (typeof videoSource === 'string') {
                errorMessage = "Failed to load video from the URL. This is often due to browser security restrictions (CORS) that block analysis from sites like YouTube or TikTok. Please try downloading the video and using the 'Upload File' option instead.";
            }
            reject(new Error(errorMessage));
        };
    });
};


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) {
            let messageIndex = 0;
            const interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            }, 2000);
            return () => {
                clearInterval(interval);
            };
        }
    }, [isLoading]);

    const handleScan = useCallback(async (type: ContentType, data: File | string) => {
        setIsLoading(true);
        setError(null);
        setScanResult(null);
        
        const fileName = data instanceof File ? data.name : (type !== ContentType.TEXT ? data as string : undefined);

        try {
            let scanData: string | File | string[] = data;
            
            if (type === ContentType.VIDEO) {
                setLoadingMessage("Extracting frames from video...");
                const frames = await extractFramesFromVideo(data as File | string, 5);
                if (frames.length === 0) {
                    throw new Error("Could not extract frames from the video. It might be too short or unsupported.");
                }
                scanData = frames; // The data for scanContent is now the array of frames
            }

            const result = await scanContent(type, scanData, fileName);
            setScanResult(result);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during the scan. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const handleReset = useCallback(() => {
        setScanResult(null);
        setError(null);
        setIsLoading(false);
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8 h-96">
                    <Spinner />
                    <p className="mt-4 text-lg font-medium text-slate-300">{loadingMessage}</p>
                    <p className="mt-1 text-sm text-slate-400">Please keep this window open.</p>
                </div>
            );
        }
        if (scanResult) {
            return <ResultsDisplay result={scanResult} onReset={handleReset} />;
        }
        return <UploadForm onScan={handleScan} setError={setError} />;
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans antialiased flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Header />
                <main className="mt-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/50 backdrop-blur-sm transition-all duration-500">
                        {error && (
                            <div className="bg-red-500/20 border-l-4 border-red-500 text-red-300 p-4 m-4 rounded-r-lg" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {renderContent()}
                    </div>
                     <footer className="text-center mt-8 text-xs text-slate-500">
                        <p>Disclaimer: AI detection is an experimental technology and is not a guarantee. Always use critical judgment.</p>
                        <p className="mt-1">
                            &copy; {new Date().getFullYear()} <a href="https://lightowerconsulting.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-300 transition-colors duration-200">Lightower Consulting</a>. All Rights Reserved.
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default App;