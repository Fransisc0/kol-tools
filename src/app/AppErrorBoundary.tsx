import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // The application intentionally has no third-party error reporting or telemetry.
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-9 w-9 text-amber-500" aria-hidden="true" />
          <h1 className="text-xl font-bold">The viewer encountered an unexpected problem</h1>
          <p className="mt-2 text-sm text-slate-600">
            No personal data was sent. Reload the page to restart the application.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reload application
          </button>
        </section>
      </main>
    );
  }
}
