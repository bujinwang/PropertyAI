const riskAssessmentService = require('../src/services/riskAssessmentService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('RiskAssessmentService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('calculateOverallRiskScore', () => {
    it('should calculate overall risk score correctly', () => {
      const riskFactors = {
        maintenance: { score: 2.5, weight: 0.25 },
        market: { score: 3.0, weight: 0.15 },
        financial: { score: 1.8, weight: 0.15 },
        operational: { score: 2.2, weight: 0.10 },
        compliance: { score: 1.5, weight: 0.10 },
        churn: { score: 2.8, weight: 0.20 },
        payment: { score: 3.2, weight: 0.25 },
        behavioral: { score: 2.0, weight: 0.15 },
        financial_tenant: { score: 1.9, weight: 0.15 },
        satisfaction: { score: 2.3, weight: 0.10 }
      };

      const result = riskAssessmentService.calculateOverallRiskScore(riskFactors);

      expect(result).to.be.a('number');
      expect(result).to.be.at.least(0);
      expect(result).to.be.at.most(5.0);
    });

    it('should handle empty risk factors', () => {
      const result = riskAssessmentService.calculateOverallRiskScore({});
      expect(result).to.equal(0);
    });

    it('should cap risk score at 5.0', () => {
      const riskFactors = {
        test: { score: 10.0, weight: 1.0 }
      };

      const result = riskAssessmentService.calculateOverallRiskScore(riskFactors);
      expect(result).to.equal(5.0);
    });
  });

  describe('determineRiskLevel', () => {
    it('should determine minimal risk level', () => {
      const result = riskAssessmentService.determineRiskLevel(0.5);
      expect(result).to.equal('minimal');
    });

    it('should determine low risk level', () => {
      const result = riskAssessmentService.determineRiskLevel(1.5);
      expect(result).to.equal('low');
    });

    it('should determine medium risk level', () => {
      const result = riskAssessmentService.determineRiskLevel(2.5);
      expect(result).to.equal('medium');
    });

    it('should determine high risk level', () => {
      const result = riskAssessmentService.determineRiskLevel(3.5);
      expect(result).to.equal('high');
    });

    it('should determine critical risk level', () => {
      const result = riskAssessmentService.determineRiskLevel(4.5);
      expect(result).to.equal('critical');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence correctly', () => {
      const riskFactors = {
        factor1: { confidence: 0.8 },
        factor2: { confidence: 0.9 },
        factor3: { confidence: 0.7 }
      };

      const result = riskAssessmentService.calculateConfidence(riskFactors);
      expect(result).to.equal(0.8); // Average of 0.8, 0.9, 0.7
    });

    it('should cap confidence at 1.0', () => {
      const riskFactors = {
        factor1: { confidence: 1.5 }
      };

      const result = riskAssessmentService.calculateConfidence(riskFactors);
      expect(result).to.equal(1.0);
    });
  });

  describe('calculateDataQuality', () => {
    it('should calculate data quality correctly', () => {
      const riskFactors = {
        factor1: { score: 2.0 },
        factor2: { score: 0 },
        factor3: { score: 1.5 }
      };

      const result = riskAssessmentService.calculateDataQuality(riskFactors);
      expect(result).to.equal(2/3); // 2 out of 3 factors have scores > 0
    });
  });

  describe('calculateMaintenanceRisk', () => {
    it('should calculate maintenance risk for old property', async () => {
      const property = {
        yearBuilt: 1980,
        riskMetadata: { maintenanceHistory: Array(15).fill({}) }
      };

      const result = await riskAssessmentService.calculateMaintenanceRisk(property);
      expect(result.score).to.be.greaterThan(1.0);
      expect(result.weight).to.equal(riskAssessmentService.RISK_WEIGHTS.maintenance);
    });

    it('should calculate maintenance risk for new property', async () => {
      const property = {
        yearBuilt: 2020,
        riskMetadata: { maintenanceHistory: [] }
      };

      const result = await riskAssessmentService.calculateMaintenanceRisk(property);
      expect(result.score).to.be.lessThan(1.0);
    });
  });

  describe('calculateChurnRisk', () => {
    it('should calculate high churn risk for low renewal likelihood', async () => {
      const tenant = {
        renewalLikelihood: 0.2,
        leaseViolations: []
      };

      const result = await riskAssessmentService.calculateChurnRisk(tenant);
      expect(result.score).to.be.greaterThan(2.0);
    });

    it('should calculate churn risk with lease violations', async () => {
      const tenant = {
        renewalLikelihood: 0.8,
        leaseViolations: [{}, {}, {}] // 3 violations
      };

      const result = await riskAssessmentService.calculateChurnRisk(tenant);
      expect(result.score).to.be.greaterThan(1.0);
    });
  });

  describe('calculatePaymentRisk', () => {
    it('should calculate high payment risk for poor payment history', async () => {
      const tenant = {
        paymentHistory: [
          { status: 'late' },
          { status: 'paid' },
          { status: 'late' },
          { status: 'late' },
          { status: 'paid' }
        ]
      };

      const result = await riskAssessmentService.calculatePaymentRisk(tenant);
      expect(result.score).to.be.greaterThan(2.0);
    });

    it('should calculate low payment risk for good payment history', async () => {
      const tenant = {
        paymentHistory: [
          { status: 'paid' },
          { status: 'paid' },
          { status: 'paid' }
        ]
      };

      const result = await riskAssessmentService.calculatePaymentRisk(tenant);
      expect(result.score).to.be.lessThan(1.0);
    });
  });

  describe('generateMitigationStrategies', () => {
    it('should generate mitigation strategies for high risk', () => {
      const riskFactors = {
        maintenance: { score: 4.0, weight: 0.25 },
        churn: { score: 2.0, weight: 0.20 }
      };

      const result = riskAssessmentService.generateMitigationStrategies(riskFactors, 'property');

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      expect(result[0]).to.have.property('category');
      expect(result[0]).to.have.property('riskScore');
      expect(result[0]).to.have.property('priority');
      expect(result[0]).to.have.property('actions');
    });

    it('should prioritize immediate strategies', () => {
      const riskFactors = {
        maintenance: { score: 4.5, weight: 0.25 },
        churn: { score: 3.5, weight: 0.20 }
      };

      const result = riskAssessmentService.generateMitigationStrategies(riskFactors, 'property');

      // First strategy should be immediate priority
      expect(result[0].priority).to.equal('immediate');
    });
  });

  describe('getMitigationActions', () => {
    it('should return maintenance actions for maintenance category', () => {
      const actions = riskAssessmentService.getMitigationActions('maintenance', 3.0, 'property');
      expect(actions).to.be.an('array');
      expect(actions.length).to.be.greaterThan(0);
      expect(actions[0]).to.include('maintenance');
    });

    it('should return churn actions for churn category', () => {
      const actions = riskAssessmentService.getMitigationActions('churn', 3.0, 'tenant');
      expect(actions).to.be.an('array');
      expect(actions.length).to.be.greaterThan(0);
      expect(actions[0]).to.include('tenant');
    });
  });

  describe('calculatePortfolioRisk', () => {
    it('should calculate portfolio risk from individual risks', () => {
      const propertyRisks = [
        { riskScore: 3.0, riskLevel: 'high' },
        { riskScore: 1.5, riskLevel: 'low' }
      ];

      const tenantRisks = [
        { riskScore: 4.0, riskLevel: 'critical' },
        { riskScore: 2.0, riskLevel: 'medium' }
      ];

      const result = riskAssessmentService.calculatePortfolioRisk(propertyRisks, tenantRisks);

      expect(result).to.have.property('overallScore');
      expect(result).to.have.property('riskLevel');
      expect(result).to.have.property('confidence');
      expect(result).to.have.property('criticalCount');
      expect(result).to.have.property('highCount');
    });

    it('should handle empty risk arrays', () => {
      const result = riskAssessmentService.calculatePortfolioRisk([], []);

      expect(result.overallScore).to.equal(0);
      expect(result.riskLevel).to.equal('minimal');
      expect(result.criticalCount).to.equal(0);
      expect(result.highCount).to.equal(0);
    });
  });

  describe('getRiskLevel', () => {
    it('should return correct risk level for score', () => {
      expect(riskAssessmentService.getRiskLevel(0.5)).to.equal('minimal');
      expect(riskAssessmentService.getRiskLevel(1.5)).to.equal('low');
      expect(riskAssessmentService.getRiskLevel(2.5)).to.equal('medium');
      expect(riskAssessmentService.getRiskLevel(3.5)).to.equal('high');
      expect(riskAssessmentService.getRiskLevel(4.5)).to.equal('critical');
    });
  });

  describe('getThresholdForScore', () => {
    it('should return correct threshold for critical score', () => {
      const threshold = riskAssessmentService.getThresholdForScore(4.5);
      expect(threshold).to.deep.equal(riskAssessmentService.ALERT_THRESHOLDS.critical);
    });

    it('should return correct threshold for low score', () => {
      const threshold = riskAssessmentService.getThresholdForScore(1.5);
      expect(threshold).to.deep.equal(riskAssessmentService.ALERT_THRESHOLDS.low);
    });
  });

  describe('calculateNextAssessmentDate', () => {
    it('should return a future date', () => {
      const nextDate = riskAssessmentService.calculateNextAssessmentDate();
      const now = new Date();

      expect(nextDate).to.be.a('string');
      expect(new Date(nextDate).getTime()).to.be.greaterThan(now.getTime());
    });
  });

  describe('generateAlertMessage', () => {
    it('should generate alert message with risk score', () => {
      const message = riskAssessmentService.generateAlertMessage(
        'maintenance_critical',
        'Property A',
        4.2
      );

      expect(message).to.include('Property A');
      expect(message).to.include('4.2');
      expect(message).to.include('Critical Maintenance Issue');
    });
  });

  describe('generateAlertDescription', () => {
    it('should generate detailed alert description', () => {
      const riskFactor = { score: 3.5, impact: 4.0, probability: 0.8 };
      const description = riskAssessmentService.generateAlertDescription(
        'maintenance_critical',
        riskFactor
      );

      expect(description).to.include('3.5');
      expect(description).to.include('4.0');
      expect(description).to.include('80%');
    });
  });

  describe('generateMitigationSteps', () => {
    it('should generate mitigation steps for maintenance', () => {
      const steps = riskAssessmentService.generateMitigationSteps(
        'maintenance_critical',
        { score: 4.0 }
      );

      expect(steps).to.be.an('array');
      expect(steps.length).to.be.greaterThan(0);
      expect(steps[0]).to.include('inspection');
    });

    it('should generate mitigation steps for churn', () => {
      const steps = riskAssessmentService.generateMitigationSteps(
        'churn_high',
        { score: 3.0 }
      );

      expect(steps).to.be.an('array');
      expect(steps.length).to.be.greaterThan(0);
      expect(steps[0]).to.include('meeting');
    });
  });

  describe('getFactorDisplayName', () => {
    it('should return display name for factor', () => {
      expect(riskAssessmentService.getFactorDisplayName('property_age')).to.equal('Property Age');
      expect(riskAssessmentService.getFactorDisplayName('payment_history')).to.equal('Payment History');
      expect(riskAssessmentService.getFactorDisplayName('unknown_factor')).to.equal('unknown_factor');
    });
  });

  describe('getFactorDescription', () => {
    it('should return description for factor', () => {
      const desc = riskAssessmentService.getFactorDescription('property_age');
      expect(desc).to.include('Age of the property');
      expect(desc).to.include('maintenance costs');
    });
  });

  describe('getRiskDescription', () => {
    it('should return risk description', () => {
      expect(riskAssessmentService.getRiskDescription('critical')).to.include('critical risk');
      expect(riskAssessmentService.getRiskDescription('low')).to.include('low risk');
    });
  });

  describe('generateAlertId', () => {
    it('should generate unique alert ID', () => {
      const id1 = riskAssessmentService.generateAlertId();
      const id2 = riskAssessmentService.generateAlertId();

      expect(id1).to.match(/^alert_\d+_[a-z0-9]+$/);
      expect(id2).to.match(/^alert_\d+_[a-z0-9]+$/);
      expect(id1).to.not.equal(id2);
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date from escalation hours', () => {
      const dueDate = riskAssessmentService.calculateDueDate(24);
      const expectedDate = new Date();
      expectedDate.setHours(expectedDate.getHours() + 24);

      expect(new Date(dueDate).getTime()).to.be.closeTo(expectedDate.getTime(), 1000);
    });
  });

  describe('getEscalatedPriority', () => {
    it('should escalate priority correctly', () => {
      expect(riskAssessmentService.getEscalatedPriority('medium')).to.equal('high');
      expect(riskAssessmentService.getEscalatedPriority('high')).to.equal('immediate');
      expect(riskAssessmentService.getEscalatedPriority('immediate')).to.equal('immediate');
    });
  });

  describe('isOverdue', () => {
    it('should detect overdue alerts', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const alert = { dueDate: pastDate.toISOString() };
      expect(riskAssessmentService.isOverdue(alert)).to.be.true;

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const futureAlert = { dueDate: futureDate.toISOString() };
      expect(riskAssessmentService.isOverdue(futureAlert)).to.be.false;
    });
  });
});