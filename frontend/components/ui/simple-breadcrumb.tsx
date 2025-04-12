import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import { ChevronRight, Home } from "lucide-react"
import React from "react"

export interface SimpleBreadcrumbProps {
    items: {
        label: string
        href: string
    }[]
}

export default function SimpleBreadcrumb({ items }: SimpleBreadcrumbProps) {
    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                        <Home className="h-4 w-4 mr-1" />
                        Home
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {items.map(({ label, href }, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}