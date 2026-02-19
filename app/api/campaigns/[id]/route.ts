import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                stats: true,
                template: true,
                recipients: {
                    include: {
                        contact: true
                    }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Transform structure to match frontend expectations
        const formattedCampaign = {
            ...campaign,
            contacts: campaign.recipients.map((r: any) => ({
                ...r.contact,
                tags: r.contact.tags ? r.contact.tags.split(',') : []
            }))
        };

        return NextResponse.json(formattedCampaign);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaign' },
            { status: 500 }
        );
    }
}
