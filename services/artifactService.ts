import { Artifact, ArtifactData } from '../types';

// Mock Data
const MOCK_ARTIFACTS: Artifact[] = [
    {
        id: '101',
        title: 'Cloud Migration Proposal',
        type: 'Proposal',
        status: 'In Review',
        companyName: 'Acme Corp',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        lastModified: new Date(Date.now() - 3600000), // 1 hour ago
        content: {
            documentContent: "# Cloud Migration Proposal for Acme Corp\n\n## Executive Summary\nAcme Corp is positioned to reduce operational costs by 30% through a strategic migration to the Azure cloud environment.\n\n## Proposed Solution\n- **Phase 1**: Assessment & Planning\n- **Phase 2**: Lift & Shift of core workloads\n- **Phase 3**: Optimization\n\n## Investment\nTotal estimated cost: $150,000",
            presentationContent: "# Cloud Strategy\n\n- Secure\n- Scalable\n- Cost-effective\n\n---\n\n# Timeline\n\n- Q1: Planning\n- Q2: Execution"
        }
    },
    {
        id: '102',
        title: 'Implementation Handoff',
        type: 'Handoff',
        status: 'Finalized',
        companyName: 'Northwind Traders',
        createdAt: new Date(Date.now() - 432000000), // 5 days ago
        lastModified: new Date(Date.now() - 400000000),
        content: {
            documentContent: "# Implementation Handoff\n\n**Client**: Northwind Traders\n**Key Contact**: Maria Anders\n\n## Scope\nDeploy IoT tracking across 3 distribution centers.",
            presentationContent: "# Kickoff\n\nTeam introductions..."
        }
    },
    {
        id: '103',
        title: 'Executive Meeting Brief',
        type: 'Meeting Brief',
        status: 'Draft',
        companyName: 'TechStart Inc',
        createdAt: new Date(Date.now() - 1800000), // 30 mins ago
        lastModified: new Date(Date.now() - 900000), // 15 mins ago
        content: {
            documentContent: "# Meeting Brief: TechStart Inc\n\n**Goal**: Secure POC commitment.\n**Attendees**: Charlie Day (CTO)\n\n## Recent News\nClosed Series B funding ($50M).",
            presentationContent: "# Agenda\n\n1. Review Requirements\n2. Demo\n3. Next Steps"
        }
    }
];

// In-memory store (could be localStorage)
let store: Artifact[] = [...MOCK_ARTIFACTS];

export const getArtifacts = (): Artifact[] => {
    return [...store].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
};

export const getArtifactById = (id: string): Artifact | undefined => {
    return store.find(a => a.id === id);
};

export const saveArtifact = (artifact: Artifact): void => {
    const index = store.findIndex(a => a.id === artifact.id);
    if (index >= 0) {
        store[index] = artifact;
    } else {
        store.unshift(artifact);
    }
};

export const createArtifact = (
    data: ArtifactData, 
    context: { type?: string, companyName?: string }
): Artifact => {
    const typeMap: Record<string, any> = {
        'proposal': 'Proposal',
        'handoff': 'Handoff',
        'meeting_brief': 'Meeting Brief',
        'email': 'Email'
    };

    // Infer type from content if generic
    let inferredType = context.type || 'Generic';
    if (inferredType.toLowerCase() in typeMap) {
        inferredType = typeMap[inferredType.toLowerCase()];
    }

    const newArtifact: Artifact = {
        id: Date.now().toString(),
        title: `${inferredType} for ${context.companyName || 'Client'}`,
        type: inferredType as any,
        status: 'Draft',
        companyName: context.companyName || 'Unknown',
        createdAt: new Date(),
        lastModified: new Date(),
        content: data
    };

    saveArtifact(newArtifact);
    return newArtifact;
};