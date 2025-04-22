"use client"

// @ts-ignore  
import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useRef, useEffect, useMemo } from 'react'
import './style.css'
import { HighlightRange } from "@/app/courses/[courseId]/[chapterId]/[taskId]/stores";
import { cn } from "@/lib/utils";

type EditorType = editor.IStandaloneCodeEditor

function highlightLines(editor: EditorType, lines: number[]) {
    return editor.createDecorationsCollection(lines.map(line => ({
        range: {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
        },
        options: {
            isWholeLine: true,
            className: 'code-editor__active-line',
            lineNumberClassName: 'code-editor__active-line',
            linesDecorationsClassName: "code-editor__active-line-symbol",
        },
    })));
}

function highlightTheRanges(editor: EditorType, highlightRanges: HighlightRange[]) {
    return editor.createDecorationsCollection(highlightRanges.map(highlight => ({
        range: {
            startLineNumber: highlight.range.start.line - 3,
            startColumn: highlight.range.start.column,
            endLineNumber: highlight.range.end.line - 3,
            endColumn: highlight.range.end.column,
        },
        options: {
            className: cn(highlight.className, 'opacity-40'),
            hoverMessage: { value: highlight.hoverMessage }
        },
    })));
}

interface EditorProps {
    functionPrototypes: string[]
    initialFunctionBodies: string[]
    onChange?: (value: string[]) => void
    activeLines?: number[]
    highlightRanges: HighlightRange[]
}

interface Range {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
}

interface RestrictedRanges {
    ranges: Range[]
    result: string
}

type RangeString = [ 'restrict', string ] | [ 'mutable', string] | [ 'mutable-dont-track', string ]

/**
 * Concatenates all the strings in the array into a single string
 * It will also generate a range for each argument which says it should be mutable (the monaco plugin will restrict everything else)
 * @param strings - The strings to concatenate
 * @return - The concatenated string and the ranges for each argument which position is odd
 * @example
 *  generateRestrictedRanges(['restrict', "will be restricted "], ['mutable', "won't be \n restricted "], ['restrict', "will be restricted again"]])
 *  will generate:
 *  { "result":"will be restricted won't be \\n restricted will be restricted again", "ranges": [[1,21,2,13]] }
 */
function generateRestrictedRanges(strings: RangeString[]): RestrictedRanges {
    const ranges: Range[] = []
    let currentLine = 1
    let currentColumn = 1
    strings.forEach(([type, string]) => {
        const lines = string.split('\n')
        const lastLine = lines.length - 1
        let lastColumn = lines[lastLine].length + 1

        if (lines.length === 1) {
            lastColumn += currentColumn
        }

        if (type === 'mutable') {
            ranges.push({
                startLineNumber: currentLine,
                startColumn: currentColumn,
                endLineNumber: currentLine + lastLine,
                endColumn: lastColumn
            })
        }

        currentLine += lastLine
        currentColumn = lastColumn
    })
    return {
        result: strings.map(([, str]) => str).join(''),
        ranges,
    }
}


export default function Editor({ functionPrototypes, initialFunctionBodies, onChange, activeLines = [], highlightRanges = [] }: EditorProps) {
    const monacoRef = useRef(null);
    const previousLineDecorationRef = useRef(null)
    const previousHighlightDecorationRef = useRef(null)
    const constrainedInstance = useRef(null)

    const { result: defaultValue, ranges } = useMemo(
        () => generateRestrictedRanges(functionPrototypes.flatMap((functionPrototype, index) => ([
            [ 'restrict', functionPrototype + '\n{' ],
            [ 'mutable', initialFunctionBodies?.[index] ?? '' ],
            [ 'restrict', '\n}' + (index === functionPrototypes.length - 1 ? '' : '\n\n') ]
        ]))
    ), [functionPrototypes, initialFunctionBodies])

    const handleEditorDidMount = (editor: EditorType, monaco: Monaco) => {
        monacoRef.current = editor

        constrainedInstance.current = constrainedEditor(monaco)
        const model = editor.getModel()
        constrainedInstance.current.initializeIn(editor)
        constrainedInstance.current.toggleDevMode()

        constrainedInstance.current.addRestrictionsTo(model, ranges.map((range, index) => ({
            range: [range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn],
            allowMultiline: true,
            label: `body${index}`
        })))

        handleChange()
    }

    useEffect(() => {
        previousLineDecorationRef.current?.clear()
        if (monacoRef.current && activeLines.length) {
            previousLineDecorationRef.current = highlightLines(monacoRef.current, activeLines)
            monacoRef.current.revealLine(activeLines[0])
        }
    }, [activeLines, monacoRef, previousLineDecorationRef])

    useEffect(() => {
        previousHighlightDecorationRef.current?.clear()
        if (monacoRef.current && highlightRanges.length) {
            previousHighlightDecorationRef.current = highlightTheRanges(monacoRef.current, highlightRanges)
        }
    }, [highlightRanges, monacoRef, previousHighlightDecorationRef])

    const handleChange = () => {
        const functionBodies = monacoRef.current.getModel().getValueInEditableRanges()
        const bodiesAsArray = functionPrototypes.map((_, index) => functionBodies['body' + index]) as string[]
        onChange?.(bodiesAsArray)
    }

    return (
        <MonacoEditor
            height="70vh"
            language="cpp"
            onMount={handleEditorDidMount}
            defaultValue={defaultValue}
            options={{
                minimap: {
                    enabled: false
                },
                scrollBeyondLastLine: false,
                tabSize: 4
            }}
            onChange={handleChange}
        />
    )
}



