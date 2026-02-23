import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const contacts = await prisma.contact.findMany({
            where: {
                deletedAt: null // Only fetch non-deleted contacts
            },
            include: {
                campaigns: {
                    include: {
                        campaign: {
                            select: { id: true, name: true, status: true }
                        }
                    }
                },
                scheduledEmails: {
                    select: { status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform tags from string to array for frontend compatibility if needed
        const formattedContacts = contacts.map(contact => ({
            ...contact,
            tags: contact.tags ? contact.tags.split(',') : [],
            campaigns: contact.campaigns.map(cc => cc.campaign),
            hasBeenEmailed: contact.scheduledEmails.some(se => se.status === 'sent')
        }));

        return NextResponse.json(formattedContacts);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch contacts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, company, country, website, niche, tags } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                company: company || '',
                country: country || null,
                website: website || null,
                niche: niche || null,
                tags: Array.isArray(tags) ? tags.join(',') : tags || '',
                source: 'manual'
            }
        });

        return NextResponse.json({
            ...contact,
            tags: contact.tags ? contact.tags.split(',') : []
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json(
            { error: 'Failed to create contact' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Contact ID is required' },
                { status: 400 }
            );
        }

        // Soft Delete: Set deletedAt to now instead of removing the row
        await prisma.contact.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete contact' },
            { status: 500 }
        );
    }
}
