'use client';

import { useState, useCallback } from 'react';
import { sessionsApi, scoringApi, smartformApi } from '@/lib/api-client';

export type PipelineStep = 'procedure' | 'upload' | 'ocr' | 'crosscheck' | 'score' | 'lawguard' | 'smartform' | 'confirm';

interface SessionState {
  sessionId: string | null;
  currentStep: PipelineStep;
  isLoading: boolean;
  error: string | null;
  scoreResult: unknown;
  lawguardAlerts: unknown[];
  formData: unknown;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    currentStep: 'procedure',
    isLoading: false,
    error: null,
    scoreResult: null,
    lawguardAlerts: [],
    formData: null,
  });

  const setLoading = (isLoading: boolean) => setState(s => ({ ...s, isLoading }));
  const setError = (error: string | null) => setState(s => ({ ...s, error }));

  const createSession = useCallback(async (procedureId: string) => {
    setLoading(true);
    try {
      const session = await sessionsApi.create(procedureId) as { _id: string };
      setState(s => ({ ...s, sessionId: session._id, currentStep: 'upload', isLoading: false }));
      return session._id;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, []);

  const runPipeline = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      setState(s => ({ ...s, currentStep: 'crosscheck' }));
      await scoringApi.crosscheck(sessionId);

      setState(s => ({ ...s, currentStep: 'score' }));
      const scoreResult = await scoringApi.score(sessionId);

      setState(s => ({ ...s, currentStep: 'lawguard', scoreResult }));
      const lawguardResult = await scoringApi.lawguard(sessionId) as { alerts: unknown[] };

      setState(s => ({ ...s, currentStep: 'smartform', lawguardAlerts: lawguardResult.alerts }));
      const formResult = await smartformApi.generate(sessionId);

      setState(s => ({ ...s, currentStep: 'confirm', formData: formResult, isLoading: false }));
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, []);

  const confirm = useCallback(async () => {
    if (!state.sessionId) return;
    setLoading(true);
    try {
      await sessionsApi.confirm(state.sessionId);
      setState(s => ({ ...s, currentStep: 'confirm', isLoading: false }));
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, [state.sessionId]);

  return { state, createSession, runPipeline, confirm };
}
