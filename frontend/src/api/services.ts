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

interface ServicesResponse {
  success: true;
  data: Service[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ServiceResponse {
  success: true;
  data: Service;
}
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export const servicesApi = {
  async list(businessId: string): Promise<Service[]> {
    const response = await apiClient.get<ServicesResponse>(
      `/businesses/${businessId}/services`,
    );

    return response.data.data;
  },

  async getById(
    businessId: string,
    serviceId: string,
  ): Promise<Service> {
    const response = await apiClient.get<ServiceResponse>(
      `/businesses/${businessId}/services/${serviceId}`,
    );

    return response.data.data;
  },
};