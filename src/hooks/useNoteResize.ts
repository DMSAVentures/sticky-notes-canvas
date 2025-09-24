import { MouseEvent, KeyboardEvent } from 'react'
import {
    NOTE_MIN_WIDTH,
    NOTE_MIN_HEIGHT,
    KEYBOARD_STEP_NORMAL,
    KEYBOARD_STEP_FAST
} from '../constants'

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
                width: Math.max(NOTE_MIN_WIDTH, startWidth + deltaX),
                height: Math.max(NOTE_MIN_HEIGHT, startHeight + deltaY)
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
        const step = e.shiftKey ? KEYBOARD_STEP_FAST : KEYBOARD_STEP_NORMAL
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                onUpdate(id, { width: Math.max(NOTE_MIN_WIDTH, width + step) })
                break
            case 'ArrowLeft':
                e.preventDefault()
                onUpdate(id, { width: Math.max(NOTE_MIN_WIDTH, width - step) })
                break
            case 'ArrowDown':
                e.preventDefault()
                onUpdate(id, { height: Math.max(NOTE_MIN_HEIGHT, height + step) })
                break
            case 'ArrowUp':
                e.preventDefault()
                onUpdate(id, { height: Math.max(NOTE_MIN_HEIGHT, height - step) })
                break
        }
    }

    return {
        handleResizeStart,
        handleResizeKeyDown
    }
}