export type Role = 'suspect' | 'witness' | 'expert' | 'victim' | 'informant' | 'custodian';

export interface Message {
  id: string;
  sender: 'system' | 'investigator' | 'participant';
  text: string;
  timestamp: number;
}

export interface Participant {
  id: string;
  name: string;
  role: Role;
  status: 'pending' | 'responded' | 'unquestioned';
  credibilityScore: number; // 0-100
  consistencyRating: number; // 0.0 - 1.0 (Duality OS metric)
  testimony: string; // Current round testimony
  history: Array<{
    round: number;
    testimony: string;
    questions: string[];
  }>;
  pendingQuestions: string[];
  evidenceFiles: Array<{
    name: string;
    description: string;
    type: 'image' | 'document';
    analysis?: string;
  }>;
  keyClaims?: string[];
}

export interface Contradiction {
  id: string;
  claim: string;
  participants: string[]; // Names involved
  type: 'temporal' | 'existential' | 'causal' | 'identity' | 'logical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  description: string;
  resolvingEvidence?: string;
}

export interface InvestigationStrategy {
  recommendedAction: 'continue' | 'subpoena' | 'confront' | 'resolve';
  targetParticipant: string;
  rationale: string;
  subpoenaSuggestions: string[];
}

export interface VisualizationData {
  mermaidNetwork: string;
  timelineEvents: any[];
}

export interface InvestigationState {
  caseId: string;
  status: 'active' | 'resolved' | 'stalled';
  round: number;
  maxRounds: number;
  participants: Record<string, Participant>;
  investigatorNotes: string;
  contradictions: Contradiction[];
  truthConfidence: number; // 0-100
  subpoenaQueue: Participant[];
  strategy?: InvestigationStrategy;
  visualizationData?: VisualizationData;
  roundProcessingStatus: 'pending' | 'processed';
}

export interface GeoLocation {
  lat: number;
  lng: number;
}