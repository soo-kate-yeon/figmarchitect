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

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <div className="progress-steps">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`progress-dot ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 === currentStep ? 'current' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}

interface TooltipProps {
    text: string;
    children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
    return (
        <div className="tooltip-container">
            {children}
            <div className="tooltip-content">{text}</div>
            <span className="tooltip-icon">ⓘ</span>
        </div>
    );
}
