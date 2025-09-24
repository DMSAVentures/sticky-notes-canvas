import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react'
import styles from './NoteContent.module.css'

interface NoteContentProps {
    content: string
    isEditing: boolean
    onContentChange: (content: string) => void
    onEditStart: () => void
    onEditEnd: () => void
    onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
}

export function NoteContent({
    content,
    isEditing,
    onContentChange,
    onEditStart,
    onEditEnd,
    onKeyDown
}: NoteContentProps) {
    const [localContent, setLocalContent] = useState(content)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Update local content when prop changes
    useEffect(() => {
        setLocalContent(content)
    }, [content])

    // Focus textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            // Move cursor to end of text for appending
            const length = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(length, length)
        }
    }, [isEditing])

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setLocalContent(e.target.value)
    }

    const handleContentBlur = () => {
        onEditEnd()
        onContentChange(localContent)
    }


    const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onEditEnd()
        }
        // Stop propagation for normal typing
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            e.stopPropagation()
        }
    }

    return (
        <div
            className={styles.content}
            ref={contentRef}
            onKeyDown={onKeyDown}
        >
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={localContent}
                    onChange={handleContentChange}
                    onBlur={handleContentBlur}
                    onKeyDown={handleTextareaKeyDown}
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
                    {localContent || 'Click to edit'}
                </div>
            )}
        </div>
    )
}