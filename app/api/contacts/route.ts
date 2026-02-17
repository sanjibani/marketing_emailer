import { NextRequest, NextResponse } from 'next/server';
import { getContacts, addContact, deleteContact } from '@/lib/db';

export async function GET() {
    const contacts = getContacts();
    return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, company, tags } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            );
        }

        const contact = addContact({
            name,
            email,
            company: company || '',
            tags: tags || [],
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error) {
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

        const deleted = deleteContact(id);
        if (!deleted) {
            return NextResponse.json(
                { error: 'Contact not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete contact' },
            { status: 500 }
        );
    }
}
