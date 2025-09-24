import { useState, useEffect, MouseEvent } from 'react'
import { useEditing } from '../contexts/EditingContext'
import { DRAG_THRESHOLD_PX, TRASH_CAN_SELECTOR } from '../constants'

interface UseNoteInteractionProps {
    id: string
    x: number
    y: number
    zoom: number
    onUpdate: (id: string, updates: { x: number; y: number }) => void
    onDelete: (id: string) => void
    onSelect: (id: string) => void
    onDragStart?: (id: string) => void
    onDragEnd?: (id: string) => void
}

export function useNoteInteraction({
    id,
    x,
    y,
    zoom,
    onUpdate,
    onDelete,
    onSelect,
    onDragStart,
    onDragEnd
}: UseNoteInteractionProps) {
    const { startEditing, isEditing } = useEditing()
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 })

    const isCurrentlyEditing = isEditing(id)

    // Handle mouse down for both click and drag
    const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement

        // Skip if clicking on controls
        const isResizeHandle = target.getAttribute('role') === 'separator'
        const isColorPicker = target.closest('[role="menu"]') ||
                             target.getAttribute('aria-label')?.includes('color')
        const isHeader = target.closest('header')

        if (isResizeHandle || isColorPicker) {
            return
        }

        onSelect(id)

        // Setup click vs drag detection
        const startX = e.clientX
        const startY = e.clientY
        let isDragIntent = false

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            const distance = Math.sqrt(
                Math.pow(moveEvent.clientX - startX, 2) +
                Math.pow(moveEvent.clientY - startY, 2)
            )

            if (distance > DRAG_THRESHOLD_PX && !isDragIntent) {
                isDragIntent = true

                // Start dragging
                setIsDragging(true)
                setOriginalPosition({ x, y })
                setDragStart({
                    x: e.clientX - x * zoom,
                    y: e.clientY - y * zoom
                })
                onDragStart?.(id)

                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)

            // If it wasn't a drag and not editing, start editing
            if (!isDragIntent && !isCurrentlyEditing && !isHeader) {
                startEditing(id)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    // Handle drag movement
    useEffect(() => {
        if (!isDragging) return

        const handleDragMove = (e: globalThis.MouseEvent) => {
            const newX = (e.clientX - dragStart.x) / zoom
            const newY = (e.clientY - dragStart.y) / zoom
            onUpdate(id, { x: newX, y: newY })
        }

        const handleDragEnd = (e: globalThis.MouseEvent) => {
            // Check trash drop
            const trashCan = document.querySelector(TRASH_CAN_SELECTOR)
            if (trashCan) {
                const rect = trashCan.getBoundingClientRect()
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    onDelete(id)
                }
            }

            setIsDragging(false)
            onDragEnd?.(id)
        }

        const handleEscape = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onUpdate(id, { x: originalPosition.x, y: originalPosition.y })
                setIsDragging(false)
                onDragEnd?.(id)
            }
        }

        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragEnd)
        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('mousemove', handleDragMove)
            window.removeEventListener('mouseup', handleDragEnd)
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isDragging, dragStart, originalPosition, id, zoom, onUpdate, onDelete, onDragEnd])

    return {
        isDragging,
        handleMouseDown
    }
}