import * as docusign from 'docusign-esign'; // Import as namespace
import { prisma } from '../config/database';
import { DocumentType } from '@prisma/client';
import { Buffer } from 'buffer';

interface DocuSignConfig {
  integrationKey: string;
  secretKey: string;
  redirectUri: string;
  accountId: string;
  baseUrl: string;
}

interface SignerInfo {
  email: string;
  name: string;
  clientUserId: string;
  tabs?: {
    signHereTabs?: Array<{
      documentId: string;
      pageNumber: number;
      xPosition: number;
      yPosition: number;
    }>;
    dateSignedTabs?: Array<{
      documentId: string;
      pageNumber: number;
      xPosition: number;
      yPosition: number;
    }>;
  };
}

interface EnvelopeData {
  templateId?: string;
  document: {
    name: string;
    fileExtension: string;
    documentBase64: string;
    documentId: string;
  };
  signers: SignerInfo[];
  emailSubject: string;
  emailBody?: string;
  status: 'sent' | 'created';
}

class DocuSignService {
  private config: DocuSignConfig;
  private apiClient: any; // Cast to any due to persistent TS2694
  private accessToken: string | null = null;

  constructor(config: DocuSignConfig) {
    this.config = config;
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(config.baseUrl);
  }

  public getAuthUrl(): string {
    const scopes = ['signature', 'impersonation'];
    
    return this.apiClient.getAuthorizationUri(
      this.config.integrationKey,
      scopes,
      this.config.redirectUri,
      'code'
    );
  }

