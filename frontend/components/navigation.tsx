import Link from "next/link";
import { Code } from "lucide-react"

export default function Navigation() {
    return (
        <nav className="px-4 py-2 border-b">
            <ul className="flex items-center justify-start gap-4">
                <li>
                    <Link href="/" className="text-md font-semibold">
                        Home
                    </Link>
                </li>

                <li className="flex-1">
                    <Link href="/courses" className="text-md font-semibold">
                        Courses
                    </Link>
                </li>
                
                <li>
                    <Link href="https://github.com/gweiermann/bachelor-thesis" target="_blank" rel="noopener noreferrer">
                        <Code className="h-5 w-5" />
                    </Link>
                </li>
            </ul>
        </nav>
    )
}