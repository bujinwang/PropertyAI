import { Request, Response } from 'express';
import * as roleService from '../services/role.service';

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await roleService.getRoles();
    res.status(200).json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await roleService.updateRole(id, req.body);
    res.status(200).json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await roleService.getPermissions();
    res.status(200).json(permissions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
