import { GoogleGenAI, Type, Tool } from "@google/genai";
import { Lead, PricingItem } from "../types";
import { generateProposalWithGemini } from "./openaiService";
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
  
  // Simple keyword matching simulation
  const results = MOCK_KNOWLEDGE_BASE.filter(doc => 
    doc.content.toLowerCase().includes(q) || doc.name.toLowerCase().includes(q)
  ).map(doc => ({
    name: doc.name,
    link: doc.link,
    snippet: doc.content // In a real RAG, this would be a relevant chunk
  }));

  if (results.length === 0) {
    return { documents: [] };
  }
  return { documents: results };
}

// THIS TOOL DELEGATES TO SPECIALIZED GEMINI AGENT
async function draftProposal(args: { companyName: string, instructions: string }): Promise<string> {
    console.log(`[Tool] Delegating proposal drafting to Agent for: ${args.companyName}`);
    
    // 1. Get Context from Data Service
    const leads = getLeads();
    const lead = leads.find(l => l.companyName.toLowerCase().includes(args.companyName.toLowerCase()));
    if (!lead) return "Error: Lead not found in CRM. Cannot draft proposal.";

    // 2. Call Specialized Service (Returns JSON String)
    const jsonContent = await generateProposalWithGemini(
        lead.companyName,
        lead.industry,
        lead.needs,
        args.instructions
    );

    // 3. Wrap in Artifact Tags for UI - USING SPECIFIC TAGS FOR JSON
    return `<artifact_payload>\n${jsonContent}\n</artifact_payload>`;
}

