import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8FE] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-900">Application Recovered</h2>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              An unexpected display issue occurred. You do not need to refresh the page — click below to resume your session.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full h-12 rounded-full bg-[#0E1116] hover:bg-black text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Resume Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
