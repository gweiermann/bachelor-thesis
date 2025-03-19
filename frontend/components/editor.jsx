"use client"

import { constrainedEditor } from "constrained-editor-plugin";
import MonacoEditor from '@monaco-editor/react';
import { useRef } from 'react'

export default function Editor({ functionProtoype, placeholder, onChange }) {
    const monacoRef = useRef(null);

    function handleEditorDidMount(editor, monaco) {
        monacoRef.current = editor;

        const constrainedInstance = constrainedEditor(monaco);
        const model = editor.getModel();
        constrainedInstance.initializeIn(editor);

        const numberOfLines = (placeholder.match(/\n/g) || []).length + 1;

        constrainedInstance.addRestrictionsTo(model, [
            {
                range: [3, 1, 3 + numberOfLines, 1],
                allowMultiline: true,
            }
        ])

        onChange?.(model.getValue())
    }

    const defaultValue = `${functionProtoype}\n{\n  ${placeholder}\n}`

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



