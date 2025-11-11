
import React, { useState, useCallback, useMemo } from 'react';
import { ContentType, VideoInputType } from '../types';
import { CONTENT_TYPE_CONFIG, MAX_TEXT_LENGTH } from '../constants';
import { UploadIcon } from './Icon';

interface UploadFormProps {
    onScan: (type: ContentType, data: File | string) => void;
    setError: (error: string | null) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onScan, setError }) => {
    const [activeTab, setActiveTab] = useState<ContentType>(ContentType.TEXT);
    const [textInput, setTextInput] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [videoInputType, setVideoInputType] = useState<VideoInputType>(VideoInputType.FILE);
    const [urlInput, setUrlInput] = useState<string>('');

    const config = useMemo(() => CONTENT_TYPE_CONFIG[activeTab], [activeTab]);

    const handleFileChange = useCallback((files: FileList | null) => {
        setError(null);
        if (files && files.length > 0) {
            const selectedFile = files[0];
            if (selectedFile.size > config.maxSize) {
                setError(`File is too large. Max size for ${activeTab} is ${config.maxSize / (1024*1024)}MB.`);
                setFile(null);
                return;
            }
            setFile(selectedFile);
        }
    }, [config, activeTab, setError]);
    
    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setError(null);
        const newText = e.target.value;
        if (newText.length > MAX_TEXT_LENGTH) {
            setError(`Text exceeds the maximum length of ${MAX_TEXT_LENGTH} characters.`);
            setTextInput(newText.slice(0, MAX_TEXT_LENGTH));
        } else {
            setTextInput(newText);
        }
    }, [setError]);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setUrlInput(e.target.value);
    }, [setError]);

    const handleTabClick = (tab: ContentType) => {
        setActiveTab(tab);
        setFile(null);
        setTextInput('');
        setUrlInput('');
        setVideoInputType(VideoInputType.FILE);
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === ContentType.TEXT) {
            if (textInput.trim().length > 0) {
                onScan(ContentType.TEXT, textInput);
            } else {
                setError('Please enter some text to analyze.');
            }
        } else if (activeTab === ContentType.VIDEO && videoInputType === VideoInputType.URL) {
            if (urlInput.trim().length > 0) {
                onScan(ContentType.VIDEO, urlInput);
            } else {
                setError('Please enter a video URL to analyze.');
            }
        } else {
            if (file) {
                onScan(activeTab, file);
            } else {
                setError('Please select a file to analyze.');
            }
        }
    };
    
    const isScanDisabled = useMemo(() => {
        if (activeTab === ContentType.TEXT) return textInput.trim().length === 0;
        if (activeTab === ContentType.VIDEO) {
            if (videoInputType === VideoInputType.URL) return urlInput.trim().length === 0;
            return !file;
        }
        return !file;
    }, [activeTab, textInput, file, videoInputType, urlInput]);

    const dragEvents = {
        onDragEnter: (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); },
        onDragLeave: (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); },
        onDragOver: (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); e.stopPropagation(); },
        onDrop: (e: React.DragEvent<HTMLLabelElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (e.dataTransfer.files) {
                handleFileChange(e.dataTransfer.files);
            }
        },
    };

    const fileDropzone = (
        <div className="mt-1 flex justify-center">
             <label
                {...dragEvents}
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-300 ${isDragOver ? 'border-indigo-400 scale-105' : ''}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
                    {file ? (
                        <>
                            <p className="font-semibold text-slate-200">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </>
                    ) : (
                        <>
                            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-slate-200">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-slate-500">{config.label}</p>
                        </>
                    )}
                </div>
                <input id="file-upload" name="file-upload" type="file" className="hidden" accept={config.accept} onChange={(e) => handleFileChange(e.target.files)} />
            </label>
        </div>
    );

    return (
        <div className="p-6 sm:p-8">
            <div className="mb-6">
                <div className="border-b border-slate-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(Object.values(ContentType)).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`${
                                    activeTab === tab
                                        ? 'border-indigo-400 text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {activeTab === ContentType.TEXT && (
                    <div>
                        <textarea
                            value={textInput}
                            onChange={handleTextChange}
                            placeholder="Paste your text here to check for AI generation..."
                            className="w-full h-48 p-4 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <div className="text-right text-sm text-slate-500 mt-1">
                            {textInput.length} / {MAX_TEXT_LENGTH}
                        </div>
                    </div>
                )}

                {activeTab === ContentType.IMAGE && fileDropzone}

                {activeTab === ContentType.VIDEO && (
                    <div>
                        <div className="flex justify-center mb-4">
                            <div className="bg-slate-900 p-1 rounded-lg flex items-center space-x-1">
                                <button type="button" onClick={() => setVideoInputType(VideoInputType.FILE)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${videoInputType === VideoInputType.FILE ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Upload File</button>
                                <button type="button" onClick={() => setVideoInputType(VideoInputType.URL)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${videoInputType === VideoInputType.URL ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Paste URL</button>
                            </div>
                        </div>
                        {videoInputType === VideoInputType.FILE ? fileDropzone : (
                            <div className="mt-1">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={handleUrlChange}
                                    placeholder="Paste a video link from YouTube, X, TikTok, etc."
                                    className="w-full h-48 p-4 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        type="submit"
                        disabled={isScanDisabled}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                    >
                        Scan Now
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadForm;