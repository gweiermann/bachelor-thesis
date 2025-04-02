'use client'

import Markdown from 'react-markdown'
import { Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Editor from '@/components/editor/editor'
import { useState, } from 'react'
import { InlineLoadingSpinner } from '@/components/loading-spinner'
import Visualization from './visualization'
import WarningAlert from '@/components/warning-alert'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export default function Task({ task }) {
    // const placeholder = `// your code here`
    const placeholder = `for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                std::swap(arr[j], arr[j+1]);
            }
        }
    }`

    const [code, setCode] = useState(null)
    const [previousCode, setPreviousCode] = useState(null)
    const [codeToAnalyse, setCodeToAnalyse] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [activeLines, setActiveLines] = useState(null)
    const codeHasChanged = useMemo(() => code !== previousCode && previousCode !== null, [code, previousCode])

    function extractCodeFromFunction(code) {
        return code.split('\n').slice(2, -1).join('\n');
    }

    function runCode() {
        const codeWithoutPrototype = extractCodeFromFunction(code)
        setCodeToAnalyse(codeWithoutPrototype)
        setPreviousCode(code)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Bar */}
            <nav className="px-8 py-4 border-b">
                <div className="max-w-3xl mx-auto flex items-center justify-between ">
                    <Link href="/" className="text-xl font-semibold">
                        Home
                    </Link>

                    <Link href="https://github.com/gweiermann/bachelor-thesis" target="_blank" rel="noopener noreferrer">
                        <Code className="h-6 w-6" />
                    </Link>
                </div>
            </nav>
        
            {/* Article Content */}
            <main className="container">
                <div className="mx-auto py-8 max-w-3xl">
                    <article className="prose prose-slate dark:prose-invert max-w-none">
                        <h1 className="text-3xl font-bold mb-12 text-center">Task: Bubble Sort</h1>
        
                        <section className="mb-8 prose">
                            {/* <Markdown>{task.description}</Markdown> */}
                        </section>
                    </article>
                </div>

                <div className="pb-8">
                    {/* Code and Visualization Section */}
                    <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 auto-cols-auto auto-rows-auto">
                        {/* Left Column - Code Editor */}
                        <div className="border rounded-lg bg-card overflow-hidden">
                            <div className="flex items-center justify-between p-3 border-b bg-muted gap-8">
                                <span className="font-medium">Code Editor</span>
                                <Button size="sm" onClick={runCode} disabled={!codeHasChanged && previousCode}>
                                    Run {isAnalyzing && <InlineLoadingSpinner />}
                                </Button>
                            </div>
                            <div className="py-4">
                                <div className={cn('overflow-hidden max-h-0 transition-all duration-100 mx-4 ease-linear', codeHasChanged && 'max-h-20 mb-4')}>
                                    <WarningAlert>
                                        The code has been changed since the visualization was build. Hit 'Run' to update it.
                                    </WarningAlert>
                                </div>
                                <Editor
                                    functionProtoype={task.code.functionPrototype}
                                    placeholder={placeholder}
                                    onChange={setCode}
                                    activeLines={codeHasChanged ? [] : activeLines} />
                            </div>
                        </div>
                
                        {/* Right Column - Visualization */}
                        <div className="border rounded-lg bg-card h-full flex flex-col">
                            <div className='m-4'>
                                <WarningAlert className={cn(!codeHasChanged && 'invisible')}>
                                    The code has been changed since the visualization was build. Hit 'Run' to update it.
                                </WarningAlert>
                            </div>
                            <div className="flex flex-grow flex-col items-center justify-center p-4">
                                {!codeToAnalyse ? 
                                    <p className="text-center text-muted-foreground"> Hit {'"Run"'} to visualize your code. </p> :
                                    <Visualization code={codeToAnalyse} task={task} onIsLoading={setIsAnalyzing} onActiveLinesChange={setActiveLines} />}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}