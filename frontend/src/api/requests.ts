import api from "@/api/axios";

import type { LoginFormValues, RegisterFormValues } from "@/shared/schemas/auth.schema";
import type { AuthResponse } from "@/types/api.types";

export const loginUser = (data: LoginFormValues) => api.post<AuthResponse>('/auth/login', data).then(r => r.data);
export const registerUser = (data: RegisterFormValues) => api.post<AuthResponse>('/auth/register', data).then(r => r.data);