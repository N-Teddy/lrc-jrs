import { useHttp, useTranslation } from '@jrs/client-core';
import type { IResetPasswordResponse } from '@jrs/shared';
import React, { useState } from 'react';
import { SetPermanentPasswordForm } from './SetPermanentPasswordForm';

interface ResetPasswordScreenProps {
  resetToken: string;
  identifier: string;
  onBackToSignIn: () => void;
  onPasswordResetComplete: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  resetToken,
  identifier,
  onBackToSignIn,
  onPasswordResetComplete,
}) => {
  const http = useHttp();
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResetPassword = async (newPassword: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await http.post<IResetPasswordResponse>('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      onPasswordResetComplete();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isFrench
          ? 'Impossible de réinitialiser le mot de passe. La session a peut-être expiré.'
          : 'Unable to reset password. The reset session may have expired.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SetPermanentPasswordForm
      title={isFrench ? 'Nouveau mot de passe' : 'Set New Password'}
      subtitle={
        isFrench
          ? `Choisissez un mot de passe sécurisé pour ${identifier}.`
          : `Choose a strong new password for ${identifier}.`
      }
      submitButtonText={
        isFrench
          ? 'Enregistrer le nouveau mot de passe'
          : 'Save New Password & Sign In'
      }
      onBack={onBackToSignIn}
      onSubmit={handleResetPassword}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  );
};
