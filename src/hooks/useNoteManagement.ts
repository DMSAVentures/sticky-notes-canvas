import { useState, MouseEvent, RefObject } from 'react'
import { StickyNoteData, NOTE_COLORS } from '../types'
import { storageService } from '../services/storage.service'
import { useCanvas } from '../contexts/CanvasContext'
import { useEditing } from '../contexts/EditingContext'

interface UseNoteManagementProps {
    canvasRef: RefObject<HTMLDivElement | null>
}

export function useNoteManagement({ canvasRef }: UseNoteManagementProps) {
    const { notes, setNotes, viewState, nextZIndex, setNextZIndex } = useCanvas()
    const { setAutoFocus } = useEditing()
    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)

    // Handle double click to create new note
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
                    width: 200,
                    height: 150,
                    content: '',
                    color: NOTE_COLORS[0], // Default to first color (Pastel Yellow)
                    zIndex: nextZIndex
                }

                setNotes(prev => [...prev, newNote])
                setNextZIndex(prev => prev + 1)
                setAutoFocus(noteId) // Use centralized editing context
            }
        }
    }

    // Handle note updates
    const handleNoteUpdate = (id: string, updates: Partial<StickyNoteData>) => {
        setNotes(prev => prev.map(note =>
            note.id === id ? { ...note, ...updates } : note
        ))
    }

    // Handle note deletion
    const handleNoteDelete = (id: string) => {
        setNotes(prev => prev.filter(note => note.id !== id))
    }

    // Handle note selection (bring to front)
    const handleNoteSelect = (id: string) => {
        const selectedNote = notes.find(note => note.id === id)
        const maxZIndex = Math.max(...notes.map(n => n.zIndex))

        if (selectedNote && selectedNote.zIndex < maxZIndex) {
            setNotes(prev => prev.map(note =>
                note.id === id ? { ...note, zIndex: nextZIndex } : note
            ))
            setNextZIndex(prev => prev + 1)
        }
    }

    // Handle drag start
    const handleNoteDragStart = (id: string) => {
        setDraggingNoteId(id)
    }

    // Handle drag end
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