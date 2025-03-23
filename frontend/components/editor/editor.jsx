"use client"

import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor from '@monaco-editor/react';
import { useRef, useEffect, useState } from 'react'
import './style.css'

function highlightLine(editor, line) {
    return editor.createDecorationsCollection([
        {
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
        }
    ]);
}

export default function Editor({ functionProtoype, placeholder, onChange, activeLine = null }) {
    const monacoRef = useRef(null);
    const [previousLineDecoration, setPreviousLineDecoration] = useState(null)

    function handleEditorDidMount(editor, monaco) {
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

    const defaultValue = `${functionProtoype}\n{\n  ${placeholder}\n}`

    useEffect(() => {
        previousLineDecoration?.clear()
        if (activeLine && monacoRef.current) {
            setPreviousLineDecoration(highlightLine(monacoRef.current, activeLine))
            monacoRef.current.revealLine(activeLine)
        }
    }, [activeLine, monacoRef])

    return (
        <MonacoEditor
            height="90vh"
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



