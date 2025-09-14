const { Op } = require('sequelize');

class RiskAlertService {
  constructor() {
    this.ALERT_THRESHOLDS = {
      critical: { minScore: 4.0, priority: 'immediate', escalationHours: 1 },
      high: { minScore: 3.0, priority: 'urgent', escalationHours: 4 },
      medium: { minScore: 2.0, priority: 'high', escalationHours: 24 },
      low: { minScore: 1.0, priority: 'medium', escalationHours: 72 }
    };

    this.ALERT_TYPES = {
      maintenance_critical: {
        title: 'Critical Maintenance Issue',
        description: 'Equipment failure or critical maintenance required',
        category: 'maintenance'
      },
      maintenance_high: {
        title: 'High Priority Maintenance',
        description: 'Maintenance issue requires urgent attention',
        category: 'maintenance'
      },
      churn_critical: {
        title: 'Critical Churn Risk',
        description: 'Tenant at immediate risk of termination',
        category: 'churn'
      },
      churn_high: {
        title: 'High Churn Risk',
        description: 'Tenant showing strong indicators of leaving',
        category: 'churn'
      },
      market_critical: {
        title: 'Critical Market Risk',
        description: 'Severe market conditions affecting property value',
        category: 'market'
      },
      payment_critical: {
        title: 'Critical Payment Risk',
        description: 'Payment failure or severe delinquency',
        category: 'payment'
      },
      compliance_critical: {
        title: 'Critical Compliance Issue',
        description: 'Regulatory compliance violation detected',
        category: 'compliance'
      }
    };
  }

  /**
   * Generate alerts from risk assessment results
   * @param {Object} assessment - Risk assessment result
   * @param {Object} entityData - Entity data (property or tenant)
   * @returns {Promise<Array>} Generated alerts
   */
  async generateAlertsFromAssessment(assessment, entityData) {
    const alerts = [];
    const riskFactors = assessment.riskFactors || {};

    // Generate alerts based on risk factors
    Object.entries(riskFactors).forEach(([category, factor]) => {
      const alertType = this.determineAlertType(category, factor.score);
      if (alertType) {
        const alert = this.createAlert(
          assessment.entityType,
          assessment.entityId,
          entityData.name || entityData.id,
          alertType,
          factor.score,
          factor,
          assessment.id
        );
        alerts.push(alert);
      }
    });

    // Generate alerts for overall risk score
    if (assessment.overallRiskScore >= 3.0) {
      const overallAlert = this.createOverallRiskAlert(
        assessment.entityType,
        assessment.entityId,
        entityData.name || entityData.id,
        assessment.overallRiskScore,
        assessment.riskLevel,
        assessment.id
      );
      if (overallAlert) {
        alerts.push(overallAlert);
      }
    }

    // Save alerts to database (in real implementation)
    // For now, return the alert objects
    return alerts;
  }

  /**
   * Determine alert type based on category and score
   * @param {string} category - Risk category
   * @param {number} score - Risk score
   * @returns {string|null} Alert type
   */
  determineAlertType(category, score) {
    if (score >= 4.0) {
      return `${category}_critical`;
    } else if (score >= 3.0) {
      return `${category}_high`;
    }
    return null;
  }

  /**
   * Create an alert object
   * @param {string} entityType - Entity type (property/tenant)
   * @param {string} entityId - Entity ID
   * @param {string} entityName - Entity name
   * @param {string} alertType - Alert type
   * @param {number} riskScore - Risk score
   * @param {Object} riskFactor - Risk factor details
   * @param {string} assessmentId - Assessment ID
   * @returns {Object} Alert object
   */
  createAlert(entityType, entityId, entityName, alertType, riskScore, riskFactor, assessmentId) {
    const alertConfig = this.ALERT_TYPES[alertType];
    const threshold = this.getThresholdForScore(riskScore);

    return {
      id: this.generateAlertId(),
      entityType,
      entityId,
      entityName,
      alertType,
      title: alertConfig?.title || 'Risk Alert',
      message: this.generateAlertMessage(alertType, entityName, riskScore),
      description: this.generateAlertDescription(alertType, riskFactor),
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      priority: threshold.priority,
      category: alertConfig?.category || 'general',
      mitigationSteps: this.generateMitigationSteps(alertType, riskFactor),
      status: 'active',
      createdAt: new Date().toISOString(),
      dueDate: this.calculateDueDate(threshold.escalationHours),
      assessmentId,
      metadata: {
        riskFactor,
        threshold,
        alertConfig
      }
    };
  }

