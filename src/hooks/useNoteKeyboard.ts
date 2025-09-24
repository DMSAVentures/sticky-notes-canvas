import { KeyboardEvent } from 'react'

interface UseNoteKeyboardProps {
    id: string
    x: number
    y: number
    width: number
    height: number
    isEditing: boolean
    isDragging: boolean
    isResizing: boolean
    onUpdate: (id: string, updates: Partial<{ x: number; y: number; width: number; height: number }>) => void
    onDelete: (id: string) => void
    onEditStart: () => void
}

export function useNoteKeyboard({
    id,
    x,
    y,
    width,
    height,
    isEditing,
    isDragging,
    isResizing,
    onUpdate,
    onDelete,
    onEditStart
}: UseNoteKeyboardProps) {

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        // Enter or Space to start editing
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onEditStart()
        }
        // Delete key to delete note
        else if (!isEditing && e.key === 'Delete') {
            if (confirm('Delete this note?')) {
                onDelete(id)
            }
        }
        // Arrow keys to move note (when not editing)
        else if (!isEditing && !isDragging && !isResizing) {
            const step = e.shiftKey ? 10 : 1
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault()
                    onUpdate(id, { x: x - step })
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    onUpdate(id, { x: x + step })
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    onUpdate(id, { y: y - step })
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    onUpdate(id, { y: y + step })
                    break
            }
        }
    }

    const handleResizeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const step = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowRight') {
            e.preventDefault()
            onUpdate(id, { width: Math.max(150, width + step) })
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            onUpdate(id, { width: Math.max(150, width - step) })
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            onUpdate(id, { height: Math.max(100, height + step) })
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            onUpdate(id, { height: Math.max(100, height - step) })
        }
    }

    return {
        handleKeyDown,
        handleResizeKeyDown
    }
}