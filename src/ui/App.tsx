import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DesignSystemInput, FormFactor, BackgroundMode, ScaleRatio, RadiusStyle, GridUnit } from '../types';
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

    // Listen for messages from plugin
    React.useEffect(() => {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (msg.type === 'tokens-generated') {
                setGeneratedTokens(msg.tokens);
                setStep(8); // Preview step
            }
            if (msg.type === 'error') {
                alert(`Error: ${msg.message}`);
            }
        };
    }, []);

    const handleGenerate = () => {
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
            <header className="header">
                <h1>Design System Token Generator</h1>
                <p>DTCG 2025.10 Format</p>
            </header>

            <main className="main">
                {/* Step 1: System Name */}
                {step === 1 && (
                    <div className="step">
                        <h2>System Name</h2>
                        <input
                            type="text"
                            value={input.systemName}
                            onChange={(e) => setInput({ ...input, systemName: e.target.value })}
                            placeholder="My Design System"
                            className="input"
                        />
                        <button onClick={() => setStep(2)} className="btn-primary">
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Form Factors */}
                {step === 2 && (
                    <div className="step">
                        <h2>Form Factors</h2>
                        <div className="checkbox-group">
                            {(['web', 'tablet', 'mobile'] as FormFactor[]).map((factor) => (
                                <label key={factor} className="checkbox-label">
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
                        <div className="button-group">
                            <button onClick={() => setStep(1)} className="btn-secondary">
                                Back
                            </button>
                            <button onClick={() => setStep(3)} className="btn-primary">
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
                            <label>Primary Color (required)</label>
                            <input
                                type="color"
                                value={input.colors.primary}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        colors: { ...input.colors, primary: e.target.value },
                                    })
                                }
                                className="color-input"
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
                                className="input"
                            />
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
                                className="color-input"
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
                                className="input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Background Mode</label>
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
                            <button onClick={() => setStep(4)} className="btn-primary">
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
                            <label>Primary Font Family</label>
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
                                className="input"
                                placeholder="Inter"
                            />
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
                                className="input"
                                min="12"
                                max="20"
                            />
                        </div>
                        <div className="form-group">
                            <label>Scale Ratio</label>
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
                            <button onClick={() => setStep(5)} className="btn-primary">
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Spacing */}
                {step === 5 && (
                    <div className="step">
                        <h2>Spacing Grid</h2>
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
                            <button onClick={() => setStep(5)} className="btn-secondary">
                                Back
                            </button>
                            <button onClick={handleGenerate} className="btn-primary">
                                Generate Tokens
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 8: Preview */}
                {step === 8 && (
                    <div className="step">
                        <h2>Preview</h2>
                        <pre className="preview">
                            {JSON.stringify(generatedTokens, null, 2)}
                        </pre>
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
