import { LoaderCircle } from "lucide-react"

export default function LoadingSpinner() {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <LoaderCircle className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin" />
        </div>
    )
}