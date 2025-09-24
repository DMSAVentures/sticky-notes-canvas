import styles from './App.module.css'
import { Canvas } from './components/Canvas'
import { CanvasSwitcher } from './components/CanvasSwitcher'
import { CanvasProvider, useCanvas } from './contexts/CanvasContext'

function AppContent() {
    const {
        canvases,
        currentCanvasId,
        selectCanvas,
        createCanvas,
        renameCanvas,
        deleteCanvas,
        getNoteCount
    } = useCanvas()

    return (
        <div className={styles.app}>
            <Canvas />
            <CanvasSwitcher
                canvases={canvases}
                currentCanvasId={currentCanvasId}
                onSelectCanvas={selectCanvas}
                onCreateCanvas={createCanvas}
                onRenameCanvas={renameCanvas}
                onDeleteCanvas={deleteCanvas}
                getNoteCount={getNoteCount}
            />
        </div>
    )
}

export function App() {
    return (
        <CanvasProvider>
            <AppContent />
        </CanvasProvider>
    )
}