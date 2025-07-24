import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';

export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;
    const transaction = await paymentService.approveTransaction(id, userId);
    res.status(200).json(transaction);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};

export const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await paymentService.rejectTransaction(id);
    res.status(200).json(transaction);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};

export const approveVendorPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;
    const vendorPayment = await paymentService.approveVendorPayment(id, userId);
    res.status(200).json(vendorPayment);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};

export const rejectVendorPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendorPayment = await paymentService.rejectVendorPayment(id);
    res.status(200).json(vendorPayment);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};
