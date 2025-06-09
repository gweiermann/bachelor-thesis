"use client"

// @ts-ignore  
import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useRef, useEffect, useCallback } from 'react'
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

// const severityMap = {   
//     error: MarkerSeverity.Error,
//     warning: MarkerSeverity.Warning,
//     info: MarkerSeverity.Info,
//     hint: MarkerSeverity.Hint
// };
const severityMap = {   
    error: 8,
    warning: 4,
    info: 2,
    hint: 1
};

export default function Editor({ template, initialFunctionBodies, onChange, activeLines = [], highlightRanges = [], markers = [] }: EditorProps) {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const previousLineDecorationRef = useRef(null)
    const previousHighlightDecorationRef = useRef(null)
    const constrainedInstance = useRef(null)
    
    const defaultValue = template.template

    const handleChange = useCallback((value: string) => {
        const functionBodies = editorRef.current.getModel().getValueInEditableRanges()
        const bodiesAsArray = template.ranges.map((_, index) => functionBodies['body' + index]) as string[]
        onChange?.(bodiesAsArray, value)
    }, [template, onChange, editorRef])

    const handleEditorDidMount = useCallback((editor: EditorType, monaco: Monaco) => {
        editorRef.current = editor
        monacoRef.current = monaco

        monaco.editor.setModelMarkers(editorRef.current.getModel(), 'owner', markers)

        constrainedInstance.current = constrainedEditor(monaco)
        const model = editor.getModel()
        constrainedInstance.current.initializeIn(editor)
        constrainedInstance.current.toggleDevMode()

        constrainedInstance.current.addRestrictionsTo(model, template.ranges.map((range, index) => ({
            range: [range.start.line, range.start.column, range.end.line, range.end.column],
            allowMultiline: true,
            label: `body${index}`
        })))

        // fill ranges with user code
        model.updateValueInEditableRanges(Object.fromEntries(initialFunctionBodies.map((body, index) => [`body${index}`, body])))

        // collapse pragma regions
        editor.trigger(null, 'editor.fold', {
            selectionLines: model.getValue().split('\n')
                .map((line, index) => [line, index])
                .filter(([line,]) => line.startsWith('#pragma region '))
                .map(([, index]) => index)
        })
        

        handleChange(editor.getValue())
    }, [initialFunctionBodies, template, handleChange])

    useEffect(() => {
        previousLineDecorationRef.current?.clear()
        if (editorRef.current && activeLines.length) {
            previousLineDecorationRef.current = highlightLines(editorRef.current, activeLines)
            editorRef.current.revealLine(activeLines[0])
        }
    }, [activeLines, editorRef, previousLineDecorationRef])

    useEffect(() => {
        monacoRef.current?.editor.removeAllMarkers('compiler')
        monacoRef.current?.editor.setModelMarkers(editorRef.current.getModel(), 'compiler', markers)
    }, [markers, monacoRef, editorRef])

    useEffect(() => {
        previousHighlightDecorationRef.current?.clear()
        if (editorRef.current && highlightRanges.length) {
            previousHighlightDecorationRef.current = highlightTheRanges(editorRef.current, highlightRanges)
        }
    }, [highlightRanges, editorRef, previousHighlightDecorationRef])
    
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