  /**
   * Create overall risk alert
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} entityName - Entity name
   * @param {number} riskScore - Overall risk score
   * @param {string} riskLevel - Risk level
   * @param {string} assessmentId - Assessment ID
   * @returns {Object|null} Alert object or null
   */
  createOverallRiskAlert(entityType, entityId, entityName, riskScore, riskLevel, assessmentId) {
    if (riskScore < 3.0) return null;

    const threshold = this.getThresholdForScore(riskScore);

    return {
      id: this.generateAlertId(),
      entityType,
      entityId,
      entityName,
      alertType: 'overall_risk',
      title: `High Overall Risk: ${entityName}`,
      message: `${entityName} has a ${riskLevel} overall risk score of ${riskScore.toFixed(1)}`,
      description: `The ${entityType} ${entityName} has been assessed with an overall risk score of ${riskScore.toFixed(1)}, indicating ${this.getRiskDescription(riskLevel)}. Immediate attention is required.`,
      riskScore,
      riskLevel,
      priority: threshold.priority,
      category: 'overall',
      mitigationSteps: [
        'Review detailed risk assessment',
        'Prioritize high-risk factors',
        'Develop comprehensive mitigation plan',
        'Schedule follow-up assessment'
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      dueDate: this.calculateDueDate(threshold.escalationHours),
      assessmentId,
      metadata: {
        overallRisk: true,
        riskLevel,
        threshold
      }
    };
  }

  /**
   * Generate alert message
   * @param {string} alertType - Alert type
   * @param {string} entityName - Entity name
   * @param {number} riskScore - Risk score
   * @returns {string} Alert message
   */
  generateAlertMessage(alertType, entityName, riskScore) {
    const config = this.ALERT_TYPES[alertType];
    if (config) {
      return `${config.title} for ${entityName} (Risk: ${riskScore.toFixed(1)})`;
    }
    return `Risk Alert for ${entityName} (Score: ${riskScore.toFixed(1)})`;
  }

  /**
   * Generate alert description
   * @param {string} alertType - Alert type
   * @param {Object} riskFactor - Risk factor details
   * @returns {string} Alert description
   */
  generateAlertDescription(alertType, riskFactor) {
    const config = this.ALERT_TYPES[alertType];
    if (config) {
      return `${config.description}. Risk score: ${riskFactor.score.toFixed(1)}, Impact: ${riskFactor.impact.toFixed(1)}, Probability: ${(riskFactor.probability * 100).toFixed(0)}%.`;
    }
    return `Risk factor detected with score ${riskFactor.score.toFixed(1)}. Immediate review recommended.`;
  }

  /**
   * Generate mitigation steps
   * @param {string} alertType - Alert type
   * @param {Object} riskFactor - Risk factor details
   * @returns {Array} Mitigation steps
   */
  generateMitigationSteps(alertType, riskFactor) {
    const baseSteps = [
      'Review detailed risk assessment',
      'Assess current mitigation options',
      'Implement immediate containment measures',
      'Schedule follow-up evaluation'
    ];

    // Add category-specific steps
    switch (alertType.split('_')[0]) {
      case 'maintenance':
        return [
          'Schedule emergency maintenance inspection',
          'Contact qualified repair service',
          'Implement temporary safety measures',
          'Monitor situation continuously'
        ];
      case 'churn':
        return [
          'Schedule tenant meeting to discuss concerns',
          'Review lease terms and incentives',
          'Implement tenant retention program',
          'Monitor tenant satisfaction metrics'
        ];
      case 'market':
        return [
          'Review current market conditions',
          'Adjust pricing strategy if needed',
          'Consider property improvements',
          'Monitor market trends weekly'
        ];
      case 'payment':
        return [
          'Contact tenant regarding payment status',
          'Review payment history and patterns',
          'Implement payment plan if appropriate',
          'Monitor payment status closely'
        ];
      case 'compliance':
        return [
          'Review compliance requirements',
          'Contact legal/compliance expert',
          'Implement corrective actions',
          'Document compliance measures'
        ];
      default:
        return baseSteps;
    }
  }

  /**
   * Get threshold configuration for score
   * @param {number} score - Risk score
   * @returns {Object} Threshold configuration
   */
  getThresholdForScore(score) {
    if (score >= 4.0) return this.ALERT_THRESHOLDS.critical;
    if (score >= 3.0) return this.ALERT_THRESHOLDS.high;
    if (score >= 2.0) return this.ALERT_THRESHOLDS.medium;
    return this.ALERT_THRESHOLDS.low;
  }

  /**
   * Get risk level from score
   * @param {number} score - Risk score
   * @returns {string} Risk level
   */
  getRiskLevel(score) {
    if (score >= 4.0) return 'critical';
    if (score >= 3.0) return 'high';
    if (score >= 2.0) return 'medium';
    if (score >= 1.0) return 'low';
    return 'minimal';
  }

  /**
   * Get risk description
   * @param {string} riskLevel - Risk level
   * @returns {string} Risk description
   */
  getRiskDescription(riskLevel) {
    const descriptions = {
      critical: 'critical risk requiring immediate action',
      high: 'high risk needing urgent attention',
      medium: 'moderate risk requiring monitoring',
      low: 'low risk that should be tracked',
      minimal: 'minimal risk with normal monitoring'
    };
    return descriptions[riskLevel] || 'unknown risk level';
  }

  /**
   * Calculate due date based on escalation hours
   * @param {number} escalationHours - Hours until escalation
   * @returns {string} Due date ISO string
   */
  calculateDueDate(escalationHours) {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + escalationHours);
    return dueDate.toISOString();
  }

