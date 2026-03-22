import { NextResponse } from "next/server";

// Admin email address - only stored server-side, never exposed to frontend
const ADMIN_EMAIL = "atinjain117@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Log the contact form submission (for development/debugging)
    console.log("Contact form submission:", {
      name,
      email,
      subject,
      messageLength: message.length,
      to: ADMIN_EMAIL,
    });

    // TODO: Configure your preferred email service here
    // Options:
    // 1. Resend (recommended): https://resend.com
    // 2. SendGrid: https://sendgrid.com
    // 3. AWS SES: https://aws.amazon.com/ses/
    // 4. Nodemailer with SMTP
    //
    // Example with Resend:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'LeaseMynd AI <contact@leasemynd.com>',
    //   to: ADMIN_EMAIL,
    //   subject: `[Contact Form] ${subject}`,
    //   html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>`,
    // });

    // For now, return success. The admin email is never exposed to the client.
    return NextResponse.json(
      { message: "Message received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
