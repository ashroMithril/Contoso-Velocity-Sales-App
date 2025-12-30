import { GoogleGenAI, Type } from "@google/genai";

export interface GeneratedArtifacts {
    documentContent: string;
    presentationContent: string;
}

const FALLBACK_TEMPLATES = {
    proposal: (context: any) => ({
        documentContent: `> **Note:** AI service is currently unavailable. This is a sample draft based on your request.\n\n# Strategic Proposal for ${context.companyName}\n\n## Executive Summary\nWe are pleased to submit this proposal to support ${context.companyName} in their upcoming initiatives. Based on our recent discussions${context.needs ? ` regarding ${context.needs.join(', ')}` : ''}, we have tailored a solution to drive operational efficiency and growth.\n\n## Understanding Your Needs\n${context.industry ? `As a leader in the ${context.industry} sector, ` : ''}we understand the unique challenges you face, particularly around scalability and security.\n\n## Proposed Solution\n### 1. Cloud Infrastructure\n- Scalable architecture\n- 99.99% Uptime SLA\n\n### 2. Security & Compliance\n- Enterprise-grade encryption\n- Compliance with industry standards\n\n## Investment\n- **Implementation**: $25,000\n- **Annual Subscription**: $120,000\n\n## Timeline\n- **Month 1**: Discovery & Planning\n- **Month 2**: Deployment\n- **Month 3**: Training & Go-Live`,
        presentationContent: `# ${context.companyName} Proposal\n\n- Strategic Partnership\n- Innovation\n- Growth\n\n---\n\n# Agenda\n\n1. Current Challenges\n2. Our Solution\n3. Investment & ROI\n4. Next Steps\n\n---\n\n# Our Solution\n\n- **Scalable**: Grows with you\n- **Secure**: Bank-grade security\n- **Reliable**: 24/7 Support\n\n---\n\n# Next Steps\n\n- Sign Proposal\n- Kickoff Meeting`
    }),
    handoff: (context: any) => ({
        documentContent: `> **Note:** AI service is currently unavailable. This is a sample draft based on your request.\n\n# Implementation Handoff: ${context.companyName}\n\n**To:** ${context.targetTeam || 'Implementation Team'}\n**Date:** ${new Date().toLocaleDateString()}\n\n## Account Overview\n${context.companyName} is a key account. We have successfully closed the deal for the Enterprise tier.\n\n## Scope of Work\n- Deploy core platform\n- Integrate with legacy CRM\n- User training for 50 seats\n\n## Key Stakeholders\n- **Sponsor**: CIO\n- **Project Lead**: IT Director\n\n## Critical Milestones\n1. Kickoff Call (Week 1)\n2. Environment Setup (Week 2)\n3. UAT (Week 4)\n4. Go-Live (Week 6)`,
        presentationContent: `# Project Kickoff: ${context.companyName}\n\n- Internal Handoff\n- Success Criteria\n\n---\n\n# Account Context\n\n- **Industry**: ${context.industry || 'Technology'}\n- **Goal**: Modernization\n\n---\n\n# Technical Scope\n\n- API Integration\n- Data Migration\n- SSO Setup`
    }),
    meeting_brief: (context: any) => ({
        documentContent: `> **Note:** AI service is currently unavailable. This is a sample draft based on your request.\n\n# Meeting Brief: ${context.companyName}\n\n## Meeting Details\n**Date:** Today\n**Context:** Strategic Review\n\n## Account Health\n- **Status**: Active\n- **Last Interaction**: Positive email exchange re: renewal.\n\n## Recent News & Signals\n- Recent press release indicates expansion in the APAC region.\n- Stock price up 5% this quarter.\n\n## Talking Points\n1. Congratulate on recent growth.\n2. Discuss roadmap for Q4.\n3. Address open support ticket #1234.`,
        presentationContent: `# Meeting Agenda: ${context.companyName}\n\n1. Executive Update\n2. Performance Review\n3. Strategic Roadmap\n\n---\n\n# Current Status\n\n- **Utilization**: 85%\n- **Health Score**: Green\n\n---\n\n# Discussion Topics\n\n- Expansion Plans\n- New Features\n- Renewal Options`
    }),
    email: (context: any) => ({
        documentContent: `> **Note:** AI service is currently unavailable. This is a sample draft based on your request.\n\n**Subject:** Follow up: Our conversation regarding ${context.meetingContext || 'our partnership'}\n\nHi [Name],\n\nThank you for the time today. It was great discussing how we can support ${context.companyName}.\n\n**Recap of Key Points:**\n- We reviewed the current challenges.\n- We demonstrated the new analytics module.\n- We agreed on a pilot timeline.\n\n**Next Steps:**\n1. I will send over the technical docs by Friday.\n2. You will review with your security team.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]`,
        presentationContent: `# Discussion Recap\n\n- Alignment on Goals\n- Path Forward\n\n---\n\n# Action Items\n\n- **Us**: Send Docs\n- **You**: Security Review`
    })
};

export async function generateArtifactWithGemini(
  type: 'proposal' | 'handoff' | 'meeting_brief' | 'email',
  context: { companyName: string, industry?: string, needs?: string[], targetTeam?: string, meetingContext?: string },
  instructions: string
): Promise<string> {
  
  console.log(`[Artifact Agent] Generating ${type} for:`, context.companyName);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key' });

  let promptContext = "";
  let outputRequirements = "";

  switch (type) {
      case 'proposal':
          promptContext = `
            Context: Proposal for ${context.companyName} (${context.industry}).
            Needs: ${context.needs?.join(", ")}.
            Include pricing, timeline, and case studies.
          `;
          outputRequirements = `
            "documentContent": "Markdown proposal (Exec Summary, Solution, Investment, Timeline, Case Studies).",
            "presentationContent": "Markdown slides (Title, Problem, Solution, Pricing, Next Steps)."
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
            "presentationContent": "Markdown slides (Recap of discussion visually - optional but include 1 slide)."
          `;
          break;
  }

  const prompt = `
    You are Velocity, the Contoso Sales Copilot Agent.
    
    TASK: Generate assets for a ${type}.
    ${promptContext}
    User Instructions: ${instructions}
    
    Structure your response as a valid JSON object:
    {
        ${outputRequirements}
    }
    
    Tone: Professional, persuasive, and efficient.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    documentContent: { type: Type.STRING, description: "The markdown content for the document/email." },
                    presentationContent: { type: Type.STRING, description: "The markdown content for the presentation/slides." }
                },
                required: ["documentContent", "presentationContent"]
            }
        }
    });

    return response.text || "{}";

  } catch (error) {
    console.error("Artifact Generation Failed (API Error). Using Fallback Template.", error);
    
    // Select template
    const templateFn = FALLBACK_TEMPLATES[type] || FALLBACK_TEMPLATES.proposal;
    const fallbackData = templateFn(context);
    
    return JSON.stringify(fallbackData);
  }
}