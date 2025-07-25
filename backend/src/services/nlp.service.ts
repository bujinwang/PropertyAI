import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

class NlpService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!config.google.apiKey) {
      throw new Error('Google API key is not defined in config.');
    }
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Extracts key details from a maintenance request description using AI.
   *
   * @param description The raw text from the maintenance request.
   * @returns An object containing the extracted priority and category.
   */
  public async extractDetails(description: string): Promise<{ priority: string; category: string }> {
    console.log(`Analyzing description with Gemini: "${description}"`);

    const prompt = `Analyze the following maintenance request description and extract the most appropriate priority (LOW, MEDIUM, HIGH, EMERGENCY) and category (e.g., PLUMBING, ELECTRICAL, HVAC, GENERAL, LOCKOUT, EMERGENCY). Return the response as a JSON object with 'priority' and 'category' keys. If a category is not explicitly mentioned or clearly implied, use 'GENERAL'.

Maintenance Request: "${description}"

Example Output: {"priority": "HIGH", "category": "PLUMBING"}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Attempt to parse the JSON response from the model
      const parsedResponse = JSON.parse(text);

      let priority = parsedResponse.priority || 'MEDIUM';
      let category = parsedResponse.category || 'GENERAL';

      // Basic validation for extracted values
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
      const validCategories = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'GENERAL', 'LOCKOUT', 'EMERGENCY'];

      if (!validPriorities.includes(priority.toUpperCase())) {
        priority = 'MEDIUM'; // Default to MEDIUM if invalid
      }
      if (!validCategories.includes(category.toUpperCase())) {
        category = 'GENERAL'; // Default to GENERAL if invalid
      }

      console.log(`Extracted Details by Gemini: Priority - ${priority}, Category - ${category}`);
      return { priority: priority.toUpperCase(), category: category.toUpperCase() };
    } catch (error) {
      console.error('Error extracting details with Gemini:', error);
      // Fallback to default or basic logic if AI fails
      const lowerCaseDescription = description.toLowerCase();
      let priority = 'MEDIUM';
      let category = 'GENERAL';

      if (lowerCaseDescription.includes('fire') || lowerCaseDescription.includes('gas')) {
        priority = 'EMERGENCY';
        category = 'EMERGENCY';
      } else if (lowerCaseDescription.includes('flood') || lowerCaseDescription.includes('leak')) {
        priority = 'HIGH';
        category = 'PLUMBING';
      } else if (lowerCaseDescription.includes('power') || lowerCaseDescription.includes('electrical')) {
        priority = 'HIGH';
        category = 'ELECTRICAL';
      } else if (lowerCaseDescription.includes('lock') || lowerCaseDescription.includes('locked out')) {
        priority = 'HIGH';
        category = 'LOCKOUT';
      } else if (lowerCaseDescription.includes('heat') || lowerCaseDescription.includes('ac')) {
        priority = 'MEDIUM';
        category = 'HVAC';
      }
      console.log(`Extracted Details by Fallback: Priority - ${priority}, Category - ${category}`);
      return { priority, category };
    }
  }
}

export const nlpService = new NlpService();