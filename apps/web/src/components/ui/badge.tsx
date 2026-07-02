import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-navy text-ivory hover:bg-navy/80",
        secondary:
          "border-transparent bg-ivory-100 text-navy hover:bg-ivory-500/80",
        destructive:
          "border-transparent bg-red-100 text-red-700 shadow-sm",
        outline: "text-navy border-navy/20",
        success: "border-transparent bg-teal-100 text-teal-900",
        warning: "border-transparent bg-amber-100 text-amber-800",
        gold: "border-transparent bg-gold/20 text-gold-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean
}

function Badge({ className, variant, animate = true, ...props }: BadgeProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(badgeVariants({ variant }), className)}
        {...props as any}
      />
    )
  }
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
