export interface BaseNote {
    id: string
    content: string
    color: string
    width: number
    height: number
}

// Complete note data including canvas position
export interface StickyNoteData extends BaseNote {
    x: number
    y: number
    zIndex: number
}

export interface ViewState {
    x: number
    y: number
    zoom: number
}

// Persisted note with audit timestamps
export interface StoredNote extends BaseNote {
    createdAt: number
    updatedAt: number
}

// Links note to canvas with position data
export interface StoredNotePositionCanvas {
    noteId: string
    x: number
    y: number
    zIndex: number
}

export interface StoredCanvas {
    id: string
    name: string
    notePositions: StoredNotePositionCanvas[]
    viewState: ViewState
    createdAt: number
    updatedAt: number
}

export interface LocalStorageAppData {
    canvases: Record<string, StoredCanvas>
    notes: Record<string, StoredNote>
    lastActiveCanvasId?: string
}

export const NOTE_COLORS = [
    '#FFF9C4', // Pastel Yellow
    '#FFE0B2', // Pastel Peach
    '#C8E6C9', // Pastel Green
    '#BBDEFB', // Pastel Blue
    '#F8BBD0', // Pastel Pink
    '#E1BEE7', // Pastel Purple
    '#B2EBF2', // Pastel Cyan
    '#FFCCBC', // Pastel Coral
]

export const STORAGE_KEY = 'sticky-notes-app'