  public async handleCallback(code: string): Promise<string> {
    try {
      const response = await this.apiClient.generateAccessToken(
        this.config.integrationKey,
        this.config.secretKey,
        code
      );

      this.accessToken = response.accessToken;
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${this.accessToken}`);
      
      if (!this.accessToken) {
        throw new Error('DocuSign access token is null');
      }
      return this.accessToken;
    } catch (error) {
      console.error('Error handling DocuSign callback:', error);
      throw new Error('Failed to authenticate with DocuSign');
    }
  }

  public async createEnvelope(envelopeData: EnvelopeData): Promise<string> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.emailSubject = envelopeData.emailSubject;
      envelopeDefinition.emailBody = envelopeData.emailBody || '';
      envelopeDefinition.status = envelopeData.status;

      if (envelopeData.templateId) {
        envelopeDefinition.templateId = envelopeData.templateId;
      } else {
        const document = new docusign.Document();
        document.documentBase64 = envelopeData.document.documentBase64;
        document.name = envelopeData.document.name;
        document.fileExtension = envelopeData.document.fileExtension;
        document.documentId = envelopeData.document.documentId;
        envelopeDefinition.documents = [document];
      }

      const recipients = new docusign.Recipients();
      const signers = envelopeData.signers.map((signerInfo, index) => {
        const signer = new docusign.Signer();
        signer.email = signerInfo.email;
        signer.name = signerInfo.name;
        signer.clientUserId = signerInfo.clientUserId;
        signer.recipientId = (index + 1).toString();

        if (signerInfo.tabs) {
          const tabs = new docusign.Tabs();
          
          if (signerInfo.tabs.signHereTabs) {
            tabs.signHereTabs = signerInfo.tabs.signHereTabs.map(tab => {
              const signHere = new docusign.SignHere();
              signHere.documentId = tab.documentId;
              signHere.pageNumber = tab.pageNumber.toString();
              signHere.xPosition = tab.xPosition.toString();
              signHere.yPosition = tab.yPosition.toString();
              return signHere;
            });
          }

          if (signerInfo.tabs.dateSignedTabs) {
            tabs.dateSignedTabs = signerInfo.tabs.dateSignedTabs.map(tab => {
              const dateSigned = new docusign.DateSigned();
              dateSigned.documentId = tab.documentId;
              dateSigned.pageNumber = tab.pageNumber.toString();
              dateSigned.xPosition = tab.xPosition.toString();
              dateSigned.yPosition = tab.yPosition.toString();
              return dateSigned;
            });
          }

          signer.tabs = tabs;
        }

        return signer;
      });

      recipients.signers = signers;
      envelopeDefinition.recipients = recipients;

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelopeSummary = await envelopesApi.createEnvelope(
        this.config.accountId,
        { envelopeDefinition }
      );

      return envelopeSummary.envelopeId!;
    } catch (error) {
      console.error('Error creating DocuSign envelope:', error);
      throw new Error('Failed to create envelope');
    }
  }

  public async getEnvelope(envelopeId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(this.config.accountId, envelopeId);
      return envelope;
    } catch (error) {
      console.error('Error getting DocuSign envelope:', error);
      throw new Error('Failed to get envelope');
    }
  }

  public async getEnvelopeDocuments(envelopeId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const documents = await envelopesApi.listDocuments(this.config.accountId, envelopeId);
      return documents;
    } catch (error) {
      console.error('Error getting DocuSign documents:', error);
      throw new Error('Failed to get documents');
    }
  }

  public async getEnvelopeRecipients(envelopeId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const recipients = await envelopesApi.listRecipients(this.config.accountId, envelopeId);
      return recipients;
    } catch (error) {
      console.error('Error getting DocuSign recipients:', error);
      throw new Error('Failed to get recipients');
    }
  }

  public async createEmbeddedSigningUrl(
    envelopeId: string,
    signerEmail: string,
    signerName: string,
    clientUserId: string,
    returnUrl: string
  ): Promise<string> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const recipientViewRequest = new docusign.RecipientViewRequest();
      recipientViewRequest.returnUrl = returnUrl;
      recipientViewRequest.authenticationMethod = 'email';
      recipientViewRequest.email = signerEmail;
      recipientViewRequest.userName = signerName;
      recipientViewRequest.clientUserId = clientUserId;

      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const recipientView = await envelopesApi.createRecipientView(
        this.config.accountId,
        envelopeId,
        { recipientViewRequest }
      );

      return recipientView.url!;
    } catch (error) {
      console.error('Error creating embedded signing URL:', error);
      throw new Error('Failed to create signing URL');
    }
  }

  public async sendEnvelope(envelopeId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      await envelopesApi.update(
        this.config.accountId,
        envelopeId,
        {
          envelope: {
            status: 'sent'
          }
        }
      );
    } catch (error) {
      console.error('Error sending envelope:', error);
      throw new Error('Failed to send envelope');
    }
  }

  public async voidEnvelope(envelopeId: string, voidReason: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      await envelopesApi.update(
        this.config.accountId,
        envelopeId,
        {
          envelope: {
            status: 'voided',
            voidedReason: voidReason
          }
        }
      );
    } catch (error) {
      console.error('Error voiding envelope:', error);
      throw new Error('Failed to void envelope');
    }
  }

  public async downloadDocument(envelopeId: string, documentId: string): Promise<Buffer> {
    if (!this.accessToken) {
      throw new Error('DocuSign not authenticated');
    }

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const document = await envelopesApi.getDocument(
        this.config.accountId,
        envelopeId,
        documentId
      );

      return Buffer.from(document.data, 'binary');
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  public async createLeaseTemplate(
    leaseData: {
      landlordName: string;
      landlordEmail: string;
      tenantName: string;
      tenantEmail: string;
      propertyAddress: string;
      leaseStartDate: string;
      leaseEndDate: string;
      monthlyRent: number;
      securityDeposit: number;
      leaseTerms: string;
    }
  ): Promise<string> {
    const documentContent = this.generateLeaseTemplate(leaseData);
    
    const envelopeData: EnvelopeData = {
      document: {
        name: 'Lease Agreement',
        fileExtension: 'pdf',
        documentBase64: Buffer.from(documentContent).toString('base64'),
        documentId: '1'
      },
      signers: [
        {
          email: leaseData.landlordEmail,
          name: leaseData.landlordName,
          clientUserId: 'landlord',
          tabs: {
            signHereTabs: [
              {
                documentId: '1',
                pageNumber: 2,
                xPosition: 100,
                yPosition: 600
              }
            ],
            dateSignedTabs: [
              {
                documentId: '1',
                pageNumber: 2,
                xPosition: 100,
                yPosition: 650
              }
            ]
          }
        },
        {
          email: leaseData.tenantEmail,
          name: leaseData.tenantName,
          clientUserId: 'tenant',
          tabs: {
            signHereTabs: [
              {
                documentId: '1',
                pageNumber: 2,
                xPosition: 100,
                yPosition: 700
              }
            ],
            dateSignedTabs: [
              {
                documentId: '1',
                pageNumber: 2,
                xPosition: 100,
                yPosition: 750
              }
            ]
          }
        }
      ],
      emailSubject: 'Lease Agreement for Signature',
      emailBody: 'Please review and sign the lease agreement.',
      status: 'sent'
    };

    return this.createEnvelope(envelopeData);
  }

  private generateLeaseTemplate(leaseData: any): string {
    return `
      LEASE AGREEMENT
      
      This Lease Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()} by and between:
      
      Landlord: ${leaseData.landlordName} (${leaseData.landlordEmail})
      Tenant: ${leaseData.tenantName} (${leaseData.tenantEmail})
      
      Property Address: ${leaseData.propertyAddress}
      
      Lease Terms:
      - Start Date: ${leaseData.leaseStartDate}
      - End Date: ${leaseData.leaseEndDate}
      - Monthly Rent: $${leaseData.monthlyRent}
      - Security Deposit: $${leaseData.securityDeposit}
      - Additional Terms: ${leaseData.leaseTerms}
      
      The parties agree to the terms set forth in this lease agreement.
      
      Landlord Signature: _____________________ Date: _________
      Tenant Signature: ______________________ Date: _________
    `;
  }

  public async storeEnvelope(envelopeId: string, documentId: string, leaseId: string): Promise<void> {
    const envelope = await this.getEnvelope(envelopeId);
    const documents = await this.getEnvelopeDocuments(envelopeId);
    
    await prisma.document.create({
      data: {
        name: 'Lease Agreement',
        type: DocumentType.LEASE,
        url: `docusign://${envelopeId}/${documentId}`,
        leaseId: leaseId,
        uploadedById: 'system', // This should be the current user ID
        description: 'Lease agreement created via DocuSign'
      }
    });
  }
}

const docuSignService = new DocuSignService({
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY!,
  secretKey: process.env.DOCUSIGN_SECRET_KEY!,
  redirectUri: process.env.DOCUSIGN_REDIRECT_URI!,
  accountId: process.env.DOCUSIGN_ACCOUNT_ID!,
  baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://account.docusign.com'
});

export { docuSignService, DocuSignService };