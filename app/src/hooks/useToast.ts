import { createContext, useContext } from 'react';

export type Tone = 'info' | 'error';

export interface ToastApi {
  notify: (text: string, tone?: Tone) => void;
}

export const ToastContext = createContext<ToastApi>({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}
