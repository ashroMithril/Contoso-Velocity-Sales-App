import { GoogleGenAI, Type } from "@google/genai";

export interface GeneratedArtifacts {
    documentContent: string;
    presentationContent: string;
}

export async function generateProposalWithGemini(
  companyName: string, 
  industry: string, 
  needs: string[], 
  instructions: string
): Promise<string> {
  
  console.log("[Proposal Agent] Triggered via Gemini for:", companyName);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a specialized Proposal Generator Agent for Contoso.
    Your goal is to create TWO assets for the following lead:
    
    Company: ${companyName}
    Industry: ${industry}
    Client Needs: ${needs.join(", ")}
    User Instructions: ${instructions}
    
    Structure your response as a valid JSON object with the following schema:
    {
        "documentContent": "Markdown string for a detailed Word document proposal (Exec Summary, Solution, Investment, Timeline)",
        "presentationContent": "Markdown string for a PowerPoint deck. Use '---' to separate slides. Each slide should have a Header (##) and bullet points."
    }
    
    Tone: Professional, persuasive, and tailored to the ${industry} industry.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Using Pro for complex reasoning/writing tasks
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    documentContent: { type: Type.STRING, description: "The markdown content for the proposal document." },
                    presentationContent: { type: Type.STRING, description: "The markdown content for the presentation slides." }
                },
                required: ["documentContent", "presentationContent"]
            }
        }
    });

    return response.text || "{}";

  } catch (error) {
    console.error("Proposal Agent Failed:", error);
    return JSON.stringify({
        documentContent: "### Error Generation Failed\n\nI encountered an issue generating the proposal. Please try again.",
        presentationContent: "## Error\n- Could not generate slides"
    });
  }
}