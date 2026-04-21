import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@/lib/auth/server-auth';
import { GuidePDFDocument } from '@/lib/pdf/guide-pdf-document';
import {
  MEMBER_GUIDE_TITLE,
  MEMBER_GUIDE_SUBTITLE,
  MEMBER_GUIDE_SECTIONS,
} from '@/lib/guides/member-guide-content';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const element = React.createElement(GuidePDFDocument, {
    title: MEMBER_GUIDE_TITLE,
    subtitle: MEMBER_GUIDE_SUBTITLE,
    sections: MEMBER_GUIDE_SECTIONS,
    generatedAt: new Date(),
  });

  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Living_and_Leaving_Member_User_Guide.pdf"',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
