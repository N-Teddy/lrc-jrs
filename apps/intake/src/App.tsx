import type { IRegistrationLinkPublicInfo } from '@jrs/shared';
import { MagnifyingGlass, Sparkle, WarningCircle } from '@phosphor-icons/react';
import React, { useCallback, useEffect, useState } from 'react';
import { IntakeExpired } from './components/IntakeExpired';
import { IntakeForm, type IntakeFormData } from './components/IntakeForm';
import { IntakeHeader } from './components/IntakeHeader';
import { IntakeSuccess } from './components/IntakeSuccess';
import { LanguageToggle, useTranslation } from './i18n';

export default function App() {
  const { t, language } = useTranslation();
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [linkInfo, setLinkInfo] = useState<IRegistrationLinkPublicInfo | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    referenceCode: string;
    fullName: string;
  } | null>(null);

  // Manual token input in case user opened root without path
  const [manualTokenInput, setManualTokenInput] = useState('');

  // Extract token from URL
  const extractTokenFromUrl = useCallback(() => {
    // 1. Check query parameter: ?token=XYZ
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get('token');
    if (queryToken?.trim()) return queryToken.trim();

    // 2. Check path pattern: /r/:token, /invite/:token, /register/:token
    const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const segments = pathname.split('/');
    if (
      segments.length >= 2 &&
      ['r', 'invite', 'register'].includes(segments[0])
    ) {
      return segments[1];
    }
    if (segments.length === 1 && segments[0].length >= 6) {
      return segments[0];
    }

    // 3. Check hash
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('token=')) {
      return hash.replace('token=', '');
    }

    return null;
  }, []);

  // Fetch Link Metadata
  const fetchLinkData = useCallback(
    async (linkToken: string) => {
      if (!linkToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      setSubmitError(null);

      try {
        const apiBase =
          (import.meta.env.VITE_API_URL as string | undefined)
            ?.trim()
            .replace(/\/+$/, '') || '/api';
        const endpoint = `${apiBase}/public/registration/${encodeURIComponent(linkToken)}`;
        const response = await fetch(endpoint);

        const contentType = response.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = {
              message: `Server error (${response.status} ${response.statusText})`,
            };
          }
        }

        if (!response.ok) {
          throw new Error(data?.message || t('error.linkInvalidOrExpired'));
        }

        setLinkInfo(data.data || data);
      } catch (err: any) {
        const msg =
          err.name === 'TypeError' || err.message === 'Failed to fetch'
            ? t('error.serverError')
            : err.message || t('error.linkInvalidOrExpired');
        setFetchError(msg);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const extracted = extractTokenFromUrl();
    if (extracted) {
      setToken(extracted);
      fetchLinkData(extracted);
    } else {
      setLoading(false);
    }
  }, [extractTokenFromUrl, fetchLinkData]);

  // Handle Form Submission
  const handleSubmit = async (formData: IntakeFormData) => {
    if (!token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const apiBase =
        (import.meta.env.VITE_API_URL as string | undefined)
          ?.trim()
          .replace(/\/+$/, '') || '/api';
      const endpoint = `${apiBase}/public/registration/${encodeURIComponent(token)}`;
      let response: Response;

      if (formData.avatarFile) {
        // Send as FormData
        const body = new FormData();
        body.append('fullName', formData.fullName);
        body.append('phoneNumber', formData.phoneNumber);
        if (formData.email) body.append('email', formData.email);
        body.append('dateOfBirth', formData.dateOfBirth);
        body.append('gender', formData.gender);
        if (formData.integrationDate)
          body.append('integrationDate', formData.integrationDate);
        if (formData.intakeNote) body.append('intakeNote', formData.intakeNote);
        body.append('avatar', formData.avatarFile);

        response = await fetch(endpoint, {
          method: 'POST',
          body,
        });
      } else {
        // Send as JSON
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            email: formData.email || undefined,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            integrationDate: formData.integrationDate || undefined,
            intakeNote: formData.intakeNote || undefined,
            avatarUrl: formData.avatarUrl || undefined,
          }),
        });
      }

      const contentType = response.headers.get('content-type') || '';
      let resData: any = null;
      if (contentType.includes('application/json')) {
        resData = await response.json();
      } else {
        const text = await response.text();
        try {
          resData = JSON.parse(text);
        } catch {
          resData = {
            message: `Submission failed (${response.status} ${response.statusText})`,
          };
        }
      }

      if (!response.ok) {
        throw new Error(resData?.message || t('error.checkInformation'));
      }

      const payload = resData.data || resData;
      setSubmissionSuccess({
        referenceCode:
          payload.referenceCode || `JRS-${Date.now().toString().slice(-6)}`,
        fullName: payload.fullName || formData.fullName,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(
        err.message ||
          'An error occurred while submitting your intake profile.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for manual token submit if landed on bare root
  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const cleanToken = manualTokenInput.trim();
    setToken(cleanToken);
    window.history.pushState({}, '', `/r/${cleanToken}`);
    fetchLinkData(cleanToken);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#23201E] flex flex-col justify-between selection:bg-[#B85028]/20 selection:text-[#B85028]">
      {/* Top Ambient Glow Banner */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-[#B85028]/8 via-[#B85028]/2 to-transparent pointer-events-none -z-10" />

      {/* Top Navbar with LRC branding and Language Toggle */}
      <header className="w-full border-b border-[#e8e1dd] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-13 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b85028]" />
            <span className="text-xs font-bold tracking-tight text-[#1e1b19] uppercase">
              LRC JRS
            </span>
            <span className="text-[10px] text-[#8a726a] font-medium hidden sm:inline">
              •{' '}
              {language === 'fr'
                ? "Portail d'inscription"
                : 'Member Registration Portal'}
            </span>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Loading Shimmer */}
        {loading && (
          <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full border-3 border-[#B85028]/20 border-t-[#B85028] animate-spin" />
            <p className="text-sm font-semibold text-[#5C554F]">
              {language === 'fr'
                ? "Chargement du portail d'inscription..."
                : 'Loading member intake portal...'}
            </p>
          </div>
        )}

        {/* No Token Provided Screen */}
        {!loading && !token && (
          <div className="w-full max-w-md mx-auto py-12 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-white border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shadow-xs mb-4">
              <Sparkle weight="fill" className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e1b19] mb-2">
              {t('noToken.title')}
            </h2>
            <p className="text-xs sm:text-sm text-[#57423b] mb-6 leading-relaxed">
              {t('noToken.description')}
            </p>

            <form onSubmit={handleManualTokenSubmit} className="space-y-3">
              <div className="relative">
                <MagnifyingGlass
                  weight="bold"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a726a]"
                />
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder={t('noToken.inputPlaceholder')}
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-[#e8e1dd] bg-[#faf2ee] hover:bg-[#f4ece9] focus:bg-white focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 outline-hidden text-xs text-[#1e1b19] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!manualTokenInput.trim()}
                className="w-full h-10 px-4 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {t('noToken.submitButton')}
              </button>
            </form>
          </div>
        )}

        {/* Link Not Found / Error */}
        {!loading && token && fetchError && (
          <IntakeExpired errorMessage={fetchError} />
        )}

        {/* Link Expired or Inactive */}
        {!loading && token && !fetchError && linkInfo?.isExpired && (
          <IntakeExpired info={linkInfo} />
        )}

        {/* Submission Success Screen */}
        {!loading && submissionSuccess && (
          <IntakeSuccess
            referenceCode={submissionSuccess.referenceCode}
            fullName={submissionSuccess.fullName}
            townName={linkInfo?.town?.name}
            onReset={() => {
              setSubmissionSuccess(null);
            }}
          />
        )}

        {/* Active Intake Form */}
        {!loading &&
          token &&
          !fetchError &&
          linkInfo &&
          !linkInfo.isExpired &&
          !submissionSuccess && (
            <div className="space-y-4">
              <IntakeHeader info={linkInfo} />

              {/* Error banner if submission failed */}
              {submitError && (
                <div className="w-full max-w-xl mx-auto p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5 shadow-xs">
                  <WarningCircle
                    weight="fill"
                    className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <strong className="font-semibold text-red-950">
                      {t('error.submissionError')}{' '}
                    </strong>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              <IntakeForm
                townName={linkInfo.town?.name || 'Local Town'}
                townCode={linkInfo.town?.code || 'JRS'}
                onSubmit={handleSubmit}
                isLoading={submitting}
              />
            </div>
          )}
      </main>
    </div>
  );
}
