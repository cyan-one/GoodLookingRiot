import React from "react";
declare type Data = Pick<IFieldState, "value" | "allowEmpty">;
interface IRule<T> {
    key: string;
    final?: boolean;
    skip?(this: T, data: Data): boolean;
    test(this: T, data: Data): boolean | Promise<boolean>;
    valid?(this: T): string;
    invalid?(this: T): string;
}
interface IArgs<T> {
    rules: IRule<T>[];
    description(this: T): React.ReactChild;
}
export interface IFieldState {
    value: string;
    focused: boolean;
    allowEmpty: boolean;
}
export interface IValidationResult {
    valid?: boolean;
    feedback?: React.ReactChild;
}
/**
 * Creates a validation function from a set of rules describing what to validate.
 * Generic T is the "this" type passed to the rule methods
 *
 * @param {Function} description
 *     Function that returns a string summary of the kind of value that will
 *     meet the validation rules. Shown at the top of the validation feedback.
 * @param {Object} rules
 *     An array of rules describing how to check to input value. Each rule in an object
 *     and may have the following properties:
 *     - `key`: A unique ID for the rule. Required.
 *     - `skip`: A function used to determine whether the rule should even be evaluated.
 *     - `test`: A function used to determine the rule's current validity. Required.
 *     - `valid`: Function returning text to show when the rule is valid. Only shown if set.
 *     - `invalid`: Function returning text to show when the rule is invalid. Only shown if set.
 *     - `final`: A Boolean if true states that this rule will only be considered if all rules before it returned valid.
 * @returns {Function}
 *     A validation function that takes in the current input value and returns
 *     the overall validity and a feedback UI that can be rendered for more detail.
 */
export default function withValidation<T = undefined>({ description, rules }: IArgs<T>): ({ value, focused, allowEmpty }: IFieldState) => Promise<IValidationResult>;
export {};
