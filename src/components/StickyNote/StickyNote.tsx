import { useState, useEffect, useRef, MouseEvent, FocusEvent, KeyboardEvent } from 'react'
import styles from './StickyNote.module.css'
import { NoteContent } from './NoteContent'
import { NOTE_COLORS, StickyNoteData } from './types'
import { useEditing } from '../../contexts/EditingContext'

interface StickyNoteProps extends StickyNoteData {
    onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onDelete: (id: string) => void
    onSelect: (id: string) => void
    zoom?: number
    onDragStart?: (id: string) => void
    onDragEnd?: (id: string) => void
}

export function StickyNote({
    id,
    x,
    y,
    width,
    height,
    content,
    color,
    zIndex,
    onUpdate,
    onDelete,
    onSelect,
    zoom = 1,
    onDragStart,
    onDragEnd
}: StickyNoteProps) {
    const noteRef = useRef<HTMLDivElement>(null)
    const {
        isEditing,
        shouldAutoFocus,
        startEditing,
        stopEditingSpecific,
        clearAutoFocus
    } = useEditing()

    const isCurrentlyEditing = isEditing(id)
    const shouldFocusThis = shouldAutoFocus(id)

    // States for UI interactions
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [originalPosition, setOriginalPosition] = useState({ x: 0, y: 0 })

    // Auto-focus handling
    useEffect(() => {
        if (shouldFocusThis) {
            onSelect(id)
            clearAutoFocus()
        }
    }, [shouldFocusThis, id, onSelect, clearAutoFocus])

    // Unified mouse handler for click/drag detection
    const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement

        // Skip if clicking on controls
        if (target.classList.contains(styles.resizeHandle) ||
            target.closest(`.${styles.colorPicker}`)) {
            return
        }

        onSelect(id)

        // Click vs drag detection
        const startX = e.clientX
        const startY = e.clientY
        let isDragIntent = false

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            const distance = Math.sqrt(
                Math.pow(moveEvent.clientX - startX, 2) +
                Math.pow(moveEvent.clientY - startY, 2)
            )

            if (distance > 5) {
                isDragIntent = true
                // Start dragging
                setIsDragging(true)
                setOriginalPosition({ x, y })
                setDragStart({
                    x: e.clientX - x * zoom,
                    y: e.clientY - y * zoom
                })
                onDragStart?.(id)

                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)

            // Click detected - enter edit mode
            if (!isDragIntent && !isCurrentlyEditing && !target.closest(`.${styles.header}`)) {
                startEditing(id)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    // Drag handling
    useEffect(() => {
        if (!isDragging) return

        const handleDragMove = (e: globalThis.MouseEvent) => {
            const newX = (e.clientX - dragStart.x) / zoom
            const newY = (e.clientY - dragStart.y) / zoom
            onUpdate(id, { x: newX, y: newY })
        }

        const handleDragEnd = (e: globalThis.MouseEvent) => {
            // Check trash drop
            const trashCan = document.querySelector('[aria-label="Drop here to delete note"]')
            if (trashCan) {
                const rect = trashCan.getBoundingClientRect()
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    onDelete(id)
                }
            }

            setIsDragging(false)
            onDragEnd?.(id)
        }

        const handleEscape = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onUpdate(id, { x: originalPosition.x, y: originalPosition.y })
                setIsDragging(false)
                onDragEnd?.(id)
            }
        }

        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragEnd)
        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('mousemove', handleDragMove)
            window.removeEventListener('mouseup', handleDragEnd)
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isDragging, dragStart, originalPosition, id, zoom, onUpdate, onDelete, onDragEnd])

    // Resize handling
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

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isCurrentlyEditing) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                startEditing(id)
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

    const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
            onSelect(id)
        }
    }

    const stopPropagation = (e: MouseEvent | FocusEvent) => {
        e.stopPropagation()
        e.preventDefault()
    }

    return (
        <article
            ref={noteRef}
            className={`${styles.stickyNote} ${isDragging ? styles.dragging : ''}`}
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
            tabIndex={0}
            role="article"
            aria-label={`Sticky note ${content ? `with content: ${content.substring(0, 50)}` : 'empty'}`}
            aria-describedby={`note-help-${id}`}
        >
            <div id={`note-help-${id}`} className="sr-only">
                Press Enter or Space to edit. Arrow keys to move. Delete key to remove. Escape to exit editing.
            </div>

            <header className={styles.header} role="toolbar" aria-label="Note controls">
                <button
                    className={styles.colorButton}
                    onClick={(e) => {
                        stopPropagation(e)
                        setShowColorPicker(!showColorPicker)
                    }}
                    onMouseDown={stopPropagation}
                    onFocus={stopPropagation}
                    style={{ backgroundColor: color }}
                    aria-label="Change note color"
                    aria-expanded={showColorPicker}
                    aria-haspopup="menu"
                />
                <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                        stopPropagation(e)
                        if (confirm('Delete this note?')) {
                            onDelete(id)
                        }
                    }}
                    onMouseDown={stopPropagation}
                    onFocus={stopPropagation}
                    aria-label="Delete note"
                >
                    <span aria-hidden="true">×</span>
                </button>
            </header>

            {showColorPicker && (
                <div className={styles.colorPicker} role="menu" aria-label="Color options">
                    {NOTE_COLORS.map((noteColor, index) => (
                        <button
                            key={noteColor}
                            className={styles.colorOption}
                            style={{ backgroundColor: noteColor }}
                            onClick={(e) => {
                                stopPropagation(e)
                                onUpdate(id, { color: noteColor })
                                setShowColorPicker(false)
                                noteRef.current?.focus()
                            }}
                            onMouseDown={stopPropagation}
                            role="menuitem"
                            aria-label={`Color ${index + 1}`}
                            tabIndex={0}
                        />
                    ))}
                </div>
            )}

            <NoteContent
                content={content}
                isEditing={isCurrentlyEditing || shouldFocusThis}
                onContentChange={(newContent) => onUpdate(id, { content: newContent })}
                onEditStart={() => startEditing(id)}
                onEditEnd={() => {
                    stopEditingSpecific(id)
                    noteRef.current?.focus()
                }}
            />

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