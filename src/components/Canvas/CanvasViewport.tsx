import styles from './Canvas.module.css'
import { StickyNote } from '../StickyNote'
import { StickyNoteData, ViewState } from '../../types'

interface CanvasViewportProps {
    notes: StickyNoteData[]
    viewState: ViewState
    newNoteId: string | null
    editingNoteId: string | null
    onNoteUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onNoteDelete: (id: string) => void
    onNoteSelect: (id: string) => void
    onNoteDragStart: (id: string) => void
    onNoteDragEnd: () => void
    onNewNoteRendered: () => void
    onEditingChange: (id: string | null) => void
}

export function CanvasViewport({
    notes,
    viewState,
    newNoteId,
    editingNoteId,
    onNoteUpdate,
    onNoteDelete,
    onNoteSelect,
    onNoteDragStart,
    onNoteDragEnd,
    onNewNoteRendered,
    onEditingChange
}: CanvasViewportProps) {
    return (
        <div
            className={styles.viewport}
            style={{
                transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
            }}
        >
            {notes.map(note => (
                <StickyNote
                    key={note.id}
                    {...note}
                    zoom={viewState.zoom}
                    shouldAutoFocus={note.id === newNoteId}
                    isEditingExternal={note.id === editingNoteId}
                    onUpdate={onNoteUpdate}
                    onDelete={onNoteDelete}
                    onSelect={onNoteSelect}
                    onDragStart={onNoteDragStart}
                    onDragEnd={onNoteDragEnd}
                    onAutoFocusComplete={note.id === newNoteId ? onNewNoteRendered : undefined}
                    onEditingChange={(isEditing) => onEditingChange(isEditing ? note.id : null)}
                />
            ))}
        </div>
    )
}