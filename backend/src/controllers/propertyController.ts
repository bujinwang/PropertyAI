import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/errorMiddleware';

const prisma = new PrismaClient();

export const createProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await prisma.property.create({
      data: req.body,
    });
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
};

export const getProperties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const properties = await prisma.property.findMany();
    res.json(properties);
  } catch (error) {
    next(error);
  }
};

export const getProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return next(new AppError('Property not found', 404));
    }
    res.json(property);
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.update({
      where: { id },
      data: req.body,
    });
    res.json(property);
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.property.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
