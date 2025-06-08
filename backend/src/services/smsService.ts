import twilio from 'twilio';

class SmsService {
  private client;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSms(to: string, body: string) {
    try {
      await this.client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }

  async sendVendorNotification(vendorPhone: string, message: string) {
    await this.sendSms(vendorPhone, message);
  }
}

export default new SmsService();