  /**
   * Generate unique alert ID
   * @returns {string} Alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send alert notifications
   * @param {Array} alerts - Alerts to send
   * @param {Object} options - Notification options
   * @returns {Promise<Array>} Notification results
   */
  async sendAlertNotifications(alerts, options = {}) {
    const results = [];

    for (const alert of alerts) {
      try {
        // Send email notification
        if (options.email !== false) {
          await this.sendEmailNotification(alert, options.recipients);
        }

        // Send in-app notification
        if (options.inApp !== false) {
          await this.sendInAppNotification(alert);
        }

        // Send SMS for critical alerts
        if (alert.priority === 'immediate' && options.sms !== false) {
          await this.sendSMSNotification(alert);
        }

        results.push({
          alertId: alert.id,
          success: true,
          channels: this.getNotificationChannels(alert, options)
        });

      } catch (error) {
        console.error(`Failed to send notification for alert ${alert.id}:`, error);
        results.push({
          alertId: alert.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send email notification
   * @param {Object} alert - Alert object
   * @param {Array} recipients - Email recipients
   * @returns {Promise<void>}
   */
  async sendEmailNotification(alert, recipients = []) {
    // In a real implementation, this would integrate with an email service
    // For now, we'll just log the notification
    console.log(`Sending email notification for alert ${alert.id}:`, {
      to: recipients,
      subject: alert.title,
      message: alert.message,
      priority: alert.priority
    });

    // Simulate email sending
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  /**
   * Send in-app notification
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async sendInAppNotification(alert) {
    // In a real implementation, this would create a notification record
    // and potentially use WebSocket or push notifications
    console.log(`Sending in-app notification for alert ${alert.id}:`, {
      userId: 'current_user', // Would be determined from context
      title: alert.title,
      message: alert.message,
      type: 'risk_alert',
      priority: alert.priority
    });

    return new Promise((resolve) => {
      setTimeout(() => resolve(), 50);
    });
  }

  /**
   * Send SMS notification
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async sendSMSNotification(alert) {
    // In a real implementation, this would integrate with an SMS service
    console.log(`Sending SMS notification for alert ${alert.id}:`, {
      phoneNumber: '+1234567890', // Would be determined from user profile
      message: `CRITICAL: ${alert.title} - ${alert.message}`,
      priority: 'high'
    });

    return new Promise((resolve) => {
      setTimeout(() => resolve(), 200);
    });
  }

  /**
   * Get notification channels for alert
   * @param {Object} alert - Alert object
   * @param {Object} options - Notification options
   * @returns {Array} Notification channels
   */
  getNotificationChannels(alert, options) {
    const channels = [];

    if (options.email !== false) channels.push('email');
    if (options.inApp !== false) channels.push('in-app');
    if (alert.priority === 'immediate' && options.sms !== false) channels.push('sms');

    return channels;
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID acknowledging the alert
   * @param {string} notes - Acknowledgment notes
   * @returns {Promise<Object>} Updated alert
   */
  async acknowledgeAlert(alertId, userId, notes = '') {
    // In a real implementation, this would update the alert in the database
    console.log(`Acknowledging alert ${alertId} by user ${userId}`);

    const updatedAlert = {
      id: alertId,
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId,
      acknowledgmentNotes: notes
    };

    return updatedAlert;
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID resolving the alert
   * @param {string} resolution - Resolution description
   * @returns {Promise<Object>} Updated alert
   */
  async resolveAlert(alertId, userId, resolution = '') {
    // In a real implementation, this would update the alert in the database
    console.log(`Resolving alert ${alertId} by user ${userId}`);

    const updatedAlert = {
      id: alertId,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId,
      resolutionNotes: resolution
    };

    return updatedAlert;
  }

  /**
   * Escalate alert
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Escalation result
   */
  async escalateAlert(alert) {
    // Check if alert is past due
    const dueDate = new Date(alert.dueDate);
    const now = new Date();

    if (now > dueDate && alert.status === 'active') {
      console.log(`Escalating alert ${alert.id} - past due date`);

      // Send escalation notifications
      await this.sendEscalationNotifications(alert);

      return {
        escalated: true,
        newPriority: this.getEscalatedPriority(alert.priority),
        escalationTime: new Date().toISOString()
      };
    }

    return { escalated: false };
  }

  /**
   * Send escalation notifications
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async sendEscalationNotifications(alert) {
    // Send to escalation contacts (managers, supervisors, etc.)
    const escalationRecipients = await this.getEscalationContacts(alert);

    await this.sendEmailNotification(alert, escalationRecipients);
    await this.sendInAppNotification({
      ...alert,
      title: `ESCALATED: ${alert.title}`,
      message: `ESCALATED: ${alert.message} - Requires immediate attention`
    });
  }

  /**
   * Get escalation contacts
   * @param {Object} alert - Alert object
   * @returns {Promise<Array>} Escalation contact emails
   */
  async getEscalationContacts(alert) {
    // In a real implementation, this would query user roles and permissions
    // For now, return a mock list
    return [
      'manager@company.com',
      'supervisor@company.com'
    ];
  }

  /**
   * Get escalated priority
   * @param {string} currentPriority - Current priority
   * @returns {string} Escalated priority
   */
  getEscalatedPriority(currentPriority) {
    const escalationMap = {
      medium: 'high',
      high: 'immediate',
      urgent: 'immediate',
      immediate: 'immediate'
    };
    return escalationMap[currentPriority] || currentPriority;
  }

  /**
   * Get alert statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Alert statistics
   */
  async getAlertStatistics(filters = {}) {
    // In a real implementation, this would query the database
    // For now, return mock statistics
    return {
      total: 25,
      active: 12,
      acknowledged: 8,
      resolved: 5,
      critical: 3,
      high: 7,
      medium: 10,
      low: 5,
      byCategory: {
        maintenance: 8,
        churn: 6,
        market: 4,
        payment: 3,
        compliance: 2,
        overall: 2
      },
      averageResolutionTime: '2.5 days',
      escalationRate: '15%'
    };
  }

  /**
   * Get alerts for entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Alerts for entity
   */
  async getEntityAlerts(entityType, entityId, options = {}) {
    // In a real implementation, this would query the database
    // For now, return mock alerts
    return [
      {
        id: 'alert_001',
        entityType,
        entityId,
        alertType: 'maintenance_critical',
        title: 'Critical Maintenance Issue',
        message: 'HVAC system failure detected',
        riskScore: 4.2,
        priority: 'immediate',
        status: 'active',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        dueDate: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    ];
  }

  /**
   * Process alert queue
   * @returns {Promise<Object>} Processing results
   */
  async processAlertQueue() {
    const results = {
      processed: 0,
      escalated: 0,
      notificationsSent: 0,
      errors: 0
    };

    try {
      // Get active alerts
      const activeAlerts = await this.getActiveAlerts();

      for (const alert of activeAlerts) {
        try {
          // Check for escalation
          const escalationResult = await this.escalateAlert(alert);
          if (escalationResult.escalated) {
            results.escalated++;
          }

          // Send reminders for overdue alerts
          if (this.isOverdue(alert)) {
            await this.sendReminderNotification(alert);
            results.notificationsSent++;
          }

          results.processed++;
        } catch (error) {
          console.error(`Error processing alert ${alert.id}:`, error);
          results.errors++;
        }
      }
    } catch (error) {
      console.error('Error processing alert queue:', error);
      results.errors++;
    }

    return results;
  }

  /**
   * Get active alerts
   * @returns {Promise<Array>} Active alerts
   */
  async getActiveAlerts() {
    // In a real implementation, this would query the database
    // For now, return mock active alerts
    return [];
  }

  /**
   * Check if alert is overdue
   * @param {Object} alert - Alert object
   * @returns {boolean} Whether alert is overdue
   */
  isOverdue(alert) {
    const dueDate = new Date(alert.dueDate);
    const now = new Date();
    return now > dueDate;
  }

  /**
   * Send reminder notification
   * @param {Object} alert - Alert object
   * @returns {Promise<void>}
   */
  async sendReminderNotification(alert) {
    const reminderAlert = {
      ...alert,
      title: `REMINDER: ${alert.title}`,
      message: `REMINDER: ${alert.message} - This alert is now overdue and requires immediate attention.`
    };

    await this.sendInAppNotification(reminderAlert);
  }
}

module.exports = new RiskAlertService();