import { KeyboardEvent } from 'react'

interface UseNoteKeyboardProps {
    id: string
    x: number
    y: number
    isEditing: boolean
    isDragging: boolean
    onUpdate: (id: string, updates: { x?: number; y?: number }) => void
    onDelete: (id: string) => void
    onStartEdit: () => void
}

export function useNoteKeyboard({
    id,
    x,
    y,
    isEditing,
    isDragging,
    onUpdate,
    onDelete,
    onStartEdit
}: UseNoteKeyboardProps) {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isEditing) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onStartEdit()
            } else if (e.key === 'Delete') {
                if (confirm('Delete this note?')) {
                    onDelete(id)
                }
            } else if (!isDragging) {
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
    }

    return {
        handleKeyDown
    }
}