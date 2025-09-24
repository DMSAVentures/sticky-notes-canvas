import { useState, useEffect, MouseEvent } from 'react'

interface UseNoteResizeProps {
    id: string
    width: number
    height: number
    onUpdate: (id: string, updates: { width: number; height: number }) => void
}

export function useNoteResize({ id, width, height, onUpdate }: UseNoteResizeProps) {
    const [isResizing, setIsResizing] = useState(false)
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

    const handleResizeStart = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setIsResizing(true)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width,
            height
        })
    }

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            const deltaX = e.clientX - resizeStart.x
            const deltaY = e.clientY - resizeStart.y

            const newWidth = Math.max(150, resizeStart.width + deltaX)
            const newHeight = Math.max(100, resizeStart.height + deltaY)

            onUpdate(id, { width: newWidth, height: newHeight })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, resizeStart, id, onUpdate])

    return {
        isResizing,
        handleResizeStart
    }
}