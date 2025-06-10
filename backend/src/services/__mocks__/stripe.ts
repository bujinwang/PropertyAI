export const customers = {
  create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
};

export const paymentIntents = {
  create: jest.fn().mockResolvedValue({ id: 'pi_123', client_secret: 'pi_123_secret' }),
};

const stripe = {
  customers,
  paymentIntents,
};

export default jest.fn().mockImplementation(() => stripe);
