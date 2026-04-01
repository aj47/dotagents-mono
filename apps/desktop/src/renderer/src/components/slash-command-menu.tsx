import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react"
import { cn } from "@renderer/lib/utils"
import { BookMarked, Sparkles } from "lucide-react"
import { useConfigQuery } from "@renderer/lib/queries"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface SlashCommandItem {
  id: string
  name: string
  description: string
  content: string
  type: "prompt" | "skill"
}

export interface SlashCommandMenuHandle {
  moveSelection: (delta: number) => void
  getSelectedItem: () => SlashCommandItem | undefined
  hasItems: () => boolean
}

interface SlashCommandMenuProps {
  query: string
  isOpen: boolean
  onSelect: (item: SlashCommandItem) => void
  onClose: () => void
  /** Anchor position relative to the input */
  className?: string
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(({
  query,
  isOpen,
  onSelect,
  onClose,
  className,
}, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const configQuery = useConfigQuery()
  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: () => tipcClient.getSkills(),
    enabled: isOpen,
  })

  const items = useMemo<SlashCommandItem[]>(() => {
    const prompts = (configQuery.data?.predefinedPrompts || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.content.slice(0, 80),
      content: p.content,
      type: "prompt" as const,
    }))
    const skills = (skillsQuery.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || "Use this skill as a reusable prompt.",
      content: s.instructions,
      type: "skill" as const,
    }))
    return [...prompts, ...skills]
  }, [configQuery.data, skillsQuery.data])

  const filtered = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    )
  }, [items, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  useImperativeHandle(ref, () => ({
    moveSelection(delta: number) {
      if (filtered.length === 0) return
      setSelectedIndex((prev) => {
        const next = prev + delta
        if (next < 0) return filtered.length - 1
        if (next >= filtered.length) return 0
        return next
      })
    },
    getSelectedItem() {
      return filtered.length > 0 ? filtered[selectedIndex] : undefined
    },
    hasItems() {
      return filtered.length > 0
    },
  }), [filtered, selectedIndex])

  if (!isOpen || filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className={cn(
        "bg-popover text-popover-foreground absolute z-50 max-h-48 w-64 overflow-y-auto rounded-md border shadow-md",
        className,
      )}
      role="listbox"
    >
      {filtered.map((item, idx) => (
        <button
          key={item.id}
          role="option"
          aria-selected={idx === selectedIndex}
          className={cn(
            "flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
            idx === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50",
          )}
          onMouseEnter={() => setSelectedIndex(idx)}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(item)
          }}
        >
          {item.type === "prompt" ? (
            <BookMarked className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{item.name}</div>
            <div className="truncate text-[10px] text-muted-foreground">
              {item.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
})

SlashCommandMenu.displayName = "SlashCommandMenu"

/**
 * Hook that manages slash command state for a text input.
 * Returns handlers and state to wire into a textarea.
 */
export function useSlashCommands(
  text: string,
  setText: (text: string) => void,
) {
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  const menuRef = useRef<SlashCommandMenuHandle>(null)

  useEffect(() => {
    // Detect /command at start of input
    if (text.startsWith("/")) {
      const query = text.slice(1)
      // Close menu if there's a space (user finished typing the command portion)
      if (query.includes(" ") || query.includes("\n")) {
        setIsSlashMenuOpen(false)
      } else {
        setIsSlashMenuOpen(true)
        setSlashQuery(query)
      }
    } else {
      setIsSlashMenuOpen(false)
      setSlashQuery("")
    }
  }, [text])

  const handleSlashSelect = (item: SlashCommandItem) => {
    setText(item.content)
    setIsSlashMenuOpen(false)
  }

  const closeSlashMenu = () => {
    setIsSlashMenuOpen(false)
  }

  /** Call from the textarea's onKeyDown. Returns true if the event was handled. */
  const handleKeyDown = (e: React.KeyboardEvent): boolean => {
    if (!isSlashMenuOpen) return false

    if (e.key === "ArrowDown") {
      if (!menuRef.current?.hasItems()) return false
      e.preventDefault()
      menuRef.current?.moveSelection(1)
      return true
    }
    if (e.key === "ArrowUp") {
      if (!menuRef.current?.hasItems()) return false
      e.preventDefault()
      menuRef.current?.moveSelection(-1)
      return true
    }
    if (e.key === "Enter" && !e.shiftKey) {
      const selected = menuRef.current?.getSelectedItem()
      if (selected) {
        e.preventDefault()
        handleSlashSelect(selected)
        return true
      }
    }
    if (e.key === "Escape") {
      e.preventDefault()
      closeSlashMenu()
      return true
    }
    return false
  }

  return {
    isSlashMenuOpen,
    slashQuery,
    handleSlashSelect,
    closeSlashMenu,
    handleSlashKeyDown: handleKeyDown,
    menuRef,
  }
}
