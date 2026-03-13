/**
 * Email utility for sending team invite notifications
 * Currently uses a simple approach - can be extended with Resend, SendGrid, etc.
 */

interface TeamInviteEmailParams {
  inviteEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteLink: string;
  expiresInDays: number;
}

export async function sendTeamInviteEmail(params: TeamInviteEmailParams): Promise<void> {
  const { inviteEmail, inviterName, organizationName, role, inviteLink, expiresInDays } = params;

  // In production, integrate with your email service (Resend, SendGrid, etc.)
  // For now, we'll log it and the API will return the link
  console.log("📧 Team Invite Email (would be sent):", {
    to: inviteEmail,
    subject: `You've been invited to join ${organizationName} on LeaseAI`,
    inviteLink,
  });

  // TODO: Integrate with email service
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'LeaseAI <noreply@leaseai.com>',
  //   to: inviteEmail,
  //   subject: `You've been invited to join ${organizationName} on LeaseAI`,
  //   html: generateInviteEmailHTML(params),
  // });

  // For development, we'll just log - the API returns the link which can be copied
}

function generateInviteEmailHTML(params: TeamInviteEmailParams): string {
  const { inviterName, organizationName, role, inviteLink, expiresInDays } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">You've Been Invited!</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on LeaseAI as a <strong>${role}</strong>.
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px;">
          LeaseAI helps teams analyze commercial leases in minutes instead of hours. You'll be able to collaborate on lease reviews, share insights, and make better leasing decisions.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" 
             style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This invitation will expire in ${expiresInDays} days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© ${new Date().getFullYear()} LeaseAI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export { generateInviteEmailHTML };
