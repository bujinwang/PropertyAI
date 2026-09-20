import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { config } from '../config/config';

class CommunicationService {
  private twilioClient: twilio.Twilio | null = null;
  private clientsReady = false;

  /**
   * Resolve the clients lazily, on first use.
   *
   * This used to happen in the constructor, and this module instantiates the
   * service at import time (`export const communicationService = new
   * CommunicationService()`). A missing SENDGRID_API_KEY therefore made
   * *importing the module* throw — silently stopping every suite that reaches it
   * from running at all in CI, where `.env.example` carries no keys. Same
   * pattern as generativeAI.service.ts and nlp.service.ts.
   */
  private ensureClients(): void {
    if (this.clientsReady) return;
    if (!config.sendgrid.apiKey) {
      throw new Error('SendGrid API key is not defined');
    }
    this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
    sgMail.setApiKey(config.sendgrid.apiKey);
    this.clientsReady = true;
  }

  async sendSms(to: string, body: string) {
    this.ensureClients();
    return this.twilioClient!.messages.create({
      body,
      from: config.twilio.fromNumber,
      to,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    this.ensureClients();
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
