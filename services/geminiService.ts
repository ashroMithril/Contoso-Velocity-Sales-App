
import { GoogleGenAI, Type, Tool, Modality } from "@google/genai";
import { Lead, PricingItem, Artifact } from "../types";
import { generateArtifactWithGemini } from "./openaiService";
import { getLeads, getNewsForCompany, getEmailHistory, getOrgChanges as getOrgChangesData } from "./dataService";

// --- Mock Pricing Data ---

const MOCK_PRICING: PricingItem[] = [
  { sku: "CLD-001", name: "Enterprise Cloud Subscription", price: 12000, currency: "USD" },
  { sku: "SEC-999", name: "Advanced Security Suite", price: 5000, currency: "USD" },
  { sku: "SUP-247", name: "Premium 24/7 Support", price: 2000, currency: "USD" },
  { sku: "IMP-001", name: "Implementation Services", price: 15000, currency: "USD" }
];

const LEGAL_CLAUSES: Record<string, string> = {
  "standard": "This agreement is governed by the laws of the State of Washington. Payment terms are Net 30.",
  "finance": "Strict data privacy compliance (GDPR/CCPA) applies. Audit rights granted to client upon 30 days notice.",
  "manufacturing": "Liability for equipment failure is capped at the total value of the contract. Service Level Agreements (SLA) guarantee 99.9% uptime."
};

// --- Knowledge Base (Google Drive) Mock Data ---

interface DriveDocument {
  id: string;
  name: string;
  type: string;
  link: string;
  content: string;
}

const MOCK_KNOWLEDGE_BASE: DriveDocument[] = [
  {
    id: "doc-1",
    name: "Contoso_Sales_Playbook_2024.pdf",
    type: "application/pdf",
    link: "https://drive.google.com/file/d/mock-playbook",
    content: "For Manufacturing clients, emphasize 'Operational Efficiency' and 'IoT Integration'. The standard discount cap for new logos is 15% without VP approval. Use the 'Challenger' sales methodology."
  },
  {
    id: "doc-2",
    name: "Acme_Corp_Past_Proposal_2023.docx",
    type: "application/vnd.google-apps.document",
    link: "https://docs.google.com/document/d/mock-acme-prev",
    content: "In 2023, we proposed the 'Basic Cloud Pack' to Acme Corp. They rejected it due to lack of '24/7 Support'. They were price sensitive around the $100k mark."
  },
  {
    id: "doc-3",
    name: "Technical_Specs_Cloud_V2.pdf",
    type: "application/pdf",
    link: "https://drive.google.com/file/d/mock-specs",
    content: "The Enterprise Cloud Subscription (CLD-001) supports up to 500TB of storage per tenant. It includes native disaster recovery with a 4-hour RTO. It is SOC2 Type II compliant."
  }
];

// --- Tool Functions ---

async function getLeadDetails(args: { companyName: string }): Promise<Lead | undefined> {
  console.log(`[Tool] Getting details for: ${args.companyName}`);
  const leads = getLeads();
  return leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase()));
}

async function getCompanyNews(args: { companyName: string }): Promise<string[]> {
    console.log(`[Tool] Fetching news for: ${args.companyName}`);
    return getNewsForCompany(args.companyName);
}

async function getRecentEmails(args: { companyName: string }): Promise<any[]> {
    console.log(`[Tool] Fetching emails for: ${args.companyName}`);
    return getEmailHistory(args.companyName);
}

async function getOrgChanges(args: { companyName: string }): Promise<any[]> {
    console.log(`[Tool] Fetching org changes for: ${args.companyName}`);
    return getOrgChangesData(args.companyName);
}

async function getPricing(args: { productKeyword: string }): Promise<PricingItem[]> {
  console.log(`[Tool] Getting pricing for: ${args.productKeyword}`);
  return MOCK_PRICING.filter(p => p.name.toLowerCase().includes(args.productKeyword.toLowerCase()));
}

