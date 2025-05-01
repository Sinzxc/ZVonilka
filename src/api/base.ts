/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { IApiError } from "../types/errorTypes";

export const API_URL = `${import.meta.env.VITE_PUBLIC_API_URL}/Api`;

let token: string | null = null;
if (typeof window !== "undefined") {
  token = localStorage.getItem("token");
}

class ApiInstance {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private handleError = async (response: Response): Promise<never> => {
    const apiError: IApiError = {
      message: "Произошла ошибка при выполнении запроса",
      code: response.status,
    };

    try {
      const data = await response.json();
      apiError.message = data?.message || apiError.message;
      apiError.data = data;
    } catch {
      apiError.message = "Сервер не отвечает";
    }

    return Promise.reject(apiError);
  };

  private async fetchWithError<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Check if the body is FormData
    const isFormData = options.body instanceof FormData;

    const headers = isFormData
      ? { Authorization: `Bearer ${token}` }
      : this.defaultHeaders;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    return data;
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithError<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.fetchWithError<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.fetchWithError<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async uploadAvatar<T>(
    endpoint: string,
    file: File,
    options: RequestInit = {}
  ): Promise<T> {
    if (!file) {
      throw new Error("No file provided");
    }

    const formData = new FormData();
    formData.append("avatar", file); // The key must match the backend parameter name 'avatar'

    return this.fetchWithError<T>(endpoint, {
      ...options,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Remove Content-Type to let browser set it correctly for FormData
      },
      body: formData,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithError<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  async externalGet<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();

    return data;
  }
}

export const apiInstance = new ApiInstance();
