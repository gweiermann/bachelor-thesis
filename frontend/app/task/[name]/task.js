'use client'

import Markdown from 'react-markdown'
import { Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Editor from '@/components/editor'
import { analyzeCode } from '@/lib/code-analysis'
import { useState } from 'react'

export default function Task({ task }) {
    const [code, setCode] = useState(task.code.functionPrototype)

    async function runCode() {
        const codeWithoutPrototype = code.split('\n').slice(2, -1).join('\n')
        const result = await analyzeCode(task.name, codeWithoutPrototype)
        console.log(result)
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
                            <Markdown>{task.description}</Markdown>
                        </section>
                    </article>
                </div>

                <div className="h-10vh">
                    {/* Code and Visualization Section */}
                    <section className="mt-12 mb-8 grid md:grid-cols-2 gap-6 h-[80vh]">
                        {/* Left Column - Code Editor */}
                        <div className="border rounded-lg overflow-hidden bg-card">
                            <div className="flex items-center justify-between p-3 border-b bg-muted">
                            <span className="font-medium">Code Editor</span>
                            <Button size="sm" onClick={runCode}>Run</Button>
                            </div>
                            <div className="py-4">
                                <Editor functionProtoype={task.code.functionPrototype} placeholder={'// your code here'} onChange={setCode}/>
                            </div>
                        </div>
                
                        {/* Right Column - Visualization */}
                        <div className="border rounded-lg overflow-hidden bg-card">
                            <div className="h-full flex items-center justify-center p-4">
                            <p className="text-center text-muted-foreground">Hit {'"Run"'} to see the code visualization</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}