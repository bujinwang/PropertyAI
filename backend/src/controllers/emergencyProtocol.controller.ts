import { Request, Response } from 'express';
import * as emergencyProtocolService from '../services/emergencyProtocol.service';

export const getEmergencyProtocolsByRentalId = async (req: Request, res: Response) => { // Updated function name
  try {
    const { rentalId } = req.params; // Changed from propertyId to rentalId
    const emergencyProtocols = await emergencyProtocolService.getEmergencyProtocolsByRentalId(rentalId); // Updated service call
    res.status(200).json(emergencyProtocols);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmergencyProtocol = async (req: Request, res: Response) => {
  try {
    const emergencyProtocol = await emergencyProtocolService.createEmergencyProtocol(req.body);
    res.status(201).json(emergencyProtocol);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmergencyProtocol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const emergencyProtocol = await emergencyProtocolService.updateEmergencyProtocol(id, req.body);
    res.status(200).json(emergencyProtocol);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmergencyProtocol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await emergencyProtocolService.deleteEmergencyProtocol(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
