import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@/lib/auth/server-auth';
import { UserRepository } from '@/lib/db/repositories/user.repository';
import { GuidePDFDocument } from '@/lib/pdf/guide-pdf-document';
import {
  ADMIN_GUIDE_TITLE,
  ADMIN_GUIDE_SUBTITLE,
  ADMIN_GUIDE_SECTIONS,
} from '@/lib/guides/admin-guide-content';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await new UserRepository().getUserByClerkId(userId);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const element = React.createElement(GuidePDFDocument, {
    title: ADMIN_GUIDE_TITLE,
    subtitle: ADMIN_GUIDE_SUBTITLE,
    sections: ADMIN_GUIDE_SECTIONS,
    generatedAt: new Date(),
  });

  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Living_and_Leaving_Administrator_Guide.pdf"',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
