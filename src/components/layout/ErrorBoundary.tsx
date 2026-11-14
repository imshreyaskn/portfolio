import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  /** Section name shown in the fallback, e.g. "skills". */
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Wraps one section so a failure there (a lazy chunk that didn't load, a GPU
 * without WebGL) leaves the rest of the page working. "Try again" re-mounts
 * just this section instead of reloading the whole site.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label ?? 'section'}] failed to render`, error, info.componentStack);
  }

  private retry = () => this.setState({ hasError: false });

  public render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label;
    return (
      <div className="section-error" role="alert">
        <p className="section-error__title">
          {label ? `the ${label} section didn't load` : "this section didn't load"}
        </p>
        <p className="section-error__body">
          Your browser may have blocked 3D graphics, or the connection dropped.
        </p>
        <button type="button" className="section-error__retry" onClick={this.retry}>
          try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
