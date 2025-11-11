import React from 'react';
import { ScanResult } from '../types';
import { CheckCircleIcon, DocumentTextIcon, ExclamationIcon, InformationCircleIcon, PhotographIcon, VideoCameraIcon } from './Icon';

interface ResultsDisplayProps {
    result: ScanResult;
    onReset: () => void;
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
    const scoreColor = score < 30 ? 'bg-green-500' : score < 70 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-slate-700 rounded-full h-6 my-4">
            <div
                className={`${scoreColor} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(score, 10)}%` }} /* Ensure a minimum width for visibility */
            >
                <span className={`text-sm font-bold text-slate-900`}>{score.toFixed(0)}%</span>
            </div>
        </div>
    );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onReset }) => {
    const { overallScore, contentType, analysis, manualInspectionTips, fileName } = result;

    const scoreColorClass = overallScore < 30 ? 'text-green-400' : overallScore < 70 ? 'text-yellow-400' : 'text-red-400';
    const scoreText = overallScore < 30 ? 'Likely Human-Generated' : overallScore < 70 ? 'Potentially AI-Assisted' : 'Likely AI-Generated';

    const Icon = {
        'Text': DocumentTextIcon,
        'Image': PhotographIcon,
        'Video': VideoCameraIcon,
    }[contentType];

    const geminiResult = analysis[0]; // We now only have one provider

    return (
        <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
                 <div className="flex items-center justify-center text-slate-400 mb-2">
                    <Icon className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{fileName ? `${contentType}: ${fileName}` : contentType}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                <p className={`text-5xl font-bold my-2 ${scoreColorClass}`}>{overallScore.toFixed(0)}%</p>
                <p className={`text-lg font-semibold ${scoreColorClass}`}>{scoreText}</p>
                <ScoreBar score={overallScore} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Gemini Analysis</h3>
                    {geminiResult && geminiResult.details && geminiResult.details.length > 0 && (
                        <div>
                             <p className="text-sm text-slate-300 italic mb-4">"{geminiResult.details[0]}"</p>
                             <ul className="space-y-3">
                                {geminiResult.details.slice(1).map((finding, index) => (
                                    <li key={index} className="flex items-start">
                                         <ExclamationIcon className="w-4 h-4 mr-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                                         <span className="text-slate-300 text-sm">{finding}</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Manual Inspection Checklist</h3>
                    <ul className="space-y-3">
                        {manualInspectionTips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                                <InformationCircleIcon className="w-5 h-5 text-sky-400 mr-3 mt-px flex-shrink-0" />
                                <span className="text-slate-300 text-sm">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-10 flex justify-center">
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto px-10 py-3 border border-slate-600 text-base font-medium rounded-full text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
                >
                    Scan Another
                </button>
            </div>
        </div>
    );
};

export default ResultsDisplay;