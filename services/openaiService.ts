
import { GoogleGenAI, Type } from "@google/genai";
import { Reference } from "../types";

const FALLBACK_TEMPLATES = {
    proposal: (context: any) => ({
        reasoning: [
            `Analyzing needs for ${context.companyName} in ${context.industry || 'General'} sector...`,
            `Retrieving pricing for requested services: ${context.needs?.join(', ') || 'Standard Package'}...`,
            `Structuring executive summary and investment breakdown...`
        ],
        references: [
            { type: 'crm', title: `CRM: ${context.companyName}`, keyPoint: 'Budget: $200k, Decision Maker: CIO', id: 'ref-1' },
            { type: 'email', title: 'Email: Negotiation Thread', keyPoint: 'Client requested 15% discount on annual commit', id: 'ref-2' },
            { type: 'file', title: 'Pricing Guide Q3', keyPoint: 'Standard rate for Enterprise is $10k/mo', id: 'ref-3' }
        ],
        payload: {
            documentContent: `> **Note:** Offline Mode - Generated Draft.\n\n# Strategic Proposal for ${context.companyName}\n\n## Executive Summary\nWe are pleased to submit this proposal to support ${context.companyName} in their upcoming initiatives. Based on our recent discussions${context.needs ? ` regarding ${context.needs.join(', ')}` : ''}, we have tailored a solution to drive operational efficiency and growth.\n\n## Understanding Your Needs\n${context.industry ? `As a leader in the ${context.industry} sector, ` : ''}we understand the unique challenges you face, particularly around scalability and security.\n\n## Proposed Solution\n### 1. Cloud Infrastructure\n- Scalable architecture\n- 99.99% Uptime SLA\n\n### 2. Security & Compliance\n- Enterprise-grade encryption\n- Compliance with industry standards\n\n## Investment\n\n| Item | Description | Annual Cost |\n| :--- | :--- | :--- |\n| **Implementation** | One-time setup and migration fee | $25,000 |\n| **Enterprise Subscription** | Core platform access (Unlimited Users) | $120,000 |\n| **Premium Support** | 24/7 dedicated support SLA | $15,000 |\n| **Total Year 1** | | **$160,000** |\n\n*Payment Terms: Net 30*\n\n## Timeline\n- **Month 1**: Discovery & Planning\n- **Month 2**: Deployment\n- **Month 3**: Training & Go-Live`,
            presentationContent: `# ${context.companyName} Proposal\n\n- Strategic Partnership\n- Innovation\n- Growth\n\n---\n\n# Agenda\n\n1. Current Challenges\n2. Our Solution\n3. Investment & ROI\n4. Next Steps\n\n---\n\n# Investment Summary\n\n| Item | Cost |\n| --- | --- |\n| Implementation | $25k |\n| Subscription | $120k |\n| Support | $15k |\n\n**Total**: $160k\n\n---\n\n# Next Steps\n\n- Sign Proposal\n- Kickoff Meeting`
        }
    }),
    handoff: (context: any) => ({
        reasoning: [
            `Identifying key stakeholders for ${context.companyName}...`,
            `Mapping scope of work to implementation timeline...`,
            `Drafting internal handoff protocols for ${context.targetTeam || 'Implementation Team'}...`
        ],
        references: [
            { type: 'crm', title: `CRM: ${context.companyName}`, keyPoint: 'Deal Status: Closed Won', id: 'ref-1' },
            { type: 'file', title: 'SOW_Final_Signed.pdf', keyPoint: 'Scope includes full data migration', id: 'ref-2' }
        ],
        payload: {
            documentContent: `> **Note:** Offline Mode - Generated Draft.\n\n# Implementation Handoff: ${context.companyName}\n\n**To:** ${context.targetTeam || 'Implementation Team'}\n**Date:** ${new Date().toLocaleDateString()}\n\n## Account Overview\n${context.companyName} is a key account. We have successfully closed the deal for the Enterprise tier.\n\n## Scope of Work\n- Deploy core platform\n- Integrate with legacy CRM\n- User training for 50 seats\n\n## Key Stakeholders\n- **Sponsor**: CIO\n- **Project Lead**: IT Director\n\n## Critical Milestones\n1. Kickoff Call (Week 1)\n2. Environment Setup (Week 2)\n3. UAT (Week 4)\n4. Go-Live (Week 6)`,
            presentationContent: `# Project Kickoff: ${context.companyName}\n\n- Internal Handoff\n- Success Criteria\n\n---\n\n# Account Context\n\n- **Industry**: ${context.industry || 'Technology'}\n- **Goal**: Modernization\n\n---\n\n# Technical Scope\n\n- API Integration\n- Data Migration\n- SSO Setup`
        }
    }),
    meeting_brief: (context: any) => ({
        reasoning: [
            `Scanning recent interactions and email threads with ${context.companyName}...`,
            `Checking account health and recent support tickets...`,
            `Compiling strategic talking points for upcoming meeting...`
        ],
        references: [
            { type: 'email', title: 'Email: Meeting Request', keyPoint: 'Agenda: Q4 Roadmap', id: 'ref-1' },
            { type: 'news', title: 'TechCrunch Article', keyPoint: 'Acme Corp acquiring startup X', id: 'ref-2' }
        ],
        payload: {
            documentContent: `> **Note:** Offline Mode - Generated Draft.\n\n# Meeting Brief: ${context.companyName}\n\n## Meeting Details\n**Date:** Today\n**Context:** Strategic Review\n\n## Account Health\n- **Status**: Active\n- **Last Interaction**: Positive email exchange re: renewal.\n\n## Recent News & Signals\n- Recent press release indicates expansion in the APAC region.\n- Stock price up 5% this quarter.\n\n## Talking Points\n1. Congratulate on recent growth.\n2. Discuss roadmap for Q4.\n3. Address open support ticket #1234.`,
            presentationContent: `# Meeting Agenda: ${context.companyName}\n\n1. Executive Update\n2. Performance Review\n3. Strategic Roadmap\n\n---\n\n# Current Status\n\n- **Utilization**: 85%\n- **Health Score**: Green\n\n---\n\n# Discussion Topics\n\n- Expansion Plans\n- New Features\n- Renewal Options`
        }
    }),
    email: (context: any) => ({
        reasoning: [
            `Reviewing meeting context: ${context.meetingContext}...`,
            `Identifying agreed next steps and action items...`,
            `Drafting personalized follow-up email...`
        ],
        references: [],
        payload: {
            documentContent: `> **Note:** Offline Mode - Generated Draft.\n\n**Subject:** Follow up: Our conversation regarding ${context.meetingContext || 'our partnership'}\n\nHi [Name],\n\nThank you for the time today. It was great discussing how we can support ${context.companyName}.\n\n**Recap of Key Points:**\n- We reviewed the current challenges.\n- We demonstrated the new analytics module.\n- We agreed on a pilot timeline.\n\n**Next Steps:**\n1. I will send over the technical docs by Friday.\n2. You will review with your security team.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]`,
            presentationContent: `# Discussion Recap\n\n- Alignment on Goals\n- Path Forward\n\n---\n\n# Action Items\n\n- **Us**: Send Docs\n- **You**: Security Review`
        }
    })
};

