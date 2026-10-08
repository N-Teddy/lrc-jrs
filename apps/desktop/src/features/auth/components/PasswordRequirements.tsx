import { useTranslation } from '@jrs/client-core';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import type React from 'react';
import type { PasswordRule } from '../utils/password.utils';

export { validatePasswordRules } from '../utils/password.utils';
export type { PasswordRule };

interface PasswordRequirementsProps {
  rules: PasswordRule[];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  rules,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5 py-1 text-xs">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`flex items-center gap-2 transition-colors duration-200 ${
            rule.met ? 'text-[#486b52] font-medium' : 'text-[#8c847c]'
          }`}
        >
          {rule.met ? (
            <CheckCircle
              size={15}
              weight="fill"
              className="text-[#486b52] shrink-0"
            />
          ) : (
            <Circle
              size={15}
              weight="regular"
              className="text-[#dcd4c8] shrink-0"
            />
          )}
          <span>
            {t(`auth:rules.${rule.id}`, { defaultValue: rule.label })}
          </span>
        </div>
      ))}
    </div>
  );
};
