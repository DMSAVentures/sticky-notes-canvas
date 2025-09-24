import { useState, useRef, useEffect, MouseEvent, FocusEvent } from 'react'
import styles from './StickyNote.module.css'
import { NoteContent } from './NoteContent'
import { NOTE_COLORS, StickyNoteData } from './types'
import { useNoteDrag } from '../../hooks/useNoteDrag'
import { useNoteResize } from '../../hooks/useNoteResize'
import { useNoteKeyboard } from '../../hooks/useNoteKeyboard'

interface StickyNoteProps extends StickyNoteData {
    onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onDelete: (id: string) => void
    onSelect: (id: string) => void
    zoom?: number
    shouldAutoFocus?: boolean
    isEditingExternal?: boolean
    onDragStart?: (id: string) => void
    onDragEnd?: (id: string) => void
    onAutoFocusComplete?: () => void
    onEditingChange?: (isEditing: boolean) => void
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
    shouldAutoFocus = false,
    isEditingExternal = false,
    onDragStart,
    onDragEnd,
    onAutoFocusComplete,
    onEditingChange
}: StickyNoteProps) {
    const [isEditing, setIsEditingState] = useState(shouldAutoFocus)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)

    // Wrapper for setIsEditing that also notifies parent
    const setIsEditing = (editing: boolean) => {
        setIsEditingState(editing)
        onEditingChange?.(editing)
    }

    // Auto-focus and start editing when shouldAutoFocus is true
    useEffect(() => {
        if (shouldAutoFocus && !isEditing) {
            setIsEditing(true)
            onSelect(id)
            onAutoFocusComplete?.()
        }
    }, [shouldAutoFocus, id, onSelect, onAutoFocusComplete, isEditing])

    // Handle external editing state changes (like clicking on canvas)
    useEffect(() => {
        if (!isEditingExternal && isEditing) {
            setIsEditing(false)
        }
    }, [isEditingExternal])

    // Use custom hooks for complex logic
    const { isDragging, handleDragStart } = useNoteDrag({
        id,
        x,
        y,
        zoom,
        onUpdate,
        onDelete,
        onDragStart,
        onDragEnd
    })

    const { isResizing, handleResizeStart } = useNoteResize({
        id,
        width,
        height,
        onUpdate
    })

    const { handleKeyDown, handleResizeKeyDown } = useNoteKeyboard({
        id,
        x,
        y,
        width,
        height,
        isEditing,
        isDragging,
        isResizing,
        onUpdate,
        onDelete,
        onEditStart: () => setIsEditing(true)
    })

    // Simplified event handlers
    const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement

        // Skip if clicking on controls or resize handle
        if (target.classList.contains(styles.resizeHandle) ||
            target.closest(`.${styles.colorPicker}`)) {
            return
        }

        onSelect(id)

        // Store mouse position for click vs drag detection
        const startX = e.clientX
        const startY = e.clientY
        let isDragIntent = false

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            // If mouse moved more than 5 pixels, it's a drag
            const distance = Math.sqrt(
                Math.pow(moveEvent.clientX - startX, 2) +
                Math.pow(moveEvent.clientY - startY, 2)
            )
            if (distance > 5) {
                isDragIntent = true
                // Start dragging
                handleDragStart(e)
                // Remove listeners as drag will handle the rest
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)

            // If not dragging and clicking on content area, enter edit mode
            if (!isDragIntent && !isEditing && !target.closest(`.${styles.header}`)) {
                setIsEditing(true)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
    }

    const handleColorChange = (newColor: string) => {
        onUpdate(id, { color: newColor })
        setShowColorPicker(false)
        noteRef.current?.focus()
    }

    const handleContentUpdate = (newContent: string) => {
        onUpdate(id, { content: newContent })
    }

    const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
            onSelect(id)
        }
    }

    // Prevent event bubbling for buttons
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
            {/* Screen reader help text */}
            <div id={`note-help-${id}`} className="sr-only">
                Press Enter or Space to edit. Arrow keys to move. Delete key to remove. Escape to exit editing.
            </div>

            {/* Header with controls */}
            <header className={styles.header} role="toolbar" aria-label="Note controls">
                <ColorButton
                    color={color}
                    showPicker={showColorPicker}
                    onToggle={() => setShowColorPicker(!showColorPicker)}
                    onStopPropagation={stopPropagation}
                />
            </header>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <ColorPicker
                    colors={NOTE_COLORS}
                    onColorSelect={handleColorChange}
                    onStopPropagation={stopPropagation}
                />
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
            <ResizeHandle
                onMouseDown={handleResizeStart}
                onKeyDown={handleResizeKeyDown}
            />
        </article>
    )
}

// Extracted sub-components for cleaner code
interface ColorButtonProps {
    color: string
    showPicker: boolean
    onToggle: () => void
    onStopPropagation: (e: MouseEvent | FocusEvent) => void
}

function ColorButton({ color, showPicker, onToggle, onStopPropagation }: ColorButtonProps) {
    return (
        <button
            className={styles.colorButton}
            onClick={(e) => {
                onStopPropagation(e)
                onToggle()
            }}
            onMouseDown={onStopPropagation}
            onFocus={onStopPropagation}
            style={{ backgroundColor: color }}
            aria-label="Change note color"
            aria-expanded={showPicker}
            aria-haspopup="menu"
        />
    )
}


interface ColorPickerProps {
    colors: readonly string[]
    onColorSelect: (color: string) => void
    onStopPropagation: (e: MouseEvent) => void
}

function ColorPicker({ colors, onColorSelect, onStopPropagation }: ColorPickerProps) {
    return (
        <div
            className={styles.colorPicker}
            role="menu"
            aria-label="Color options"
        >
            {colors.map((color, index) => (
                <button
                    key={color}
                    className={styles.colorOption}
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                        onStopPropagation(e)
                        onColorSelect(color)
                    }}
                    onMouseDown={onStopPropagation}
                    role="menuitem"
                    aria-label={`Color ${index + 1}`}
                    tabIndex={0}
                />
            ))}
        </div>
    )
}

interface ResizeHandleProps {
    onMouseDown: (e: MouseEvent) => void
    onKeyDown: (e: React.KeyboardEvent) => void
}

function ResizeHandle({ onMouseDown, onKeyDown }: ResizeHandleProps) {
    return (
        <div
            className={styles.resizeHandle}
            onMouseDown={onMouseDown}
            onKeyDown={onKeyDown}
            role="separator"
            aria-label="Resize note"
            aria-orientation="vertical"
            tabIndex={0}
        />
    )
}
