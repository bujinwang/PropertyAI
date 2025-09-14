/**
 * Notification Service
 * Handles email delivery, in-app notifications, and report distribution
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { Notification, User } = require('../models');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeEmailTransporter();
    this.loadEmailTemplates();
  }

  /**
   * Initialize email transporter
   */
  async initializeEmailTransporter() {
    try {
      // Configure with environment variables or default settings
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      // Continue without email functionality
      this.transporter = null;
    }
  }

  /**
   * Load email templates
   */
  async loadEmailTemplates() {
    this.templates.set('report-delivery', {
      subject: 'AI-Generated Report: {{reportName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">AI-Generated Report Ready</h2>
          <p>Dear {{recipientName}},</p>
          <p>Your scheduled report "<strong>{{reportName}}</strong>" has been generated and is ready for download.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Report Details:</h3>
            <ul>
              <li><strong>Template:</strong> {{templateName}}</li>
              <li><strong>Generated:</strong> {{generatedAt}}</li>
              <li><strong>Format:</strong> {{format}}</li>
              <li><strong>Insights:</strong> {{insightsCount}} AI-generated insights</li>
              <li><strong>Recommendations:</strong> {{recommendationsCount}} actionable recommendations</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{downloadUrl}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Download Report
            </a>
          </div>

          <p><strong>Key Highlights:</strong></p>
          <ul>
            {{#highPriorityInsights}}
            <li style="color: #d32f2f;">{{title}}</li>
            {{/highPriorityInsights}}
          </ul>

          <p>If you have any questions about this report, please contact our support team.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This report was generated automatically by our AI-powered analytics system.
            For questions about the methodology or data sources, please refer to the report documentation.
          </p>
        </div>
      `,
      text: `
        AI-Generated Report Ready

        Dear {{recipientName}},

        Your scheduled report "{{reportName}}" has been generated and is ready for download.

        Report Details:
        - Template: {{templateName}}
        - Generated: {{generatedAt}}
        - Format: {{format}}
        - Insights: {{insightsCount}} AI-generated insights
        - Recommendations: {{recommendationsCount}} actionable recommendations

        Download your report: {{downloadUrl}}

        Key Highlights:
        {{#highPriorityInsights}}
        - {{title}}
        {{/highPriorityInsights}}

        This report was generated automatically by our AI-powered analytics system.
      `
    });

    this.templates.set('alert-notification', {
      subject: 'Property Alert: {{alertTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Property Alert</h2>
          <p>Dear {{recipientName}},</p>
          <p>A property alert has been triggered that requires your attention:</p>

          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3>{{alertTitle}}</h3>
            <p>{{alertDescription}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
            <p><strong>Property:</strong> {{propertyName}}</p>
            <p><strong>Risk Level:</strong> {{riskLevel}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{actionUrl}}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Details & Take Action
            </a>
          </div>

          <p>Please review this alert promptly and take the necessary actions to address the issue.</p>
        </div>
      `,
      text: `
        Property Alert: {{alertTitle}}

        Dear {{recipientName}},

        A property alert has been triggered that requires your attention:

        {{alertTitle}}
        {{alertDescription}}

        Priority: {{priority}}
        Property: {{propertyName}}
        Risk Level: {{riskLevel}}

        View details: {{actionUrl}}

        Please review this alert promptly.
      `
    });

    this.templates.set('scheduled-report-failed', {
      subject: 'Report Generation Failed: {{reportName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Report Generation Failed</h2>
          <p>Dear {{recipientName}},</p>
          <p>We encountered an issue while generating your scheduled report "{{reportName}}".</p>

          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Error Details:</h3>
            <p><strong>Report:</strong> {{reportName}}</p>
            <p><strong>Scheduled Time:</strong> {{scheduledTime}}</p>
            <p><strong>Error:</strong> {{errorMessage}}</p>
          </div>

          <p>Our team has been notified and will investigate this issue. We'll attempt to regenerate the report shortly.</p>

          <p>If you need immediate access to this data, you can manually generate a report from the dashboard.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `,
      text: `
        Report Generation Failed: {{reportName}}

        Dear {{recipientName}},

        We encountered an issue while generating your scheduled report "{{reportName}}".

        Error Details:
        - Report: {{reportName}}
        - Scheduled Time: {{scheduledTime}}
        - Error: {{errorMessage}}

        Our team has been notified and will investigate this issue.
        You can manually generate a report from the dashboard: {{dashboardUrl}}
      `
    });
  }

  /**
   * Send report delivery email
   */
  async sendReportEmail(report, recipientEmail, options = {}) {
    try {
      if (!this.transporter) {
        console.warn('Email transporter not initialized, skipping email delivery');
        return { success: false, error: 'Email service not configured' };
      }

      const template = this.templates.get('report-delivery');
      if (!template) {
        throw new Error('Report delivery email template not found');
      }

      // Get recipient user info
      const recipient = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['firstName', 'lastName']
      });

      const recipientName = recipient ?
        `${recipient.firstName} ${recipient.lastName}` :
        recipientEmail.split('@')[0];

      // Prepare template data
      const templateData = {
        recipientName,
        reportName: report.templateName,
        templateName: report.templateName,
        generatedAt: new Date(report.generatedAt).toLocaleString(),
        format: report.format.toUpperCase(),
        insightsCount: report.insights?.length || 0,
        recommendationsCount: report.recommendations?.length || 0,
        downloadUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${report.id}/download`,
        highPriorityInsights: report.insights?.filter(i => i.priority === 'high') || []
      };

      // Render email content
      const subject = this.renderTemplate(template.subject, templateData);
      const html = this.renderTemplate(template.html, templateData);
      const text = this.renderTemplate(template.text, templateData);

      // Send email
      const mailOptions = {
        from: process.env.SMTP_FROM || 'reports@propertymgmt.com',
        to: recipientEmail,
        subject,
        html,
        text,
        attachments: options.includeAttachment ? [{
          filename: `${report.templateName}.${report.format}`,
          content: options.attachmentData,
          encoding: 'base64'
        }] : []
      };

      const result = await this.transporter.sendMail(mailOptions);

      // Log notification
      await this.logNotification({
        type: 'email',
        recipientId: recipient?.id,
        recipientEmail,
        subject,
        content: html,
        status: 'sent',
        metadata: {
          reportId: report.id,
          templateId: report.templateId,
          format: report.format
        }
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending report email:', error);

      // Log failed notification
      await this.logNotification({
        type: 'email',
        recipientEmail,
        subject: `Report: ${report.templateName}`,
        content: 'Failed to send report email',
        status: 'failed',
        error: error.message,
        metadata: { reportId: report.id }
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail(alert, recipientEmail) {
    try {
      if (!this.transporter) {
        console.warn('Email transporter not initialized, skipping alert email');
        return { success: false, error: 'Email service not configured' };
      }

      const template = this.templates.get('alert-notification');
      if (!template) {
        throw new Error('Alert notification email template not found');
      }

      const recipient = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['firstName', 'lastName']
      });

      const recipientName = recipient ?
        `${recipient.firstName} ${recipient.lastName}` :
        recipientEmail.split('@')[0];

      const templateData = {
        recipientName,
        alertTitle: alert.title,
        alertDescription: alert.description,
        priority: alert.priority,
        propertyName: alert.propertyName || 'N/A',
        riskLevel: alert.riskLevel || 'Unknown',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts/${alert.id}`
      };

      const subject = this.renderTemplate(template.subject, templateData);
      const html = this.renderTemplate(template.html, templateData);
      const text = this.renderTemplate(template.text, templateData);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'alerts@propertymgmt.com',
        to: recipientEmail,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);

      await this.logNotification({
        type: 'alert',
        recipientId: recipient?.id,
        recipientEmail,
        subject,
        content: html,
        status: 'sent',
        metadata: {
          alertId: alert.id,
          priority: alert.priority,
          riskLevel: alert.riskLevel
        }
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending alert email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk report emails
   */
  async sendBulkReportEmails(report, recipientEmails, options = {}) {
    const results = [];

    for (const email of recipientEmails) {
      try {
        const result = await this.sendReportEmail(report, email, options);
        results.push({ email, ...result });
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send failure notification
   */
  async sendFailureNotification(reportName, scheduledTime, errorMessage, recipientEmails) {
    try {
      if (!this.transporter) return;

      const template = this.templates.get('scheduled-report-failed');

      for (const email of recipientEmails) {
        const recipient = await User.findOne({
          where: { email },
          attributes: ['firstName', 'lastName']
        });

        const recipientName = recipient ?
          `${recipient.firstName} ${recipient.lastName}` :
          email.split('@')[0];

        const templateData = {
          recipientName,
          reportName,
          scheduledTime: new Date(scheduledTime).toLocaleString(),
          errorMessage,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports`
        };

        const subject = this.renderTemplate(template.subject, templateData);
        const html = this.renderTemplate(template.html, templateData);
        const text = this.renderTemplate(template.text, templateData);

        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'reports@propertymgmt.com',
          to: email,
          subject,
          html,
          text
        });
      }
    } catch (error) {
      console.error('Error sending failure notification:', error);
    }
  }

  /**
   * Create in-app notification
   */
  async createInAppNotification(userId, notification) {
    try {
      const notificationData = {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        isRead: false,
        createdAt: new Date()
      };

      // This would integrate with a real-time notification system
      // For now, we'll just log it
      console.log('In-app notification created:', notificationData);

      return { success: true, notificationId: Date.now().toString() };
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log notification for audit trail
   */
  async logNotification(notificationData) {
    try {
      await Notification.create({
        type: notificationData.type,
        recipientId: notificationData.recipientId,
        recipientEmail: notificationData.recipientEmail,
        subject: notificationData.subject,
        content: notificationData.content,
        status: notificationData.status || 'sent',
        error: notificationData.error,
        metadata: notificationData.metadata || {},
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Render template with data
   */
  renderTemplate(template, data) {
    let result = template;

    // Simple template rendering - replace {{variable}} with data.variable
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key]);
    });

    // Handle conditional blocks like {{#highPriorityInsights}}...{{/highPriorityInsights}}
    result = result.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
      const value = data[key];
      if (Array.isArray(value) && value.length > 0) {
        return value.map(item => {
          let itemContent = content;
          Object.keys(item).forEach(itemKey => {
            const itemRegex = new RegExp(`{{${itemKey}}}`, 'g');
            itemContent = itemContent.replace(itemRegex, item[itemKey]);
          });
          return itemContent;
        }).join('');
      }
      return '';
    });

    return result;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(timeRange = {}) {
    try {
      const whereClause = {};
      if (timeRange.start) {
        whereClause.sentAt = {
          [require('sequelize').Op.gte]: timeRange.start
        };
      }
      if (timeRange.end) {
        whereClause.sentAt = {
          ...whereClause.sentAt,
          [require('sequelize').Op.lte]: timeRange.end
        };
      }

      const stats = await Notification.findAll({
        where: whereClause,
        attributes: [
          'type',
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['type', 'status']
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return [];
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'test@propertymgmt.com',
        to: testEmail,
        subject: 'Email Configuration Test',
        text: 'This is a test email to verify your email configuration is working correctly.',
        html: '<p>This is a test email to verify your email configuration is working correctly.</p>'
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();