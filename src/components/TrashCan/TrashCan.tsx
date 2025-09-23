import { useState, useRef, useEffect } from 'react'
import styles from './TrashCan.module.css'

interface TrashCanProps {
    isActive?: boolean
    onDrop?: () => void
}

export function TrashCan({ isActive = false, onDrop }: TrashCanProps) {
    const [isHovered, setIsHovered] = useState(false)
    const trashRef = useRef<HTMLDivElement>(null)

    // Add global mouse move listener when dragging
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
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Trash can lid */}
                <polyline points="3 6 5 6 21 6" />
                {/* Trash can body */}
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                {/* Handle */}
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                {/* Top decoration */}
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {(isActive || isHovered) && (
                <span className={styles.label}>Drop to delete</span>
            )}
        </div>
    )
}