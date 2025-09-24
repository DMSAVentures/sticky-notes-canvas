import { useRef } from 'react'
import styles from './Canvas.module.css'
import { CanvasGrid } from './CanvasGrid'
import { CanvasViewport } from './CanvasViewport'
import { TrashCan } from '../TrashCan'
import { useCanvas } from '../../contexts/CanvasContext'
import { useCanvasState } from '../../hooks/useCanvasState'
import { useNoteManagement } from '../../hooks/useNoteManagement'

export function Canvas() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const { viewState, setViewState, isSaving } = useCanvas()

    const {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        resetView,
        gridSize,
        gridOpacity
    } = useCanvasState({ canvasRef, viewState, setViewState })

    const {
        notes,
        draggingNoteId,
        newNoteId,
        setNewNoteId,
        editingNoteId,
        setEditingNoteId,
        handleDoubleClick,
        handleNoteUpdate,
        handleNoteDelete,
        handleNoteSelect,
        handleNoteDragStart,
        handleNoteDragEnd,
        handleTrashDrop
    } = useNoteManagement({ canvasRef })

    // Handle clicking on canvas to exit edit mode
    const handleCanvasClick = (e: React.MouseEvent) => {
        // Only if clicking directly on canvas (not on notes or controls)
        if (e.target === e.currentTarget) {
            setEditingNoteId(null)
        }
    }

    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
        >
            <CanvasGrid
                gridSize={gridSize}
                gridOpacity={gridOpacity}
                viewState={viewState}
            />

            <CanvasViewport
                notes={notes}
                viewState={viewState}
                newNoteId={newNoteId}
                editingNoteId={editingNoteId}
                onNoteUpdate={handleNoteUpdate}
                onNoteDelete={handleNoteDelete}
                onNoteSelect={handleNoteSelect}
                onNoteDragStart={handleNoteDragStart}
                onNoteDragEnd={handleNoteDragEnd}
                onNewNoteRendered={() => setNewNoteId(null)}
                onEditingChange={setEditingNoteId}
            />

            <div className={styles.controls}>
                <button onClick={resetView}>
                    Reset View
                </button>
                <span className={styles.zoomLevel}>
                    Zoom: {Math.round(viewState.zoom * 100)}%
                </span>
                {isSaving && <span className={styles.saveIndicator}>Saving...</span>}
                {!isSaving && <span className={styles.saveIndicator}>✓ Saved</span>}
            </div>

            {notes.length === 0 && (
                <div className={styles.helpText}>
                    Double-click anywhere to create a sticky note
                </div>
            )}

            <TrashCan
                isActive={draggingNoteId !== null}
                onDrop={handleTrashDrop}
            />
        </div>
    )
}