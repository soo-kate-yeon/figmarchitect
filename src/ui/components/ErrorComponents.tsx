import React from 'react';

interface ErrorMessageProps {
    message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
    if (!message) return null;

    return <span className="error-message">{message}</span>;
}

interface LoadingOverlayProps {
    isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
        </div>
    );
}

interface ErrorBannerProps {
    message?: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <div className="error-banner">
            {message}
        </div>
    );
}
