import type React from 'react';
import { createContext, useContext } from 'react';
import type { HttpService } from '../http/axios-client';

const HttpContext = createContext<HttpService | null>(null);

export interface HttpProviderProps {
  children: React.ReactNode;
  http: HttpService;
}

export function HttpProvider({ children, http }: HttpProviderProps) {
  return <HttpContext.Provider value={http}>{children}</HttpContext.Provider>;
}

export function useHttp(): HttpService {
  const context = useContext(HttpContext);
  if (!context) {
    throw new Error('useHttp must be used within an HttpProvider');
  }
  return context;
}
