import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';

export const approveTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const transaction = await (paymentService as any).approveTransaction(id, userId);
    res.status(200).json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const transaction = await (paymentService as any).rejectTransaction(id, userId);
    res.status(200).json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const approveVendorPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendorPayment = await (paymentService as any).approveVendorPayment(id, userId);
    res.status(200).json(vendorPayment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectVendorPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendorPayment = await (paymentService as any).rejectVendorPayment(id, userId);
    res.status(200).json(vendorPayment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const transactions = await (paymentService as any).getPendingTransactions(userId);
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingVendorPayments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const vendorPayments = await (paymentService as any).getPendingVendorPayments(userId);
    res.status(200).json(vendorPayments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
