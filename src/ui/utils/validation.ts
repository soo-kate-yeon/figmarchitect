// ============================================
// VALIDATION UTILITIES
// ============================================

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

// ============================================
// COLOR VALIDATION
// ============================================

export function validateHexColor(color: string): ValidationResult {
    if (!color || color.trim() === '') {
        return { isValid: false, error: 'Color is required' };
    }

    // Remove # if present
    const hex = color.replace('#', '');

    // Check if valid hex format (3 or 6 characters)
    const hexRegex = /^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{3}$/;

    if (!hexRegex.test(hex)) {
        return { isValid: false, error: 'Invalid hex color format (e.g., #FF0000)' };
    }

    return { isValid: true };
}

// ============================================
// SYSTEM NAME VALIDATION
// ============================================

export function validateSystemName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
        return { isValid: false, error: 'System name is required' };
    }

    if (name.trim().length < 2) {
        return { isValid: false, error: 'System name must be at least 2 characters' };
    }

    if (name.trim().length > 50) {
        return { isValid: false, error: 'System name must be less than 50 characters' };
    }

    // Allow letters, numbers, spaces, hyphens, underscores
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;

    if (!validNameRegex.test(name)) {
        return { isValid: false, error: 'System name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }

    return { isValid: true };
}

// ============================================
// FONT FAMILY VALIDATION
// ============================================

export function validateFontFamily(fontFamily: string): ValidationResult {
    if (!fontFamily || fontFamily.trim() === '') {
        return { isValid: false, error: 'Font family is required' };
    }

    if (fontFamily.trim().length < 2) {
        return { isValid: false, error: 'Font family name must be at least 2 characters' };
    }

    // Basic validation - allow most characters for font names
    const validFontRegex = /^[a-zA-Z0-9\s\-_',]+$/;

    if (!validFontRegex.test(fontFamily)) {
        return { isValid: false, error: 'Font family contains invalid characters' };
    }

    return { isValid: true };
}

// ============================================
// NUMERIC VALIDATION
// ============================================

export function validateBaseFontSize(size: number): ValidationResult {
    if (isNaN(size)) {
        return { isValid: false, error: 'Font size must be a number' };
    }

    if (size < 10) {
        return { isValid: false, error: 'Font size must be at least 10px' };
    }

    if (size > 24) {
        return { isValid: false, error: 'Font size must be at most 24px' };
    }

    return { isValid: true };
}

// ============================================
// FORM FACTORS VALIDATION
// ============================================

export function validateFormFactors(formFactors: string[]): ValidationResult {
    if (!formFactors || formFactors.length === 0) {
        return { isValid: false, error: 'At least one form factor must be selected' };
    }

    return { isValid: true };
}

// ============================================
// COMPLETE FORM VALIDATION
// ============================================

export interface FormErrors {
    systemName?: string;
    formFactors?: string;
    primaryColor?: string;
    backgroundColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    primaryFont?: string;
    baseFontSize?: string;
}

export function validateCompleteForm(input: any): { isValid: boolean; errors: FormErrors } {
    const errors: FormErrors = {};

    // System name
    const nameValidation = validateSystemName(input.systemName);
    if (!nameValidation.isValid) {
        errors.systemName = nameValidation.error;
    }

    // Form factors
    const formFactorsValidation = validateFormFactors(input.formFactors);
    if (!formFactorsValidation.isValid) {
        errors.formFactors = formFactorsValidation.error;
    }

    // Primary color
    const primaryColorValidation = validateHexColor(input.colors.primary);
    if (!primaryColorValidation.isValid) {
        errors.primaryColor = primaryColorValidation.error;
    }

    // Background color
    const backgroundColorValidation = validateHexColor(input.colors.background.default);
    if (!backgroundColorValidation.isValid) {
        errors.backgroundColor = backgroundColorValidation.error;
    }

    // Secondary color (optional)
    if (input.colors.secondary) {
        const secondaryColorValidation = validateHexColor(input.colors.secondary);
        if (!secondaryColorValidation.isValid) {
            errors.secondaryColor = secondaryColorValidation.error;
        }
    }

    // Accent color (optional)
    if (input.colors.accent) {
        const accentColorValidation = validateHexColor(input.colors.accent);
        if (!accentColorValidation.isValid) {
            errors.accentColor = accentColorValidation.error;
        }
    }

    // Primary font
    const primaryFontValidation = validateFontFamily(input.typography.fontFamily.primary);
    if (!primaryFontValidation.isValid) {
        errors.primaryFont = primaryFontValidation.error;
    }

    // Base font size
    const baseFontSizeValidation = validateBaseFontSize(input.typography.baseFontSize);
    if (!baseFontSizeValidation.isValid) {
        errors.baseFontSize = baseFontSizeValidation.error;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
