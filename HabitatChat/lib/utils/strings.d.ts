/**
 * Copy plaintext to user's clipboard
 * It will overwrite user's selection range
 * In certain browsers it may only work if triggered by a user action or may ask user for permissions
 * Tries to use new async clipboard API if available
 * @param text the plaintext to put in the user's clipboard
 */
export declare function copyPlaintext(text: string): Promise<boolean>;
export declare function selectText(target: Element): void;
/**
 * Copy rich text to user's clipboard
 * It will overwrite user's selection range
 * In certain browsers it may only work if triggered by a user action or may ask user for permissions
 * @param ref pointer to the node to copy
 */
export declare function copyNode(ref: Element): boolean;
