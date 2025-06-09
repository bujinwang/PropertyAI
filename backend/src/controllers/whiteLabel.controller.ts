import { Request, Response } from 'express';
import * as whiteLabelService from '../services/whiteLabel.service';

export const getWhiteLabelConfigByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const whiteLabelConfig = await whiteLabelService.getWhiteLabelConfigByPropertyId(propertyId);
    res.status(200).json(whiteLabelConfig);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const whiteLabelConfig = await whiteLabelService.createWhiteLabelConfig(req.body);
    res.status(201).json(whiteLabelConfig);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const whiteLabelConfig = await whiteLabelService.updateWhiteLabelConfig(id, req.body);
    res.status(200).json(whiteLabelConfig);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await whiteLabelService.deleteWhiteLabelConfig(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
