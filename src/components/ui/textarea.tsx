import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[10px] border border-input bg-card px-3.5 py-3 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leaf-tint disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
