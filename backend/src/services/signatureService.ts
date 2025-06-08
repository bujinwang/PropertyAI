import { DocuSign } from 'docusign-esign';

class SignatureService {
  private apiClient: DocuSign.ApiClient;

  constructor() {
    this.apiClient = new DocuSign.ApiClient();
    this.apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH!);
    this.apiClient.addDefaultHeader(
      'Authorization',
      `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`
    );
  }

  async sendForSignature(
    documentId: string,
    signerEmail: string,
    signerName: string
  ) {
    // This is a placeholder for the actual implementation
    console.log(
      `Sending document ${documentId} to ${signerName} <${signerEmail}> for signature`
    );
  }
}

export default new SignatureService();
