import React, { useState } from 'react';
import { Participant } from '../types';
import { analyzeEvidenceImage } from '../services/geminiService';

interface ParticipantPortalProps {
  participant: Participant;
  currentRound: number;
  onUpdateTestimony: (text: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
}

export const ParticipantPortal: React.FC<ParticipantPortalProps> = ({ participant, currentRound, onUpdateTestimony, onSubmit, onLogout }) => {
  const [uploading, setUploading] = useState(false);
  const [evidenceAnalysis, setEvidenceAnalysis] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      const analysis = await analyzeEvidenceImage(file, "Investigation Evidence Scan");
      setEvidenceAnalysis(analysis);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest">UNSKEWED OS</h1>
            <p className="text-xs text-slate-500">SECURE RELAY // ENCRYPTED // ID: {participant.id}</p>
          </div>
          <div className="text-right flex items-center space-x-4">
            <div>
                <div className="text-terminal-yellow font-bold">ROUND {currentRound}</div>
                <div className="text-xs text-slate-400">STATUS: {participant.status.toUpperCase()}</div>
            </div>
            <button 
               onClick={onLogout}
               className="text-slate-500 hover:text-white border border-slate-700 p-2 rounded hover:bg-slate-800"
               title="Exit Secure Channel"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
          </div>
        </div>

        {/* Security Warning */}
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 text-sm text-red-200">
          <strong>WARNING:</strong> You are accessing a federal investigation portal. All inputs are logged. 
          Do not share this screen.
        </div>

        {/* Questions */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">PENDING INQUIRIES</h2>
          {participant.pendingQuestions.length === 0 ? (
            <div className="p-4 bg-slate-900 rounded text-slate-500 italic">No new questions at this time. Please update your general testimony or stand by.</div>
          ) : (
            participant.pendingQuestions.map((q, idx) => (
              <div key={idx} className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
                <span className="text-terminal-yellow font-bold mr-2">Q{idx + 1}:</span>
                {q}
              </div>
            ))
          )}
        </div>

        {/* Testimony Input */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">YOUR TESTIMONY</h2>
          <textarea 
            value={participant.testimony}
            onChange={(e) => onUpdateTestimony(e.target.value)}
            disabled={participant.status === 'responded'}
            className="w-full h-64 bg-slate-900 border border-slate-700 p-4 rounded-lg focus:border-blue-500 outline-none transition-colors"
            placeholder="State your account of the events clearly..."
          />
        </div>

        {/* Evidence Upload */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">EVIDENCE SUBMISSION</h2>
          <div className="border-2 border-dashed border-slate-800 rounded-lg p-6 text-center hover:bg-slate-900 transition-colors">
            <input type="file" onChange={handleFileUpload} className="hidden" id="evidence-upload" />
            <label htmlFor="evidence-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📎</div>
              <div className="text-sm text-slate-400">Click to upload documents or photos</div>
            </label>
          </div>
          
          {uploading && <div className="text-terminal-yellow text-sm animate-pulse">Scanning evidence with Gemini Vision...</div>}
          
          {evidenceAnalysis && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded text-sm">
              <div className="font-bold text-blue-400 mb-1">AUTOMATED ANALYSIS:</div>
              {evidenceAnalysis}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="pt-6 flex justify-end">
          <button 
            onClick={onSubmit}
            disabled={participant.status === 'responded'}
            className={`px-8 py-3 rounded font-bold tracking-wider ${
              participant.status === 'responded' 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-terminal-green/20 text-terminal-green border border-terminal-green hover:bg-terminal-green/30'
            }`}
          >
            {participant.status === 'responded' ? 'SUBMITTED' : 'SUBMIT SWORN STATEMENT'}
          </button>
        </div>

      </div>
    </div>
  );
};