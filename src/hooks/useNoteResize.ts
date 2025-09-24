import { MouseEvent, KeyboardEvent } from 'react'

interface UseNoteResizeProps {
    id: string
    width: number
    height: number
    onUpdate: (id: string, updates: { width?: number; height?: number }) => void
}

export function useNoteResize({ id, width, height, onUpdate }: UseNoteResizeProps) {
    const handleResizeStart = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = width
        const startHeight = height

        const handleResizeMove = (moveEvent: globalThis.MouseEvent) => {
            const deltaX = moveEvent.clientX - startX
            const deltaY = moveEvent.clientY - startY

            onUpdate(id, {
                width: Math.max(150, startWidth + deltaX),
                height: Math.max(100, startHeight + deltaY)
            })
        }

        const handleResizeEnd = () => {
            window.removeEventListener('mousemove', handleResizeMove)
            window.removeEventListener('mouseup', handleResizeEnd)
        }

        window.addEventListener('mousemove', handleResizeMove)
        window.addEventListener('mouseup', handleResizeEnd)
    }

    const handleResizeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const step = e.shiftKey ? 10 : 1
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                onUpdate(id, { width: Math.max(150, width + step) })
                break
            case 'ArrowLeft':
                e.preventDefault()
                onUpdate(id, { width: Math.max(150, width - step) })
                break
            case 'ArrowDown':
                e.preventDefault()
                onUpdate(id, { height: Math.max(100, height + step) })
                break
            case 'ArrowUp':
                e.preventDefault()
                onUpdate(id, { height: Math.max(100, height - step) })
                break
        }
    }

    return {
        handleResizeStart,
        handleResizeKeyDown
    }
}