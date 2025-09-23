import { useState, useRef, useEffect, MouseEvent, KeyboardEvent, FocusEvent } from 'react'
import styles from './StickyNote.module.css'
import { NoteContent } from './NoteContent'
import { StickyNoteProps, NOTE_COLORS } from './types'

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
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)

    // Handle dragging
    const handleMouseDown = (e: MouseEvent) => {
        // Don't start dragging if clicking on resize handle or header controls
        const target = e.target as HTMLElement
        if (target.classList.contains(styles.resizeHandle) ||
            target.closest(`.${styles.header}`) ||
            target.closest(`.${styles.colorPicker}`)) {
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

    // Handle content update
    const handleContentUpdate = (newContent: string) => {
        onUpdate(id, { content: newContent })
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
        // Don't select if focus came from clicking a button within the note
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
            onSelect(id)
        }
        setIsFocused(true)
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
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={0}
            role="article"
            aria-label={`Sticky note ${content ? `with content: ${content.substring(0, 50)}` : 'empty'}`}
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
                        e.preventDefault()
                        setShowColorPicker(!showColorPicker)
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                    onFocus={(e) => {
                        e.stopPropagation()
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
                        e.preventDefault()
                        if (confirm('Delete this note?')) {
                            onDelete(id)
                        }
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                    onFocus={(e) => {
                        e.stopPropagation()
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
                    {NOTE_COLORS.map((c, index) => (
                        <button
                            key={c}
                            className={styles.colorOption}
                            style={{ backgroundColor: c }}
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleColorChange(c)
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                            role="menuitem"
                            aria-label={`Color ${index + 1}`}
                            tabIndex={0}
                        />
                    ))}
                </div>
            )}

            {/* Content area */}
            <NoteContent
                content={content}
                isEditing={isEditing}
                onContentChange={handleContentUpdate}
                onEditStart={() => setIsEditing(true)}
                onEditEnd={() => {
                    setIsEditing(false)
                    noteRef.current?.focus()
                }}
            />

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