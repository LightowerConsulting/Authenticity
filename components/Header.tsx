import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="flex justify-between items-center pb-4 border-b border-slate-700">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Authenticity</h1>
                <p className="text-sm text-slate-400">
                    by <a href="https://lightowerconsulting.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200">Lightower Consulting</a>
                </p>
            </div>
            <button className="hidden sm:inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Sign In
            </button>
        </header>
    );
};

export default Header;