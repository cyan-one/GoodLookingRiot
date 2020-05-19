/**
 * Generates a human readable identifier. This should not be used for anything
 * which needs secure/cryptographic random: just a level uniquness that is offered
 * by something like Date.now().
 * @returns {string} The randomly generated ID
 */
export declare function generateHumanReadableId(): string;
