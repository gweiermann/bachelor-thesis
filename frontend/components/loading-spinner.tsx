import { cn } from "@/lib/utils"
import { LoaderCircle } from "lucide-react"

export function FullLoadingSpinner() {
    return (
        <div className="flex items-center justify-center z-50 bg-opacity-50">
            <InlineLoadingSpinner />
        </div>
    )
}

export function InlineLoadingSpinner({ className }: { className?: string }) {
    return <LoaderCircle className={cn("w-12 h-12 animate-spin", className)} />
}