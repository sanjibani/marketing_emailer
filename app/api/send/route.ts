import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, personalize } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { campaignId } = body;

        if (!campaignId) {
            return NextResponse.json(
                { error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                template: true,
                recipients: {
                    include: { contact: true }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        if (!campaign.template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Update campaign status
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'sending' }
        });

        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Send emails to each contact
        for (const recipient of campaign.recipients) {
            const contact = recipient.contact;

            // Personalize content
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
                // Create successful log
                await prisma.emailLog.create({
                    data: {
                        campaignId,
                        recipient: contact.email,
                        status: 'sent',
                        sentAt: new Date()
                    }
                });
            } else {
                results.failed++;
                const errorMsg = result.error ? String(result.error) : 'Unknown error';
                results.errors.push(`Failed to send to ${contact.email}: ${errorMsg}`);

                // Create failed log
                await prisma.emailLog.create({
                    data: {
                        campaignId,
                        recipient: contact.email,
                        status: 'failed',
                        error: errorMsg,
                        sentAt: new Date()
                    }
                });
            }
        }

        // Update campaign with final stats
        await prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: 'sent',
                sentAt: new Date(),
                stats: {
                    upsert: {
                        create: {
                            sent: results.sent,
                            opened: 0,
                            clicked: 0
                        },
                        update: {
                            sent: results.sent
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            sent: results.sent,
            failed: results.failed,
            errors: results.errors,
        });
    } catch (error) {
        console.error('Send campaign error:', error);
        return NextResponse.json(
            { error: 'Failed to send campaign' },
            { status: 500 }
        );
    }
}