function formatResponse(reasoning: string[], references: Reference[], payload: any): string {
    const reasoningStr = reasoning.map(r => `- ${r}`).join('\n');
    return `<reasoning>\n${reasoningStr}\n</reasoning>\n<references>\n${JSON.stringify(references)}\n</references>\n<artifact_payload>\n${JSON.stringify(payload)}\n</artifact_payload>`;
}

export async function generateArtifactWithGemini(
  type: 'proposal' | 'handoff' | 'meeting_brief' | 'email',
  context: { companyName: string, industry?: string, needs?: string[], targetTeam?: string, meetingContext?: string },
  instructions: string
): Promise<string> {
  
  console.log(`[Artifact Agent] Generating ${type} for:`, context.companyName);

  if (!process.env.API_KEY || process.env.API_KEY === 'dummy_key') {
      const templateFn = FALLBACK_TEMPLATES[type] || FALLBACK_TEMPLATES.proposal;
      const data = templateFn(context);
      return formatResponse(data.reasoning, data.references || [], data.payload);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let promptContext = "";
  let outputRequirements = "";

  switch (type) {
      case 'proposal':
          promptContext = `
            Context: Proposal for ${context.companyName} (${context.industry}).
            Needs: ${context.needs?.join(", ")}.
            REQUIREMENT: You MUST include a "Pricing" or "Investment" section with a Markdown Table detailing line items (e.g., Implementation, Subscription, Support) and costs.
          `;
          outputRequirements = `
            "documentContent": "Markdown proposal (Exec Summary, Solution, Investment Table, Timeline).",
            "presentationContent": "Markdown slides (Title, Problem, Solution, Pricing Table, Next Steps)."
          `;
          break;
      case 'handoff':
          promptContext = `
            Context: Handoff ${context.companyName} to ${context.targetTeam}.
            Include deal context, key stakeholders, technical requirements, and agreed milestones.
          `;
          outputRequirements = `
            "documentContent": "Markdown handoff document (Deal Overview, Stakeholders, Tech Specs, Risks, Timeline).",
            "presentationContent": "Markdown slides for kick-off meeting (Team Intro, Objectives, Roles, Q&A)."
          `;
          break;
      case 'meeting_brief':
          promptContext = `
            Context: Meeting Brief for ${context.companyName}.
            Include recent interactions, open issues, stakeholder changes, and talking points.
          `;
          outputRequirements = `
            "documentContent": "Markdown briefing doc (Attendee Bios, Account Status, Recent News, Strategy, Talking Points).",
            "presentationContent": "Markdown slides (Agenda, Current Status, Discussion Topics)."
          `;
          break;
      case 'email':
          promptContext = `
            Context: Follow-up email for ${context.companyName} regarding ${context.meetingContext}.
            Include action items and next steps.
          `;
          outputRequirements = `
            "documentContent": "Markdown email draft (Subject Line, Body, Next Steps).",
            "presentationContent": "Markdown slides (Recap of discussion visually)."
          `;
          break;
  }

  const prompt = `
    You are Velocity, the Contoso Sales Copilot Agent.
    
    TASK: Generate assets for a ${type}.
    ${promptContext}
    User Instructions: ${instructions}
    
    CRITICAL OUTPUT INSTRUCTIONS:
    1. First, output your reasoning process inside <reasoning> tags.
    2. Second, output a JSON array of references/citations inside <references> tags. 
       Format: [{"type": "crm"|"email"|"file", "title": "Source Title", "keyPoint": "Extracted Insight"}]
       Fake these references based on the context to simulate a RAG process (e.g. cite a "CRM Deal Record" or "Email from CIO").
    3. Third, output the JSON artifact inside <artifact_payload> tags.
    
    Structure:
    <reasoning>
    - Step 1...
    </reasoning>
    <references>
    [{"type": "crm", "title": "...", "keyPoint": "..."}]
    </references>
    <artifact_payload>
    {
        ${outputRequirements}
    }
    </artifact_payload>
    
    Tone: Professional, persuasive, and efficient.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
             thinkingConfig: { thinkingBudget: 1024 } 
        }
    });

    return response.text || formatResponse(FALLBACK_TEMPLATES[type](context).reasoning, FALLBACK_TEMPLATES[type](context).references || [], FALLBACK_TEMPLATES[type](context).payload);

  } catch (error) {
    console.error("Artifact Generation Failed (API Error). Using Fallback Template.", error);
    const data = FALLBACK_TEMPLATES[type] || FALLBACK_TEMPLATES.proposal;
    return formatResponse(data(context).reasoning, data(context).references || [], data(context).payload);
  }
}