import { AbstractConnector, ConnectorType, ConnectorConfig, SyncResult, WebhookPayload } from '../connectorFramework';

export interface BackgroundCheckRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyId: string;
  unitId: string;
  requestType: 'standard' | 'premium' | 'express';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: BackgroundCheckResult;
  requestedAt: string;
  completedAt?: string;
}

export interface BackgroundCheckResult {
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  criminalRecords: CriminalRecord[];
  creditScore?: number;
  employmentVerification: EmploymentVerification[];
  referenceChecks: ReferenceCheck[];
  reportUrl?: string;
  expiresAt: string;
}

export interface CriminalRecord {
  type: string;
  date: string;
  location: string;
  status: 'verified' | 'unverified';
  details?: string;
}

export interface EmploymentVerification {
  employer: string;
  position: string;
  startDate: string;
  endDate?: string;
  verified: boolean;
  contactInfo?: string;
}

export interface ReferenceCheck {
  name: string;
  relationship: string;
  contactInfo: string;
  verified: boolean;
  comments?: string;
}

export class BackgroundCheckConnector extends AbstractConnector {
  readonly type: ConnectorType = 'background_check';
  readonly provider: string;

  constructor(provider: string, config: ConnectorConfig) {
    super(config);
    this.provider = provider;
  }

  async validateConfig(): Promise<boolean> {
    const { apiKey, apiSecret } = this.config.credentials;

    if (!apiKey) {
      throw new Error('API key is required for background check connector');
    }

    if (this.provider === 'transunion' && !apiSecret) {
      throw new Error('API secret is required for TransUnion connector');
    }

    return true;
  }

  async testConnection(): Promise<void> {
    // Test the connection by making a simple API call
    const response = await this.makeRequest('/health', 'GET');

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.statusText}`);
    }
  }

  async performSync(): Promise<Omit<SyncResult, 'duration' | 'timestamp'>> {
    try {
      // Get pending background check requests
      const pendingRequests = await this.getPendingRequests();

      let processed = 0;
      const errors: string[] = [];

      for (const request of pendingRequests) {
        try {
          await this.processBackgroundCheck(request);
          processed++;
        } catch (error) {
          const errorMsg = `Failed to process request ${request.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        recordsProcessed: processed,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      };
    }
  }

  private async getPendingRequests(): Promise<BackgroundCheckRequest[]> {
    // This would typically fetch from your database
    // For now, return mock data
    return [
      {
        id: 'req_1',
        tenantId: 'tenant_1',
        tenantName: 'John Doe',
        tenantEmail: 'john@example.com',
        propertyId: 'prop_1',
        unitId: 'unit_1',
        requestType: 'standard',
        status: 'pending',
        requestedAt: new Date().toISOString(),
      },
    ];
  }

  private async processBackgroundCheck(request: BackgroundCheckRequest): Promise<void> {
    // Submit background check to provider
    const payload = {
      applicant: {
        firstName: request.tenantName.split(' ')[0],
        lastName: request.tenantName.split(' ').slice(1).join(' '),
        email: request.tenantEmail,
        phone: request.tenantPhone,
      },
      package: request.requestType,
    };

    const response = await this.makeRequest('/background-checks', 'POST', payload);

    if (!response.ok) {
      throw new Error(`Background check submission failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Update request status
    await this.updateRequestStatus(request.id, 'processing', result.id);
  }

  private async updateRequestStatus(
    requestId: string,
    status: BackgroundCheckRequest['status'],
    providerRequestId?: string
  ): Promise<void> {
    // This would update your database
    console.log(`Updating request ${requestId} to status ${status}`);
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    if (payload.event === 'background_check_completed') {
      const { requestId, results } = payload.data;

      // Process the completed background check
      await this.processCompletedCheck(requestId, results);
    }
  }

  private async processCompletedCheck(requestId: string, results: any): Promise<void> {
    // Transform provider results to our format
    const transformedResults: BackgroundCheckResult = {
      overallScore: this.calculateOverallScore(results),
      riskLevel: this.determineRiskLevel(results),
      criminalRecords: results.criminalRecords || [],
      creditScore: results.creditScore,
      employmentVerification: results.employmentVerification || [],
      referenceChecks: results.referenceChecks || [],
      reportUrl: results.reportUrl,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };

    // Update the request with results
    await this.updateRequestStatus(requestId, 'completed');
    // Save results to database
    console.log(`Background check completed for request ${requestId}:`, transformedResults);
  }

  private calculateOverallScore(results: any): number {
    // Implement scoring logic based on provider results
    let score = 100;

    if (results.criminalRecords?.length > 0) {
      score -= results.criminalRecords.length * 10;
    }

    if (results.creditScore && results.creditScore < 600) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(results: any): 'low' | 'medium' | 'high' {
    const score = this.calculateOverallScore(results);

    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<Response> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.credentials.apiKey}`,
    };

    if (this.provider === 'transunion' && this.config.credentials.apiSecret) {
      headers['X-API-Secret'] = this.config.credentials.apiSecret;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return response;
  }

  private getBaseUrl(): string {
    switch (this.provider) {
      case 'transunion':
        return 'https://api.transunion.com';
      case 'experian':
        return 'https://api.experian.com';
      case 'equifax':
        return 'https://api.equifax.com';
      default:
        return 'https://api.backgroundcheck.com';
    }
  }

  // Public methods for external use
  async submitBackgroundCheck(request: Omit<BackgroundCheckRequest, 'id' | 'status' | 'requestedAt'>): Promise<string> {
    const backgroundCheckRequest: BackgroundCheckRequest = {
      ...request,
      id: `bg_${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    await this.processBackgroundCheck(backgroundCheckRequest);
    return backgroundCheckRequest.id;
  }

  async getBackgroundCheckResults(requestId: string): Promise<BackgroundCheckResult | null> {
    // Fetch results from database
    return null; // Mock implementation
  }

  async getSupportedPackages(): Promise<string[]> {
    return ['standard', 'premium', 'express'];
  }
}

// Factory function to create background check connectors
export function createBackgroundCheckConnector(provider: string, config: ConnectorConfig): BackgroundCheckConnector {
  return new BackgroundCheckConnector(provider, config);
}