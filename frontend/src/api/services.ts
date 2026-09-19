import { apiClient } from "./client";

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServicesResponse { success: true; data: Service[]; pagination?: { page: number; limit: number; total: number; totalPages: number; }; }
interface ServiceResponse { success: true; data: Service; }

export const servicesApi = {
  async list(businessId: string): Promise<Service[]> {
    const response = await apiClient.get<ServicesResponse>(`/businesses/${businessId}/services`);
    return response.data.data;
  },

  async getById(businessId: string, serviceId: string): Promise<Service> {
    const response = await apiClient.get<ServiceResponse>(`/businesses/${businessId}/services/${serviceId}`);
    return response.data.data;
  },

  async create(businessId: string, input: { name: string; description?: string }): Promise<Service> {
    const response = await apiClient.post<ServiceResponse>(`/businesses/${businessId}/services`, input);
    return response.data.data;
  },

  async update(businessId: string, serviceId: string, input: { name?: string; description?: string }): Promise<Service> {
    const response = await apiClient.patch<ServiceResponse>(`/businesses/${businessId}/services/${serviceId}`, input);
    return response.data.data;
  },
};