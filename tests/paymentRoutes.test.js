const request = require('supertest');
const express = require('express');
const nock = require('nock');
const { Payment, Invoice } = require('../src/models');
const paymentRoutes = require('../src/routes/payment');
const NotificationService = require('../src/services/notificationService');

const app = express();
app.use(express.json());
app.use('/api/payment', paymentRoutes);

// Mock models for test DB
jest.mock('../src/models', () => ({
  Payment: {
    findByPk: jest.fn(),
    save: jest.fn(() => Promise.resolve())
  },
  Invoice: {
    findByPk: jest.fn(),
    save: jest.fn(() => Promise.resolve())
  }
}));

// Mock notification
jest.mock('../src/services/notificationService', () => ({
  notifyPaymentSuccess: jest.fn(() => Promise.resolve()),
  notifyPaymentFailed: jest.fn(() => Promise.resolve())
}));

describe('Payment Webhook Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  it('handles payment_intent.succeeded event', async () => {
    const mockPayment = { id: 1, status: 'pending', save: jest.fn(() => Promise.resolve()) };
    const mockInvoice = { id: 1, status: 'pending', save: jest.fn(() => Promise.resolve()) };

    Payment.findByPk.mockResolvedValue(mockPayment);
    Invoice.findByPk.mockResolvedValue(mockInvoice);

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: { paymentId: '1' }
        }
      }
    };

    // Mock constructEvent to return event (bypass sig verify for test)
    nock('https://api.stripe.com')
      .post('/v1/webhook_events/construct')
      .reply(200, event);

    const response = await request(app)
      .post('/api/payment/webhook')
      .send(JSON.stringify(event.data.object)) // Raw body
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'mock_sig'); // Mock sig

    expect(response.status).toBe(200);
    expect(mockPayment.status).toBe('paid');
    expect(mockInvoice.status).toBe('paid');
    expect(NotificationService.notifyPaymentSuccess).toHaveBeenCalledWith(mockPayment);
    expect(mockPayment.save).toHaveBeenCalled();
    expect(mockInvoice.save).toHaveBeenCalled();
  });

  it('handles payment_intent.payment_failed event', async () => {
    const mockPayment = { id: 1, status: 'pending', save: jest.fn(() => Promise.resolve()) };

    Payment.findByPk.mockResolvedValue(mockPayment);

    const event = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          metadata: { paymentId: '1' }
        }
      }
    };

    const response = await request(app)
      .post('/api/payment/webhook')
      .send(JSON.stringify(event.data.object))
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'mock_sig');

    expect(response.status).toBe(200);
    expect(mockPayment.status).toBe('failed');
    expect(NotificationService.notifyPaymentFailed).toHaveBeenCalledWith(mockPayment);
  });

  it('returns 400 on signature verification failure', async () => {
    nock('https://api.stripe.com')
      .post('/v1/webhook_events/construct')
      .reply(400, { error: 'Invalid signature' });

    const response = await request(app)
      .post('/api/payment/webhook')
      .send('{}')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid_sig');

    expect(response.status).toBe(400);
    expect(response.text).toContain('Webhook Error');
  });

  it('handles unhandled event type', async () => {
    const event = { type: 'unknown.event', data: { object: {} } };

    const response = await request(app)
      .post('/api/payment/webhook')
      .send(JSON.stringify(event.data.object))
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'mock_sig');

    expect(response.status).toBe(200);
  });

  it('handles webhook error', async () => {
    const event = { type: 'payment_intent.succeeded', data: { object: {} } };

    // Simulate DB error
    Payment.findByPk.mockRejectedValue(new Error('DB error'));

    const response = await request(app)
      .post('/api/payment/webhook')
      .send(JSON.stringify(event.data.object))
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'mock_sig');

    expect(response.status).toBe(400);
  });
});