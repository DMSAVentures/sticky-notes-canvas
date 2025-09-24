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
        handleDoubleClick,
        handleNoteUpdate,
        handleNoteDelete,
        handleNoteSelect,
        handleNoteDragStart,
        handleNoteDragEnd,
        handleTrashDrop
    } = useNoteManagement({ canvasRef })

    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
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
                onNoteUpdate={handleNoteUpdate}
                onNoteDelete={handleNoteDelete}
                onNoteSelect={handleNoteSelect}
                onNoteDragStart={handleNoteDragStart}
                onNoteDragEnd={handleNoteDragEnd}
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