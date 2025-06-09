import { Request, Response } from 'express';
import * as apiKeyService from '../services/apiKey.service';

export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const { userId, permissions, expiresAt } = req.body;
    const apiKey = await apiKeyService.generateApiKey(userId, permissions, expiresAt);
    res.status(201).json(apiKey);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApiKeysByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const apiKeys = await apiKeyService.getApiKeysByUserId(userId);
    res.status(200).json(apiKeys);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await apiKeyService.deleteApiKey(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
