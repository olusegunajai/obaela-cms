import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} className="text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold serif mb-4 text-forest">Something went wrong</h1>
            <p className="text-gray-600 mb-8 font-light leading-relaxed">
              Our spiritual guides are currently addressing a technical disturbance. We apologize for the interruption.
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-forest text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-forest/20"
              >
                <RefreshCw size={20} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-black/5 text-forest rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                <Home size={20} />
                <span>Return Home</span>
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-12 p-6 bg-rose-50 rounded-2xl border border-rose-100 text-left overflow-auto max-h-48">
                <p className="text-xs font-mono text-rose-800 whitespace-pre-wrap">
                  {this.state.error?.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
