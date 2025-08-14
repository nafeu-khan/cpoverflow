"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open, onOpenChange, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(className)} {...props}>
        {children}
      </button>
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden transition-all duration-200 ease-in-out", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