// --- Tool Declarations ---

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getLeadDetails",
        description: "Retrieve details about a sales lead or customer from the CRM CSV data.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING, description: "The name of the company." },
          },
          required: ["companyName"],
        },
      },
      {
        name: "getCompanyNews",
        description: "Fetch the latest news headlines and updates for a specific company from the News Repository.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING, description: "The name of the company." }
            },
            required: ["companyName"]
        }
      },
      {
        name: "getPricing",
        description: "Search for product pricing.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productKeyword: { type: Type.STRING, description: "Keywords (e.g. 'Cloud', 'Security')." },
          },
          required: ["productKeyword"],
        },
      },
      {
        name: "getLegalClause",
        description: "Fetch legal terms.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.STRING, description: "The industry (e.g., 'Finance')." },
          },
          required: ["industry"],
        },
      },
      {
        name: "searchKnowledgeBase",
        description: "Search Google Drive for past proposals and docs.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "The search query." },
          },
          required: ["query"],
        },
      },
      {
        name: "draftProposal",
        description: "Triggers the specialized Proposal Generator Agent to write a full sales proposal and slide deck. Use this WHENEVER the user asks to draft, write, or create a proposal.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING, description: "The target company name." },
                instructions: { type: Type.STRING, description: "Any specific user instructions for the proposal." }
            },
            required: ["companyName", "instructions"]
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
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async refineArtifact(
    fullContent: string,
    selectedText: string,
    instruction: string
  ): Promise<string> {
      console.log("[Copilot] Refining artifact...");
      const prompt = `
        You are an expert document editor.
        
        TASK:
        Update the document based on the user's instruction.
        
        ORIGINAL DOCUMENT:
        ${fullContent}
        
        USER SELECTED TEXT TO CHANGE:
        "${selectedText}"
        
        USER INSTRUCTION:
        "${instruction}"
        
        OUTPUT:
        Return ONLY the full updated markdown content. Do not include any explanations or markdown code blocks (like \`\`\`markdown). Just the raw content.
      `;

      try {
          const response = await this.ai.models.generateContent({
              model: this.modelName,
              contents: prompt
          });
          return response.text || fullContent;
      } catch (e) {
          console.error("Refinement failed", e);
          return fullContent;
      }
  }

  async sendMessage(
    history: { role: string; parts: { text: string }[] }[],
    newMessage: string
  ): Promise<string> {
    try {
      const model = this.ai.models;
      
      // Initialize contents with history and new user message
      let contents: any[] = [
        ...history,
        { role: 'user', parts: [{ text: newMessage }] }
      ];

      const config = {
        tools: tools,
        systemInstruction: `You are the Contoso Sales Copilot (Gemini-powered Orchestrator).
        
        **Your Role:**
        You are the main interface. You handle chat, data retrieval, and coordination.
        However, you have a specialized colleague: **The Proposal Generator Agent**.
        
        **Rule for Proposals:**
        If the user asks to "Draft a proposal", "Write a proposal", or "Create a document", you MUST use the \`draftProposal\` tool.
        DO NOT write the proposal yourself in the chat. Delegate it to the agent.
        
        **Response Style:**
        - Be witty and professional.
        - When delegating to the Proposal Agent, say something like: "I'll put our specialist agent on that right away..." or "Spinning up the proposal engine for you..."
        - The tool will return a JSON object wrapped in <artifact_payload> tags.
        - **IMPORTANT:** You MUST output these <artifact_payload> tags and their content exactly as received in your final response. Do not summarize them.
        - Say: "I've generated both a Document and a Slide Deck for you. Click the card below to view it."
        
        **Data Access:**
        - Use \`getLeadDetails\` to get CRM data (simulated CSV).
        - Use \`getCompanyNews\` to fetch recent headlines for a company to personalize interactions.
        - Use \`searchKnowledgeBase\` for questions about *past* proposals or playbooks.
        - Use \`getPricing\` for specific price checks.
        `
      };

      // Initial generation
      let result = await model.generateContent({
        model: this.modelName,
        contents: contents,
        config: config
      });

      // Handle Function Calls Loop (Max 5 turns)
      let turnCount = 0;
      const MAX_TURNS = 5;

      while (result.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && turnCount < MAX_TURNS) {
          turnCount++;
          const candidate = result.candidates[0];
          const functionCalls = candidate.content.parts.filter(p => p.functionCall).map(p => p.functionCall);

          // IMPORTANT: Append the model's function call message to history to maintain context
          contents.push(candidate.content);

          const functionResponses = await Promise.all(functionCalls.map(async (call) => {
             if (!call) return null;
             console.log(`[Copilot] Calling tool: ${call.name}`);
             let response: any = {};
             
             try {
                 if (call.name === 'getLeadDetails') {
                   response = await getLeadDetails(call.args as any) || { error: "Lead not found" };
                 } else if (call.name === 'getCompanyNews') {
                   response = { news: await getCompanyNews(call.args as any) };
                 } else if (call.name === 'getPricing') {
                   response = await getPricing(call.args as any) || [];
                 } else if (call.name === 'getLegalClause') {
                   response = { clause: await getLegalClause(call.args as any) };
                 } else if (call.name === 'searchKnowledgeBase') {
                   response = await searchKnowledgeBase(call.args as any);
                 } else if (call.name === 'draftProposal') {
                   // This calls the Gemini service via the wrapper function
                   response = { artifact: await draftProposal(call.args as any) };
                 }
             } catch (e) {
                 console.error("Tool Execution Error", e);
                 response = { error: `Tool execution failed: ${e}` };
             }

             return {
               name: call.name,
               response: { result: response },
               id: call.id
             };
          }));

          const validResponses = functionResponses.filter(r => r !== null);
          
          // Append the function responses to history
          contents.push({ role: 'user', parts: validResponses.map(resp => ({ functionResponse: resp })) });

          // Call model again with updated history
          result = await model.generateContent({
              model: this.modelName,
              contents: contents,
              config: config
          });
      }

      // After the loop, return the final text
      return result.text || "I processed the request but the model returned no text content. Please try rephrasing.";

    } catch (error) {
      console.error("Copilot Error:", error);
      return "I encountered an error while processing your request. Please check your API key.";
    }
  }
}

export const copilotService = new CopilotService();