import type {
  IForgotPasswordResponse,
  ILoginResponse,
  IResetPasswordResponse,
  IVerifyResetCodeResponse,
} from '@jrs/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth.context';
import { useHttp } from '../context/http.context';

export interface ILoginCredentials {
  identifier: string;
  password: string;
}

export interface ICompleteSetupDto {
  newPassword: string;
}

export interface IForgotPasswordDto {
  identifier: string;
  channel?: 'whatsapp' | 'email' | 'auto';
}

export interface IVerifyResetCodeDto {
  identifier: string;
  code: string;
}

export interface IResetPasswordDto {
  resetToken: string;
  newPassword: string;
}

export interface IChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export function useLoginMutation() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: ({ identifier, password }: ILoginCredentials) =>
      signIn(identifier, password),
  });
}

export function useCompleteSetupMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ICompleteSetupDto) =>
      http.post<ILoginResponse>('/auth/complete-setup', dto),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useForgotPasswordMutation() {
  const http = useHttp();

  return useMutation({
    mutationFn: (dto: IForgotPasswordDto) =>
      http.post<IForgotPasswordResponse>('/auth/forgot-password', dto),
  });
}

export function useVerifyResetCodeMutation() {
  const http = useHttp();

  return useMutation({
    mutationFn: (dto: IVerifyResetCodeDto) =>
      http.post<IVerifyResetCodeResponse>('/auth/verify-reset-code', dto),
  });
}

export function useResetPasswordMutation() {
  const http = useHttp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: IResetPasswordDto) =>
      http.post<IResetPasswordResponse>('/auth/reset-password', dto),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePasswordMutation() {
  const http = useHttp();

  return useMutation({
    mutationFn: (dto: IChangePasswordDto) =>
      http.post<{ success: boolean; message: string }>(
        '/auth/change-password',
        dto,
      ),
  });
}

export function useLogoutMutation() {
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: () => signOut(),
  });
}
