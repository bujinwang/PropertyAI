import { Request, Response } from 'express';
import * as applianceService from '../services/appliance.service';

export const getAppliancesByUnitId = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const appliances = await applianceService.getAppliancesByUnitId(unitId);
    res.status(200).json(appliances);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAppliance = async (req: Request, res: Response) => {
  try {
    const appliance = await applianceService.createAppliance(req.body);
    res.status(201).json(appliance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApplianceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appliance = await applianceService.getApplianceById(id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }
    res.status(200).json(appliance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppliance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appliance = await applianceService.updateAppliance(id, req.body);
    res.status(200).json(appliance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppliance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await applianceService.deleteAppliance(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
