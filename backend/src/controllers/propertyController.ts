import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PropertyController {
  async getAllProperties(req: Request, res: Response) {
    try {
      const properties = await prisma.property.findMany();
      res.status(200).json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProperty(req: Request, res: Response) {
    try {
      const property = await prisma.property.create({ data: req.body });
      res.status(201).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    try {
      const property = await prisma.property.findUnique({
        where: { id: req.params.id },
      });
      if (property) {
        res.status(200).json(property);
      } else {
        res.status(404).json({ message: 'Property not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProperty(req: Request, res: Response) {
    try {
      const property = await prisma.property.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      await prisma.property.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PropertyController();
