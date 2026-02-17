import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '@/lib/db';

export async function GET() {
    const campaigns = getCampaigns();
    return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, templateId, contactIds, scheduledAt } = body;

        if (!name || !templateId || !contactIds?.length) {
            return NextResponse.json(
                { error: 'Name, template, and contacts are required' },
                { status: 400 }
            );
        }

        const campaign = addCampaign({
            name,
            templateId,
            contactIds,
            scheduledAt: scheduledAt || null,
        });

        return NextResponse.json(campaign, { status: 201 });
    } catch (error) {
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

        const campaign = updateCampaign(id, updates);
        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

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

        const deleted = deleteCampaign(id);
        if (!deleted) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete campaign' },
            { status: 500 }
        );
    }
}
