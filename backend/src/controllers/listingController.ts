import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ListingController {
  async getAllListings(req: Request, res: Response) {
    try {
      const listings = await prisma.listing.findMany();
      res.status(200).json(listings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createListing(req: Request, res: Response) {
    try {
      const listing = await prisma.listing.create({ data: req.body });
      res.status(201).json(listing);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getListingById(req: Request, res: Response) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: req.params.id },
      });
      if (listing) {
        res.status(200).json(listing);
      } else {
        res.status(404).json({ message: 'Listing not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateListing(req: Request, res: Response) {
    try {
      const listing = await prisma.listing.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json(listing);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteListing(req: Request, res: Response) {
    try {
      await prisma.listing.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ListingController();
