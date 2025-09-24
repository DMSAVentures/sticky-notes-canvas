import { useState, useRef, MouseEvent } from 'react'

interface UseNoteColorsProps {
    id: string
    onUpdate: (id: string, updates: { color: string }) => void
}

export function useNoteColors({ id, onUpdate }: UseNoteColorsProps) {
    const [showColorPicker, setShowColorPicker] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)

    const handleColorButtonClick = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setShowColorPicker(!showColorPicker)
    }

    const handleColorSelect = (newColor: string) => (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onUpdate(id, { color: newColor })
        setShowColorPicker(false)
        noteRef.current?.focus()
    }

    const closeColorPicker = () => {
        setShowColorPicker(false)
    }

    return {
        showColorPicker,
        noteRef,
        handleColorButtonClick,
        handleColorSelect,
        closeColorPicker
    }
}