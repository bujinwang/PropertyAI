import api from './api';
import { Application, ApplicationFormData } from '../types/tenantScreening';

const getApplications = async (): Promise<Application[]> => {
  try {
    const response = await api.get<Application[]>('/tenant-screening/applications');
    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
};

const getApplicationById = async (id: string): Promise<Application> => {
  try {
    const response = await api.get<Application>(`/tenant-screening/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw error;
  }
};

const createApplication = async (applicationData: ApplicationFormData): Promise<Application> => {
  try {
    const response = await api.post<Application>('/tenant-screening/applications', applicationData);
    return response.data;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

const updateApplication = async (id: string, applicationData: Partial<ApplicationFormData>): Promise<Application> => {
  try {
    const response = await api.put<Application>(`/tenant-screening/applications/${id}`, applicationData);
    return response.data;
  } catch (error) {
    console.error(`Error updating application ${id}:`, error);
    throw error;
  }
};

const deleteApplication = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tenant-screening/applications/${id}`);
  } catch (error) {
    console.error(`Error deleting application ${id}:`, error);
    throw error;
  }
};

const submitBackgroundCheck = async (id: string): Promise<Application> => {
  try {
    const response = await api.post<Application>(`/tenant-screening/applications/${id}/background-check`);
    return response.data;
  } catch (error) {
    console.error(`Error submitting background check for application ${id}:`, error);
    throw error;
  }
};

const approveApplication = async (id: string): Promise<Application> => {
  try {
    const response = await api.post<Application>(`/tenant-screening/applications/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Error approving application ${id}:`, error);
    throw error;
  }
};

const rejectApplication = async (id: string, reason: string): Promise<Application> => {
  try {
    const response = await api.post<Application>(`/tenant-screening/applications/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting application ${id}:`, error);
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
};

export default tenantScreeningService; 