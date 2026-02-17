import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Types
export interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    tags: string[];
    createdAt: string;
}

export interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    createdAt: string;
}

export interface Campaign {
    id: string;
    name: string;
    templateId: string;
    contactIds: string[];
    status: 'draft' | 'scheduled' | 'sending' | 'sent';
    scheduledAt: string | null;
    sentAt: string | null;
    stats: {
        sent: number;
        opened: number;
        clicked: number;
    };
    createdAt: string;
}

// Generic read/write
function readJson<T>(filename: string): T[] {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

function writeJson<T>(filename: string, data: T[]): void {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Contacts
export function getContacts(): Contact[] {
    return readJson<Contact>('contacts.json');
}

export function getContact(id: string): Contact | undefined {
    return getContacts().find(c => c.id === id);
}

export function addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Contact {
    const contacts = getContacts();
    const newContact: Contact = {
        ...contact,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };
    contacts.push(newContact);
    writeJson('contacts.json', contacts);
    return newContact;
}

export function deleteContact(id: string): boolean {
    const contacts = getContacts();
    const filtered = contacts.filter(c => c.id !== id);
    if (filtered.length === contacts.length) return false;
    writeJson('contacts.json', filtered);
    return true;
}

// Templates
export function getTemplates(): Template[] {
    return readJson<Template>('templates.json');
}

export function getTemplate(id: string): Template | undefined {
    return getTemplates().find(t => t.id === id);
}

export function addTemplate(template: Omit<Template, 'id' | 'createdAt'>): Template {
    const templates = getTemplates();
    const newTemplate: Template = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    writeJson('templates.json', templates);
    return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const templates = getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) return null;
    templates[index] = { ...templates[index], ...updates };
    writeJson('templates.json', templates);
    return templates[index];
}

export function deleteTemplate(id: string): boolean {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    if (filtered.length === templates.length) return false;
    writeJson('templates.json', filtered);
    return true;
}

// Campaigns
export function getCampaigns(): Campaign[] {
    return readJson<Campaign>('campaigns.json');
}

export function getCampaign(id: string): Campaign | undefined {
    return getCampaigns().find(c => c.id === id);
}

export function addCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'stats' | 'status' | 'sentAt'>): Campaign {
    const campaigns = getCampaigns();
    const newCampaign: Campaign = {
        ...campaign,
        id: Date.now().toString(),
        status: 'draft',
        sentAt: null,
        stats: { sent: 0, opened: 0, clicked: 0 },
        createdAt: new Date().toISOString(),
    };
    campaigns.push(newCampaign);
    writeJson('campaigns.json', campaigns);
    return newCampaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const campaigns = getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;
    campaigns[index] = { ...campaigns[index], ...updates };
    writeJson('campaigns.json', campaigns);
    return campaigns[index];
}

export function deleteCampaign(id: string): boolean {
    const campaigns = getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    if (filtered.length === campaigns.length) return false;
    writeJson('campaigns.json', filtered);
    return true;
}
