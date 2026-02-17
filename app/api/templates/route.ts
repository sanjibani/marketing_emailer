import { NextRequest, NextResponse } from 'next/server';
import { getTemplates, addTemplate, updateTemplate, deleteTemplate } from '@/lib/db';

export async function GET() {
    const templates = getTemplates();
    return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, subject, body: templateBody } = body;

        if (!name || !subject || !templateBody) {
            return NextResponse.json(
                { error: 'Name, subject, and body are required' },
                { status: 400 }
            );
        }

        const template = addTemplate({
            name,
            subject,
            body: templateBody,
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create template' },
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
                { error: 'Template ID is required' },
                { status: 400 }
            );
        }

        const template = updateTemplate(id, updates);
        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update template' },
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
                { error: 'Template ID is required' },
                { status: 400 }
            );
        }

        const deleted = deleteTemplate(id);
        if (!deleted) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
