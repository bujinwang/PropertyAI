import api from './api';
import { Application, ApplicationFormData } from '../types/tenantScreening';

const getApplications = async (): Promise<Application[]> => {
  try {
    // Remove the '/tenant-screening' prefix
    const response = await api.get<Application[]>('/applications');
    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

const createApplication = async (applicationData: ApplicationFormData): Promise<Application> => {
  try {
    // Remove the '/tenant-screening' prefix
    const response = await api.post<Application>('/applications', applicationData);
    return response.data;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

const getApplicationById = async (id: string): Promise<Application> => {
  try {
    const response = await api.get<Application>(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw error;
  }
};

const updateApplication = async (id: string, applicationData: Partial<ApplicationFormData>): Promise<Application> => {
  try {
    const response = await api.put<Application>(`/applications/${id}`, applicationData);
    return response.data;
  } catch (error) {
    console.error(`Error updating application ${id}:`, error);
    throw error;
  }
};

// Removed duplicate declarations of getApplications and getApplicationById

const deleteApplication = async (id: string): Promise<void> => {
  try {
    await api.delete(`/applications/${id}`);
  } catch (error) {
    console.error(`Error deleting application ${id}:`, error);
    throw error;
  }
};

const submitBackgroundCheck = async (
  id: string
): Promise<{ transunionResult: any; experianResult: any }> => {
  try {
    const response = await api.post(`/background-checks`, { applicationId: id });
    return response.data;
  } catch (error) {
    console.error(`Error submitting background check for application ${id}:`, error);
    throw error;
  }
};

const approveApplication = async (id: string): Promise<Application> => {
  try {
    const response = await api.put<Application>(`/applications/${id}`, { status: 'approved' });
    return response.data;
  } catch (error) {
    console.error(`Error approving application ${id}:`, error);
    throw error;
  }
};

const rejectApplication = async (id: string, reason: string): Promise<Application> => {
  try {
    const response = await api.put<Application>(`/applications/${id}`, {
      status: 'rejected',
      rejectionReason: reason,
    });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting application ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches current issue alerts for tenant screening from the backend.
 * @returns A list of issue alerts.
 */
const getScreeningIssueAlerts = async (): Promise<any[]> => {
  try {
    // Backend mounts this under /api/tenants/tenant-screening/alerts
    const response = await api.get<any[]>('/tenants/tenant-screening/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching screening issue alerts:', error);
    throw error;
  }
};

const tenantScreeningService = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  submitBackgroundCheck,
  approveApplication,
  rejectApplication,
  getScreeningIssueAlerts,
};

export default tenantScreeningService;