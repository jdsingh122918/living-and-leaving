import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { ResourceRepository } from "@/lib/db/repositories/resource.repository";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  generateFormPDF,
  generatePDFFilename,
} from "@/lib/pdf/pdf-generation.service";
import { initializeEmailService } from "@/lib/email";
import type { FormSectionData } from "@/lib/pdf/types";

const prisma = new PrismaClient();
const resourceRepository = new ResourceRepository(prisma);

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 5;

/**
 * API Route for sharing form responses via email as PDF
 * POST /api/resources/[id]/form-response/share
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: resourceId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientEmails,
      subject,
      message,
    }: {
      recipientEmails: string[];
      subject?: string;
      message?: string;
    } = body;

    // Validate recipient emails
    if (
      !recipientEmails ||
      !Array.isArray(recipientEmails) ||
      recipientEmails.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one recipient email is required" },
        { status: 400 },
      );
    }

    if (recipientEmails.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECIPIENTS} recipients allowed` },
        { status: 400 },
      );
    }

    // Validate email format
    const invalidEmails = recipientEmails.filter(
      (email) => !EMAIL_REGEX.test(email),
    );
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address(es): ${invalidEmails.join(", ")}` },
        { status: 400 },
      );
    }

    // Get user role and database ID with dual-path pattern
    const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role;

    // Get user's database record for ID and role
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User database record not found" },
        { status: 403 },
      );
    }

    const finalUserRole = userRole || (dbUser.role as UserRole);

    if (!finalUserRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 403 },
      );
    }

    // Get form response
    const formResponse = await resourceRepository.getFormResponse(
      resourceId,
      dbUser.id,
    );

    if (!formResponse) {
      return NextResponse.json(
        { error: "Form response not found" },
        { status: 404 },
      );
    }

    // Get resource details
    const resource = await resourceRepository.findById(
      resourceId,
      dbUser.id,
      finalUserRole,
    );

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 },
      );
    }

    // Generate member name
    const memberName =
      `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || "Member";

    // Generate PDF
    const pdfResult = await generateFormPDF(
      formResponse.formData as unknown as Record<string, FormSectionData>,
      resource.title,
      memberName,
      {
        resourceDescription: resource.description || undefined,
        memberEmail: dbUser.email || undefined,
        completedAt: formResponse.completedAt,
      },
    );

    if (!pdfResult.success || !pdfResult.buffer) {
      return NextResponse.json(
        { error: pdfResult.error || "Failed to generate PDF" },
        { status: 500 },
      );
    }

    if (pdfResult.buffer.length === 0) {
      return NextResponse.json(
        { error: "Generated PDF is empty. Please try again." },
        { status: 500 },
      );
    }

    // Initialize email service
    const emailService = await initializeEmailService();

    // Send emails to all recipients
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipientEmail of recipientEmails) {
      try {
        const emailResult = await emailService.sendEmail({
          to: recipientEmail,
          subject:
            subject || `${memberName} shared "${resource.title}" with you`,
          html: generateEmailHtml({
            senderName: memberName,
            senderEmail: dbUser.email || undefined,
            formTitle: resource.title,
            formDescription: resource.description || undefined,
            customMessage: message,
            shareDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          }),
          text: generateEmailText({
            senderName: memberName,
            senderEmail: dbUser.email || undefined,
            formTitle: resource.title,
            formDescription: resource.description || undefined,
            customMessage: message,
            shareDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          }),
          attachments: [
            {
              filename:
                pdfResult.filename ||
                generatePDFFilename(
                  resource.title,
                  dbUser.lastName || undefined,
                ),
              content: pdfResult.buffer,
              contentType: "application/pdf",
            },
          ],
        });

        results.push({
          email: recipientEmail,
          success: emailResult.success,
          error: emailResult.error,
        });
      } catch (error) {
        results.push({
          email: recipientEmail,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;
    const failedDetails = results
      .filter((r) => !r.success)
      .map((r) => r.error)
      .filter(Boolean);

    return NextResponse.json({
      success: successCount > 0,
      sent: successCount,
      failed: failedCount,
      results,
      message:
        failedCount === 0
          ? `Email sent successfully to ${successCount} recipient(s)`
          : `Email sent to ${successCount} recipient(s), failed for ${failedCount}`,
      ...(failedDetails.length > 0 && { errorDetails: failedDetails }),
    });
  } catch (error) {
    console.error("Error sharing form response:", error);
    return NextResponse.json(
      { error: "Failed to share form response" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/resources/[id]/form-response/share
 * Download PDF directly without sending email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: resourceId } = await params;
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role and database ID with dual-path pattern
    const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User database record not found" },
        { status: 403 },
      );
    }

    const finalUserRole = userRole || (dbUser.role as UserRole);

    if (!finalUserRole) {
      return NextResponse.json(
        { error: "User role not found" },
        { status: 403 },
      );
    }

    // Get form response
    const formResponse = await resourceRepository.getFormResponse(
      resourceId,
      dbUser.id,
    );

    if (!formResponse) {
      return NextResponse.json(
        { error: "Form response not found" },
        { status: 404 },
      );
    }

    // Get resource details
    const resource = await resourceRepository.findById(
      resourceId,
      dbUser.id,
      finalUserRole,
    );

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found or access denied" },
        { status: 404 },
      );
    }

    // Generate member name
    const memberName =
      `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || "Member";

    // Generate PDF
    const pdfResult = await generateFormPDF(
      formResponse.formData as unknown as Record<string, FormSectionData>,
      resource.title,
      memberName,
      {
        resourceDescription: resource.description || undefined,
        memberEmail: dbUser.email || undefined,
        completedAt: formResponse.completedAt,
      },
    );

    if (!pdfResult.success || !pdfResult.buffer) {
      return NextResponse.json(
        { error: pdfResult.error || "Failed to generate PDF" },
        { status: 500 },
      );
    }

    // Return PDF as download
    const filename =
      pdfResult.filename ||
      generatePDFFilename(resource.title, dbUser.lastName || undefined);

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfData = new Uint8Array(pdfResult.buffer);

    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfResult.buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}

// Helper functions to generate email content
function generateEmailHtml(data: {
  senderName: string;
  senderEmail?: string;
  formTitle: string;
  formDescription?: string;
  customMessage?: string;
  shareDate: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .email-header {
      background: linear-gradient(135deg, #5B7555 0%, #3D5A4A 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .email-body {
      padding: 30px 20px;
      background: #ffffff;
    }
    .email-footer {
      padding: 20px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
    }
    .notification-content {
      background: #f8f9fa;
      padding: 20px;
      border-left: 4px solid #5B7555;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .custom-message {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 3px solid #5B7555;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Shared Document</h1>
      <p>A document has been shared with you</p>
    </div>
    <div class="email-body">
      <h2>Hello,</h2>
      <p><strong>${data.senderName}</strong> has shared a completed form with you.</p>
      <div class="notification-content">
        <h3>${data.formTitle}</h3>
        ${data.formDescription ? `<p>${data.formDescription}</p>` : ""}
        <p><strong>Shared by:</strong> ${data.senderName}</p>
        ${data.senderEmail ? `<p><strong>Contact:</strong> ${data.senderEmail}</p>` : ""}
        <p><strong>Date:</strong> ${data.shareDate}</p>
      </div>
      ${
        data.customMessage
          ? `
      <div class="custom-message">
        <p style="margin: 0; font-style: italic;">"${data.customMessage}"</p>
      </div>
      `
          : ""
      }
      <p><strong>The completed form is attached to this email as a PDF document.</strong></p>
      <p>If you have any questions about this document, please contact ${data.senderName} directly.</p>
      <p>Best regards,<br>The Living &amp; Leaving Team</p>
    </div>
    <div class="email-footer">
      <p>This email was sent through the Living &amp; Leaving platform.</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        The attached document may contain personal health information. Please handle with care.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateEmailText(data: {
  senderName: string;
  senderEmail?: string;
  formTitle: string;
  formDescription?: string;
  customMessage?: string;
  shareDate: string;
}): string {
  return `
Shared Document - Living & Leaving

Hello,

${data.senderName} has shared a completed form with you.

Form: ${data.formTitle}
${data.formDescription ? `Description: ${data.formDescription}` : ""}

Shared by: ${data.senderName}
${data.senderEmail ? `Contact: ${data.senderEmail}` : ""}
Date: ${data.shareDate}

${data.customMessage ? `Message from ${data.senderName}:\n"${data.customMessage}"\n` : ""}

The completed form is attached to this email as a PDF document.

If you have any questions about this document, please contact ${data.senderName} directly.

Best regards,
The Living & Leaving Team

---
This email was sent through the Living & Leaving platform.
The attached document may contain personal health information. Please handle with care.
  `.trim();
}
