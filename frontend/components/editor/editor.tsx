"use client"

// @ts-ignore  
import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useRef, useEffect, useMemo, useCallback } from 'react'
import './style.css'
import { HighlightRange } from "@/app/courses/[courseId]/[chapterId]/[taskId]/stores";
import { cn } from "@/lib/utils";
import { Template } from "@/lib/get-template";

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
            startLineNumber: highlight.range.start.line,
            startColumn: highlight.range.start.column,
            endLineNumber: highlight.range.end.line,
            endColumn: highlight.range.end.column,
        },
        options: {
            className: cn(highlight.className, 'opacity-40'),
            hoverMessage: { value: highlight.hoverMessage }
        },
    })));
}

interface EditorProps {
    template: Template
    initialFunctionBodies: string[]
    onChange?: (bodies: string[], code: string) => void
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

function insertIntoString(str: string, index: number, value: string): string {
    return str.slice(0, index) + value + str.slice(index);
}

function insertsIntoString(base: string, ...inserts: {index: number, value: string}[]): string {
    let result = base
    let index = 0
    inserts.forEach(insert => {
        const { index: insertIndex, value } = insert
        result = insertIntoString(result, index + insertIndex, value)
        index += value.length
    })
    return result
}

// https://stackoverflow.com/a/51399781/6368046
type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export default function Editor({ template, initialFunctionBodies, onChange, activeLines = [], highlightRanges = [] }: EditorProps) {
    const monacoRef = useRef(null);
    const previousLineDecorationRef = useRef(null)
    const previousHighlightDecorationRef = useRef(null)
    const constrainedInstance = useRef(null)
    
    const defaultValue = template.template

    const handleChange = useCallback((value: string) => {
        const functionBodies = monacoRef.current.getModel().getValueInEditableRanges()
        const bodiesAsArray = template.ranges.map((_, index) => functionBodies['body' + index]) as string[]
        onChange?.(bodiesAsArray, value)
    }, [template, onChange, monacoRef])

    const handleEditorDidMount = useCallback((editor: EditorType, monaco: Monaco) => {
        monacoRef.current = editor

        constrainedInstance.current = constrainedEditor(monaco)
        const model = editor.getModel()
        constrainedInstance.current.initializeIn(editor)
        constrainedInstance.current.toggleDevMode()

        constrainedInstance.current.addRestrictionsTo(model, template.ranges.map((range, index) => ({
            range: [range.start.line, range.start.column, range.end.line, range.end.column],
            allowMultiline: true,
            label: `body${index}`
        })))

        model.updateValueInEditableRanges(Object.fromEntries(initialFunctionBodies.map((body, index) => [`body${index}`, body])))

        handleChange(editor.getValue())
    }, [initialFunctionBodies, template, handleChange])

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



