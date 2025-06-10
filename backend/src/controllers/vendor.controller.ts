import { Request, Response } from 'express';
import { prisma } from '../config/database';

class VendorController {
  public async updateProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      specialty,
      serviceAreas,
      availability,
      certifications,
      hourlyRate,
    } = req.body;

    try {
      const updatedVendor = await prisma.vendor.update({
        where: { id },
        data: {
          name,
          phone,
          email,
          address,
          specialty,
          serviceAreas,
          availability,
          certifications,
          hourlyRate,
        },
      });
      res.status(200).json(updatedVendor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update vendor profile' });
    }
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id },
      });
      if (vendor) {
        res.status(200).json(vendor);
      } else {
        res.status(404).json({ error: 'Vendor not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve vendor profile' });
    }
  }
}

export const vendorController = new VendorController();
