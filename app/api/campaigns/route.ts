import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const campaigns = await prisma.campaign.findMany({
            include: {
                stats: true,
                recipients: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to match frontend expectation
        const formattedCampaigns = campaigns.map(c => ({
            ...c,
            contactIds: c.recipients.map(r => r.contactId),
            stats: c.stats || { sent: 0, opened: 0, clicked: 0 }
        }));

        return NextResponse.json(formattedCampaigns);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch campaigns' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, templateId, contactIds, scheduledAt } = body;

        if (!name || !templateId || !contactIds?.length) {
            return NextResponse.json(
                { error: 'Name, template, and contacts are required' },
                { status: 400 }
            );
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                description,
                template: { connect: { id: templateId } },
                status: 'draft',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                recipients: {
                    create: contactIds.map((id: string) => ({
                        contact: { connect: { id } }
                    }))
                },
                stats: {
                    create: { sent: 0, opened: 0, clicked: 0 }
                }
            },
            include: {
                recipients: true,
                stats: true
            }
        });

        return NextResponse.json({
            ...campaign,
            contactIds: campaign.recipients.map(r => r.contactId)
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { error: 'Failed to create campaign' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        // Handle Status Update separately if needed, or simple updates
        // For simple field updates:
        const campaign = await prisma.campaign.update({
            where: { id },
            data: {
                ...updates,
                // If scheduledAt is passed, ensure it is Date
                ...(updates.scheduledAt && { scheduledAt: new Date(updates.scheduledAt) })
            }
        });

        return NextResponse.json(campaign);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update campaign' },
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
                { error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        await prisma.campaign.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}
