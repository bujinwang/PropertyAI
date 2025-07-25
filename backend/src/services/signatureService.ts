import * as docusign from 'docusign-esign';

class SignatureService {
  private apiClient: any;

  constructor() {
    this.apiClient = new docusign.ApiClient();
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
    const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = 'Please sign this document';
    envelopeDefinition.documents = [
      {
        documentBase64: '<DOCUMENT_BASE64>',
        name: 'Document',
        fileExtension: 'pdf',
        documentId: '1',
      },
    ];
    envelopeDefinition.recipients = docusign.Recipients.constructFromObject({
      signers: [
        {
          email: signerEmail,
          name: signerName,
          recipientId: '1',
          routingOrder: '1',
        },
      ],
    });
    envelopeDefinition.status = 'sent';

    const results = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID!,
      {
        envelopeDefinition,
      }
    );

    return results;
  }
}

export default new SignatureService();
