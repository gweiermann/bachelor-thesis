import { LoaderCircle } from "lucide-react"

export function FullLoadingSpinner() {
    return (
        <div className="inset-0 flex items-center justify-center z-50 bg-opacity-50">
            <InlineLoadingSpinner />
        </div>
    )
}

export function InlineLoadingSpinner() {
    return <LoaderCircle className="w-12 h-12 animate-spin" />
}