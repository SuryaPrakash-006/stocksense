import { apiClient } from "@/lib/api-client";
import {
  AuthResponse,
  ForgotPasswordResponse,
  LoginCredentials,
  ResetPasswordPayload,
  SignupCredentials,
  User,
  VerifyOTPResponse,
} from "@/types/auth";

export const authService = {
  async register(credentials: SignupCredentials): Promise<User> {
    const response = await apiClient.post<User>("/auth/register", credentials);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", {
      email,
    });
    return response.data;
  },

  async verifyOtp(email: string, otp: string): Promise<VerifyOTPResponse> {
    const response = await apiClient.post<VerifyOTPResponse>("/auth/verify-otp", {
      email,
      otp,
    });
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>("/auth/reset-password", payload);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Clean locally even if network fails
    }
  },
};
