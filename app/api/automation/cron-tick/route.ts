import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, personalize } from '@/lib/email';

// This endpoint is triggered by:
// 1. The Automation UI polling every 30 seconds
// 2. An external cron service (e.g., cron-job.org pointing at /api/automation/cron-tick)
// 3. Vercel Cron (vercel.json config)

export async function GET(request: NextRequest) {
    try {
        const now = new Date();

        // Find all pending emails that are due now or overdue
        const dueEmails = await prisma.scheduledEmail.findMany({
            where: {
                status: 'pending',
                scheduledAt: { lte: now },
            },
            include: {
                contact: true,
                campaign: {
                    include: { template: true },
                },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 10, // Process max 10 per tick to avoid timeouts
        });

        if (dueEmails.length === 0) {
            return NextResponse.json({ processed: 0, message: 'No emails due' });
        }

        const results = { sent: 0, failed: 0, errors: [] as string[] };

        for (const scheduledEmail of dueEmails) {
            const { contact, campaign } = scheduledEmail;
            if (!campaign.template) {
                await prisma.scheduledEmail.update({
                    where: { id: scheduledEmail.id },
                    data: { status: 'failed', error: 'Template missing', sentAt: new Date() },
                });
                results.failed++;
                continue;
            }

            const personalizedSubject = personalize(campaign.template.subject, {
                name: contact.name,
                company: contact.company || '',
                email: contact.email,
            });

            const personalizedBody = personalize(campaign.template.body, {
                name: contact.name,
                company: contact.company || '',
                email: contact.email,
            });

            const result = await sendEmail({
                to: contact.email,
                subject: personalizedSubject,
                html: personalizedBody,
            });

            if (result.success) {
                results.sent++;

                // Update scheduled email
                await prisma.scheduledEmail.update({
                    where: { id: scheduledEmail.id },
                    data: { status: 'sent', sentAt: new Date() },
                });

                // Create EmailLog entry
                await prisma.emailLog.create({
                    data: {
                        campaignId: scheduledEmail.campaignId,
                        recipient: contact.email,
                        status: 'sent',
                        sentAt: new Date(),
                    },
                });
            } else {
                results.failed++;
                const errorMsg = result.error ? String(result.error) : 'Unknown error';
                results.errors.push(`${contact.email}: ${errorMsg}`);

                await prisma.scheduledEmail.update({
                    where: { id: scheduledEmail.id },
                    data: { status: 'failed', error: errorMsg, sentAt: new Date() },
                });

                await prisma.emailLog.create({
                    data: {
                        campaignId: scheduledEmail.campaignId,
                        recipient: contact.email,
                        status: 'failed',
                        error: errorMsg,
                        sentAt: new Date(),
                    },
                });
            }

            // Update CampaignStats
            await prisma.campaignStats.upsert({
                where: { campaignId: scheduledEmail.campaignId },
                create: {
                    campaignId: scheduledEmail.campaignId,
                    sent: result.success ? 1 : 0,
                    opened: 0,
                    clicked: 0,
                },
                update: {
                    sent: { increment: result.success ? 1 : 0 },
                },
            });
        }

        // Check if ALL emails for each campaign are done, then mark campaign as 'sent'
        const campaignIds = [...new Set(dueEmails.map(e => e.campaignId))];
        for (const campaignId of campaignIds) {
            const remaining = await prisma.scheduledEmail.count({
                where: { campaignId, status: 'pending' },
            });
            if (remaining === 0) {
                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: 'sent', sentAt: new Date() },
                });
            }
        }

        return NextResponse.json({
            processed: dueEmails.length,
            sent: results.sent,
            failed: results.failed,
            errors: results.errors,
        });
    } catch (error) {
        console.error('Cron tick error:', error);
        return NextResponse.json({ error: 'Cron tick failed' }, { status: 500 });
    }
}
