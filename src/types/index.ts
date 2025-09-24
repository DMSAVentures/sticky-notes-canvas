// Base note with core properties
export interface BaseNote {
    id: string
    content: string
    color: string
    width: number
    height: number
}

// Note with position for rendering
export interface StickyNoteData extends BaseNote {
    x: number
    y: number
    zIndex: number
}

// Canvas view state
export interface ViewState {
    x: number
    y: number
    zoom: number
}

// Note stored with timestamps
export interface StoredNote extends BaseNote {
    createdAt: number
    updatedAt: number
}

// Note position in a specific canvas
export interface StoredNotePositionCanvas {
    noteId: string
    x: number
    y: number
    zIndex: number
}

// Canvas with its note arrangement
export interface StoredCanvas {
    id: string
    name: string
    notePositions: StoredNotePositionCanvas[]
    viewState: ViewState
    createdAt: number
    updatedAt: number
}

export interface LocalStorageAppData {
    version: string
    canvases: Record<string, StoredCanvas>
    notes: Record<string, StoredNote>
    lastActiveCanvasId?: string
}

// ============= Constants =============

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
export const STORAGE_VERSION = '1.0.0'
