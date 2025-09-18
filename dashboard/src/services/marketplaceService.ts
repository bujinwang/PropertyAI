import { Tensor, tensor, tidy } from '@tensorflow/tfjs-node';
import tenantService from './tenantService';
import propertyService from './propertyService';
import { MarketplaceMatch } from '../models/MarketplaceMatch';
import logger from '../utils/logger';

// Tenant scoring function
export const scoreTenant = async (tenantId: string) => {
  const tenant = await tenantService.getTenant(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  // Mock scoring logic (financial, preference, history)
  const financialScore = tenant.income ? Math.min(tenant.income / 1000, 1) : 0.5; // Normalize income
  const historyScore = tenant.leaseHistory ? tenant.leaseHistory.length * 0.1 : 0.5; // Based on leases
  const preferenceScore = 0.7; // Placeholder for preference matching

  const overallScore = (financialScore * 0.4 + historyScore * 0.3 + preferenceScore * 0.3).toFixed(2);

  // Update tenant model with score
  await tenantService.updateTenant(tenantId, { matchingProfile: { overallScore: parseFloat(overallScore), financialScore, historyScore, preferenceScore } });

  return { overallScore: parseFloat(overallScore), financialScore, historyScore, preferenceScore };
};

// Property suitability function
export const scoreProperty = async (propertyId: string, criteria: { locationPref?: string, priceRange?: [number, number], amenities?: string[] }) => {
  const property = await propertyService.getProperty(propertyId);
  if (!property) throw new Error('Property not found');

  // Mock suitability
  let locationScore = criteria.locationPref === property.city ? 1 : 0.6;
  let priceScore = criteria.priceRange ? (property.rent >= criteria.priceRange[0] && property.rent <= criteria.priceRange[1] ? 1 : 0.5) : 0.8;
  let amenityScore = criteria.amenities ? criteria.amenities.filter(a => property.amenities?.includes(a)).length / (criteria.amenities.length || 1) : 0.7;

  const overallScore = (locationScore * 0.3 + priceScore * 0.4 + amenityScore * 0.3).toFixed(2);

  // Update property model
  await propertyService.updateProperty(propertyId, { matchingCriteria: { overallScore: parseFloat(overallScore), locationScore, priceScore, amenityScore } });

  return { overallScore: parseFloat(overallScore), locationScore, priceScore, amenityScore };
};

// Core matching algorithm (basic TF-IDF for now)
export const generateMatches = async (tenantId: string, propertyIds?: string[]) => {
  const tenant = await tenantService.getTenant(tenantId);
  const screeningStatus = tenant.screeningStatus || { status: 'pending' };
  if (screeningStatus.status === 'pending') {
    throw new Error('Tenant screening pending - cannot generate matches');
  }

  const tenantScore = await scoreTenant(tenantId);
  const properties = propertyIds ? await Promise.all(propertyIds.map(id => propertyService.getProperty(id))) : await propertyService.getProperties(1, 10);

  const matches = await Promise.all(properties.map(async (property) => {
    const propertyScore = await scoreProperty(property.id, tenant.preferences || {});
    // Simple cosine similarity for preferences (mock vectors)
    const preferenceVector = tenant.preferences ? tensor([tenant.preferences.location, tenant.preferences.price, tenant.preferences.amenities?.length || 0]) : tensor([0, 0, 0]);
    const propertyVector = tensor([property.matchingCriteria.locationScore, property.rent / 1000, property.amenities?.length || 0]);
    const similarity = tidy(() => preferenceVector.dot(propertyVector).div(preferenceVector.square().sum().sqrt().mul(propertyVector.square().sum().sqrt()))).dataSync()[0];

    const matchScore = (tenantScore.overallScore * 0.5 + propertyScore.overallScore * 0.3 + similarity * 0.2).toFixed(2);
    const confidence = Math.min(tenantScore.confidence * 0.8 + propertyScore.overallScore * 0.9, 1) * 100; // Mock

    // Create match record
    const match = await MarketplaceMatch.create({
      tenantId,
      propertyId: property.id,
      matchScore: parseFloat(matchScore),
      confidence,
      recommendationReason: `High fit based on financial (${tenantScore.financialScore.toFixed(2)}), location (${propertyScore.locationScore.toFixed(2)}), and similarity (${similarity.toFixed(2)}). Screening status: ${screeningStatus.status}.`,
      status: 'generated'
    });

    // Audit log
    logger.info('Match generated', {
      tenantId,
      propertyId: property.id,
      matchScore: parseFloat(matchScore),
      confidence,
      reason: match.recommendationReason
    });

    return match;
  }));

  // Sort by score
  return matches.sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore));
};

// A/B testing hook
export const runABTest = async (tenantId: string, variant: 'v1' | 'v2', propertyIds?: string[]) => {
  const tenant = await tenantService.getTenant(tenantId);
  const screeningStatus = tenant.screeningStatus || { status: 'pending' };
  if (screeningStatus.status === 'pending') {
    logger.warn('A/B test for tenant with pending screening', { tenantId, risk: screeningStatus.riskLevel });
  }

  const matchesV1 = await generateMatches(tenantId, propertyIds);
  const matchesV2 = await generateMatches(tenantId, propertyIds); // Mock variant difference
  // Log for comparison
  logger.info('A/B Test executed', {
    tenantId,
    variant,
    v1TopScore: matchesV1[0]?.matchScore,
    v2TopScore: matchesV2[0]?.matchScore,
    screeningStatus: screeningStatus.status
  });
  return { v1: matchesV1, v2: matchesV2 };
};