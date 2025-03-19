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
        let restrictions = []
        constrainedInstance.initializeIn(editor);
        restrictions.push({
            range: [1, 1, 2, 1],
            allowMultiline: true
        });

        constrainedInstance.addRestrictionsTo(model, [
            {
                range: [3, 1, 4, 1],
                allowMultiline: true,
            }
        ])
    }

    return (
        <MonacoEditor
            height="90vh"
            language="cpp"
            onMount={handleEditorDidMount}
            defaultValue={`${functionProtoype}\n{\n  ${placeholder}\n}`}
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



