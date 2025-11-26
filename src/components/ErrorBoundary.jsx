import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="rail-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">System Error</h2>
              <p className="text-primary-500 mb-6">
                An unexpected error occurred in the analysis module. Please try again.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-primary-200 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-primary-800 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors border border-primary-700"
                >
                  Refresh
                </button>
              </div>
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-500">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-primary-950 rounded text-xs text-primary-500 overflow-x-auto font-mono">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
