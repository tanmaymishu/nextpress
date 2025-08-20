"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ResponsiveDialogContentProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogHeaderProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogFooterProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogTitleProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface ResponsiveDialogTriggerProps {
  className?: string
  children: React.ReactNode
  asChild?: boolean
}

interface ResponsiveDialogCloseProps {
  className?: string
  children: React.ReactNode
  asChild?: boolean
}

const ResponsiveDialog = ({ children, ...props }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogImpl = isMobile ? Drawer : Dialog

  return <ResponsiveDialogImpl {...props}>{children}</ResponsiveDialogImpl>
}

const ResponsiveDialogTrigger = ({ 
  className, 
  children, 
  ...props 
}: ResponsiveDialogTriggerProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogTriggerImpl = isMobile ? DrawerTrigger : DialogTrigger

  return (
    <ResponsiveDialogTriggerImpl className={className} {...props}>
      {children}
    </ResponsiveDialogTriggerImpl>
  )
}

const ResponsiveDialogContent = ({ 
  className, 
  children, 
  ...props 
}: ResponsiveDialogContentProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        <div className="flex flex-col max-h-full overflow-hidden">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

const ResponsiveDialogHeader = ({ 
  className, 
  children 
}: ResponsiveDialogHeaderProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogHeaderImpl = isMobile ? DrawerHeader : DialogHeader

  return (
    <ResponsiveDialogHeaderImpl className={isMobile ? `px-4 pt-2 ${className || ''}` : className}>
      {children}
    </ResponsiveDialogHeaderImpl>
  )
}

const ResponsiveDialogFooter = ({ 
  className, 
  children 
}: ResponsiveDialogFooterProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogFooterImpl = isMobile ? DrawerFooter : DialogFooter

  return (
    <ResponsiveDialogFooterImpl className={isMobile ? `px-4 pb-4 ${className || ''}` : className}>
      {children}
    </ResponsiveDialogFooterImpl>
  )
}

const ResponsiveDialogTitle = ({ 
  className, 
  children 
}: ResponsiveDialogTitleProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogTitleImpl = isMobile ? DrawerTitle : DialogTitle

  return (
    <ResponsiveDialogTitleImpl className={className}>
      {children}
    </ResponsiveDialogTitleImpl>
  )
}

const ResponsiveDialogDescription = ({ 
  className, 
  children 
}: ResponsiveDialogDescriptionProps) => {
  const isMobile = useIsMobile()
  const ResponsiveDialogDescriptionImpl = isMobile ? DrawerDescription : DialogDescription

  return (
    <ResponsiveDialogDescriptionImpl className={className}>
      {children}
    </ResponsiveDialogDescriptionImpl>
  )
}

const ResponsiveDialogClose = ({ 
  className, 
  children, 
  ...props 
}: ResponsiveDialogCloseProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerClose className={className} {...props}>
        {children}
      </DrawerClose>
    )
  }

  // For dialog, we don't need a specific close component as the overlay handles it
  return <>{children}</>
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
}