async function getLegalClause(args: { industry: string }): Promise<string> {
  console.log(`[Tool] Getting legal clause for: ${args.industry}`);
  const key = Object.keys(LEGAL_CLAUSES).find(k => k.toLowerCase() === args.industry.toLowerCase()) || "standard";
  return LEGAL_CLAUSES[key];
}

async function searchKnowledgeBase(args: { query: string }): Promise<{ documents: Partial<DriveDocument>[] }> {
  console.log(`[Tool] Searching Knowledge Base (Drive) for: ${args.query}`);
  const q = args.query.toLowerCase();
  
  const results = MOCK_KNOWLEDGE_BASE.filter(doc => 
    doc.content.toLowerCase().includes(q) || doc.name.toLowerCase().includes(q)
  ).map(doc => ({
    name: doc.name,
    link: doc.link,
    snippet: doc.content
  }));

  if (results.length === 0) {
    return { documents: [] };
  }
  return { documents: results };
}

// --- GENERATION TOOLS ---

async function draftProposal(args: { companyName: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName, industry: 'Technology', needs: ['General Services'] } as Lead;
    
    // generateArtifactWithGemini returns the formatted XML string
    return await generateArtifactWithGemini(
        'proposal',
        { companyName: lead.companyName, industry: lead.industry, needs: lead.needs },
        args.instructions
    );
}

async function draftHandoff(args: { companyName: string, targetTeam: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    return await generateArtifactWithGemini(
        'handoff',
        { companyName: lead.companyName, targetTeam: args.targetTeam },
        args.instructions
    );
}

async function prepareMeetingBrief(args: { companyName: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    return await generateArtifactWithGemini(
        'meeting_brief',
        { companyName: lead.companyName },
        args.instructions
    );
}

async function draftFollowUp(args: { companyName: string, meetingContext: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    return await generateArtifactWithGemini(
        'email',
        { companyName: lead.companyName, meetingContext: args.meetingContext },
        args.instructions
    );
}

// --- Tool Declarations ---

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getLeadDetails",
        description: "Retrieve details about a sales lead or customer from the CRM CSV data.",
        parameters: { type: Type.OBJECT, properties: { companyName: { type: Type.STRING } }, required: ["companyName"] }
      },
      {
        name: "getCompanyNews",
        description: "Fetch the latest news headlines and updates.",
        parameters: { type: Type.OBJECT, properties: { companyName: { type: Type.STRING } }, required: ["companyName"] }
      },
      {
        name: "getRecentEmails",
        description: "Fetch recent email threads and communication signals from the account.",
        parameters: { type: Type.OBJECT, properties: { companyName: { type: Type.STRING } }, required: ["companyName"] }
      },
      {
        name: "getOrgChanges",
        description: "Check for recent leadership or role changes in the organization.",
        parameters: { type: Type.OBJECT, properties: { companyName: { type: Type.STRING } }, required: ["companyName"] }
      },
      {
        name: "getPricing",
        description: "Search for product pricing.",
        parameters: { type: Type.OBJECT, properties: { productKeyword: { type: Type.STRING } }, required: ["productKeyword"] }
      },
      {
        name: "getLegalClause",
        description: "Fetch legal terms.",
        parameters: { type: Type.OBJECT, properties: { industry: { type: Type.STRING } }, required: ["industry"] }
      },
      {
        name: "searchKnowledgeBase",
        description: "Search Google Drive for past proposals and docs.",
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] }
      },
      {
        name: "draftProposal",
        description: "Drafts a full sales proposal (Doc + Slides) with pricing and timelines. Trigger via @Velocity draft proposal.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING },
                instructions: { type: Type.STRING }
            },
            required: ["companyName", "instructions"]
        }
      },
      {
        name: "draftHandoff",
        description: "Generates a cross-team handoff document. Trigger via @Velocity handoff.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING },
                targetTeam: { type: Type.STRING },
                instructions: { type: Type.STRING }
            },
            required: ["companyName", "targetTeam", "instructions"]
        }
      },
      {
        name: "prepareMeetingBrief",
        description: "Generates a pre-meeting briefing with recent interactions and talking points. Trigger via @Velocity prep meeting.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING },
                instructions: { type: Type.STRING }
            },
            required: ["companyName", "instructions"]
        }
      },
      {
        name: "draftFollowUp",
        description: "Drafts a personalized follow-up email after a meeting. Trigger via @Velocity follow up.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING },
                meetingContext: { type: Type.STRING },
                instructions: { type: Type.STRING }
            },
            required: ["companyName", "meetingContext", "instructions"]
        }
      },
      {
          name: "draftVoiceOver",
          description: "Generates an audio voice-over script and audio file for a pitch. Trigger via @Velocity voice over.",
          parameters: {
              type: Type.OBJECT,
              properties: {
                  companyName: { type: Type.STRING },
                  script: { type: Type.STRING, description: "The text to speak" }
              },
              required: ["companyName", "script"]
          }
      },
      {
          name: "createDemoVideo",
          description: "Generates a short demo video concept using Veo. Trigger via @Velocity demo video.",
          parameters: {
              type: Type.OBJECT,
              properties: {
                  companyName: { type: Type.STRING },
                  prompt: { type: Type.STRING, description: "Visual description of the video" }
              },
              required: ["companyName", "prompt"]
          }
      }
    ]
  }
];

