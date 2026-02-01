import React, { useState } from 'react';
import { Role } from '../types';

interface SubpoenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, role: Role, reason: string) => void;
}

export const SubpoenaModal: React.FC<SubpoenaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('witness');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-terminal-green mb-4 tracking-wider">ISSUE SUBPOENA</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase mb-1">Subject Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2 text-white rounded focus:border-terminal-green outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase mb-1">Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-slate-950 border border-slate-700 p-2 text-white rounded focus:border-terminal-green outline-none"
            >
              <option value="witness">Fact Witness</option>
              <option value="expert">Expert Witness</option>
              <option value="suspect">Person of Interest</option>
              <option value="informant">Informant</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase mb-1">Reason for Summons</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2 text-white rounded focus:border-terminal-green outline-none h-24"
              placeholder="e.g. Was seen on CCTV at 22:00..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
            <button 
              onClick={() => { onSubmit(name, role, reason); onClose(); setName(''); setReason(''); }}
              className="px-4 py-2 bg-terminal-green/20 text-terminal-green border border-terminal-green hover:bg-terminal-green/30 rounded"
            >
              Issue Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};