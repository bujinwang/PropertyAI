import { Request, Response } from 'express';
import { prisma } from '../utils/dbManager';
import { getCache, setCache, clearCache } from '../utils/cache';

class PropertyController {
  async getAllProperties(req: Request, res: Response) {
    const { skip, take } = req.query;
    const cacheKey = `properties-skip:${skip}-take:${take}`;
    const cachedProperties = await getCache(cacheKey);

    if (cachedProperties) {
      return res.status(200).json(cachedProperties);
    }

    try {
      const properties = await prisma.property.findMany({
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });
      await setCache(cacheKey, properties, 300);
      res.status(200).json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProperty(req: Request, res: Response) {
    try {
      const property = await prisma.property.create({ data: req.body });
      await clearCache('properties-skip:undefined-take:undefined');
      res.status(201).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    const cacheKey = `property-${req.params.id}`;
    const cachedProperty = await getCache(cacheKey);

    if (cachedProperty) {
      return res.status(200).json(cachedProperty);
    }

    try {
      const property = await prisma.property.findUnique({
        where: { id: req.params.id },
      });
      if (property) {
        await setCache(cacheKey, property, 300);
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
      await clearCache(`property-${req.params.id}`);
      await clearCache('properties-skip:undefined-take:undefined');
      res.status(200).json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      await prisma.property.delete({ where: { id: req.params.id } });
      await clearCache(`property-${req.params.id}`);
      await clearCache('properties-skip:undefined-take:undefined');
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPublicProperties(req: Request, res: Response) {
    const { skip, take, city, state, propertyType } = req.query;
    const cacheKey = `public-properties-skip:${skip}-take:${take}-city:${city}-state:${state}-type:${propertyType}`;
    const cachedProperties = await getCache(cacheKey);

    if (cachedProperties) {
      return res.status(200).json(cachedProperties);
    }

    try {
      const where: any = {};
      
      // Add filters for public view
      if (city) where.city = city;
      if (state) where.state = state;
      if (propertyType) where.propertyType = propertyType;

      const properties = await prisma.property.findMany({
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : 20,
        where,
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          propertyType: true,
          amenities: true,
          yearBuilt: true,
          totalUnits: true,
          images: {
            select: {
              id: true,
              url: true,
              filename: true,
              mimetype: true,
            }
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      await setCache(cacheKey, properties, 300);
      res.status(200).json(properties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PropertyController();
