import { GoogleGenAI, Type, Tool } from "@google/genai";
import { Lead, PricingItem } from "../types";
import { generateArtifactWithGemini } from "./openaiService";
import { getLeads, getNewsForCompany } from "./dataService";

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
    
    const jsonContent = await generateArtifactWithGemini(
        'proposal',
        { companyName: lead.companyName, industry: lead.industry, needs: lead.needs },
        args.instructions
    );
    return `<artifact_payload>\n${jsonContent}\n</artifact_payload>`;
}

async function draftHandoff(args: { companyName: string, targetTeam: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    const jsonContent = await generateArtifactWithGemini(
        'handoff',
        { companyName: lead.companyName, targetTeam: args.targetTeam },
        args.instructions
    );
    return `<artifact_payload>\n${jsonContent}\n</artifact_payload>`;
}

async function prepareMeetingBrief(args: { companyName: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    const jsonContent = await generateArtifactWithGemini(
        'meeting_brief',
        { companyName: lead.companyName },
        args.instructions
    );
    return `<artifact_payload>\n${jsonContent}\n</artifact_payload>`;
}

async function draftFollowUp(args: { companyName: string, meetingContext: string, instructions: string }): Promise<string> {
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase())) || { companyName: args.companyName } as Lead;

    const jsonContent = await generateArtifactWithGemini(
        'email',
        { companyName: lead.companyName, meetingContext: args.meetingContext },
        args.instructions
    );
    return `<artifact_payload>\n${jsonContent}\n</artifact_payload>`;
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
      }
    ]
  }
];

// --- API Service ---

export class CopilotService {
  private ai: GoogleGenAI;
  private modelName = "gemini-3-flash-preview"; 

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key' });
  }

  async refineArtifact(fullContent: string, selectedText: string, instruction: string): Promise<string> {
      const prompt = `
        You are an expert document editor.
        TASK: Update the document based on the user's instruction.
        ORIGINAL: ${fullContent}
        SELECTED: "${selectedText}"
        INSTRUCTION: "${instruction}"
        OUTPUT: Return ONLY the full updated markdown content.
      `;
      try {
          const response = await this.ai.models.generateContent({ model: this.modelName, contents: prompt });
          return response.text || fullContent;
      } catch (e) {
          console.error("Refinement failed (API Error). Returning original.", e);
          return fullContent; // Graceful degradation for refinement
      }
  }

  async sendMessage(history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> {
    try {
      const model = this.ai.models;
      let contents: any[] = [...history, { role: 'user', parts: [{ text: newMessage }] }];

      const config = {
        tools: tools,
        systemInstruction: `You are Velocity, the Contoso Sales Copilot.
        
        **Persona:**
        You are an intelligent M365-style agent helping sales teams.
        You support "Quick Commands" via the @Velocity tag.
        
        **Capabilities & Commands:**
        1. **Proposal Generation**: "@Velocity draft proposal [Company]" -> Use \`draftProposal\`.
        2. **Handoffs**: "@Velocity handoff [Company] to [Team]" -> Use \`draftHandoff\`.
        3. **Meeting Prep**: "@Velocity prep meeting [Company]" -> Use \`prepareMeetingBrief\`.
        4. **Follow-ups**: "@Velocity follow up [Company]" -> Use \`draftFollowUp\`.
        5. **Proactive Alerts**: You can detect "Buying Signals" and "Renewal Risks" from news and CRM data.
        
        **Rules:**
        - If the user uses a @Velocity command, map it to the correct tool immediately.
        - For any content generation (Proposal, Handoff, Email, Brief), ALWAYS use the respective tool. DO NOT write it in chat.
        - The tools return JSON wrapped in <artifact_payload>. Output this EXACTLY.
        - Be concise and professional.
        `
      };

      let result = await model.generateContent({ model: this.modelName, contents: contents, config: config });

      let turnCount = 0;
      const MAX_TURNS = 5;

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
                     case 'getPricing': response = await getPricing(call.args as any) || []; break;
                     case 'getLegalClause': response = { clause: await getLegalClause(call.args as any) }; break;
                     case 'searchKnowledgeBase': response = await searchKnowledgeBase(call.args as any); break;
                     case 'draftProposal': response = { artifact: await draftProposal(call.args as any) }; break;
                     case 'draftHandoff': response = { artifact: await draftHandoff(call.args as any) }; break;
                     case 'prepareMeetingBrief': response = { artifact: await prepareMeetingBrief(call.args as any) }; break;
                     case 'draftFollowUp': response = { artifact: await draftFollowUp(call.args as any) }; break;
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
      // Try to find company in query
      const lead = leads.find(l => lowerQuery.includes(l.companyName.toLowerCase())) || leads[0];
      const companyName = lead ? lead.companyName : "Client";

      let artifactResponse = "";
      let actionTaken = "";

      // Force-invoke the tool logic (which now has its own fallback templates)
      if (lowerQuery.includes("proposal")) {
          artifactResponse = await draftProposal({ companyName, instructions: query });
          actionTaken = "drafting a proposal";
      } else if (lowerQuery.includes("handoff")) {
          artifactResponse = await draftHandoff({ companyName, targetTeam: "Implementation", instructions: query });
          actionTaken = "creating a handoff";
      } else if (lowerQuery.includes("brief") || lowerQuery.includes("prep") || lowerQuery.includes("meeting")) {
          artifactResponse = await prepareMeetingBrief({ companyName, instructions: query });
          actionTaken = "preparing a meeting brief";
      } else if (lowerQuery.includes("email") || lowerQuery.includes("follow up")) {
          artifactResponse = await draftFollowUp({ companyName, meetingContext: "recent discussion", instructions: query });
          actionTaken = "drafting a follow-up email";
      } else {
           return "I'm currently having trouble connecting to my AI services. Please check your internet connection or API key configuration.";
      }

      return `(AI Service Unavailable) I have generated a **sample** for you by ${actionTaken} for ${companyName}.\n\n${artifactResponse}`;
  }
}

export const copilotService = new CopilotService();