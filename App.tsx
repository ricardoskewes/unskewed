import React, { useState, useEffect } from 'react';
import { InvestigationState, Participant, Role } from './types';
import { InvestigatorDashboard } from './components/InvestigatorDashboard';
import { ParticipantPortal } from './components/ParticipantPortal';

// --- INITIAL MOCK STATE ---
const generateCaseId = () => "GOTHAM-PD-" + Math.floor(Math.random() * 10000);

const INITIAL_PARTICIPANTS: Record<string, Participant> = {
  "harvey-d": {
    id: "harvey-d",
    name: "Harvey Dent",
    role: "victim",
    status: "responded", 
    credibilityScore: 92,
    consistencyRating: 1.0,
    testimony: "I left the DA's office at 8:00 PM to meet Gordon on the roof. I left my lucky double-headed silver dollar on my desk. When I returned at 9:30 PM, the coin was gone and the window was shattered. It had to be the Joker; he's been taunting me about 'chance' all week.",
    history: [],
    pendingQuestions: [],
    evidenceFiles: []
  },
  "joker": {
    id: "joker",
    name: "The Joker",
    role: "suspect",
    status: "responded",
    credibilityScore: 15,
    consistencyRating: 0.4,
    testimony: "Why so serious, Harvey? I didn't take your shiny little trinket! I was busy adding a little... chaos... to the Iceberg Lounge's grand re-opening from 7 PM until midnight. Ask Penguin, he tried to throw me out!",
    history: [],
    pendingQuestions: [],
    evidenceFiles: []
  },
  "gordon": {
    id: "gordon",
    name: "Jim Gordon",
    role: "witness",
    status: "responded",
    credibilityScore: 98,
    consistencyRating: 1.0,
    testimony: "I can confirm I met with Dent on the MCU rooftop from 8:15 PM to 8:45 PM. We were discussing the Maroni case. I didn't see anyone enter the DA's office, but I did hear an explosion near the docks later that night.",
    history: [],
    pendingQuestions: [],
    evidenceFiles: []
  }
};

const INITIAL_STATE: InvestigationState = {
  caseId: generateCaseId(),
  status: "active",
  round: 1,
  maxRounds: 10,
  participants: INITIAL_PARTICIPANTS,
  investigatorNotes: "",
  contradictions: [],
  truthConfidence: 20, // Low initial confidence
  subpoenaQueue: [],
  roundProcessingStatus: 'pending' // Initially pending, but since everyone answered, user can click Process
};

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'landing' | 'participant' | 'investigator'>('landing');
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // Initialize state from localStorage if available, or use initial state
  const [investigation, setInvestigation] = useState<InvestigationState>(() => {
    const saved = localStorage.getItem('unskewed_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // --- PERSISTENCE & SYNC ---
  
  // Write to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('unskewed_state', JSON.stringify(investigation));
  }, [investigation]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'unskewed_state' && e.newValue) {
            setInvestigation(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- HANDLERS ---
  const handleLogin = (name: string) => {
    // Check for Investigator
    if (name.toLowerCase() === 'admin' || name.toLowerCase() === 'batman' || name.toLowerCase() === 'investigator') {
      setView('investigator');
      return;
    }

    // Check for Participant (Match name or ID partially)
    const pId = Object.keys(investigation.participants).find(
      key => investigation.participants[key].name.toLowerCase().includes(name.toLowerCase()) || key === name.toLowerCase()
    );

    if (pId) {
      setCurrentUser(pId);
      setView('participant');
    } else {
      alert("Access Denied: Subject not found in investigation manifest.");
    }
  };

  const handleLogout = () => {
    setView('landing');
    setCurrentUser('');
  };

  const handleParticipantSubmit = (text: string) => {
    if (!currentUser) return;
    
    setInvestigation(prev => ({
      ...prev,
      participants: {
        ...prev.participants,
        [currentUser]: {
          ...prev.participants[currentUser],
          testimony: text,
          status: 'responded'
        }
      }
    }));
  };

  // --- VIEWS ---

  if (view === 'investigator') {
    return (
      <InvestigatorDashboard 
        state={investigation} 
        onUpdateState={setInvestigation} 
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'participant') {
    const p = investigation.participants[currentUser];
    if (!p) return <div>Error loading profile</div>;
    return (
      <ParticipantPortal 
        participant={p} 
        currentRound={investigation.round}
        onUpdateTestimony={(text) => {
           setInvestigation(prev => ({
            ...prev,
            participants: {
                ...prev.participants,
                [currentUser]: { ...prev.participants[currentUser], testimony: text }
            }
           }))
        }}
        onSubmit={() => handleParticipantSubmit(p.testimony)}
        onLogout={handleLogout}
      />
    );
  }

  // LANDING VIEW
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-300 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-[0.2em] mb-2">UNSKEWED OS</h1>
          <div className="h-1 w-24 bg-terminal-green mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">TRUTH CONVERGENCE PLATFORM</p>
          <p className="text-xs text-slate-600 mt-2">SECURE SERVER: GOTHAM CENTRAL</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-slate-500 mb-2">Identity Verification</label>
              <input 
                type="text" 
                id="login-input"
                placeholder="Enter Name (e.g., 'Batman' or 'Joker')"
                className="w-full bg-black border border-slate-700 p-3 text-white rounded focus:border-terminal-green outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin((e.target as HTMLInputElement).value);
                }}
              />
            </div>
            <button 
              onClick={() => {
                const input = document.getElementById('login-input') as HTMLInputElement;
                handleLogin(input.value);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded border border-slate-600 hover:border-slate-500 transition-all"
            >
              SECURE LOGIN
            </button>
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-800 text-[10px] text-slate-600">
            <p className="text-center mb-4">AUTHORIZED PERSONNEL ONLY. ALL ACTIVITIES LOGGED.</p>
            
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <p className="font-bold text-slate-500 mb-2 uppercase tracking-wider">AVAILABLE CREDENTIALS:</p>
              <div className="grid grid-cols-1 gap-2 text-slate-400">
                <div 
                  className="cursor-pointer hover:text-terminal-red flex items-center p-1 hover:bg-slate-900 rounded transition-colors"
                  onClick={() => handleLogin('batman')}
                >
                  <span className="w-2 h-2 bg-terminal-red rounded-full mr-2"></span>
                  Investigator (Batman)
                </div>
                {Object.values(investigation.participants).map(p => (
                  <div 
                    key={p.id}
                    className="cursor-pointer hover:text-terminal-green flex items-center p-1 hover:bg-slate-900 rounded transition-colors"
                    onClick={() => handleLogin(p.name)}
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {p.name} <span className="text-slate-600 ml-1">({p.role})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;