import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type SelectContextValue = {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  selectedLabel?: React.ReactNode
  setSelectedLabel: (label?: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(componentName: string) {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error(`${componentName} must be used within Select`)
  }
  return context
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>()

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { selectedLabel } = useSelectContext("SelectValue")
  return <span>{selectedLabel ?? placeholder}</span>
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext("SelectTrigger")
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelectContext("SelectContent")
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 max-h-60 min-w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
  )
)
SelectLabel.displayName = "SelectLabel"

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, onClick, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen, setSelectedLabel } =
      useSelectContext("SelectItem")

    React.useEffect(() => {
      if (selectedValue === value) {
        setSelectedLabel(children)
      }
    }, [children, selectedValue, setSelectedLabel, value])

    const isSelected = selectedValue === value

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative flex w-full items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
          className
        )}
        onClick={(event) => {
          onValueChange?.(value)
          setSelectedLabel(children)
          setOpen(false)
          onClick?.(event)
        }}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected ? <Check className="h-4 w-4" /> : null}
        </span>
        {children}
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
)
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
