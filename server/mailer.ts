import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendResetEmail(to: string, token: string) {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

  await mailer.sendMail({
    from: `"Reel Manager" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Reset your Reel Manager password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below (valid for 15 minutes):</p>
      <a href="${resetLink}">${resetLink}</a>
      <br/><br/>
      <p>If you didn’t request this, ignore this email.</p>
    `,
  });
}
