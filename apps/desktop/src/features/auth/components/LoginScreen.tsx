import { useTranslation } from '@jrs/client-core';
import type { IAuthUser } from '@jrs/shared';
import {
  ArrowRight,
  At,
  Check,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Info,
  Lock,
  Phone,
  WarningCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import appLogo from '../../../assets/app-logo.jpg';
import fellowshipHero from '../../../assets/fellowship-hero.jpg';
import { LanguageToggle } from '../../../components/LanguageToggle';
import { APP_VERSION } from '../../../constants/version';
import { useLogin } from '../hooks/use-login';
import { AccountRevokedModal } from './AccountRevokedModal';

interface LoginScreenProps {
  onRequiresPasswordChange: (data: {
    setupToken: string;
    user: IAuthUser;
  }) => void;
  onForgotPasswordClick?: (identifier: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRequiresPasswordChange,
  onForgotPasswordClick,
}) => {
  const { t } = useTranslation();
  const {
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
  } = useLogin({
    onRequiresPasswordChange,
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fdfbf9]">
      {/* Full 50% Left Side: Edge-to-Edge Clean Hero Image */}
      <div className="relative hidden h-full w-1/2 overflow-hidden lg:block">
        <img
          src={fellowshipHero}
          alt="Youth Community gathering"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Full 50% Right Side: Form Container */}
      <div className="relative flex h-full w-full flex-col justify-center overflow-y-auto px-6 sm:px-12 lg:w-1/2 lg:px-10 xl:px-16">
        {/* Floating Language Switcher */}
        <div className="absolute top-6 right-8 z-10">
          <LanguageToggle showIcon />
        </div>

        <div className="mx-auto w-full max-w-xl py-8">
          <div className="bg-white rounded-2xl border border-[#e8e1dd] p-6 sm:p-10 shadow-sm flex flex-col">
            {/* Brand Logo & Header */}
            <div className="mb-7">
              <div className="mb-5 flex items-center">
                <img
                  src={appLogo}
                  alt="JRS Portal"
                  className="h-9 w-auto object-contain rounded-md"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1e1b19] sm:text-3xl">
                {t('auth:login.title')}
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#57423b]">
                {t('auth:login.subtitle')}
              </p>
            </div>

            {/* First-time logging in info box */}
            <div className="mb-6 rounded-xl border border-[#eddcd4] bg-[#faf2ee] p-4 text-xs text-[#57423b]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#983912]">
                  <Info size={17} weight="bold" />
                </div>
                <div>
                  <p className="font-semibold text-[#1e1b19]">
                    {t('auth:login.firstTimeNoticeTitle')}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[#57423b]">
                    {t('auth:login.firstTimeNoticeDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 rounded-lg border border-[#ba1a1a]/20 bg-[#ffdad6] p-3.5 text-xs text-[#93000a]">
                <div className="flex items-start gap-2.5">
                  <WarningCircle
                    size={18}
                    weight="fill"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                    {isTempExpired && (
                      <button
                        type="button"
                        onClick={() => onForgotPasswordClick?.(identifier)}
                        className="mt-1 inline-flex items-center text-xs font-bold underline hover:text-[#ba1a1a]"
                      >
                        {t('auth:login.resetNow')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold text-[#1e1b19]"
                >
                  {t('auth:login.identifierLabel')}{' '}
                  <span className="text-[#b85028]">*</span>
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8a726a]">
                    {isPhoneInput ? (
                      <Phone size={18} weight="bold" />
                    ) : isEmailInput ? (
                      <EnvelopeSimple size={18} weight="bold" />
                    ) : (
                      <At size={18} weight="bold" />
                    )}
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('auth:login.identifierPlaceholder')}
                    className="w-full h-11 rounded-md border border-[#e8e1dd] bg-[#faf2ee] pl-10 pr-3.5 text-xs text-[#1e1b19] placeholder-[#8a726a] transition focus:bg-white focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/15"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#8a726a]">
                  {t('auth:login.identifierHelper')}
                </p>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-[#1e1b19]"
                  >
                    {t('auth:login.passwordLabel')}{' '}
                    <span className="text-[#b85028]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onForgotPasswordClick?.(identifier)}
                    className="text-xs font-semibold text-[#b85028] transition hover:text-[#983912]"
                  >
                    {t('auth:login.forgotPassword')}
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8a726a]">
                    <Lock size={18} weight="bold" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth:login.passwordPlaceholder')}
                    className="w-full h-11 rounded-md border border-[#e8e1dd] bg-[#faf2ee] pl-10 pr-11 text-xs text-[#1e1b19] placeholder-[#8a726a] transition focus:bg-white focus:border-[#b85028] focus:outline-none focus:ring-2 focus:ring-[#b85028]/15"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8a726a] hover:text-[#1e1b19]"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} weight="bold" />
                    ) : (
                      <Eye size={18} weight="bold" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keep me signed in Checkbox */}
              <div className="pt-0.5">
                <label
                  htmlFor="keepSignedIn"
                  className="inline-flex cursor-pointer items-center gap-2.5"
                >
                  <input
                    type="checkbox"
                    id="keepSignedIn"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                      keepSignedIn
                        ? 'border-[#43664d] bg-[#43664d] text-white'
                        : 'border-[#ddc0b7] bg-white text-transparent'
                    }`}
                  >
                    <Check size={12} weight="bold" />
                  </div>
                  <span className="text-xs font-medium text-[#1e1b19]">
                    {t('auth:login.keepSignedIn')}
                  </span>
                </label>
              </div>

              {/* Primary Action Button: "Sign In →" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim() || !password}
                  className="flex w-full h-11 items-center justify-center gap-2 rounded-md bg-[#b85028] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#983912] active:bg-[#812901] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <CircleNotch size={18} className="animate-spin" />
                      <span>{t('auth:login.signingIn')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth:login.signInButton')}</span>
                      <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Version Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-[#8a726a] select-none">
            <span className="font-medium text-[#57423b]">JRS Portal</span>
            <span className="text-[#8a726a]/50">•</span>
            <span className="px-2 py-0.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] font-bold text-[11px]">
              v{APP_VERSION}
            </span>
            <span className="text-[#8a726a]/50">•</span>
            <span>Desktop Edition</span>
          </div>
        </div>
      </div>

      {/* Account Revoked Modal (403 Handler) */}
      <AccountRevokedModal
        isOpen={isRevokedModalOpen}
        onAcknowledge={closeRevokedModal}
      />
    </div>
  );
};
