import { useState, useRef } from 'react'
import styles from './CanvasSwitcher.module.css'
import { StoredCanvas } from '../../types'

interface CanvasSwitcherProps {
    canvases: StoredCanvas[]
    currentCanvasId: string | null
    onSelectCanvas: (canvasId: string) => void
    onCreateCanvas: () => void
    onRenameCanvas: (canvasId: string, newName: string) => void
    onDeleteCanvas: (canvasId: string) => void
    getNoteCount: (canvasId: string) => number
}

export function CanvasSwitcher({
    canvases,
    currentCanvasId,
    onSelectCanvas,
    onCreateCanvas,
    onRenameCanvas,
    onDeleteCanvas,
    getNoteCount
}: CanvasSwitcherProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleRename = (canvas: StoredCanvas) => {
        setEditingId(canvas.id)
        setEditValue(canvas.name)
        setTimeout(() => {
            inputRef.current?.select()
        }, 0)
    }

    const handleRenameSubmit = (canvasId: string) => {
        if (editValue.trim()) {
            onRenameCanvas(canvasId, editValue.trim())
        }
        setEditingId(null)
    }

    const handleRenameCancel = () => {
        setEditingId(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent, canvasId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleRenameSubmit(canvasId)
        } else if (e.key === 'Escape') {
            handleRenameCancel()
        }
    }

    const handleDelete = (e: React.MouseEvent, canvasId: string) => {
        e.stopPropagation()
        if (canvases.length > 1) {
            if (confirm('Delete this canvas? All notes on this canvas will be lost.')) {
                onDeleteCanvas(canvasId)
            }
        } else {
            alert('You cannot delete the last canvas.')
        }
    }

    return (
        <div className={styles.canvasSwitcher}>
            <div className={styles.header}>
                <span className={styles.title}>Canvases</span>
                <button
                    className={styles.addButton}
                    onClick={onCreateCanvas}
                    title="Create new canvas"
                >
                    + New
                </button>
            </div>

            <div className={styles.canvasList}>
                {canvases.map((canvas, index) => (
                    <div
                        key={canvas.id}
                        className={`${styles.canvasItem} ${
                            canvas.id === currentCanvasId ? styles.active : ''
                        } ${editingId === canvas.id ? styles.editing : ''}`}
                        onClick={() => {
                            if (editingId !== canvas.id) {
                                onSelectCanvas(canvas.id)
                            }
                        }}
                        title={index < 9 ? `⌘${index + 1}` : undefined}
                    >
                        {editingId === canvas.id ? (
                            <input
                                ref={inputRef}
                                className={styles.canvasName}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleRenameSubmit(canvas.id)}
                                onKeyDown={(e) => handleKeyDown(e, canvas.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className={styles.canvasName}>{canvas.name}</span>
                        )}

                        <span className={styles.noteCount}>
                            {getNoteCount(canvas.id)}
                        </span>

                        <div className={styles.canvasActions}>
                            <button
                                className={styles.actionButton}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRename(canvas)
                                }}
                                title="Rename canvas"
                            >
                                ✏️
                            </button>
                            {canvases.length > 1 && (
                                <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={(e) => handleDelete(e, canvas.id)}
                                    title="Delete canvas"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
