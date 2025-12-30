
import { Lead, CalendarEvent } from '../types';

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
    suggestedAction: "Review sales proposal"
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
    suggestedAction: "Send pricing deck"
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

// ---------------------------------------------------------------------------
// 3. CALENDAR EVENTS GENERATOR
// ---------------------------------------------------------------------------

const EVENT_TEMPLATES = [
    { title: "Quarterly Business Review", type: 'meeting', desc: "Review Q3 performance and Q4 roadmap." },
    { title: "Introductory Call", type: 'meeting', desc: "Initial discovery and needs assessment." },
    { title: "Solution Demo", type: 'meeting', desc: "Deep dive into product capabilities." },
    { title: "Contract Renewal Deadline", type: 'deadline', desc: "Current MSA expires. Need renewal signed." },
    { title: "Technical Integration Sync", type: 'meeting', desc: "Align on API requirements and security." },
    { title: "Follow-up: Compliance", type: 'reminder', desc: "Send updated SOC2 Type II reports." },
    { title: "Pricing Negotiation", type: 'meeting', desc: "Finalize discount structure and payment terms." },
    { title: "Implementation Kickoff", type: 'meeting', desc: "Handover to customer success team." },
    { title: "Stakeholder Lunch", type: 'meeting', desc: "Casual sync with key decision makers." },
    { title: "RFP Submission Due", type: 'deadline', desc: "Submit final response packet." },
    { title: "Internal Pipeline Review", type: 'meeting', desc: "Weekly team sync on active deals." },
    { title: "Sign-off Meeting", type: 'meeting', desc: "Get final signatures on the contract." }
];

export const getCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const today = new Date();
    
    // Function to generate random events for a specific month
    const generateForMonth = (year: number, month: number, count: number) => {
        for (let i = 0; i < count; i++) {
            // Pick a random day in the month
            const day = Math.floor(Math.random() * 28) + 1; // 1-28 to be safe
            // Pick a random hour (9am - 5pm)
            const hour = Math.floor(Math.random() * 9) + 9; 
            
            const date = new Date(year, month, day, hour, 0, 0);
            
            // Pick a random lead to associate
            const lead = CRM_CSV_DATA[Math.floor(Math.random() * CRM_CSV_DATA.length)];
            // Pick a random template
            const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

            events.push({
                id: `evt-${year}-${month}-${i}`,
                title: `${template.title}: ${lead.companyName}`,
                date: date,
                type: template.type as any,
                leadId: lead.id,
                companyName: lead.companyName,
                description: template.desc
            });
        }
    };

    // 1. Current Month (High Density - 15 events)
    generateForMonth(today.getFullYear(), today.getMonth(), 15);

    // 2. Next Month (Medium Density - 10 events)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    generateForMonth(nextMonth.getFullYear(), nextMonth.getMonth(), 12);

    // 3. Month After Next (Low Density - 5 events)
    const futureMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    generateForMonth(futureMonth.getFullYear(), futureMonth.getMonth(), 8);

    // 4. Ensure some events are on specific "today" and "tomorrow" for demo purposes
    events.push({
        id: 'evt-today-1',
        title: 'QBR with Acme Corp',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), // Today 2pm
        type: 'meeting',
        companyName: 'Acme Corp',
        leadId: '1',
        description: 'Quarterly Business Review with executive team.'
    });
    
    events.push({
        id: 'evt-tomorrow-1',
        title: 'Intro Call: TechStart',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0), // Tomorrow 11am
        type: 'meeting',
        companyName: 'TechStart Inc',
        leadId: '3',
        description: 'Initial discovery call.'
    });

    // Sort chronologically
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Accessors
export const getLeads = () => CRM_CSV_DATA;

export const getNewsForCompany = (companyName: string) => {
    // Fuzzy match company name
    const key = Object.keys(NEWS_REPOSITORY).find(k => k.toLowerCase().includes(companyName.toLowerCase()));
    return key ? NEWS_REPOSITORY[key] : ["No recent news found for this company."];
};
