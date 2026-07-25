import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label: string;
}
interface State {
  hasError: boolean;
}

/** Error boundary por panel (§11): un crash de un tab no tumba el resto. */
export class PanelErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Error en panel "${this.props.label}"`, error, info);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm text-text-muted">
          No se pudo mostrar {this.props.label}.{' '}
          <button
            type="button"
            className="text-accent-ok underline"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
