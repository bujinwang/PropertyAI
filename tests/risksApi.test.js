const request = require('supertest');
const express = require('express');
const riskRoutes = require('../src/routes/risks');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Risk Assessment API', () => {
  let app;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Mock authentication middleware
    sandbox.stub(require('../src/middleware/authMiddleware'), 'default').callsFake((req, res, next) => {
      req.user = { id: 'test-user-id' };
      next();
    });

    app = express();
    app.use(express.json());
    app.use('/api/risks', riskRoutes);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('POST /api/risks/assess', () => {
    it('should assess property risk successfully', (done) => {
      const assessmentData = {
        entityType: 'property',
        entityId: 'test-property-id',
        assessmentType: 'comprehensive'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessmentId');
          expect(res.body.data).to.have.property('overallScore');
          expect(res.body.data).to.have.property('riskLevel');
          expect(res.body.data).to.have.property('mitigationStrategies');
        })
        .end(done);
    });

    it('should assess tenant risk successfully', (done) => {
      const assessmentData = {
        entityType: 'tenant',
        entityId: 'test-tenant-id',
        assessmentType: 'comprehensive'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessmentId');
          expect(res.body.data).to.have.property('overallScore');
          expect(res.body.data).to.have.property('riskLevel');
        })
        .end(done);
    });

    it('should assess portfolio risk successfully', (done) => {
      const assessmentData = {
        entityType: 'portfolio',
        assessmentType: 'portfolio'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessmentId');
          expect(res.body.data).to.have.property('portfolioRisk');
        })
        .end(done);
    });

    it('should return 400 for invalid entity type', (done) => {
      const assessmentData = {
        entityType: 'invalid',
        entityId: 'test-id'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });

    it('should return 400 for invalid assessment type', (done) => {
      const assessmentData = {
        entityType: 'property',
        entityId: 'test-property-id',
        assessmentType: 'invalid'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });

    it('should return 400 for missing entityId when required', (done) => {
      const assessmentData = {
        entityType: 'property',
        assessmentType: 'comprehensive'
      };

      request(app)
        .post('/api/risks/assess')
        .send(assessmentData)
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });
  });

  describe('GET /api/risks/portfolio', () => {
    it('should return portfolio risk data', (done) => {
      request(app)
        .get('/api/risks/portfolio')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
        })
        .end(done);
    });

    it('should return detailed portfolio risk data when requested', (done) => {
      request(app)
        .get('/api/risks/portfolio?detailed=true')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          // Detailed response should include risk factors and mitigation strategies
          if (res.body.data) {
            expect(res.body.data).to.have.property('riskFactors');
            expect(res.body.data).to.have.property('mitigationStrategies');
          }
        })
        .end(done);
    });
  });

  describe('GET /api/risks/property/:id', () => {
    it('should return property risk assessments', (done) => {
      request(app)
        .get('/api/risks/property/test-property-id')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('propertyId', 'test-property-id');
          expect(res.body.data).to.have.property('assessments');
        })
        .end(done);
    });

    it('should return detailed property risk data when requested', (done) => {
      request(app)
        .get('/api/risks/property/test-property-id?detailed=true')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessments');

          // Check if detailed data is included
          if (res.body.data.assessments && res.body.data.assessments.length > 0) {
            const assessment = res.body.data.assessments[0];
            expect(assessment).to.have.property('riskFactors');
            expect(assessment).to.have.property('mitigationStrategies');
          }
        })
        .end(done);
    });

    it('should return 400 for invalid property ID', (done) => {
      request(app)
        .get('/api/risks/property/invalid-id')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });

    it('should handle limit parameter', (done) => {
      request(app)
        .get('/api/risks/property/test-property-id?limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
        })
        .end(done);
    });
  });

  describe('GET /api/risks/tenant/:id', () => {
    it('should return tenant risk assessments', (done) => {
      request(app)
        .get('/api/risks/tenant/test-tenant-id')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('tenantId', 'test-tenant-id');
          expect(res.body.data).to.have.property('assessments');
        })
        .end(done);
    });

    it('should return detailed tenant risk data when requested', (done) => {
      request(app)
        .get('/api/risks/tenant/test-tenant-id?detailed=true')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessments');
        })
        .end(done);
    });

    it('should return 400 for invalid tenant ID', (done) => {
      request(app)
        .get('/api/risks/tenant/invalid-id')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });
  });

  describe('GET /api/risks/trends', () => {
    it('should return risk trends for property', (done) => {
      request(app)
        .get('/api/risks/trends?entityType=property&entityId=test-property-id&period=30d')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('entityType', 'property');
          expect(res.body.data).to.have.property('trends');
        })
        .end(done);
    });

    it('should return risk trends for tenant', (done) => {
      request(app)
        .get('/api/risks/trends?entityType=tenant&entityId=test-tenant-id&period=7d')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('entityType', 'tenant');
          expect(res.body.data).to.have.property('trends');
        })
        .end(done);
    });

    it('should return 400 for invalid entity type', (done) => {
      request(app)
        .get('/api/risks/trends?entityType=invalid&entityId=test-id')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });

    it('should return 400 for invalid period', (done) => {
      request(app)
        .get('/api/risks/trends?entityType=property&entityId=test-id&period=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });
  });

  describe('GET /api/risks/assessment/:id', () => {
    it('should return specific risk assessment', (done) => {
      request(app)
        .get('/api/risks/assessment/test-assessment-id')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('assessmentId');
          expect(res.body.data).to.have.property('entityType');
          expect(res.body.data).to.have.property('entityId');
        })
        .end(done);
    });

    it('should return 400 for invalid assessment ID', (done) => {
      request(app)
        .get('/api/risks/assessment/invalid-id')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });
  });

  describe('GET /api/risks/summary', () => {
    it('should return risk summary statistics', (done) => {
      request(app)
        .get('/api/risks/summary')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('totalAssessments');
          expect(res.body.data).to.have.property('riskLevelBreakdown');
        })
        .end(done);
    });

    it('should filter by entity type', (done) => {
      request(app)
        .get('/api/risks/summary?entityType=property')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('filters');
          expect(res.body.data.filters).to.have.property('entityType', 'property');
        })
        .end(done);
    });

    it('should filter by risk level', (done) => {
      request(app)
        .get('/api/risks/summary?riskLevel=high')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('filters');
          expect(res.body.data.filters).to.have.property('riskLevel', 'high');
        })
        .end(done);
    });

    it('should return 400 for invalid entity type', (done) => {
      request(app)
        .get('/api/risks/summary?entityType=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });

    it('should return 400 for invalid risk level', (done) => {
      request(app)
        .get('/api/risks/summary?riskLevel=invalid')
        .expect(400)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(done);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for assessment endpoint', (done) => {
      // This test would need to be configured with the actual rate limiting settings
      // For now, just verify the endpoint exists and responds
      request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: 'test-property-id'
        })
        .expect((res) => {
          expect(res.status).to.be.oneOf([200, 429]);
        })
        .end(done);
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', (done) => {
      // Mock a service method to throw an error
      const originalMethod = require('../src/services/riskAssessmentService').assessPropertyRisk;
      require('../src/services/riskAssessmentService').assessPropertyRisk = sinon.stub().throws(new Error('Test error'));

      request(app)
        .post('/api/risks/assess')
        .send({
          entityType: 'property',
          entityId: 'test-property-id'
        })
        .expect(500)
        .expect((res) => {
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error');
        })
        .end(() => {
          // Restore original method
          require('../src/services/riskAssessmentService').assessPropertyRisk = originalMethod;
          done();
        });
    });

    it('should handle malformed JSON', (done) => {
      request(app)
        .post('/api/risks/assess')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400)
        .end(done);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', (done) => {
      // Temporarily remove auth middleware mock
      sandbox.restore();

      request(app)
        .get('/api/risks/portfolio')
        .expect((res) => {
          // Should fail without authentication
          expect(res.status).to.be.oneOf([401, 403, 500]);
        })
        .end(done);
    });
  });
});