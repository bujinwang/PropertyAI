const nodemailer = require('nodemailer');

// Mock email service - replace with real SMTP configuration
class EmailService {
  constructor() {
    // In production, configure with real SMTP settings
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'noreply@propertyai.com',
        pass: process.env.SMTP_PASS || 'demo_password'
      }
    });
  }

  // Send report via email
  async sendReportEmail(recipient, reportData) {
    try {
      const { reportId, templateName, format, attachmentPath, insights } = reportData;

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@propertyai.com',
        to: recipient,
        subject: `PropertyAI Report: ${templateName}`,
        html: this.generateReportEmailHTML(templateName, insights, reportId),
        attachments: attachmentPath ? [{
          filename: `report-${reportId}.${format}`,
          path: attachmentPath
        }] : []
      };

      // In demo mode, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', {
          to: recipient,
          subject: mailOptions.subject,
          hasAttachment: !!attachmentPath
        });
        return { success: true, messageId: 'demo-' + Date.now() };
      }

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send failed:', error);
      throw new Error('Failed to send report email');
    }
  }

  // Generate HTML email content
  generateReportEmailHTML(templateName, insights, reportId) {
    const topInsights = insights.slice(0, 3); // Show top 3 insights

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>PropertyAI Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { padding: 20px 0; }
            .insight { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; border-radius: 4px; }
            .insight.high { border-left-color: #dc3545; }
            .insight.medium { border-left-color: #ffc107; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 PropertyAI Report</h1>
              <h2>${templateName}</h2>
            </div>

            <div class="content">
              <p>Your scheduled report has been generated and is attached to this email.</p>

              <h3>Key Insights:</h3>
              ${topInsights.map(insight => `
                <div class="insight ${insight.priority}">
                  <strong>${insight.type.toUpperCase()}</strong>
                  <p>${insight.text}</p>
                  ${insight.suggestedActions ? `
                    <small><strong>Suggested Actions:</strong> ${insight.suggestedActions.join(', ')}</small>
                  ` : ''}
                </div>
              `).join('')}

              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${reportId}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  View Full Report Online
                </a>
              </p>
            </div>

            <div class="footer">
              <p>This report was generated automatically by PropertyAI on ${new Date().toLocaleDateString()}.</p>
              <p>Report ID: ${reportId}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Send bulk emails for scheduled reports
  async sendBulkReportEmails(recipients, reportData) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendReportEmail(recipient, reportData);
        results.push({ recipient, success: true, messageId: result.messageId });
      } catch (error) {
        console.error(`Failed to send email to ${recipient}:`, error);
        results.push({ recipient, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new EmailService();