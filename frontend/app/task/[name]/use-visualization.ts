import { create } from 'zustand'
import { AnalysisResult } from '@/lib/code-analysis';

export type VisualizationType = 'sort'
export type VisualizationState = 'unrun' | 'loading' | 'ready' | 'error'

interface VisualizationStore {
    type: VisualizationType
    state: VisualizationState
    analysis: AnalysisResult | null
    error: string | null
    loadingMessage: string | null
    codeToBeRun: string | null
    activeLines: number[]
    isDirty: boolean
    setIsDirty: (isDirty: boolean) => void
    setState: (state: VisualizationState) => void
    setLoadingMessage: (loadingMessage: string) => void
    setAnalysis: (analysis: AnalysisResult) => void
    setActiveLines: (activeLines: number[]) => void
    setError: (error: string) => void
    runCode: (code: string) => void
}

export const useVisualization = create<VisualizationStore>(set => ({
    type: 'sort',
    state: 'unrun',
    loadingMessage: null,
    analysis: null,
    error: null,
    codeToBeRun: null,
    activeLines: [],
    isDirty: false,
    setIsDirty(isDirty: boolean) {
        set({ isDirty })
    },
    setAnalysis(analysis: AnalysisResult) {
        set({ analysis })
    },
    setState(state: VisualizationState) {
        set({ state })
    },
    setLoadingMessage(loadingMessage: string) {
        set({ loadingMessage })
    },
    setError(error: string) {
        set({ error })
    },
    setActiveLines(activeLines: number[]) {
        set({ activeLines })
    },
    runCode(code: string) {
        set({ code })
    }
}))
