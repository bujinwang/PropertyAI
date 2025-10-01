import { User, MaintenanceRequest, Transaction } from '@prisma/client';
import axios from 'axios';

interface TenantData {
  maintenanceRequests: MaintenanceRequest[];
  payments: Transaction[];
}

interface TenantPredictionResponse {
  tenant_id: string;
  prediction: {
    issue: string;
    confidence: number;
    risk_score: number;
    model_used: 'ml_model' | 'rule_based';
  };
}

// ML API configuration
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';
const ML_API_TIMEOUT = parseInt(process.env.ML_API_TIMEOUT || '5000', 10);

/**
 * Predict tenant issues using ML model or fallback to rule-based
 * Integrates with Python ML API for predictions
 */
export const predictTenantIssue = async (tenant: User & TenantData): Promise<any> => {
  const { maintenanceRequests, payments } = tenant;

  // Prepare data for ML API
  const latePayments = payments.filter(p => p.status === 'FAILED').length;
  const missedPayments = payments.filter(p => p.status === 'MISSED').length;
  const totalPayments = payments.length;

  const requestData = {
    tenant_id: tenant.id,
    maintenance_requests: maintenanceRequests.length,
    late_payments: latePayments,
    missed_payments: missedPayments,
    total_payments: totalPayments,
    complaint_messages: 0, // Could be enhanced with actual message data
    months_as_tenant: calculateMonthsSince(tenant.createdAt),
    credit_score: 650, // Placeholder - could be from tenant profile
    rent_amount: 1500, // Placeholder - could be from lease data
  };

  try {
    // Call ML API for prediction
    const response = await axios.post<TenantPredictionResponse>(
      `${ML_API_URL}/api/predict/tenant-issue`,
      requestData,
      {
        timeout: ML_API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.prediction;
  } catch (error) {
    // Fallback to rule-based prediction if ML API is unavailable
    console.warn('ML API unavailable, using fallback rule-based prediction:', error);
    
    const frequentIssues = maintenanceRequests.length > 5;
    const riskScore = calculateRiskScore(latePayments, missedPayments, frequentIssues);

    if (riskScore > 0.5) {
      return {
        issue: 'High risk of lease termination',
        confidence: 0.85,
        risk_score: riskScore,
        model_used: 'rule_based_fallback',
      };
    }

    return {
      issue: 'Low risk',
      confidence: 0.95,
      risk_score: riskScore,
      model_used: 'rule_based_fallback',
    };
  }
};

/**
 * Calculate risk score based on payment and maintenance history
 */
function calculateRiskScore(
  latePayments: number,
  missedPayments: number,
  frequentIssues: boolean
): number {
  let score = 0.0;

  // Late payments contribute to risk
  if (latePayments > 0) {
    score += latePayments * 0.15;
  }

  // Missed payments are more serious
  if (missedPayments > 0) {
    score += missedPayments * 0.25;
  }

  // Frequent maintenance issues
  if (frequentIssues) {
    score += 0.20;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Calculate months since a given date
 */
function calculateMonthsSince(date: Date): number {
  const now = new Date();
  const start = new Date(date);
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(months, 0);
}
