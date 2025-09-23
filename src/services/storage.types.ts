// Storage data structures for canvas and notes

export interface StoredNote {
    id: string
    content: string
    color: string
    width: number
    height: number
    createdAt: number
    updatedAt: number
}

export interface StoredNotePosition {
    noteId: string
    x: number
    y: number
    zIndex: number
}

export interface StoredCanvas {
    id: string
    name: string
    notePositions: StoredNotePosition[]
    viewState: {
        x: number
        y: number
        zoom: number
    }
    createdAt: number
    updatedAt: number
}

export interface StorageData {
    version: string
    canvases: Record<string, StoredCanvas>
    notes: Record<string, StoredNote>
    lastActiveCanvasId?: string
}