export const customers = {
  create: jest.fn(),
};

export const paymentIntents = {
  create: jest.fn(),
};

const stripe = {
  customers,
  paymentIntents,
};

export default jest.fn().mockImplementation(() => stripe);
