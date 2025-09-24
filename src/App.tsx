import styles from './App.module.css'
import { Canvas } from './components/Canvas'
import { CanvasSwitcher } from './components/CanvasSwitcher'
import { StorageErrorNotifier } from './components/StorageErrorNotifier'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CanvasProvider, useCanvas } from './contexts/CanvasContext'
import { EditingProvider } from './contexts/EditingContext'

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
            <StorageErrorNotifier />
        </div>
    )
}

export function App() {
    return (
        <ErrorBoundary>
            <CanvasProvider>
                <EditingProvider>
                    <AppContent />
                </EditingProvider>
            </CanvasProvider>
        </ErrorBoundary>
    )
}