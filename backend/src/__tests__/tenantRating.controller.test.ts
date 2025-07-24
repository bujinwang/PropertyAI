import { Request, Response } from 'express';
import { TenantRatingController } from '../controllers/tenantRating.controller';
import { TenantRatingService } from '../services/tenantRating.service';

jest.mock('../services/tenantRating.service');

describe('TenantRatingController', () => {
  let controller: TenantRatingController;
  let service: TenantRatingService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new TenantRatingService();
    controller = new TenantRatingController();
    (controller as any).tenantRatingService = service;

    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createTenantRating', () => {
    it('should create a new tenant rating', async () => {
      const ratingData = {
        leaseId: 'lease1',
        tenantId: 'tenant1',
        raterId: 'rater1',
        rating: 5,
        comment: 'Great tenant!',
      };
      req.body = ratingData;
      const newRating = { ...ratingData, id: '1' };
      (service.createTenantRating as jest.Mock).mockResolvedValue(newRating);

      await controller.createTenantRating(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newRating);
    });
  });

  describe('getTenantRatings', () => {
    it('should get all ratings for a tenant', async () => {
      const tenantId = 'tenant1';
      req.params = { tenantId };
      const ratings = [{ id: '1', tenantId, rating: 5 }];
      (service.getTenantRatings as jest.Mock).mockResolvedValue(ratings);

      await controller.getTenantRatings(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ratings);
    });
  });
});
