import { Request, Response } from 'express';
import { prisma } from '../utils/dbManager';
import { getCache, setCache, clearCache } from '../utils/cache';

class PropertyController {
  async getAllProperties(req: Request, res: Response) {
    const { skip, take } = req.query;
    const cacheKey = `properties-skip:${skip}-take:${take}`;
    const cachedProperties = getCache(cacheKey);

    if (cachedProperties) {
      return res.status(200).json(cachedProperties);
    }

    try {
      const properties = await prisma.property.findMany({
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });
      setCache(cacheKey, properties, 300000);
      res.status(200).json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProperty(req: Request, res: Response) {
    try {
      const property = await prisma.property.create({ data: req.body });
      clearCache('properties-skip:undefined-take:undefined');
      res.status(201).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    const cacheKey = `property-${req.params.id}`;
    const cachedProperty = getCache(cacheKey);

    if (cachedProperty) {
      return res.status(200).json(cachedProperty);
    }

    try {
      const property = await prisma.property.findUnique({
        where: { id: req.params.id },
      });
      if (property) {
        setCache(cacheKey, property, 300000);
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
      clearCache(`property-${req.params.id}`);
      clearCache('properties-skip:undefined-take:undefined');
      res.status(200).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      await prisma.property.delete({ where: { id: req.params.id } });
      clearCache(`property-${req.params.id}`);
      clearCache('properties-skip:undefined-take:undefined');
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PropertyController();
