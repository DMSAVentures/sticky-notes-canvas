import { useState, useEffect, MouseEvent } from 'react'

interface UseNoteDragProps {
    id: string
    x: number
    y: number
    zoom: number
    onUpdate: (id: string, updates: { x: number; y: number }) => void
    onDelete: (id: string) => void
    onDragStart?: (id: string) => void
    onDragEnd?: (id: string) => void
}

export function useNoteDrag({
    id,
    x,
    y,
    zoom,
    onUpdate,
    onDelete,
    onDragStart,
    onDragEnd
}: UseNoteDragProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 })

    const handleDragStart = (e: MouseEvent) => {
        setIsDragging(true)
        setOriginalPosition({ x, y })
        setDragStart({
            x: e.clientX - x * zoom,
            y: e.clientY - y * zoom
        })
        onDragStart?.(id)
        e.preventDefault()
    }

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            const newX = (e.clientX - dragStart.x) / zoom
            const newY = (e.clientY - dragStart.y) / zoom
            onUpdate(id, { x: newX, y: newY })
        }

        const handleMouseUp = (e: globalThis.MouseEvent) => {
            // Check if dropped on trash can
            const trashCan = document.querySelector('[aria-label="Drop here to delete note"]')
            if (trashCan) {
                const rect = trashCan.getBoundingClientRect()
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    setIsDragging(false)
                    onDragEnd?.(id)
                    onDelete(id)
                    return
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

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isDragging, dragStart, id, zoom, originalPosition, onUpdate, onDelete, onDragEnd])

    return {
        isDragging,
        handleDragStart
    }
}