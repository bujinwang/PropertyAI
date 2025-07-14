import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { config } from '../config/config';

class CommunicationService {
  private twilioClient: twilio.Twilio;

  constructor() {
    this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    sgMail.setApiKey(config.sendgrid.apiKey);
  }

  async sendSms(to: string, body: string) {
    return this.twilioClient.messages.create({
      body,
      from: config.twilio.fromNumber,
      to,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
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
