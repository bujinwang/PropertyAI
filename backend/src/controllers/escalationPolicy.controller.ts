import { Request, Response } from 'express';
import * as escalationPolicyService from '../services/escalationPolicy.service';

export const getEscalationPoliciesByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const escalationPolicies = await escalationPolicyService.getEscalationPoliciesByPropertyId(propertyId);
    res.status(200).json(escalationPolicies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const escalationPolicy = await escalationPolicyService.createEscalationPolicy(req.body);
    res.status(201).json(escalationPolicy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const escalationPolicy = await escalationPolicyService.updateEscalationPolicy(id, req.body);
    res.status(200).json(escalationPolicy);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await escalationPolicyService.deleteEscalationPolicy(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const escalationPolicyRule = await escalationPolicyService.createEscalationPolicyRule(req.body);
    res.status(201).json(escalationPolicyRule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const escalationPolicyRule = await escalationPolicyService.updateEscalationPolicyRule(id, req.body);
    res.status(200).json(escalationPolicyRule);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await escalationPolicyService.deleteEscalationPolicyRule(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
