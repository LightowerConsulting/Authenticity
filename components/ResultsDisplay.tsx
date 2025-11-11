
import React from 'react';
import { ScanResult } from '../types';
import { CheckCircleIcon, DocumentTextIcon, ExclamationIcon, InformationCircleIcon, PhotographIcon, VideoCameraIcon } from './Icon';

interface ResultsDisplayProps {
    result: ScanResult;
    onReset: () => void;
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
    const scoreColor = score < 30 ? 'bg-green-500' : score < 70 ? 'bg-yellow-500' : 'bg-red-500';
    const scoreText = score < 30 ? 'text-green-300' : score < 70 ? 'text-yellow-300' : 'text-red-300';
    return (
        <div className="w-full bg-slate-700 rounded-full h-6 my-4">
            <div
                className={`${scoreColor} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out`}
                style={{ width: `${Math.max(score, 5)}%` }}
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

    return (
        <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
                 <div className="flex items-center justify-center text-slate-400 mb-2">
                    <Icon className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{fileName ? `${contentType}: ${fileName}` : contentType}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Scan Complete</h2>
                <p className={`text-5xl font-bold my-2 ${scoreColorClass}`}>{overallScore.toFixed(0)}%</p>
                <p className={`text-lg font-semibold ${scoreColorClass}`}>{scoreText}</p>
                <ScoreBar score={overallScore} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">AI Detection Breakdown</h3>
                    <ul className="space-y-4">
                        {analysis.map((item) => (
                            <li key={item.provider}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-slate-300">{item.provider}</span>
                                    <span className="text-sm font-bold text-slate-400">{item.score.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${item.score}%` }}></div>
                                </div>
                                 <div className="mt-2 text-xs text-slate-400 flex items-start">
                                    {item.score < 40 ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" /> : <ExclamationIcon className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0 mt-0.5" />}
                                    <span>{item.details.join(', ')}</span>
                                 </div>
                            </li>
                        ))}
                    </ul>
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

            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto px-10 py-3 border border-slate-600 text-base font-medium rounded-full text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
                >
                    Scan Another
                </button>
                 <button
                    className="w-full sm:w-auto px-10 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
                >
                    Save Report
                </button>
            </div>
        </div>
    );
};

export default ResultsDisplay;