// --- API Service ---

export class CopilotService {
  private modelName = "gemini-3-flash-preview"; 

  // --- AUDIO GENERATION (TTS) ---
  async generateAudio(text: string): Promise<string | null> {
      try {
          if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') throw new Error("Missing API Key");
          
          const ttsAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ttsAi.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: text }] }],
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Kore' },
                      },
                  },
              },
          });
          
          return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (e) {
          console.error("Audio Generation Failed", e);
          return null;
      }
  }

  // --- VIDEO GENERATION (VEO) ---
  async generateVideo(prompt: string): Promise<string | null> {
      try {
          if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') throw new Error("Missing API Key");

          // Check for Paid Key Selection for Veo
          if ((window as any).aistudio) {
              const hasKey = await (window as any).aistudio.hasSelectedApiKey();
              if (!hasKey) {
                   await (window as any).aistudio.openSelectKey();
              }
          }

          const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
          
          let operation = await videoAi.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: prompt,
              config: {
                  numberOfVideos: 1,
                  resolution: '720p',
                  aspectRatio: '16:9'
              }
          });

          // Polling
          let retryCount = 0;
          while (!operation.done && retryCount < 20) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
              operation = await videoAi.operations.getVideosOperation({operation: operation});
              retryCount++;
          }

          if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
               const uri = operation.response.generatedVideos[0].video.uri;
               return `${uri}&key=${process.env.API_KEY}`;
          }
          return null;

      } catch (e) {
          console.error("Video Generation Failed", e);
          return null;
      }
  }

  async refineArtifact(fullContent: string, selectedText: string, instruction: string): Promise<string> {
      try {
          if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') throw new Error("Missing API Key");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            You are an expert document editor.
            TASK: Update the document based on the user's instruction.
            ORIGINAL: ${fullContent}
            SELECTED: "${selectedText}"
            INSTRUCTION: "${instruction}"
            OUTPUT: Return ONLY the full updated markdown content.
          `;
          const response = await ai.models.generateContent({ model: this.modelName, contents: prompt });
          return response.text || fullContent;
      } catch (e) {
          console.error("Refinement failed. Returning original.", e);
          return fullContent; 
      }
  }

  async generateEmailForArtifact(artifact: Artifact): Promise<string> {
    try {
        if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') return "Draft email content...";

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Draft a concise email to the client ${artifact.companyName} attaching the ${artifact.title}. Return only the body text.`;
        const response = await ai.models.generateContent({ model: this.modelName, contents: prompt });
        return response.text || "Draft email content...";
    } catch (e) {
        console.error("Email generation failed", e);
        return `Subject: ${artifact.title}\n\nPlease find attached the ${artifact.title} for your review.\n\nBest regards,\n[Your Name]`;
    }
  }

  async sendMessage(history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> {
    try {
      if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') {
          return await this.handleFallbackResponse(newMessage);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = ai.models;
      let contents: any[] = [...history, { role: 'user', parts: [{ text: newMessage }] }];

      const config = {
        tools: tools,
        thinkingConfig: { thinkingBudget: 1024 }, 
        systemInstruction: `You are Velocity, the Contoso Sales Copilot.
        
        **Persona:**
        You are an intelligent M365-style agent helping sales teams.
        
        **CRITICAL OUTPUT FORMAT:**
        For EVERY response that involves generating an artifact (proposal, handoff, brief, email), you MUST follow this XML format:
        
        <reasoning>
        - Step 1: Analyzing...
        - Step 2: Retrieving data...
        </reasoning>
        
        <references>
        [
          {"type": "crm", "title": "CRM Data: Acme Corp", "keyPoint": "Budget $150k, Decision Maker: Alice"},
          {"type": "email", "title": "Email from Alice", "keyPoint": "Concern about 24/7 support pricing"},
          {"type": "file", "title": "Past Proposal 2023", "keyPoint": "Previous rejection due to price sensitivity"}
        ]
        </references>

        <artifact_payload>
        { "documentContent": "...", "presentationContent": "..." }
        </artifact_payload>

        If you are just chatting, you can skip the tags.

        **CRITICAL: PROPOSAL PRICING**
        When generating a proposal, ALWAYS include a specific "Investment" or "Pricing" section with a Markdown Table.
        Use real numbers based on the product data available or reasonable estimates.
        
        **CRITICAL REASONING PROCESS:**
        When the user asks you to draft a proposal or analyze an account, you MUST consult the following data sources:
        1. **Recent Emails (\`getRecentEmails\`):** Check for blockers.
        2. **Org Changes (\`getOrgChanges\`):** Check for new stakeholders.
        3. **Company News (\`getCompanyNews\`):** Check for context.
        4. **Previous Proposals (\`searchKnowledgeBase\`):** Check pricing history.
        
        **Capabilities & Commands:**
        1. **Proposal Generation**: "@Velocity draft proposal [Company]" -> Use \`draftProposal\`.
        2. **Handoffs**: "@Velocity handoff [Company] to [Team]" -> Use \`draftHandoff\`.
        3. **Meeting Prep**: "@Velocity prep meeting [Company]" -> Use \`prepareMeetingBrief\`.
        4. **Follow-ups**: "@Velocity follow up [Company]" -> Use \`draftFollowUp\`.
        
        **Rules:**
        - If the user uses a @Velocity command, map it to the correct tool immediately.
        - The tools return XML/JSON mixed content. Output this EXACTLY as returned by the tool.
        - Be concise and professional.
        `
      };

      let result = await model.generateContent({ model: this.modelName, contents: contents, config: config });

      let turnCount = 0;
      const MAX_TURNS = 10;

      while (result.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && turnCount < MAX_TURNS) {
          turnCount++;
          const candidate = result.candidates[0];
          const functionCalls = candidate.content.parts.filter(p => p.functionCall).map(p => p.functionCall);
          contents.push(candidate.content);

          const functionResponses = await Promise.all(functionCalls.map(async (call) => {
             if (!call) return null;
             console.log(`[Copilot] Calling tool: ${call.name}`);
             let response: any = {};
             try {
                 switch (call.name) {
                     case 'getLeadDetails': response = await getLeadDetails(call.args as any) || { error: "Lead not found" }; break;
                     case 'getCompanyNews': response = { news: await getCompanyNews(call.args as any) }; break;
                     case 'getRecentEmails': response = { emails: await getRecentEmails(call.args as any) }; break;
                     case 'getOrgChanges': response = { changes: await getOrgChanges(call.args as any) }; break;
                     case 'getPricing': response = await getPricing(call.args as any) || []; break;
                     case 'getLegalClause': response = { clause: await getLegalClause(call.args as any) }; break;
                     case 'searchKnowledgeBase': response = await searchKnowledgeBase(call.args as any); break;
                     // These return string with XML tags now
                     case 'draftProposal': response = { result: await draftProposal(call.args as any) }; break;
                     case 'draftHandoff': response = { result: await draftHandoff(call.args as any) }; break;
                     case 'prepareMeetingBrief': response = { result: await prepareMeetingBrief(call.args as any) }; break;
                     case 'draftFollowUp': response = { result: await draftFollowUp(call.args as any) }; break;
                     
                     case 'draftVoiceOver': {
                         const args = call.args as any;
                         const audioBase64 = await this.generateAudio(args.script);
                         const artifactJson = JSON.stringify({
                             documentContent: `## Voice Over Script for ${args.companyName}\n\n${args.script}`,
                             presentationContent: `# Voice Over\n\n- **Client**: ${args.companyName}\n- **Status**: Generated`,
                             audioContent: audioBase64 || undefined
                         });
                         response = { result: `<reasoning>\n- Generating TTS audio...\n</reasoning>\n<artifact_payload>\n${artifactJson}\n</artifact_payload>` };
                         break;
                     }
                     case 'createDemoVideo': {
                         const args = call.args as any;
                         const videoUri = await this.generateVideo(args.prompt);
                         const artifactJson = JSON.stringify({
                             documentContent: `## Demo Video Prompt for ${args.companyName}\n\n**Prompt Used:** ${args.prompt}`,
                             presentationContent: `# Demo Video\n\n- **Client**: ${args.companyName}\n- **Model**: Veo 3.1`,
                             videoUri: videoUri || undefined,
                             videoPrompt: args.prompt
                         });
                         response = { result: `<reasoning>\n- Generating video with Veo...\n</reasoning>\n<artifact_payload>\n${artifactJson}\n</artifact_payload>` };
                         break;
                     }
                 }
             } catch (e) {
                 response = { error: `Tool execution failed: ${e}` };
             }
             return { name: call.name, response: { result: response }, id: call.id };
          }));

          const validResponses = functionResponses.filter(r => r !== null);
          contents.push({ role: 'user', parts: validResponses.map(resp => ({ functionResponse: resp })) });

          result = await model.generateContent({ model: this.modelName, contents: contents, config: config });
      }

      return result.text || "I processed the request but the model returned no text content.";

    } catch (error) {
      console.error("Copilot Error (API Failure). Attempting Fallback logic.", error);
      return await this.handleFallbackResponse(newMessage);
    }
  }

  // Handle fallback when the LLM is down but we can still infer intent via regex
  private async handleFallbackResponse(query: string): Promise<string> {
      const lowerQuery = query.toLowerCase();
      const leads = getLeads();
      const lead = leads.find(l => lowerQuery.includes(l.companyName.toLowerCase())) || leads[0];
      const companyName = lead ? lead.companyName : "Client";

      let artifactResponse = "";

      if (lowerQuery.includes("proposal")) {
          artifactResponse = await generateArtifactWithGemini('proposal', { companyName, industry: lead.industry, needs: lead.needs }, query);
      } else if (lowerQuery.includes("handoff")) {
          artifactResponse = await generateArtifactWithGemini('handoff', { companyName, targetTeam: "Implementation" }, query);
      } else if (lowerQuery.includes("brief") || lowerQuery.includes("prep") || lowerQuery.includes("meeting")) {
          artifactResponse = await generateArtifactWithGemini('meeting_brief', { companyName }, query);
      } else if (lowerQuery.includes("email") || lowerQuery.includes("follow up")) {
          artifactResponse = await generateArtifactWithGemini('email', { companyName, meetingContext: "recent discussion" }, query);
      } else {
           return "I'm currently running in offline mode. I can still help you generate proposals, handoffs, and meeting briefs. Try saying '@Velocity draft proposal for Acme Corp'.";
      }

      return `(Offline Mode) I have generated a **sample** for you.\n\n${artifactResponse}`;
  }
}

export const copilotService = new CopilotService();