"use client"

import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor from '@monaco-editor/react';
import { useRef, useEffect, useState } from 'react'
import './style.css'

function highlightLines(editor, lines) {
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

function extractCodeFromFunction(code) {
    // Same function in editor.jsx, should be combined into one
    return code.split('\n').slice(2, -1).join('\n');
}

export default function Editor({ functionProtoype, placeholder, onChange, activeLines = [] }) {
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

    const defaultValue = `${functionProtoype}\n{\n    ${placeholder}\n}`

    useEffect(() => {
        previousLineDecoration?.clear()
        if (monacoRef.current && activeLines.length) {
            setPreviousLineDecoration(highlightLines(monacoRef.current, activeLines))
            monacoRef.current.revealLine(activeLines[0])
        }
    }, [activeLines, monacoRef])

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



