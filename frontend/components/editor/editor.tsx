"use client"

// @ts-ignore  
import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useRef, useEffect } from 'react'
import './style.css'

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

interface EditorProps {
    functionPrototypes: string[]
    initialFunctionBodies: string[]
    onChange?: (value: string[]) => void
    activeLines?: number[]
}

function getNumberOfLines(code: string) {
    return (code.match(/\n/g) || []).length + 1
}

type Range = [
    number, // startLineNumber
    number, // startColumn
    number, // endLineNumber
    number  // endColumn
]

interface RestrictedRanges {
    ranges: Range[]
    result: string
}

type RangeString = [ 'restrict', string ] | [ 'mutable', string]

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
            ranges.push([currentLine, currentColumn, currentLine + lastLine, lastColumn])
        }

        currentLine += lastLine
        currentColumn = lastColumn
    })
    return {
        result: strings.map(([, str]) => str).join(''),
        ranges,
    }
}


export default function Editor({ functionPrototypes, initialFunctionBodies, onChange, activeLines = [] }: EditorProps) {
    const monacoRef = useRef(null);
    const previousLineDecorationRef = useRef(null)
    const constrainedInstance = useRef(null)

    const { result: defaultValue, ranges } = generateRestrictedRanges(functionPrototypes.flatMap((functionPrototype, index) => ([
        [ 'restrict', functionPrototype + '\n{' ],
        [ 'mutable', '\n    ' + initialFunctionBodies[index] ],
        [ 'restrict', '\n}' + (index === functionPrototypes.length - 1 ? '' : '\n\n') ]
    ])))

    

    const handleEditorDidMount = (editor: EditorType, monaco: Monaco) => {
        monacoRef.current = editor

        constrainedInstance.current = constrainedEditor(monaco)
        const model = editor.getModel()
        constrainedInstance.current.initializeIn(editor)
        constrainedInstance.current.toggleDevMode()

        constrainedInstance.current.addRestrictionsTo(model, ranges.map((range, index) => ({
            range,
            allowMultiline: true,
            label: `body${index}`
        })))
    }

    useEffect(() => {
        previousLineDecorationRef.current?.clear()
        if (monacoRef.current && activeLines.length) {
            previousLineDecorationRef.current = highlightLines(monacoRef.current, activeLines)
            monacoRef.current.revealLine(activeLines[0])
        }
    }, [activeLines, monacoRef, previousLineDecorationRef])

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
                scrollBeyondLastLine: false
            }}
            onChange={handleChange}
        />
    )
}



