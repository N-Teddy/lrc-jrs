import { useForgotPasswordMutation } from '@jrs/client-core';
import type React from 'react';
import { useState } from 'react';
import { extractAuthErrorMessage } from '../utils/auth-error.utils';
import {
  determineAuthChannel,
  isEmailIdentifier,
  isPhoneIdentifier,
  isValidIdentifier,
} from '../utils/identifier.utils';

interface UseForgotPasswordOptions {
  initialIdentifier?: string;
  onCodeSent: (
    identifier: string,
    channel: 'auto' | 'whatsapp' | 'email',
  ) => void;
}

export function useForgotPassword({
  initialIdentifier = '',
  onCodeSent,
}: UseForgotPasswordOptions) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotPasswordMutation = useForgotPasswordMutation();

  const isEmailInput = isEmailIdentifier(identifier);
  const isPhoneInput = isPhoneIdentifier(identifier);

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorMessage(
        'Please enter your registered phone number or email address.',
      );
      return;
    }

    if (!isValidIdentifier(cleanId)) {
      setErrorMessage(
        'Please enter a valid phone number (e.g. 693087159) or email address.',
      );
      return;
    }

    setErrorMessage(null);

    const determinedChannel = determineAuthChannel(cleanId);

    try {
      await forgotPasswordMutation.mutateAsync({
        identifier: cleanId,
        channel: determinedChannel,
      });

      onCodeSent(cleanId, determinedChannel);
    } catch (err: unknown) {
      const message = extractAuthErrorMessage(
        err,
        'Unable to request reset code. Please try again.',
      );
      setErrorMessage(message);
    }
  };

  return {
    identifier,
    isEmailInput,
    isPhoneInput,
    errorMessage,
    isPending: forgotPasswordMutation.isPending,
    handleIdentifierChange,
    handleSubmit,
  };
}
