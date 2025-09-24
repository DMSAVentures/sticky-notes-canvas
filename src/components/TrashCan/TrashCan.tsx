import { useState, useRef, useEffect } from 'react'
import styles from './TrashCan.module.css'

interface TrashCanProps {
    isActive?: boolean
}

export function TrashCan({ isActive = false }: TrashCanProps) {
    const [isHovered, setIsHovered] = useState(false)
    const trashRef = useRef<HTMLDivElement>(null)

    // Track hover state during drag operations
    useEffect(() => {
        if (!isActive) return

        const handleMouseMove = (e: MouseEvent) => {
            if (trashRef.current) {
                const rect = trashRef.current.getBoundingClientRect()
                const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                               e.clientY >= rect.top && e.clientY <= rect.bottom
                setIsHovered(isOver)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [isActive])

    return (
        <div
            ref={trashRef}
            className={`${styles.trashCan} ${isActive ? styles.active : ''} ${isHovered ? styles.hovered : ''}`}
            aria-label="Drop here to delete note"
            role="button"
        >
            🗑️
        </div>
    )
}
