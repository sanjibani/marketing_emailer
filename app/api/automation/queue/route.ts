import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');

        const where = campaignId ? { campaignId } : {};

        const scheduled = await prisma.scheduledEmail.findMany({
            where,
            include: {
                contact: { select: { name: true, email: true, company: true } },
                campaign: { select: { name: true, status: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        // Group counts
        const counts = {
            pending: scheduled.filter(e => e.status === 'pending').length,
            sent: scheduled.filter(e => e.status === 'sent').length,
            failed: scheduled.filter(e => e.status === 'failed').length,
            cancelled: scheduled.filter(e => e.status === 'cancelled').length,
        };

        return NextResponse.json({ queue: scheduled, counts });
    } catch (error) {
        console.error('Queue fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
        }

        await prisma.scheduledEmail.updateMany({
            where: { campaignId, status: 'pending' },
            data: { status: 'cancelled' },
        });

        // Also revert campaign status
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'draft', scheduledAt: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel error:', error);
        return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 });
    }
}
