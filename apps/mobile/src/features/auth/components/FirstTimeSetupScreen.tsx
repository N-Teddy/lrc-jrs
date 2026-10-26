import { useAuth, useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import React, { useState } from 'react';
import { SetPermanentPasswordForm } from './SetPermanentPasswordForm';

interface FirstTimeSetupScreenProps {
  setupToken: string;
  user: IAuthUser;
  onCancel: () => void;
  onSetupComplete: () => void;
}

export const FirstTimeSetupScreen: React.FC<FirstTimeSetupScreenProps> = ({
  setupToken,
  user,
  onCancel,
  onSetupComplete,
}) => {
  const { completeSetup } = useAuth();
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (password: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await completeSetup(password, setupToken);
      onSetupComplete();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isFrench
          ? 'Impossible d’enregistrer le mot de passe permanent. Veuillez réessayer.'
          : 'Unable to set permanent password. Please try again.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SetPermanentPasswordForm
      title={
        isFrench
          ? `Bienvenue, ${user.fullName} !`
          : `Welcome, ${user.fullName}!`
      }
      subtitle={
        isFrench
          ? 'Créez votre mot de passe permanent pour finaliser la configuration de votre compte.'
          : 'Create your permanent password to complete your account setup.'
      }
      submitButtonText={
        isFrench ? 'Finaliser la configuration' : 'Complete Account Setup'
      }
      onBack={onCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      errorMessage={errorMessage}
    />
  );
};
