import { useAuth } from '@jrs/client-core';
import type { IAuthUser, ILoginResponse } from '@jrs/shared';
import type React from 'react';
import { useState } from 'react';
import {
  extractAuthErrorMessage,
  isAuthRevokedError,
  isAuthTempExpiredError,
} from '../utils/auth-error.utils';
import {
  isEmailIdentifier,
  isPhoneIdentifier,
} from '../utils/identifier.utils';

interface UseLoginOptions {
  onRequiresPasswordChange: (data: {
    setupToken: string;
    user: IAuthUser;
  }) => void;
}

export function useLogin({ onRequiresPasswordChange }: UseLoginOptions) {
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTempExpired, setIsTempExpired] = useState(false);
  const [isRevokedModalOpen, setIsRevokedModalOpen] = useState(false);

  const isEmailInput = isEmailIdentifier(identifier);
  const isPhoneInput = isPhoneIdentifier(identifier);

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const closeRevokedModal = () => setIsRevokedModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsTempExpired(false);

    try {
      const response: ILoginResponse = await signIn(
        identifier.trim(),
        password,
      );

      if (response.requiresPasswordChange && response.setupToken) {
        onRequiresPasswordChange({
          setupToken: response.setupToken,
          user: response.user,
        });
      }
    } catch (err: unknown) {
      if (isAuthRevokedError(err)) {
        setIsRevokedModalOpen(true);
      } else if (isAuthTempExpiredError(err)) {
        setIsTempExpired(true);
        setErrorMessage(
          'Your temporary password has expired. Please use Forgot Password or request a new invitation.',
        );
      } else {
        const errorObj = err as {
          statusCode?: number;
          status?: number;
          response?: { status?: number };
        };
        const status =
          errorObj?.statusCode ||
          errorObj?.status ||
          errorObj?.response?.status;

        if (status === 401) {
          setErrorMessage(
            'Invalid identifier or password. Please verify your credentials.',
          );
        } else {
          setErrorMessage(
            extractAuthErrorMessage(
              err,
              'Unable to connect to the authentication server. Please check your network.',
            ),
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    keepSignedIn,
    setKeepSignedIn,
    isLoading,
    errorMessage,
    isTempExpired,
    isRevokedModalOpen,
    closeRevokedModal,
    isEmailInput,
    isPhoneInput,
    handleSubmit,
  };
}
