import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import fs from 'fs';

class DocumentVerificationService {
  private client: TextractClient;

  constructor() {
    this.client = new TextractClient({ region: 'us-east-1' });
  }

  async analyzeDocument(filePath: string) {
    const file = fs.readFileSync(filePath);

    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: file,
      },
      FeatureTypes: ['FORMS'],
    });

    const response = await this.client.send(command);
    return response;
  }
}

export default new DocumentVerificationService();
