import * as React from "react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

interface TooltipContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined)

export function TooltipProvider({ children }: { children: React.ReactNode; delayDuration?: number }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative flex items-center justify-center">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("TooltipTrigger must be used within a Tooltip")

  const triggerProps = {
    onMouseEnter: () => context.setOpen(true),
    onMouseLeave: () => context.setOpen(false),
    onFocus: () => context.setOpen(true),
    onBlur: () => context.setOpen(false),
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, triggerProps)
  }

  return (
    <div {...triggerProps}>
      {children}
    </div>
  )
}

export function TooltipContent({
  children,
  className,
  side = "top"
}: {
  children: React.ReactNode
  className?: string
  side?: "top" | "bottom" | "left" | "right"
}) {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("TooltipContent must be used within a Tooltip")

  return (
    <AnimatePresence>
      {context.open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === "top" ? 4 : -4 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute z-50 overflow-hidden rounded-md bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white shadow-md",
            side === "top" && "bottom-full mb-2",
            side === "bottom" && "top-full mt-2",
            side === "left" && "right-full mr-2",
            side === "right" && "left-full ml-2",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
