import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.LEAD_INJECTION_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, company, country, notes, tags, campaignId } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        // Check if contact already exists
        let contact = await prisma.contact.findUnique({
            where: { email }
        });

        if (!contact) {
            contact = await prisma.contact.create({
                data: {
                    name,
                    email,
                    company: company || '',
                    country: country || null,
                    tags: Array.isArray(tags) ? tags.join(',') : tags || '',
                    source: 'ai',
                }
            });
        }

        // If campaignId is provided, link the contact to the campaign
        if (campaignId) {
            // Check if already linked to avoid duplicates
            const existingLink = await prisma.campaignContact.findUnique({
                where: {
                    campaignId_contactId: {
                        campaignId,
                        contactId: contact.id
                    }
                }
            });

            if (!existingLink) {
                await prisma.campaignContact.create({
                    data: {
                        campaignId,
                        contactId: contact.id
                    }
                });
            }
        }

        return NextResponse.json(contact, { status: 201 });

        return NextResponse.json(contact, { status: 201 });
    } catch (error) {
        console.error('Error injecting lead:', error);
        return NextResponse.json(
            { error: 'Failed to inject lead' },
            { status: 500 }
        );
    }
}
