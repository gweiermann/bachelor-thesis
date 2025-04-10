import Markdown from 'react-markdown'

interface InstructionsProps {
    description: string
}

export default function Instructions({ description }: InstructionsProps) {
    return (
        <div className="w-full overflow-auto">
            <section className="mb-8 prose w-full">
                <Markdown>{description}</Markdown>
            </section>
        </div>
    )
}