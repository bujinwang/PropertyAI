import { runScreening, getScreeningReport, generateReportPDF } from './screeningWorkflow';
import tenantService from './tenantService';
import { ScreeningReport, ScreeningLog } from '../models';
import nock from 'nock';

jest.mock('./tenantService');
jest.mock('../models/ScreeningReport');
jest.mock('../models/ScreeningLog');

describe('screeningWorkflow', () => {
  const mockTenant = { id: 'test-tenant', matchingProfile: { overallScore: 0.8 } };
  const mockAppId = 'test-app';

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await ScreeningReport.destroy({ where: {} });
    await ScreeningLog.destroy({ where: {} });
  });

  describe('runScreening', () => {
    test('completes screening with mock APIs', async () => {
      // Mock tenant for match score
      (tenantService.getTenant as jest.Mock).mockResolvedValue(mockTenant);

      // Mock external APIs (nock for HTTP)
      nock('https://api.transunion.com')
        .post(`/tenant/${mockTenant.id}/credit`)
        .reply(200, { creditScore: 750, status: 'approved' });

      nock('https://api.checkr.com')
        .post(`/tenant/${mockTenant.id}/background`)
        .reply(200, { criminal: false, eviction: false, status: 'clear' });

      nock('https://api.referenceverify.com')
        .post(`/tenant/${mockTenant.id}/verify`)
        .reply(200, { verified: true, comments: 'Excellent' });

      const result = await runScreening(mockTenant.id, mockAppId);

      expect(result.riskLevel).toBeDefined();
      expect(result.overallRiskScore).toBeGreaterThan(0.7); // Mock weights
      expect(tenantService.updateTenant).toHaveBeenCalledWith(mockTenant.id, expect.objectContaining({
        screeningStatus: { status: 'completed', riskLevel: expect.any(String), reportId: expect.any(String) }
      }));
    });

    test('calculates risk score correctly', async () => {
      // Mock tenant for match score
      (tenantService.getTenant as jest.Mock).mockResolvedValue(mockTenant);

      // Mock high credit, clean background, good reference
      nock('https://api.transunion.com')
        .post(`/tenant/${mockTenant.id}/credit`)
        .reply(200, { creditScore: 750 });

      nock('https://api.checkr.com')
        .post(`/tenant/${mockTenant.id}/background`)
        .reply(200, { criminal: false, eviction: false });

      nock('https://api.referenceverify.com')
        .post(`/tenant/${mockTenant.id}/verify`)
        .reply(200, { verified: true });

      const result = await runScreening(mockTenant.id, mockAppId);

      // Expected: high scores
      expect(result.overallRiskScore).toBeCloseTo(0.85, 1); // Mock calculation
      expect(result.riskLevel).toBe('low');
    });

    test('handles API failure gracefully', async () => {
      (tenantService.getTenant as jest.Mock).mockResolvedValue(mockTenant);

      nock('https://api.transunion.com')
        .post(`/tenant/${mockTenant.id}/credit`)
        .reply(500, { error: 'Service unavailable' });

      await expect(runScreening(mockTenant.id, mockAppId)).rejects.toThrow('Screening failed');
    });

    test('logs screening events', async () => {
      // Mock tenant
      (tenantService.getTenant as jest.Mock).mockResolvedValue(mockTenant);

      nock('https://api.transunion.com')
        .post(`/tenant/${mockTenant.id}/credit`)
        .reply(200, { creditScore: 750 });

      nock('https://api.checkr.com')
        .post(`/tenant/${mockTenant.id}/background`)
        .reply(200, { criminal: false, eviction: false });

      nock('https://api.referenceverify.com')
        .post(`/tenant/${mockTenant.id}/verify`)
        .reply(200, { verified: true });

      // Mock logger calls (assume logger.info called)
      const mockLogger = require('../utils/logger');
      const logSpy = jest.spyOn(mockLogger, 'info');
      const errorSpy = jest.spyOn(mockLogger, 'error');

      await runScreening(mockTenant.id, mockAppId);

      expect(logSpy).toHaveBeenCalledWith('Screening started', { tenantId: mockTenant.id, applicationId: mockAppId });
      expect(logSpy).toHaveBeenCalledWith('Screening completed', expect.objectContaining({ tenantId: mockTenant.id, reportId: expect.any(String), riskLevel: expect.any(String) }));
    });
  });

  describe('getScreeningReport', () => {
    test('retrieves report with logs', async () => {
      const mockReport = { tenantId: 'test', creditScore: 750, riskLevel: 'low' };
      (ScreeningReport.findByPk as jest.Mock).mockResolvedValue(mockReport);
      (ScreeningLog.findAll as jest.Mock).mockResolvedValue([]);

      const result = await getScreeningReport('test-report-id');

      expect(result).toEqual(mockReport);
    });

    test('throws if report not found', async () => {
      (ScreeningReport.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(getScreeningReport('invalid')).rejects.toThrow('Report not found');
    });
  });

  describe('generateReportPDF', () => {
    test('generates PDF content', async () => {
      const mockReport = { tenantId: 'test', creditScore: 750, riskLevel: 'low', aiAssessment: 'Low risk tenant.' };
      (getScreeningReport as jest.Mock).mockResolvedValue(mockReport);

      const result = await generateReportPDF('test-report-id');

      expect(result).toContain('Screening Report for Tenant test');
      expect(result).toContain('Credit Score: 750');
      expect(result).toContain('Risk Level: low');
      expect(result).toContain('AI Assessment: Low risk tenant.');
    });
  });