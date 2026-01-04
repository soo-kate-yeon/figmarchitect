import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DesignSystemInput, FormFactor, BackgroundMode, ScaleRatio, RadiusStyle, GridUnit } from '../types';
import { validateSystemName, validateHexColor, validateFontFamily, validateBaseFontSize, validateFormFactors, type FormErrors } from './utils/validation';
import { ErrorMessage, LoadingOverlay, ErrorBanner, ProgressBar, Tooltip } from './components/ErrorComponents';
import { JSONPreview } from './components/JSONPreview';
import './styles/main.css';

function App() {
    const [step, setStep] = useState(1);
    const [input, setInput] = useState<DesignSystemInput>({
        systemName: 'My Design System',
        formFactors: ['web'],
        colors: {
            primary: '#3B82F6',
            background: {
                default: '#FFFFFF',
                mode: 'pure',
            },
        },
        typography: {
            fontFamily: {
                primary: 'Inter',
            },
            baseFontSize: 16,
            scaleRatio: 1.250,
        },
        spacing: {
            gridUnit: 8,
        },
        radius: {
            style: 'rounded',
        },
    });

    const [generatedTokens, setGeneratedTokens] = useState<any>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Listen for messages from plugin
    React.useEffect(() => {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (msg.type === 'tokens-generated') {
                setIsLoading(false);
                setGeneratedTokens(msg.tokens);
                setErrorMessage('');
                setStep(8); // Preview step
            }
            if (msg.type === 'error') {
                setIsLoading(false);
                setErrorMessage(msg.message || 'An error occurred while generating tokens');
            }
        };
    }, []);

    const handleGenerate = () => {
        // Clear previous errors
        setErrorMessage('');
        setErrors({});

        // Validate all inputs
        const newErrors: FormErrors = {};

        const nameValidation = validateSystemName(input.systemName);
        if (!nameValidation.isValid) newErrors.systemName = nameValidation.error;

        const formFactorsValidation = validateFormFactors(input.formFactors);
        if (!formFactorsValidation.isValid) newErrors.formFactors = formFactorsValidation.error;

        const primaryColorValidation = validateHexColor(input.colors.primary);
        if (!primaryColorValidation.isValid) newErrors.primaryColor = primaryColorValidation.error;

        const backgroundColorValidation = validateHexColor(input.colors.background.default);
        if (!backgroundColorValidation.isValid) newErrors.backgroundColor = backgroundColorValidation.error;

        const primaryFontValidation = validateFontFamily(input.typography.fontFamily.primary);
        if (!primaryFontValidation.isValid) newErrors.primaryFont = primaryFontValidation.error;

        const baseFontSizeValidation = validateBaseFontSize(input.typography.baseFontSize);
        if (!baseFontSizeValidation.isValid) newErrors.baseFontSize = baseFontSizeValidation.error;

        // If there are errors, don't proceed
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setErrorMessage('Please fix the validation errors before generating tokens');
            return;
        }

        // Start loading
        setIsLoading(true);

        // Send to plugin
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'generate-tokens',
                    input,
                },
            },
            '*'
        );
    };

    const handleDownload = () => {
        if (!generatedTokens) return;

        const json = JSON.stringify(generatedTokens, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${input.systemName.toLowerCase().replace(/\s+/g, '-')}.tokens.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app">
            <LoadingOverlay isLoading={isLoading} />

            <header className="header">
                <h1>Design System Token Generator</h1>
                <p>DTCG 2025.10 Format</p>
            </header>

            {step <= 7 ? (
                <ProgressBar currentStep={step} totalSteps={7} />
            ) : (
                <div style={{ height: '4px', background: 'var(--color-primary)' }} />
            )}

            <main className="main">
                <ErrorBanner message={errorMessage} />

                {/* Step 1: System Name */}
                {step === 1 && (
                    <div className="step">
                        <h2>System Name</h2>
                        <input
                            type="text"
                            value={input.systemName}
                            onChange={(e) => setInput({ ...input, systemName: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const validation = validateSystemName(input.systemName);
                                    if (validation.isValid) {
                                        setErrors({ ...errors, systemName: undefined });
                                        setStep(2);
                                    } else {
                                        setErrors({ ...errors, systemName: validation.error });
                                    }
                                }
                            }}
                            placeholder="My Design System"
                            className={`input ${errors.systemName ? 'error' : ''}`}
                        />
                        <ErrorMessage message={errors.systemName} />
                        <button
                            onClick={() => {
                                const validation = validateSystemName(input.systemName);
                                if (validation.isValid) {
                                    setErrors({ ...errors, systemName: undefined });
                                    setStep(2);
                                } else {
                                    setErrors({ ...errors, systemName: validation.error });
                                }
                            }}
                            className="btn-primary"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Form Factors */}
                {step === 2 && (
                    <div className="step">
                        <h2>
                            <Tooltip text="Select which platforms this system should optimize for. This affects typography scale and spacing behavior.">
                                Form Factors
                            </Tooltip>
                        </h2>
                        <div className="checkbox-group">
                            {(['web', 'tablet', 'mobile'] as FormFactor[]).map((factor) => (
                                <label key={factor} className={`checkbox-label ${errors.formFactors ? 'error' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={input.formFactors.includes(factor)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setInput({
                                                    ...input,
                                                    formFactors: [...input.formFactors, factor],
                                                });
                                            } else {
                                                setInput({
                                                    ...input,
                                                    formFactors: input.formFactors.filter((f) => f !== factor),
                                                });
                                            }
                                        }}
                                    />
                                    {factor.charAt(0).toUpperCase() + factor.slice(1)}
                                </label>
                            ))}
                        </div>
                        <ErrorMessage message={errors.formFactors} />
                        <div className="button-group">
                            <button onClick={() => setStep(1)} className="btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    const validation = validateFormFactors(input.formFactors);
                                    if (validation.isValid) {
                                        setErrors({ ...errors, formFactors: undefined });
                                        setStep(3);
                                    } else {
                                        setErrors({ ...errors, formFactors: validation.error });
                                    }
                                }}
                                className="btn-primary"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Brand Colors */}
                {step === 3 && (
                    <div className="step">
                        <h2>Brand Colors</h2>
                        <div className="form-group">
                            <label>
                                <Tooltip text="The main brand color used for primary actions, links, and key focus areas.">
                                    Primary Color (required)
                                </Tooltip>
                            </label>
                            <input
                                type="color"
                                value={input.colors.primary}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: { ...input.colors, primary: e.target.value },
                                    })
                                }
                                className={`color-input ${errors.primaryColor ? 'error' : ''}`}
                            />
                            <input
                                type="text"
                                value={input.colors.primary}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: { ...input.colors, primary: e.target.value },
                                    })
                                }
                                className={`input ${errors.primaryColor ? 'error' : ''}`}
                                placeholder="#000000"
                            />
                            <ErrorMessage message={errors.primaryColor} />
                        </div>
                        <div className="form-group">
                            <label>Background Default (required)</label>
                            <input
                                type="color"
                                value={input.colors.background.default}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: {
                                            ...input.colors,
                                            background: { ...input.colors.background, default: e.target.value },
                                        },
                                    })
                                }
                                className={`color-input ${errors.backgroundColor ? 'error' : ''}`}
                            />
                            <input
                                type="text"
                                value={input.colors.background.default}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: {
                                            ...input.colors,
                                            background: { ...input.colors.background, default: e.target.value },
                                        },
                                    })
                                }
                                className={`input ${errors.backgroundColor ? 'error' : ''}`}
                                placeholder="#FFFFFF"
                            />
                            <ErrorMessage message={errors.backgroundColor} />
                        </div>
                        <div className="form-group">
                            <label>
                                <Tooltip text="Determines the tint level of adaptive background surfaces (Neutral, Brand Tinted, or Custom).">
                                    Background Mode
                                </Tooltip>
                            </label>
                            <select
                                value={input.colors.background.mode}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: {
                                            ...input.colors,
                                            background: {
                                                ...input.colors.background,
                                                mode: e.target.value as BackgroundMode,
                                            },
                                        },
                                    })
                                }
                                className="select"
                            >
                                <option value="pure">Pure (No tint)</option>
                                <option value="tinted">Tinted (Slight brand color)</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div className="button-group">
                            <button onClick={() => setStep(2)} className="btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    const primaryVal = validateHexColor(input.colors.primary);
                                    const bgVal = validateHexColor(input.colors.background.default);
                                    if (primaryVal.isValid && bgVal.isValid) {
                                        setErrors({ ...errors, primaryColor: undefined, backgroundColor: undefined });
                                        setStep(4);
                                    } else {
                                        setErrors({
                                            ...errors,
                                            primaryColor: primaryVal.error,
                                            backgroundColor: bgVal.error
                                        });
                                    }
                                }}
                                className="btn-primary"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Typography */}
                {step === 4 && (
                    <div className="step">
                        <h2>Typography</h2>
                        <div className="form-group">
                            <label>
                                <Tooltip text="The primary typeface used for body text and headings. Supports Google Fonts and System Fonts.">
                                    Primary Font Family
                                </Tooltip>
                            </label>
                            <input
                                type="text"
                                value={input.typography.fontFamily.primary}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        typography: {
                                            ...input.typography,
                                            fontFamily: { ...input.typography.fontFamily, primary: e.target.value },
                                        },
                                    })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const fontVal = validateFontFamily(input.typography.fontFamily.primary);
                                        const sizeVal = validateBaseFontSize(input.typography.baseFontSize);
                                        if (fontVal.isValid && sizeVal.isValid) {
                                            setErrors({ ...errors, primaryFont: undefined, baseFontSize: undefined });
                                            setStep(5);
                                        } else {
                                            setErrors({
                                                ...errors,
                                                primaryFont: fontVal.error,
                                                baseFontSize: sizeVal.error
                                            });
                                        }
                                    }
                                }}
                                className={`input ${errors.primaryFont ? 'error' : ''}`}
                                placeholder="Inter"
                            />
                            <ErrorMessage message={errors.primaryFont} />
                        </div>
                        <div className="form-group">
                            <label>Base Font Size (px)</label>
                            <input
                                type="number"
                                value={input.typography.baseFontSize}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        typography: { ...input.typography, baseFontSize: Number(e.target.value) },
                                    })
                                }
                                className={`input ${errors.baseFontSize ? 'error' : ''}`}
                                min="10"
                                max="24"
                            />
                            <ErrorMessage message={errors.baseFontSize} />
                        </div>
                        <div className="form-group">
                            <label>
                                <Tooltip text="A mathematical ratio used to determine the relative size of each typography level (e.g., H1, H2, Body).">
                                    Scale Ratio
                                </Tooltip>
                            </label>
                            <select
                                value={input.typography.scaleRatio}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        typography: {
                                            ...input.typography,
                                            scaleRatio: Number(e.target.value) as ScaleRatio,
                                        },
                                    })
                                }
                                className="select"
                            >
                                <option value="1.067">Minor Second (1.067)</option>
                                <option value="1.125">Major Second (1.125)</option>
                                <option value="1.200">Minor Third (1.200)</option>
                                <option value="1.250">Major Third (1.250)</option>
                                <option value="1.333">Perfect Fourth (1.333)</option>
                                <option value="1.414">Augmented Fourth (1.414)</option>
                                <option value="1.500">Perfect Fifth (1.500)</option>
                                <option value="1.618">Golden Ratio (1.618)</option>
                            </select>
                        </div>
                        <div className="button-group">
                            <button onClick={() => setStep(3)} className="btn-secondary">
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    const fontVal = validateFontFamily(input.typography.fontFamily.primary);
                                    const sizeVal = validateBaseFontSize(input.typography.baseFontSize);
                                    if (fontVal.isValid && sizeVal.isValid) {
                                        setErrors({ ...errors, primaryFont: undefined, baseFontSize: undefined });
                                        setStep(5);
                                    } else {
                                        setErrors({
                                            ...errors,
                                            primaryFont: fontVal.error,
                                            baseFontSize: sizeVal.error
                                        });
                                    }
                                }}
                                className="btn-primary"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Spacing */}
                {step === 5 && (
                    <div className="step">
                        <h2>
                            <Tooltip text="The baseline increment for all spacing, padding, and margin tokens. 8px is the industry standard.">
                                Spacing Grid
                            </Tooltip>
                        </h2>
                        <div className="radio-group">
                            {([4, 8] as GridUnit[]).map((unit) => (
                                <label key={unit} className="radio-label">
                                    <input
                                        type="radio"
                                        checked={input.spacing.gridUnit === unit}
                                        onChange={() =>
                                            setInput({ ...input, spacing: { gridUnit: unit } })
                                        }
                                    />
                                    {unit}px Grid
                                </label>
                            ))}
                        </div>
                        <div className="button-group">
                            <button onClick={() => setStep(4)} className="btn-secondary">
                                Back
                            </button>
                            <button onClick={() => setStep(6)} className="btn-primary">
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 6: Radius */}
                {step === 6 && (
                    <div className="step">
                        <h2>Corner Radius Style</h2>
                        <div className="radio-group">
                            {(['sharp', 'rounded', 'pill'] as RadiusStyle[]).map((style) => (
                                <label key={style} className="radio-label">
                                    <input
                                        type="radio"
                                        checked={input.radius.style === style}
                                        onChange={() =>
                                            setInput({ ...input, radius: { style } })
                                        }
                                    />
                                    {style.charAt(0).toUpperCase() + style.slice(1)}
                                </label>
                            ))}
                        </div>
                        <div className="button-group">
                            <button onClick={() => setStep(5)} className="btn-secondary" disabled={isLoading}>
                                Back
                            </button>
                            <button onClick={handleGenerate} className="btn-primary" disabled={isLoading}>
                                {isLoading ? 'Generating...' : 'Generate Tokens'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 8: Preview */}
                {step === 8 && (
                    <div className="step">
                        <h2>Preview</h2>
                        <JSONPreview data={generatedTokens} />
                        <div className="button-group">
                            <button onClick={() => setStep(1)} className="btn-secondary">
                                Start Over
                            </button>
                            <button onClick={handleDownload} className="btn-primary">
                                Download JSON
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Mount React app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
