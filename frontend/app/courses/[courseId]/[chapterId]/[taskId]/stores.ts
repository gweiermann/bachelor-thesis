import { create, StateCreator, StoreApi, UseBoundStore, useStore } from 'zustand'
import { AnalysisResult } from '@/lib/code-analysis';
import { TestCase } from '@/lib/tasks';

export type VisualizationType = 'sort'
export type State = 'unrun' | 'loading' | 'ready' | 'error'

interface FetchStore<T> {
    state: State
    isLoading: boolean
    errorMessage?: string
    loadingMessage?: string
    result?: T
    setIsLoading: (isLoading: boolean) => void,
    setLoadingMessage: (loadingMessage: string) => void,
    setErrorMessage: (errorMessage: string) => void,
    setResult: (result: T) => void,
}

export interface TestCaseResult {
    testCase: TestCase
    output: number[]
    suite: 'public' | 'private'
    passed: boolean
}

interface TestsStore extends FetchStore<TestCaseResult[]> { }

interface VisualizationStore extends FetchStore<AnalysisResult> {
    type: VisualizationType
    activeLines: number[]
    setActiveLines: (activeLines: number[]) => void
}

export interface UserCodeStore {
    functionBodies?: string[]
    functionBodiesToBeRun?: string[]
    isDirty: boolean
    setFunctionBodies: (functionBodies: string[]) => void
    runCode: () => void
}

export const useUserCode = create<UserCodeStore>((set, get) => ({
    functionBodies: null,
    functionBodiesToBeRun: null,
    isDirty: false,
    
    setFunctionBodies(functionBodies: string[]) {
        set(state => ({ functionBodies, isDirty: functionBodies !== state.functionBodiesToBeRun }))
    },
    runCode() {
        set(state => ({ functionBodiesToBeRun: state.functionBodies, isDirty: false }))
    }
}))

export const useFetchStore = <T>(
    set: Parameters<StateCreator<FetchStore<T>>>[0],
    get: Parameters<StateCreator<FetchStore<T>>>[1]
): FetchStore<T> => ({
    state: 'unrun',
    isLoading: false,
    errorMessage: null,
    loadingMessage: null,
    result: null,
    setLoadingMessage(loadingMessage: string) {
        return set(state => ({
            loadingMessage,
            state: loadingMessage ? 'loading' : state.state
        }))
    },
    setErrorMessage(errorMessage: string) {
        return set(state => ({
            errorMessage,
            state: errorMessage ? 'error' : state.state
        }))
    },
    setResult(result: T) {
        return set(state => ({
            result,
            state: result ? 'ready' : state.state
        }))
    },
    setIsLoading(isLoading: boolean) {
        return set(state => ({
            isLoading,
            state: isLoading ? 'loading' : state.state
        }))
    },
})

export const useVisualization = create<VisualizationStore>((set, get) => ({
    type: 'sort',
    activeLines: [],
    setActiveLines: (activeLines: number[]) => set({ activeLines }),
    ...useFetchStore(set, get),
}))

export const useTests = create<TestsStore>((set, get) => ({
    ...useFetchStore(set, get),
}))
