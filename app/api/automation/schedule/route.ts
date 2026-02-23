import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Business hours: 13:00 - 18:00 IST (UTC+5:30 = UTC 07:30 - 12:30)
const BUSINESS_START_HOUR_IST = 13; // 1 PM IST
const BUSINESS_END_HOUR_IST = 18;   // 6 PM IST
const MIN_DELAY_MINUTES = 3;
const MAX_DELAY_MINUTES = 12;

function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_MINUTES - MIN_DELAY_MINUTES + 1)) + MIN_DELAY_MINUTES;
}

function getBusinessWindowStart(referenceDate?: Date): Date {
    // Work in IST = UTC+5:30
    const now = referenceDate ? new Date(referenceDate) : new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

    const istHour = nowIST.getUTCHours();
    const istMinute = nowIST.getUTCMinutes();

    // If current IST time is already in the afternoon window, start from now + 5 min buffer
    if (istHour >= BUSINESS_START_HOUR_IST && istHour < BUSINESS_END_HOUR_IST) {
        const start = new Date(now);
        start.setMinutes(start.getMinutes() + 5);
        return start;
    }

    // Otherwise schedule for next available 1 PM IST window
    const startIST = new Date(nowIST);
    startIST.setUTCHours(BUSINESS_START_HOUR_IST, 0, 0, 0);

    // If we're past 6 PM IST today, schedule for tomorrow
    if (istHour >= BUSINESS_END_HOUR_IST || (istHour === BUSINESS_END_HOUR_IST && istMinute > 0)) {
        startIST.setUTCDate(startIST.getUTCDate() + 1);
    }

    // Convert back to UTC
    return new Date(startIST.getTime() - IST_OFFSET_MS);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { campaignId } = body;

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
        }

        // Load campaign with recipients
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                recipients: { include: { contact: true } },
                template: true,
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (!campaign.template) {
            return NextResponse.json({ error: 'Campaign has no template' }, { status: 400 });
        }
        if (campaign.recipients.length === 0) {
            return NextResponse.json({ error: 'Campaign has no recipients' }, { status: 400 });
        }

        // Cancel any existing pending scheduled emails for this campaign
        await prisma.scheduledEmail.updateMany({
            where: { campaignId, status: 'pending' },
            data: { status: 'cancelled' },
        });

        // Build schedule: each email gets its own staggered slot
        const windowStart = getBusinessWindowStart();
        let currentTime = new Date(windowStart);

        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const businessEndUTC = new Date(windowStart.getTime());
        // Set to 18:00 IST = 12:30 UTC same day
        const startIST = new Date(windowStart.getTime() + IST_OFFSET_MS);
        startIST.setUTCHours(BUSINESS_END_HOUR_IST, 0, 0, 0);
        const windowEnd = new Date(startIST.getTime() - IST_OFFSET_MS);

        const schedules: { campaignId: string; contactId: string; scheduledAt: Date }[] = [];

        for (const recipient of campaign.recipients) {
            // If we've spilled past 6 PM IST, roll over to next day at 1 PM IST
            if (currentTime >= windowEnd) {
                const nextDayIST = new Date(currentTime.getTime() + IST_OFFSET_MS);
                nextDayIST.setUTCDate(nextDayIST.getUTCDate() + 1);
                nextDayIST.setUTCHours(BUSINESS_START_HOUR_IST, 0, 0, 0);
                currentTime = new Date(nextDayIST.getTime() - IST_OFFSET_MS);
                // Recalculate window end for the new day
                const newEndIST = new Date(currentTime.getTime() + IST_OFFSET_MS);
                newEndIST.setUTCHours(BUSINESS_END_HOUR_IST, 0, 0, 0);
                businessEndUTC.setTime(newEndIST.getTime() - IST_OFFSET_MS);
            }

            schedules.push({
                campaignId,
                contactId: recipient.contactId,
                scheduledAt: new Date(currentTime),
            });

            // Advance by random delay
            const delay = getRandomDelay();
            currentTime = new Date(currentTime.getTime() + delay * 60 * 1000);
        }

        // Bulk create scheduled emails
        // Prisma SQLite doesn't support createMany, so we use a transaction
        await prisma.$transaction(
            schedules.map(schedule => prisma.scheduledEmail.create({ data: schedule }))
        );

        // Update campaign to 'scheduled'
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'scheduled',
                scheduledAt: schedules[0]?.scheduledAt,
            },
        });

        const lastScheduled = schedules[schedules.length - 1]?.scheduledAt;

        return NextResponse.json({
            success: true,
            scheduled: schedules.length,
            startTime: schedules[0]?.scheduledAt,
            estimatedFinish: lastScheduled,
        });
    } catch (error) {
        console.error('Schedule error:', error);
        return NextResponse.json({ error: 'Failed to schedule campaign' }, { status: 500 });
    }
}
