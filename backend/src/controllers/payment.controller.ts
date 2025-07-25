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
    // @ts-ignore
    const userId = req.user.id;
    const transaction = await paymentService.rejectTransaction(id, userId);
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
    // @ts-ignore
    const userId = req.user.id;
    const vendorPayment = await paymentService.rejectVendorPayment(id, userId);
    res.status(200).json(vendorPayment);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};

export const getPendingTransactions = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const transactions = await paymentService.getPendingTransactions(userId);
    res.status(200).json(transactions);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};

export const getPendingVendorPayments = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const vendorPayments = await paymentService.getPendingVendorPayments(userId);
    res.status(200).json(vendorPayments);
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error.message });
  }
};
