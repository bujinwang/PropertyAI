import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRecoveryEmail = async (to: string, token: string) => {
  const recoveryLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Account Recovery',
    text: `Click the following link to recover your account: ${recoveryLink}`,
    html: `<p>Click the following link to recover your account: <a href="${recoveryLink}">${recoveryLink}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetConfirmationEmail = async (to: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Password Reset Confirmation',
    text: 'Your password has been successfully reset.',
    html: '<p>Your password has been successfully reset.</p>',
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};
