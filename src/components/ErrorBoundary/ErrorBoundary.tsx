import { Component, ErrorInfo, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface Props {
    children: ReactNode
    fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // Log to external service if available
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            // Production error logging would go here
            console.error('Production error:', {
                error: error.toString(),
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            })
        }

        this.setState({
            error,
            errorInfo
        })
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })

        // Optionally clear localStorage if corruption suspected
        const shouldClearStorage = window.confirm(
            'Would you like to clear app data? This might help if the error was caused by corrupted data.'
        )

        if (shouldClearStorage) {
            try {
                localStorage.clear()
                window.location.reload()
            } catch (e) {
                console.error('Failed to clear storage:', e)
            }
        }
    }

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleReset)
            }

            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorCard}>
                        <h1 className={styles.title}>⚠️ Oops! Something went wrong</h1>
                        <p className={styles.message}>
                            The application encountered an unexpected error.
                            Your work has been saved up to the last auto-save.
                        </p>

                        {import.meta.env.DEV && (
                            <details className={styles.details}>
                                <summary>Error Details (Development Only)</summary>
                                <pre className={styles.errorStack}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className={styles.actions}>
                            <button
                                className={styles.primaryButton}
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                            <button
                                className={styles.secondaryButton}
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </button>
                        </div>

                        <p className={styles.hint}>
                            If the problem persists, try clearing your browser cache or using a different browser.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}