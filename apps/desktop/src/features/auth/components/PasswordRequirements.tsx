import { CheckCircle, Circle } from '@phosphor-icons/react';
import type React from 'react';

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export function validatePasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: 'At least 8 characters long',
      met: password.length >= 8,
    },
    {
      id: 'casing',
      label: 'Contains both uppercase & lowercase letters',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: 'numberOrSpecial',
      label: 'Contains at least one number or symbol',
      met: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];
}

interface PasswordRequirementsProps {
  rules: PasswordRule[];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  rules,
}) => {
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
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
};
