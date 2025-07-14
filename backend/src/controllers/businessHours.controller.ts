import { Request, Response } from 'express';
import * as businessHoursService from '../services/businessHours.service';

export const getBusinessHoursByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const businessHours = await businessHoursService.getBusinessHoursByPropertyId(propertyId);
    res.status(200).json(businessHours);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBusinessHours = async (req: Request, res: Response) => {
  try {
    const businessHours = await businessHoursService.createBusinessHours(req.body);
    res.status(201).json(businessHours);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBusinessHours = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessHours = await businessHoursService.updateBusinessHours(id, req.body);
    res.status(200).json(businessHours);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBusinessHours = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await businessHoursService.deleteBusinessHours(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
