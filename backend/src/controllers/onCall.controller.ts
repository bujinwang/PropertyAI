import { Request, Response } from 'express';
import * as onCallService from '../services/onCall.service';

export const getOnCallSchedulesByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const onCallSchedules = await onCallService.getOnCallSchedulesByPropertyId(propertyId);
    res.status(200).json(onCallSchedules);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const onCallSchedule = await onCallService.createOnCallSchedule(req.body);
    res.status(201).json(onCallSchedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const onCallSchedule = await onCallService.updateOnCallSchedule(id, req.body);
    res.status(200).json(onCallSchedule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await onCallService.deleteOnCallSchedule(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createOnCallRotation = async (req: Request, res: Response) => {
  try {
    const onCallRotation = await onCallService.createOnCallRotation(req.body);
    res.status(201).json(onCallRotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOnCallRotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const onCallRotation = await onCallService.updateOnCallRotation(id, req.body);
    res.status(200).json(onCallRotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOnCallRotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await onCallService.deleteOnCallRotation(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
