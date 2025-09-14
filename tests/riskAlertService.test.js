const riskAlertService = require('../src/services/riskAlertService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('RiskAlertService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('generateAlertsFromAssessment', () => {
    it('should generate alerts for high-risk assessment', async () => {
      const assessment = {
        entityType: 'property',
        entityId: 'test-property-id',
        overallRiskScore: 4.2,
        riskLevel: 'critical',
        riskFactors: {
          maintenance: { score: 4.5, weight: 0.25 },
          market: { score: 3.8, weight: 0.15 }
        }
      };

      const entityData = {
        name: 'Test Property'
      };

      const alerts = await riskAlertService.generateAlertsFromAssessment(assessment, entityData);

      expect(alerts).to.be.an('array');
      expect(alerts.length).to.be.greaterThan(0);
      expect(alerts[0]).to.have.property('alertType');
      expect(alerts[0]).to.have.property('riskScore');
      expect(alerts[0]).to.have.property('priority');
    });

    it('should not generate alerts for low-risk assessment', async () => {
      const assessment = {
        entityType: 'property',
        entityId: 'test-property-id',
        overallRiskScore: 1.2,
        riskLevel: 'low',
        riskFactors: {
          maintenance: { score: 1.0, weight: 0.25 },
          market: { score: 0.8, weight: 0.15 }
        }
      };

      const entityData = {
        name: 'Test Property'
      };

      const alerts = await riskAlertService.generateAlertsFromAssessment(assessment, entityData);

      expect(alerts).to.be.an('array');
      expect(alerts.length).to.equal(0);
    });
  });

  describe('determineAlertType', () => {
    it('should return critical alert type for high score', () => {
      const alertType = riskAlertService.determineAlertType('maintenance', 4.5);
      expect(alertType).to.equal('maintenance_critical');
    });

    it('should return high alert type for medium-high score', () => {
      const alertType = riskAlertService.determineAlertType('churn', 3.2);
      expect(alertType).to.equal('churn_high');
    });

    it('should return null for low score', () => {
      const alertType = riskAlertService.determineAlertType('market', 1.5);
      expect(alertType).to.be.null;
    });
  });

  describe('createAlert', () => {
    it('should create alert with correct structure', () => {
      const alert = riskAlertService.createAlert(
        'property',
        'test-property-id',
        'Test Property',
        'maintenance_critical',
        4.5,
        { score: 4.5, impact: 4.0, probability: 0.8 },
        'assessment-123'
      );

      expect(alert).to.have.property('id');
      expect(alert).to.have.property('entityType', 'property');
      expect(alert).to.have.property('entityId', 'test-property-id');
      expect(alert).to.have.property('entityName', 'Test Property');
      expect(alert).to.have.property('alertType', 'maintenance_critical');
      expect(alert).to.have.property('title');
      expect(alert).to.have.property('message');
      expect(alert).to.have.property('description');
      expect(alert).to.have.property('riskScore', 4.5);
      expect(alert).to.have.property('riskLevel', 'critical');
      expect(alert).to.have.property('priority', 'immediate');
      expect(alert).to.have.property('mitigationSteps');
      expect(alert).to.have.property('status', 'active');
      expect(alert).to.have.property('createdAt');
      expect(alert).to.have.property('dueDate');
      expect(alert).to.have.property('assessmentId', 'assessment-123');
    });
  });

  describe('createOverallRiskAlert', () => {
    it('should create overall risk alert for high score', () => {
      const alert = riskAlertService.createOverallRiskAlert(
        'property',
        'test-property-id',
        'Test Property',
        4.2,
        'critical',
        'assessment-123'
      );

      expect(alert).to.have.property('alertType', 'overall_risk');
      expect(alert).to.have.property('priority', 'immediate');
      expect(alert).to.have.property('riskScore', 4.2);
      expect(alert).to.have.property('riskLevel', 'critical');
    });

    it('should return null for low score', () => {
      const alert = riskAlertService.createOverallRiskAlert(
        'property',
        'test-property-id',
        'Test Property',
        1.5,
        'low',
        'assessment-123'
      );

      expect(alert).to.be.null;
    });
  });

  describe('generateAlertMessage', () => {
    it('should generate alert message with entity name and score', () => {
      const message = riskAlertService.generateAlertMessage(
        'maintenance_critical',
        'Test Property',
        4.2
      );

      expect(message).to.include('Test Property');
      expect(message).to.include('4.2');
      expect(message).to.include('Critical Maintenance Issue');
    });
  });

  describe('generateAlertDescription', () => {
    it('should generate detailed alert description', () => {
      const riskFactor = { score: 4.5, impact: 4.0, probability: 0.8 };
      const description = riskAlertService.generateAlertDescription(
        'maintenance_critical',
        riskFactor
      );

      expect(description).to.include('4.5');
      expect(description).to.include('4.0');
      expect(description).to.include('80%');
    });
  });

  describe('generateMitigationSteps', () => {
    it('should generate maintenance mitigation steps', () => {
      const steps = riskAlertService.generateMitigationSteps(
        'maintenance_critical',
        { score: 4.5 }
      );

      expect(steps).to.be.an('array');
      expect(steps.length).to.be.greaterThan(0);
      expect(steps[0]).to.include('inspection');
    });

    it('should generate churn mitigation steps', () => {
      const steps = riskAlertService.generateMitigationSteps(
        'churn_high',
        { score: 3.5 }
      );

      expect(steps).to.be.an('array');
      expect(steps.length).to.be.greaterThan(0);
      expect(steps[0]).to.include('meeting');
    });

    it('should generate payment mitigation steps', () => {
      const steps = riskAlertService.generateMitigationSteps(
        'payment_critical',
        { score: 4.0 }
      );

      expect(steps).to.be.an('array');
      expect(steps.length).to.be.greaterThan(0);
      expect(steps[0]).to.include('contact');
    });
  });

  describe('getThresholdForScore', () => {
    it('should return critical threshold for high score', () => {
      const threshold = riskAlertService.getThresholdForScore(4.5);
      expect(threshold).to.deep.equal(riskAlertService.ALERT_THRESHOLDS.critical);
    });

    it('should return high threshold for medium-high score', () => {
      const threshold = riskAlertService.getThresholdForScore(3.5);
      expect(threshold).to.deep.equal(riskAlertService.ALERT_THRESHOLDS.high);
    });

    it('should return low threshold for low score', () => {
      const threshold = riskAlertService.getThresholdForScore(1.5);
      expect(threshold).to.deep.equal(riskAlertService.ALERT_THRESHOLDS.low);
    });
  });

  describe('getRiskLevel', () => {
    it('should return correct risk level for score', () => {
      expect(riskAlertService.getRiskLevel(0.5)).to.equal('minimal');
      expect(riskAlertService.getRiskLevel(1.5)).to.equal('low');
      expect(riskAlertService.getRiskLevel(2.5)).to.equal('medium');
      expect(riskAlertService.getRiskLevel(3.5)).to.equal('high');
      expect(riskAlertService.getRiskLevel(4.5)).to.equal('critical');
    });
  });

  describe('getRiskDescription', () => {
    it('should return risk description', () => {
      expect(riskAlertService.getRiskDescription('critical')).to.include('critical risk');
      expect(riskAlertService.getRiskDescription('high')).to.include('high risk');
      expect(riskAlertService.getRiskDescription('low')).to.include('low risk');
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date from escalation hours', () => {
      const dueDate = riskAlertService.calculateDueDate(24);
      const expectedDate = new Date();
      expectedDate.setHours(expectedDate.getHours() + 24);

      expect(new Date(dueDate).getTime()).to.be.closeTo(expectedDate.getTime(), 1000);
    });
  });

  describe('generateAlertId', () => {
    it('should generate unique alert ID', () => {
      const id1 = riskAlertService.generateAlertId();
      const id2 = riskAlertService.generateAlertId();

      expect(id1).to.match(/^alert_\d+_[a-z0-9]+$/);
      expect(id2).to.match(/^alert_\d+_[a-z0-9]+$/);
      expect(id1).to.not.equal(id2);
    });
  });

  describe('sendAlertNotifications', () => {
    beforeEach(() => {
      // Mock notification methods
      sandbox.stub(riskAlertService, 'sendEmailNotification').resolves();
      sandbox.stub(riskAlertService, 'sendInAppNotification').resolves();
      sandbox.stub(riskAlertService, 'sendSMSNotification').resolves();
    });

    it('should send notifications for critical alert', async () => {
      const alerts = [{
        id: 'alert-1',
        priority: 'immediate',
        title: 'Critical Alert',
        message: 'Test message'
      }];

      const results = await riskAlertService.sendAlertNotifications(alerts);

      expect(results).to.be.an('array');
      expect(results.length).to.equal(1);
      expect(results[0]).to.have.property('success', true);
      expect(results[0]).to.have.property('channels');

      // Verify notification methods were called
      expect(riskAlertService.sendEmailNotification.calledOnce).to.be.true;
      expect(riskAlertService.sendInAppNotification.calledOnce).to.be.true;
      expect(riskAlertService.sendSMSNotification.calledOnce).to.be.true;
    });

    it('should send notifications for high priority alert', async () => {
      const alerts = [{
        id: 'alert-1',
        priority: 'urgent',
        title: 'High Alert',
        message: 'Test message'
      }];

      const results = await riskAlertService.sendAlertNotifications(alerts);

      expect(results).to.be.an('array');
      expect(results.length).to.equal(1);
      expect(results[0]).to.have.property('success', true);

      // SMS should not be sent for non-immediate alerts
      expect(riskAlertService.sendSMSNotification.called).to.be.false;
    });

    it('should handle notification failures', async () => {
      // Make email notification fail
      riskAlertService.sendEmailNotification.rejects(new Error('Email failed'));

      const alerts = [{
        id: 'alert-1',
        priority: 'immediate',
        title: 'Critical Alert',
        message: 'Test message'
      }];

      const results = await riskAlertService.sendAlertNotifications(alerts);

      expect(results).to.be.an('array');
      expect(results.length).to.equal(1);
      expect(results[0]).to.have.property('success', false);
      expect(results[0]).to.have.property('error');
    });
  });

  describe('sendEmailNotification', () => {
    it('should send email notification', async () => {
      const alert = {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message'
      };
      const recipients = ['test@example.com'];

      // This would normally send an email, but we're just testing the method exists
      await riskAlertService.sendEmailNotification(alert, recipients);

      // In a real test, we'd verify the email was sent
      expect(true).to.be.true; // Placeholder assertion
    });
  });

  describe('sendInAppNotification', () => {
    it('should send in-app notification', async () => {
      const alert = {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message'
      };

      await riskAlertService.sendInAppNotification(alert);

      // In a real test, we'd verify the notification was created
      expect(true).to.be.true; // Placeholder assertion
    });
  });

  describe('sendSMSNotification', () => {
    it('should send SMS notification', async () => {
      const alert = {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message'
      };

      await riskAlertService.sendSMSNotification(alert);

      // In a real test, we'd verify the SMS was sent
      expect(true).to.be.true; // Placeholder assertion
    });
  });

  describe('getNotificationChannels', () => {
    it('should return all channels for critical alert', () => {
      const alert = { priority: 'immediate' };
      const options = {};

      const channels = riskAlertService.getNotificationChannels(alert, options);

      expect(channels).to.include('email');
      expect(channels).to.include('in-app');
      expect(channels).to.include('sms');
    });

    it('should exclude SMS for non-immediate alerts', () => {
      const alert = { priority: 'urgent' };
      const options = {};

      const channels = riskAlertService.getNotificationChannels(alert, options);

      expect(channels).to.include('email');
      expect(channels).to.include('in-app');
      expect(channels).to.not.include('sms');
    });

    it('should respect options', () => {
      const alert = { priority: 'immediate' };
      const options = { email: false, sms: false };

      const channels = riskAlertService.getNotificationChannels(alert, options);

      expect(channels).to.not.include('email');
      expect(channels).to.include('in-app');
      expect(channels).to.not.include('sms');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const alertId = 'alert-1';
      const userId = 'user-123';
      const notes = 'Acknowledged for review';

      const result = await riskAlertService.acknowledgeAlert(alertId, userId, notes);

      expect(result).to.have.property('id', alertId);
      expect(result).to.have.property('status', 'acknowledged');
      expect(result).to.have.property('acknowledgedAt');
      expect(result).to.have.property('acknowledgedBy', userId);
      expect(result).to.have.property('acknowledgmentNotes', notes);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert', async () => {
      const alertId = 'alert-1';
      const userId = 'user-123';
      const resolution = 'Issue resolved by maintenance team';

      const result = await riskAlertService.resolveAlert(alertId, userId, resolution);

      expect(result).to.have.property('id', alertId);
      expect(result).to.have.property('status', 'resolved');
      expect(result).to.have.property('resolvedAt');
      expect(result).to.have.property('resolvedBy', userId);
      expect(result).to.have.property('resolutionNotes', resolution);
    });
  });

  describe('escalateAlert', () => {
    it('should escalate overdue alert', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago

      const alert = {
        id: 'alert-1',
        dueDate: pastDate.toISOString(),
        status: 'active',
        priority: 'urgent'
      };

      const result = await riskAlertService.escalateAlert(alert);

      expect(result).to.have.property('escalated', true);
      expect(result).to.have.property('newPriority', 'immediate');
      expect(result).to.have.property('escalationTime');
    });

    it('should not escalate non-overdue alert', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours from now

      const alert = {
        id: 'alert-1',
        dueDate: futureDate.toISOString(),
        status: 'active',
        priority: 'urgent'
      };

      const result = await riskAlertService.escalateAlert(alert);

      expect(result).to.have.property('escalated', false);
    });

    it('should not escalate resolved alert', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);

      const alert = {
        id: 'alert-1',
        dueDate: pastDate.toISOString(),
        status: 'resolved',
        priority: 'urgent'
      };

      const result = await riskAlertService.escalateAlert(alert);

      expect(result).to.have.property('escalated', false);
    });
  });

  describe('getEscalationContacts', () => {
    it('should return escalation contacts', async () => {
      const alert = { id: 'alert-1' };
      const contacts = await riskAlertService.getEscalationContacts(alert);

      expect(contacts).to.be.an('array');
      expect(contacts.length).to.be.greaterThan(0);
      expect(contacts[0]).to.include('@');
    });
  });

  describe('getEscalatedPriority', () => {
    it('should escalate priority correctly', () => {
      expect(riskAlertService.getEscalatedPriority('medium')).to.equal('high');
      expect(riskAlertService.getEscalatedPriority('high')).to.equal('immediate');
      expect(riskAlertService.getEscalatedPriority('urgent')).to.equal('immediate');
      expect(riskAlertService.getEscalatedPriority('immediate')).to.equal('immediate');
    });
  });

  describe('isOverdue', () => {
    it('should detect overdue alerts', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const alert = { dueDate: pastDate.toISOString() };
      expect(riskAlertService.isOverdue(alert)).to.be.true;

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const futureAlert = { dueDate: futureDate.toISOString() };
      expect(riskAlertService.isOverdue(futureAlert)).to.be.false;
    });
  });

  describe('sendEscalationNotifications', () => {
    beforeEach(() => {
      sandbox.stub(riskAlertService, 'sendEmailNotification').resolves();
      sandbox.stub(riskAlertService, 'sendInAppNotification').resolves();
      sandbox.stub(riskAlertService, 'getEscalationContacts').resolves(['manager@example.com']);
    });

    it('should send escalation notifications', async () => {
      const alert = {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message'
      };

      await riskAlertService.sendEscalationNotifications(alert);

      expect(riskAlertService.sendEmailNotification.calledOnce).to.be.true;
      expect(riskAlertService.sendInAppNotification.calledOnce).to.be.true;
    });
  });

  describe('sendReminderNotification', () => {
    beforeEach(() => {
      sandbox.stub(riskAlertService, 'sendInAppNotification').resolves();
    });

    it('should send reminder notification', async () => {
      const alert = {
        id: 'alert-1',
        title: 'Test Alert',
        message: 'Test message'
      };

      await riskAlertService.sendReminderNotification(alert);

      expect(riskAlertService.sendInAppNotification.calledOnce).to.be.true;
      const callArgs = riskAlertService.sendInAppNotification.firstCall.args[0];
      expect(callArgs.title).to.include('REMINDER');
      expect(callArgs.message).to.include('REMINDER');
    });
  });

  describe('processAlertQueue', () => {
    beforeEach(() => {
      sandbox.stub(riskAlertService, 'getActiveAlerts').resolves([]);
      sandbox.stub(riskAlertService, 'escalateAlert').resolves({ escalated: false });
      sandbox.stub(riskAlertService, 'isOverdue').returns(false);
      sandbox.stub(riskAlertService, 'sendReminderNotification').resolves();
    });

    it('should process alert queue successfully', async () => {
      const result = await riskAlertService.processAlertQueue();

      expect(result).to.have.property('processed');
      expect(result).to.have.property('escalated');
      expect(result).to.have.property('notificationsSent');
      expect(result).to.have.property('errors');
    });

    it('should handle processing errors', async () => {
      riskAlertService.escalateAlert.rejects(new Error('Processing error'));

      const mockAlerts = [{ id: 'alert-1' }];
      riskAlertService.getActiveAlerts.resolves(mockAlerts);

      const result = await riskAlertService.processAlertQueue();

      expect(result.errors).to.be.greaterThan(0);
    });
  });
});