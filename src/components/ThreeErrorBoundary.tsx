import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Rendering Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-8">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>3D Rendering Error</AlertTitle>
            <AlertDescription>
              Unable to display the 3D model. This could be due to:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Incompatible mesh format</li>
                <li>Missing texture files</li>
                <li>Browser compatibility issues</li>
              </ul>
              <p className="mt-2 text-sm">Try uploading a different photo or refresh the page.</p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
