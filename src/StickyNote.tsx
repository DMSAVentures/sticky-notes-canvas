import { useState, useRef, useEffect, MouseEvent, ChangeEvent } from 'react'
import styles from './StickyNote.module.css'

interface StickyNoteProps {
    id: string
    x: number
    y: number
    width: number
    height: number
    content: string
    color: string
    onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onDelete: (id: string) => void
    zIndex: number
    onSelect: (id: string) => void
}

export interface StickyNoteData {
    id: string
    x: number
    y: number
    width: number
    height: number
    content: string
    color: string
    zIndex: number
}

const COLORS = [
    '#ffeb3b', // Yellow
    '#ff9800', // Orange
    '#4caf50', // Green
    '#2196f3', // Blue
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#ff5722', // Deep Orange
]

export function StickyNote({
    id,
    x,
    y,
    width,
    height,
    content,
    color,
    onUpdate,
    onDelete,
    zIndex,
    onSelect
}: StickyNoteProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
    const [noteContent, setNoteContent] = useState(content)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Handle dragging
    const handleMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains(styles.resizeHandle)) {
            return
        }

        onSelect(id)
        setIsDragging(true)
        setDragStart({
            x: e.clientX - x,
            y: e.clientY - y
        })
        e.preventDefault()
    }

    // Handle resizing
    const handleResizeStart = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setIsResizing(true)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: width,
            height: height
        })
    }

    // Handle text editing
    const handleDoubleClick = () => {
        setIsEditing(true)
    }

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setNoteContent(e.target.value)
    }

    const handleContentBlur = () => {
        setIsEditing(false)
        onUpdate(id, { content: noteContent })
    }

    // Handle color change
    const handleColorChange = (newColor: string) => {
        onUpdate(id, { color: newColor })
        setShowColorPicker(false)
    }

    // Handle dragging
    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            const newX = e.clientX - dragStart.x
            const newY = e.clientY - dragStart.y
            onUpdate(id, { x: newX, y: newY })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragStart.x, dragStart.y, id, onUpdate])

    // Handle resizing
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

    // Focus textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        }
    }, [isEditing])

    // Update content when it changes from outside
    useEffect(() => {
        setNoteContent(content)
    }, [content])

    return (
        <div
            ref={noteRef}
            className={styles.stickyNote}
            style={{
                left: x,
                top: y,
                width,
                height,
                backgroundColor: color,
                zIndex,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {/* Header with controls */}
            <div className={styles.header}>
                <button
                    className={styles.colorButton}
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowColorPicker(!showColorPicker)
                    }}
                    style={{ backgroundColor: color }}
                />
                <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(id)
                    }}
                >
                    ×
                </button>
            </div>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <div className={styles.colorPicker}>
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            className={styles.colorOption}
                            style={{ backgroundColor: c }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleColorChange(c)
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content area */}
            <div className={styles.content} ref={contentRef}>
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        value={noteContent}
                        onChange={handleContentChange}
                        onBlur={handleContentBlur}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className={styles.text}>{noteContent || 'Double-click to edit'}</div>
                )}
            </div>

            {/* Resize handle */}
            <div
                className={styles.resizeHandle}
                onMouseDown={handleResizeStart}
            />
        </div>
    )
}