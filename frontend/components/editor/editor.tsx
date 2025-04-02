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
    functionProtoype: string
    placeholder: string
    onChange?: (value: string) => void
    activeLines?: number[]
}

export default function Editort({ functionProtoype, placeholder, onChange, activeLines = [] }: EditorProps) {
    const monacoRef = useRef(null);
    const previousLineDecorationRef = useRef(null)

    function handleEditorDidMount(editor: EditorType, monaco: Monaco) {
        monacoRef.current = editor;

        const constrainedInstance = constrainedEditor(monaco);
        const model = editor.getModel();
        constrainedInstance.initializeIn(editor);

        const numberOfLines = (placeholder.match(/\n/g) || []).length + 1;

        constrainedInstance.addRestrictionsTo(model, [
            {
                range: [2, 2, 3 + numberOfLines, 1],
                allowMultiline: true,
            }
        ])

        onChange?.(model.getValue())
    }

    const defaultValue = `${functionProtoype}\n{\n    ${placeholder}\n}`

    useEffect(() => {
        previousLineDecorationRef.current?.clear()
        if (monacoRef.current && activeLines.length) {
            previousLineDecorationRef.current = highlightLines(monacoRef.current, activeLines)
            monacoRef.current.revealLine(activeLines[0])
        }
    }, [activeLines, monacoRef, previousLineDecorationRef])

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
            onChange={onChange}
        />
    )
}



