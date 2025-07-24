import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { config } from '../config/config';

class CommunicationService {
  private twilioClient: twilio.Twilio;

  constructor() {
    this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    if (config.sendgrid.apiKey) {
      sgMail.setApiKey(config.sendgrid.apiKey);
    } else {
      throw new Error('SendGrid API key is not defined');
    }
  }

  async sendSms(to: string, body: string) {
    return this.twilioClient.messages.create({
      body,
      from: config.twilio.fromNumber,
      to,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!config.sendgrid.fromEmail) {
      throw new Error('SendGrid from email is not defined');
    }
    const msg = {
      to,
      from: config.sendgrid.fromEmail,
      subject,
      html,
    };
    return sgMail.send(msg);
  }
}

export const communicationService = new CommunicationService();
