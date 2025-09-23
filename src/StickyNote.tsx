import { useState, useRef, useEffect, MouseEvent, ChangeEvent, KeyboardEvent, FocusEvent } from 'react'
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
    const [isFocused, setIsFocused] = useState(false)
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
        noteRef.current?.focus()
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        // Enter or Space to start editing
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsEditing(true)
        }
        // Escape to stop editing
        else if (isEditing && e.key === 'Escape') {
            setIsEditing(false)
            noteRef.current?.focus()
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

    // Handle focus
    const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
        setIsFocused(true)
        onSelect(id)
    }

    const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
        // Don't blur if focus is moving to a child element
        if (!noteRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocused(false)
        }
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
        <article
            ref={noteRef}
            className={`${styles.stickyNote} ${isFocused ? styles.focused : ''}`}
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
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={0}
            role="article"
            aria-label={`Sticky note ${noteContent ? `with content: ${noteContent.substring(0, 50)}` : 'empty'}`}
            aria-describedby={`note-help-${id}`}
        >
            {/* Screen reader help text */}
            <div id={`note-help-${id}`} className="sr-only">
                Press Enter or Space to edit. Arrow keys to move. Delete key to remove. Escape to exit editing.
            </div>

            {/* Header with controls */}
            <div className={styles.header} role="toolbar" aria-label="Note controls">
                <button
                    className={styles.colorButton}
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowColorPicker(!showColorPicker)
                    }}
                    style={{ backgroundColor: color }}
                    aria-label="Change note color"
                    aria-expanded={showColorPicker}
                    aria-haspopup="menu"
                />
                <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this note?')) {
                            onDelete(id)
                        }
                    }}
                    aria-label="Delete note"
                >
                    <span aria-hidden="true">×</span>
                </button>
            </div>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <div
                    className={styles.colorPicker}
                    role="menu"
                    aria-label="Color options"
                >
                    {COLORS.map((c, index) => (
                        <button
                            key={c}
                            className={styles.colorOption}
                            style={{ backgroundColor: c }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleColorChange(c)
                            }}
                            role="menuitem"
                            aria-label={`Color ${index + 1}`}
                            tabIndex={0}
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
                        aria-label="Note content"
                        placeholder="Type your note here..."
                    />
                ) : (
                    <div
                        className={styles.text}
                        role="textbox"
                        aria-readonly="true"
                        aria-label="Note content (read-only)"
                    >
                        {noteContent || 'Double-click to edit'}
                    </div>
                )}
            </div>

            {/* Resize handle */}
            <div
                className={styles.resizeHandle}
                onMouseDown={handleResizeStart}
                role="separator"
                aria-label="Resize note"
                aria-orientation="vertical"
                tabIndex={0}
                onKeyDown={(e) => {
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
                }}
            />
        </article>
    )
}