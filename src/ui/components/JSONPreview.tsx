import React, { useState } from 'react';

interface JSONPreviewProps {
    data: any;
}

export const JSONPreview: React.FC<JSONPreviewProps> = ({ data }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const jsonString = JSON.stringify(data, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy JSON:', err);
        }
    };

    const toggleCollapse = (key: string) => {
        setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Simple token counter for DTCG format
    const countTokens = (obj: any): any => {
        let counts: Record<string, number> = {
            color: 0,
            typography: 0,
            spacing: 0,
            radius: 0,
            elevation: 0,
            total: 0
        };

        const traverse = (o: any, parentKey: string = '') => {
            if (!o || typeof o !== 'object') return;

            if (o.$value !== undefined) {
                counts.total++;
                if (parentKey.startsWith('color')) counts.color++;
                else if (parentKey.startsWith('typography')) counts.typography++;
                else if (parentKey.startsWith('spacing')) counts.spacing++;
                else if (parentKey.startsWith('radius')) counts.radius++;
                else if (parentKey.startsWith('elevation')) counts.elevation++;
                return;
            }

            for (const key in o) {
                traverse(o[key], parentKey || key);
            }
        };

        traverse(obj);
        return counts;
    };

    const tokenCounts = countTokens(data);

    // Basic syntax highlighting function
    const syntaxHighlight = (json: string) => {
        if (!json) return '';

        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    };

    const keys = Object.keys(data);

    return (
        <div className="json-preview-container">
            <div className="json-header">
                <div className="token-summary">
                    <span className="badge">Total: {tokenCounts.total}</span>
                    <span className="badge color">Color: {tokenCounts.color}</span>
                    <span className="badge typo">Typo: {tokenCounts.typography}</span>
                    <span className="badge spacing">Space: {tokenCounts.spacing}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`btn-copy ${copyStatus === 'copied' ? 'success' : ''}`}
                >
                    {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                </button>
            </div>

            <div className="json-content">
                {keys.map(key => (
                    <div key={key} className={`json-section ${collapsed[key] ? 'collapsed' : ''}`}>
                        <div className="json-section-header" onClick={() => toggleCollapse(key)}>
                            <span className="collapse-icon">{collapsed[key] ? '▶' : '▼'}</span>
                            <span className="json-key">"{key}"</span>: {collapsed[key] ? '{ ... }' : '{'}
                        </div>
                        {!collapsed[key] && (
                            <div className="json-section-body">
                                <pre
                                    dangerouslySetInnerHTML={{
                                        __html: syntaxHighlight(JSON.stringify(data[key], null, 2))
                                    }}
                                />
                                <div>{'}'}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
