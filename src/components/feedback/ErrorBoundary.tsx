import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence against a render-time crash taking down the whole demo.
 * React has no hook equivalent, so this stays a class component.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with a real reporter (Sentry etc.) if the team adds one.
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-ink">This page hit an error</h1>
        <p className="max-w-md text-sm text-muted">
          The screen failed to render. You can retry, and if it keeps happening,
          share this message with the team:
        </p>
        <code className="max-w-md overflow-x-auto rounded-lg bg-canvas px-3 py-2 text-xs text-danger">
          {error.message}
        </code>
        <Button onClick={this.handleReset}>Reload this view</Button>
      </div>
    )
  }
}
