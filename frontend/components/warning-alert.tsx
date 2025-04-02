import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from '@/lib/utils'

export default function WarningAlert({ children, className, actionButton }) {
    return (
      <Alert variant="warning" className={cn('flex flex-row justify-between items-center', className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className='text-black'>
          {children}
        </AlertDescription>
        <div className="flex flex-grow" />
        {actionButton}
      </Alert>
    )
  }