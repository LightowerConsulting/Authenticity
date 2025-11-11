import React, { useState, useEffect, useCallback } from 'react';
import { ContentType, ScanResult } from './types';
import { scanContent } from './services/detectionService';
import Header from './components/Header';
import UploadForm from './components/UploadForm';
import ResultsDisplay from './components/ResultsDisplay';
import Spinner from './components/Spinner';
import { LOADING_MESSAGES } from './constants';

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
            }, 1000);
            return () => {
                clearInterval(interval);
            };
        }
    }, [isLoading]);

    const handleScan = useCallback(async (type: ContentType, data: File | string) => {
        setIsLoading(true);
        setError(null);
        setScanResult(null);
        try {
            // Use the real scanContent service instead of the mock
            const result = await scanContent(type, data);
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
                <div className="flex flex-col items-center justify-center text-center p-8">
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
                        <p>Disclaimer: Detection is estimated to be ~90% accurate and is not a guarantee. Always use critical judgment.</p>
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