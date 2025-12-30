import { Lead } from '../types';

// ---------------------------------------------------------------------------
// 1. CRM DATA (Simulating a CSV Export)
// ---------------------------------------------------------------------------
export const CRM_CSV_DATA: Lead[] = [
  {
    id: "1",
    companyName: "Acme Corp",
    contactName: "Alice Smith",
    email: "alice@acme.com",
    industry: "Manufacturing",
    status: "Negotiation",
    needs: ["Cloud Migration", "Security Audit", "24/7 Support"],
    estimatedValue: 150000,
    lastInteraction: "Email received regarding timeline for cloud transition.",
    meetingTime: "Tomorrow, 2:00 PM",
    aiSummary: "High-momentum opportunity. Q4 earnings signals increased tech spending (+25%) and a priority on analytics.",
    signals: [
        { type: 'positive', text: "Technical requirements align with solution" },
        { type: 'info', text: "Strategic review tomorrow - brief ready" },
        { type: 'warning', text: "Need to connect with VP Engineering" }
    ],
    suggestedAction: "Review technical architecture"
  },
  {
    id: "3",
    companyName: "TechStart Inc",
    contactName: "Charlie Day",
    email: "charlie@techstart.io",
    industry: "Technology",
    status: "Proposal",
    needs: ["SaaS Platform", "API Access"],
    estimatedValue: 75000,
    lastInteraction: "3 days ago",
    meetingTime: "Thursday, 11:00 AM",
    aiSummary: "Early stage but promising. Focus on infrastructure modernization aligns with our value prop.",
    signals: [
        { type: 'info', text: "POC discussions next week" },
        { type: 'warning', text: "Meeting brief needed" }
    ],
    suggestedAction: "Prepare demo brief"
  },
  {
    id: "2",
    companyName: "Global Bank",
    contactName: "Bob Jones",
    email: "bob@globalbank.com",
    industry: "Finance",
    status: "New",
    needs: ["Compliance Reporting", "Data Encryption"],
    estimatedValue: 250000,
    lastInteraction: "Inbound inquiry via website.",
    aiSummary: "High potential value. Regulatory pressure is driving demand for compliance tools.",
    signals: [
        { type: 'positive', text: "Budget approved for Q3" },
        { type: 'info', text: "Competitor analysis available" }
    ],
    suggestedAction: "Draft outreach email"
  },
  {
    id: "5",
    companyName: "Northwind Traders",
    contactName: "Maria Anders",
    email: "maria@northwind.com",
    industry: "Retail/Logistics",
    status: "Contacted",
    needs: ["Inventory Management", "IoT Tracking"],
    estimatedValue: 120000,
    lastInteraction: "Phone call yesterday.",
    aiSummary: "Expanding logistics network. They are looking for real-time tracking solutions for their new distribution centers.",
    signals: [
        { type: 'positive', text: "New distribution center opening in Q2" },
        { type: 'warning', text: "Current provider contract expires soon" }
    ],
    suggestedAction: "Send IoT tracking case study"
  },
  {
    id: "6",
    companyName: "Litware Inc",
    contactName: "David So",
    email: "david@litware.com",
    industry: "Consumer Electronics",
    status: "Proposal",
    needs: ["Customer Support Bot", "Knowledge Base"],
    estimatedValue: 95000,
    lastInteraction: "Demo requested.",
    aiSummary: "Seeking to automate 40% of customer support queries. Strong interest in our GenAI agent capabilities.",
    signals: [
        { type: 'positive', text: "CTO is the primary sponsor" },
        { type: 'info', text: "Evaluating 2 other vendors" }
    ],
    suggestedAction: "Draft competitive analysis vs. Competitor X"
  },
  {
    id: "7",
    companyName: "Fabrikam Residences",
    contactName: "Elizabeth Brown",
    email: "liz@fabrikam.com",
    industry: "Real Estate",
    status: "New",
    needs: ["Tenant Portal", "Payment Processing"],
    estimatedValue: 180000,
    lastInteraction: "LinkedIn message.",
    aiSummary: "Large property management firm digitizing tenant experiences. High volume transaction potential.",
    signals: [
        { type: 'info', text: "Just acquired 5 new properties" },
        { type: 'warning', text: "Requires custom ERP integration" }
    ],
    suggestedAction: "Schedule discovery call"
  },
  {
    id: "4",
    companyName: "MediCare Plus",
    contactName: "Sarah Connor",
    email: "sarah@medicare.com",
    industry: "Healthcare",
    status: "Contacted",
    needs: ["HIPAA Compliance", "Patient Portal"],
    estimatedValue: 500000,
    lastInteraction: "Follow-up call scheduled.",
    aiSummary: "Complex deal. Recent data breach news suggests urgent need for our security suite.",
    signals: [
        { type: 'warning', text: "Decision timeline is tight" },
        { type: 'positive', text: "Successful pilot at sister hospital" }
    ],
    suggestedAction: "Send HIPAA compliance docs"
  }
];

// ---------------------------------------------------------------------------
// 2. NEWS REPOSITORY (Live Headlines)
// ---------------------------------------------------------------------------
export const NEWS_REPOSITORY: Record<string, string[]> = {
    "Acme Corp": [
        "Acme Corp Announces $50M Expansion of Ohio Manufacturing Plant",
        "CEO of Acme Corp Discusses Supply Chain Resilience on CNBC",
        "Acme Corp Partners with GreenEnergy for Sustainable Operations"
    ],
    "Global Bank": [
        "Global Bank to Launch AI-Driven Wealth Management Tool",
        "Regulatory Scrutiny Increases for Cross-Border Payments at Global Bank",
        "Global Bank Reports Record Q3 Profits driven by Investment Banking"
    ],
    "TechStart Inc": [
        "TechStart Inc Closes Series B Funding Round led by Sequoia",
        "TechStart Inc Released New API for Seamless ERP Integration",
        "TechCrunch: Is TechStart Inc the next Unicorn?"
    ],
    "MediCare Plus": [
        "MediCare Plus Suffers Minor Data Breach, Security Overhaul Planned",
        "MediCare Plus Acquires Small Telehealth Startup for $20M",
        "New Government Healthcare Regulations Favor MediCare Plus Business Model"
    ],
    "Northwind Traders": [
        "Northwind Traders Opens New European Distribution Hub",
        "Logistics Weekly: Northwind Traders adopts electric fleet",
        "Supply Chain shock hits Northwind Asian operations"
    ],
    "Litware Inc": [
        "Litware Inc recalls newest smart home hub due to firmware bug",
        "Litware Inc CEO to step down next year",
        "Review: Litware's new AI assistant is surprisingly good"
    ],
    "Fabrikam Residences": [
        "Fabrikam Residences acquires downtown luxury apartment complex",
        "Fabrikam faces lawsuit over tenant data privacy",
        "Real Estate Outlook: Fabrikam leads market in digital transformation"
    ]
};

// Accessors
export const getLeads = () => CRM_CSV_DATA;

export const getNewsForCompany = (companyName: string) => {
    // Fuzzy match company name
    const key = Object.keys(NEWS_REPOSITORY).find(k => k.toLowerCase().includes(companyName.toLowerCase()));
    return key ? NEWS_REPOSITORY[key] : ["No recent news found for this company."];
};