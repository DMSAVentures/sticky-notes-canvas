import styles from './Canvas.module.css'
import { StickyNote } from '../StickyNote'
import { StickyNoteData, ViewState } from '../../types'

interface CanvasViewportProps {
    notes: StickyNoteData[]
    viewState: ViewState
    onNoteUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onNoteDelete: (id: string) => void
    onNoteSelect: (id: string) => void
    onNoteDragStart: (id: string) => void
    onNoteDragEnd: () => void
}

export function CanvasViewport({
    notes,
    viewState,
    onNoteUpdate,
    onNoteDelete,
    onNoteSelect,
    onNoteDragStart,
    onNoteDragEnd
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
                    onUpdate={onNoteUpdate}
                    onDelete={onNoteDelete}
                    onSelect={onNoteSelect}
                    onDragStart={onNoteDragStart}
                    onDragEnd={onNoteDragEnd}
                />
            ))}
        </div>
    )
}