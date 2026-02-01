import { GoogleGenAI, Type } from "@google/genai";
import { InvestigationState, Participant, Contradiction, InvestigationStrategy, VisualizationData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILITIES ---

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- DUALITY OS CORE ENGINE ---

/**
 * The core engine of Duality OS. 
 * Analyzes the entire state, detects contradictions, calculates truth confidence,
 * generates questions, and produces visualization data in one pass.
 */
export const processInvestigationRound = async (
  state: InvestigationState
): Promise<{
  updatedParticipants: Record<string, Participant>;
  contradictions: Contradiction[];
  truthConfidence: number;
  strategy: InvestigationStrategy;
  visualizationData: VisualizationData;
}> => {
  
  try {
    // Prepare transcript for the model - Moved inside try/catch for safety
    // Uses safer access to 'history' in case of legacy state data
    const transcript = Object.values(state.participants).map(p => {
      const history = p.history || [];
      const historyText = history.map(h => `Round ${h.round}: ${h.testimony}`).join("\n");
      return `
      PARTICIPANT: ${p.name} (${p.role})
      CURRENT TESTIMONY (Round ${state.round}): ${p.testimony || "(No testimony provided this round yet)"}
      HISTORY:
      ${historyText}
      `;
    }).join("\n--------------------------------\n");

    const systemPrompt = `
      You are DUALITY OS v2.0 - A Multi-Round, N-Party Investigation Engine with Truth Convergence.
      
      CAPABILITIES:
      - Analyze testimonies for temporal, existential, and logical contradictions.
      - Calculate truth confidence (0-100).
      - Generate targeted, non-leading questions that resolve contradictions WITHOUT revealing other testimony.
      - Suggest investigation strategy.
      
      CURRENT STATE:
      Round: ${state.round}
      Previous Confidence: ${state.truthConfidence}
      Previous Contradictions: ${JSON.stringify(state.contradictions)}
      
      TASK:
      Analyze the provided transcripts. Return a JSON object matching the schema.
      
      RULES FOR QUESTION GENERATION:
      1. The question must NOT reveal what other participants said.
      2. Target the specific weak point.
      3. Ask for evidence.
      4. Example Bad: "Sarah says you stole it."
      5. Example Good: "Can you provide documentation of your whereabouts between 6-7PM?"

      RULES FOR VISUALIZATION:
      Generate a valid Mermaid.js graph string for 'visualizationData.mermaidNetwork'.
      - Use graph TD.
      - Nodes are participants or Events.
      - Edges are claims or contradictions.
      - Style contradictions in red.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: systemPrompt + "\n\nTRANSCRIPTS:\n" + transcript,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            participantsUpdate: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING }, // Should match participant name/id loosely
                  credibilityScore: { type: Type.NUMBER },
                  consistencyRating: { type: Type.NUMBER },
                  keyClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
                  newQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            contradictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  claim: { type: Type.STRING },
                  participants: { type: Type.ARRAY, items: { type: Type.STRING } },
                  type: { type: Type.STRING, enum: ['temporal', 'existential', 'causal', 'identity', 'logical'] },
                  severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                  status: { type: Type.STRING, enum: ['open', 'resolved'] },
                  description: { type: Type.STRING },
                  resolvingEvidence: { type: Type.STRING }
                }
              }
            },
            truthConfidence: { type: Type.NUMBER },
            strategy: {
              type: Type.OBJECT,
              properties: {
                recommendedAction: { type: Type.STRING, enum: ['continue', 'subpoena', 'confront', 'resolve'] },
                targetParticipant: { type: Type.STRING },
                rationale: { type: Type.STRING },
                subpoenaSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            visualizationData: {
              type: Type.OBJECT,
              properties: {
                mermaidNetwork: { type: Type.STRING },
                timelineEvents: { type: Type.ARRAY, items: { type: Type.STRING } } // simplified for now
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Merge updates back into participant records
    const updatedParticipants = { ...state.participants };
    
    if (result.participantsUpdate) {
      result.participantsUpdate.forEach((update: any) => {
        // Find participant by ID or Name fuzzy match
        let pId = Object.keys(updatedParticipants).find(k => k === update.id || updatedParticipants[k].name === update.id);
        
        // Fallback: try to find by name inclusion
        if (!pId) {
             pId = Object.keys(updatedParticipants).find(k => updatedParticipants[k].name.includes(update.id));
        }

        if (pId) {
          const p = updatedParticipants[pId];
          p.credibilityScore = update.credibilityScore ?? p.credibilityScore;
          p.consistencyRating = update.consistencyRating ?? p.consistencyRating;
          p.keyClaims = update.keyClaims ?? [];
          
          if (update.newQuestions && update.newQuestions.length > 0) {
            p.pendingQuestions = update.newQuestions;
            p.status = 'pending'; // Re-open for questioning
          }
        }
      });
    }

    return {
      updatedParticipants,
      contradictions: result.contradictions || [],
      truthConfidence: result.truthConfidence || state.truthConfidence,
      strategy: result.strategy || { recommendedAction: 'continue', targetParticipant: 'None', rationale: 'Analysis inconclusive', subpoenaSuggestions: [] },
      visualizationData: result.visualizationData || { mermaidNetwork: 'graph TD; Error[Analysis Failed]', timelineEvents: [] }
    };

  } catch (error) {
    console.error("Duality OS Analysis Failed", error);
    return {
      updatedParticipants: state.participants,
      contradictions: [],
      truthConfidence: state.truthConfidence,
      strategy: { recommendedAction: 'continue', targetParticipant: 'None', rationale: 'Error during analysis: ' + (error instanceof Error ? error.message : String(error)), subpoenaSuggestions: [] },
      visualizationData: { mermaidNetwork: 'graph TD; Error[System Failure]', timelineEvents: [] }
    };
  }
};

// --- HELPER WRAPPERS ---

export const performBackgroundCheck = async (name: string): Promise<{ summary: string; sources: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a background check summary for a fictional character or public figure named ${name}. Key events only.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri).filter(Boolean) || [];

    return {
      summary: response.text || "No records found.",
      sources: sources
    };
  } catch (error) {
    return { summary: "Search unavailable.", sources: [] };
  }
};

export const analyzeEvidenceImage = async (file: File, context: string): Promise<string> => {
    try {
      const imagePart = await fileToGenerativePart(file);
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            imagePart,
            { text: `Analyze this image in the context of: ${context}. List key details relevant to an investigation.` }
          ]
        }
      });
      return response.text || "Analysis failed.";
    } catch (error) {
      return "Could not analyze image.";
    }
};

export const forensicEnhancement = async (file: File, instruction: string): Promise<string> => {
    // Placeholder as we don't have file persistence in this demo context
    return ""; 
};