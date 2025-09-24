import { useEffect, FocusEvent, MouseEvent } from 'react'
import styles from './StickyNote.module.css'
import { NoteContent } from './NoteContent'
import { NOTE_COLORS, StickyNoteData } from './types'
import { useEditing } from '../../contexts/EditingContext'
import { useNoteInteraction } from '../../hooks/useNoteInteraction'
import { useNoteResize } from '../../hooks/useNoteResize'
import { useNoteKeyboard } from '../../hooks/useNoteKeyboard'
import { useNoteColors } from '../../hooks/useNoteColors'
import { safeConfirm } from '../../utils/dom-safety'

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
    const {
        isEditing,
        shouldAutoFocus,
        startEditing,
        stopEditingSpecific,
        clearAutoFocus
    } = useEditing()

    const isCurrentlyEditing = isEditing(id)
    const shouldFocusThis = shouldAutoFocus(id)

    const { isDragging, handleMouseDown } = useNoteInteraction({
        id, x, y, zoom, onUpdate, onDelete, onSelect, onDragStart, onDragEnd
    })

    const { handleResizeStart, handleResizeKeyDown } = useNoteResize({
        id, width, height, onUpdate
    })

    const { handleKeyDown } = useNoteKeyboard({
        id, x, y,
        isEditing: isCurrentlyEditing,
        isDragging,
        onUpdate,
        onDelete,
        onStartEdit: () => startEditing(id)
    })

    const {
        showColorPicker,
        noteRef,
        handleColorButtonClick,
        handleColorSelect
    } = useNoteColors({
        id, onUpdate
    })

    // Focus newly created notes automatically
    useEffect(() => {
        if (shouldFocusThis) {
            onSelect(id)
            clearAutoFocus()
        }
    }, [shouldFocusThis, id, onSelect, clearAutoFocus])

    const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
            onSelect(id)
        }
    }

    const handleDeleteClick = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (safeConfirm('Delete this note?')) {
            onDelete(id)
        }
    }

    const handleContentChange = (newContent: string) => {
        onUpdate(id, { content: newContent })
    }

    const handleEditEnd = () => {
        stopEditingSpecific(id)
        noteRef.current?.focus()
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
                    onClick={handleColorButtonClick}
                    onMouseDown={stopPropagation}
                    onFocus={stopPropagation}
                    style={{ backgroundColor: color }}
                    aria-label="Change note color"
                    aria-expanded={showColorPicker}
                    aria-haspopup="menu"
                />
                <button
                    className={styles.deleteButton}
                    onClick={handleDeleteClick}
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
                            onClick={handleColorSelect(noteColor)}
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
                onContentChange={handleContentChange}
                onEditEnd={handleEditEnd}
            />

            <div
                className={styles.resizeHandle}
                onMouseDown={handleResizeStart}
                onKeyDown={handleResizeKeyDown}
                role="separator"
                aria-label="Resize note"
                aria-orientation="vertical"
                tabIndex={0}
            />
        </article>
    )
}