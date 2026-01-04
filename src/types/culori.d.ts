declare module 'culori' {
    export interface Oklch {
        mode: 'oklch';
        l: number;
        c?: number;
        h?: number;
        alpha?: number;
    }

    export function oklch(color: string | object): Oklch | undefined;
    export function formatHex(color: object): string;
    export function clampChroma(color: Oklch, mode: string): Oklch;
}
