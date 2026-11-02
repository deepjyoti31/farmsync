import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-leaf-tint text-[#1A4D2C] dark:text-foreground",
        secondary:
          "border-transparent bg-muted text-[#34453A] dark:text-foreground",
        destructive:
          "border-transparent bg-rust-tint text-rust",
        outline: "border-[#C9D1C5] text-[#34453A] dark:border-input dark:text-foreground",
        warning: "border-transparent bg-warning-tint text-[#6E4600] dark:text-warning",
        info: "border-transparent bg-info-tint text-info",
        solid: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
