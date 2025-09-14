import axios from 'axios';
import tenantService from './tenantService';
import { ScreeningReport } from '../models/ScreeningReport';
import { ScreeningLog } from '../models/ScreeningLog';
import logger from '../utils/logger';
import marketplaceService from './marketplaceService';

// Mock third-party APIs for dev/testing
const mockTransUnion = async (tenantId) => {
  // Mock credit check - in prod, real API call
  return { creditScore: Math.floor(Math.random() * 551) + 300, status: 'approved' };
};

const mockCheckr = async (tenantId) => {
  // Mock background check
  return { criminal: false, eviction: false, status: 'clear' };
};

const mockReferenceVerify = async (tenantId) => {
  // Mock reference verification
  return { verified: true, comments: 'Good tenant history' };
};

export const runScreening = async (tenantId, applicationId) => {
  try {
    logger.info('Screening started', { tenantId, applicationId });

    // Parallel checks
    const [credit, background, reference] = await Promise.all([
      mockTransUnion(tenantId),
      mockCheckr(tenantId),
      mockReferenceVerify(tenantId),
    ]);

    // Log individual checks
    await ScreeningLog.create({
      reportId: null, // Will update after report creation
      checkType: 'credit',
      result: credit,
      status: 'success',
      timestamp: new Date(),
    });
    await ScreeningLog.create({
      reportId: null,
      checkType: 'background',
      result: background,
      status: 'success',
      timestamp: new Date(),
    });
    await ScreeningLog.create({
      reportId: null,
      checkType: 'reference',
      result: reference,
      status: 'success',
      timestamp: new Date(),
    });

    // Get tenant match score from 18.1
    const tenant = await tenantService.getTenant(tenantId);
    const matchScore = tenant.matchingProfile?.overallScore || 0.5;

    // AI risk assessment
    const financialRisk = credit.creditScore < 600 ? 0.3 : 0.8;
    const backgroundRisk = background.criminal || background.eviction ? 0.2 : 0.9;
    const referenceRisk = reference.verified ? 0.8 : 0.4;
    const overallRiskScore = (financialRisk * 0.4 + backgroundRisk * 0.3 + referenceRisk * 0.2 + matchScore * 0.1).toFixed(2);

    const riskLevel = overallRiskScore < 0.4 ? 'low' : overallRiskScore < 0.7 ? 'medium' : 'high';
    const aiAssessment = `Risk assessment based on credit (${financialRisk}), background (${backgroundRisk}), references (${referenceRisk}), and match fit (${matchScore}). Overall risk: ${riskLevel}.`;

    // Create report
    const report = await ScreeningReport.create({
      tenantId,
      creditScore: credit.creditScore,
      backgroundResults: background,
      referenceVerification: reference,
      riskLevel,
      aiAssessment,
      status: 'completed',
    });

    // Update logs with reportId
    await ScreeningLog.update({ reportId: report.id }, { where: { reportId: null } });

    // Update tenant screening status
    await tenantService.updateTenant(tenantId, { screeningStatus: { status: 'completed', riskLevel, reportId: report.id } });

    logger.info('Screening completed', { tenantId, reportId: report.id, riskLevel });

    return { reportId: report.id, riskLevel, overallRiskScore: parseFloat(overallRiskScore), aiAssessment };
  } catch (error) {
    logger.error('Screening failed', { tenantId, applicationId, error: error.message });
    throw new Error(`Screening failed: ${error.message}`);
  }
};

export const getScreeningReport = async (reportId) => {
  const report = await ScreeningReport.findByPk(reportId, {
    include: [ScreeningLog],
  });
  if (!report) throw new Error('Report not found');
  return report;
};

export const generateReportPDF = async (reportId) => {
  const report = await getScreeningReport(reportId);
  // Mock PDF generation - in prod, use pdfkit or similar
  const pdfContent = `Screening Report for Tenant ${report.tenantId}\nCredit Score: ${report.creditScore}\nRisk Level: ${report.riskLevel}\nAI Assessment: ${report.aiAssessment}`;
  return pdfContent; // Return buffer in prod
};