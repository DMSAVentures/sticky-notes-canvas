import { useState, useMemo, MouseEvent, RefObject } from 'react'
import { StickyNoteData, NOTE_COLORS } from '../types'
import { storageService } from '../services/storage.service'
import { useCanvas } from '../contexts/CanvasContext'
import { useEditing } from '../contexts/EditingContext'
import { NOTE_DEFAULT_WIDTH, NOTE_DEFAULT_HEIGHT } from '../constants'

interface UseNoteManagementProps {
    canvasRef: RefObject<HTMLDivElement | null>
}

export function useNoteManagement({ canvasRef }: UseNoteManagementProps) {
    const { notes, setNotes, viewState, nextZIndex, setNextZIndex } = useCanvas()
    const { setAutoFocus } = useEditing()
    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)

    const handleDoubleClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
                const x = (e.clientX - rect.left - viewState.x) / viewState.zoom
                const y = (e.clientY - rect.top - viewState.y) / viewState.zoom

                const noteId = storageService.generateId()
                const newNote: StickyNoteData = {
                    id: noteId,
                    x,
                    y,
                    width: NOTE_DEFAULT_WIDTH,
                    height: NOTE_DEFAULT_HEIGHT,
                    content: '',
                    color: NOTE_COLORS[0],
                    zIndex: nextZIndex
                }

                setNotes(prev => [...prev, newNote])
                setNextZIndex(prev => prev + 1)
                setAutoFocus(noteId) // Use centralized editing context
            }
        }
    }

    const handleNoteUpdate = (id: string, updates: Partial<StickyNoteData>) => {
        setNotes(prev => prev.map(note =>
            note.id === id ? { ...note, ...updates } : note
        ))
    }

    const handleNoteDelete = (id: string) => {
        setNotes(prev => prev.filter(note => note.id !== id))
    }

    // Memoized to avoid recalculating on every render
    const maxZIndex = useMemo(() => {
        if (notes.length === 0) return 0
        return Math.max(...notes.map(n => n.zIndex))
    }, [notes])

    const handleNoteSelect = (id: string) => {
        const selectedNote = notes.find(note => note.id === id)

        if (selectedNote && selectedNote.zIndex < maxZIndex) {
            setNotes(prev => prev.map(note =>
                note.id === id ? { ...note, zIndex: nextZIndex } : note
            ))
            setNextZIndex(prev => prev + 1)
        }
    }

    const handleNoteDragStart = (id: string) => {
        setDraggingNoteId(id)
    }

    const handleNoteDragEnd = () => {
        setDraggingNoteId(null)
    }

    return {
        notes,
        draggingNoteId,
        handleDoubleClick,
        handleNoteUpdate,
        handleNoteDelete,
        handleNoteSelect,
        handleNoteDragStart,
        handleNoteDragEnd
    }
}