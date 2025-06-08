import { Application } from '@prisma/client';
import { AppError } from '../middleware/errorMiddleware';

const TRANSUNION_API_URL = 'https://api.transunion.com/v1';

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${process.env.TRANSUNION_API_KEY}`,
  'Content-Type': 'application/json',
});

export const performBackgroundCheck = async (application: Application): Promise<any> => {
  const response = await fetch(`${TRANSUNION_API_URL}/background-check`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      applicantId: application.applicantId,
      // ... other applicant data
    }),
  });

  if (!response.ok) {
    throw new AppError('Failed to perform background check', response.status);
  }

  return response.json();
};
