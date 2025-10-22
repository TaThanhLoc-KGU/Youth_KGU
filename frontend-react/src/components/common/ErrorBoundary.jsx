import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-base-100 rounded-lg shadow-lg p-8 border border-base-300">
              <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                Đã xảy ra lỗi
              </h1>
              <p className="mb-6">
                Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ quản trị viên.
              </p>
              {this.state.error && (
                <details className="text-left bg-base-200 rounded p-4 mb-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Chi tiết lỗi
                  </summary>
                  <pre className="text-xs text-error overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
