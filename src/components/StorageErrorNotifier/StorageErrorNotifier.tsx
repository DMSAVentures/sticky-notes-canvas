import { useEffect, useState } from 'react'
import styles from './StorageErrorNotifier.module.css'

interface StorageError {
    message: string
    timestamp: number
}

export function StorageErrorNotifier() {
    const [error, setError] = useState<StorageError | null>(null)

    useEffect(() => {
        const handleStorageError = (event: CustomEvent) => {
            const { error: err, operation } = event.detail
            setError({
                message: `Failed to ${operation} data: ${err?.message || 'Unknown error'}`,
                timestamp: Date.now()
            })

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setError(null)
            }, 5000)
        }

        window.addEventListener('storage-error' as any, handleStorageError)

        return () => {
            window.removeEventListener('storage-error' as any, handleStorageError)
        }
    }, [])

    if (!error) return null

    return (
        <div className={styles.notifier}>
            <div className={styles.content}>
                <span className={styles.icon}>⚠️</span>
                <span className={styles.message}>{error.message}</span>
                <button
                    className={styles.closeButton}
                    onClick={() => setError(null)}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>
            <div className={styles.hint}>
                Your work is still in memory. Try refreshing if issues persist.
            </div>
        </div>
    )
}