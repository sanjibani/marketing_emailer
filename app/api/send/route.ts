import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, getTemplate, getContact, updateCampaign } from '@/lib/db';
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

        const campaign = getCampaign(campaignId);
        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            );
        }

        const template = getTemplate(campaign.templateId);
        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Update campaign status
        updateCampaign(campaignId, { status: 'sending' });

        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Send emails to each contact
        for (const contactId of campaign.contactIds) {
            const contact = getContact(contactId);
            if (!contact) {
                results.errors.push(`Contact ${contactId} not found`);
                results.failed++;
                continue;
            }

            const personalizedSubject = personalize(template.subject, {
                name: contact.name,
                company: contact.company,
                email: contact.email,
            });

            const personalizedBody = personalize(template.body, {
                name: contact.name,
                company: contact.company,
                email: contact.email,
            });

            const result = await sendEmail({
                to: contact.email,
                subject: personalizedSubject,
                html: personalizedBody,
            });

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push(`Failed to send to ${contact.email}`);
            }
        }

        // Update campaign with final stats
        updateCampaign(campaignId, {
            status: 'sent',
            sentAt: new Date().toISOString(),
            stats: {
                sent: results.sent,
                opened: 0,
                clicked: 0,
            },
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
