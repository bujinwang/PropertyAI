import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/dbManager';
import { AppError } from '../middleware/errorMiddleware';
import * as aiService from '../services/aiService';

export const generateDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;
    const { photos, details } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: propertyId },
    });

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    const description = await aiService.generatePropertyDescription(photos, details);
    
    await prisma.listing.update({
        where: { id: propertyId },
        data: { description },
    });

    res.json({ description });
  } catch (error) {
    next(error);
  }
};

export const assessRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicantData } = req.body;
    const assessment = await aiService.assessApplicantRisk(applicantData);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

export const followUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversation } = req.body;
    const response = await aiService.generateFollowUp(conversation);
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

export const sentiment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const sentiment = await aiService.analyzeSentiment(text);
    res.json(sentiment);
  } catch (error) {
    next(error);
  }
};

export const translate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, targetLanguage } = req.body;
    const translatedText = await aiService.translateText(text, targetLanguage);
    res.json({ translatedText });
  } catch (error) {
    next(error);
  }
};

export const smartResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const response = await aiService.generateSmartResponse(message);
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

export const generatePrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { listingId } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { property: true, unit: true },
    });

    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    const price = await aiService.generatePriceRecommendation(listing);
    res.json(price);
  } catch (error) {
    next(error);
  }
};

export const analyzeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return next(new AppError('Image URL is required', 400));
    }

    const analysis = await aiService.generateImageAnalysis(imageUrl);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
};
