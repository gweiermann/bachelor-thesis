import { AnalysisResult } from '@/lib/build'
import { TestCase } from '@/lib/db'
import { create, type StateCreator } from 'zustand'
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

export interface HighlightRange {
    range: { start: { line: number, column: number }, end: { line: number, column: number } }
    className: string
    hoverMessage?: string
}
interface VisualizationStore extends FetchStore<AnalysisResult> {
    type: VisualizationType
    activeLines: number[]
    setActiveLines: (activeLines: number[]) => void
    highlightRanges: HighlightRange[],
    setHighlightRanges: (highlightRanges: HighlightRange[]) => void,
}

export interface UserCodeStore {
    codeToBeRun?: string
    code?: string
    isDirty: boolean
    runCount: number
    setCode: (code: string) => void
    runCode: () => void
}

export const useUserCode = create<UserCodeStore>(
    (set, get) => ({
        code: null,
        codeToBeRun: null,
        isDirty: false,
        runCount: 0,
        setCode(code: string) {
            set(state => ({ code, isDirty: state.code !== state.codeToBeRun  }))
        },
        runCode() {
            set(state => ({ codeToBeRun: state.code, isDirty: false, runCount: state.runCount + 1 }))
        }
    })
)

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
    setActiveLines: activeLines => set({ activeLines }),
    highlightRanges: [],
    setHighlightRanges: highlightRanges => set({ highlightRanges }),
    ...useFetchStore(set, get),
}))

export const useTests = create<TestsStore>((set, get) => ({
    ...useFetchStore(set, get),
}))
