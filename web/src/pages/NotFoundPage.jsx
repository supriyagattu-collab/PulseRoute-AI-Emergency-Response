import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
        <Activity className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
        <h1 className="text-3xl font-black text-white">404</h1>
        <p className="text-sm text-slate-400">The requested dispatch terminal or emergency page does not exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Command Central
        </Link>
      </div>
    </div>
  );
};
