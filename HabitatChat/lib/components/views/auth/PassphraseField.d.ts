import { PureComponent, RefCallback, RefObject } from "react";
import zxcvbn from "zxcvbn";
import { IFieldState, IValidationResult } from "../elements/Validation";
import Field from "../elements/Field";
interface IProps {
    autoFocus?: boolean;
    id?: string;
    className?: string;
    minScore: 0 | 1 | 2 | 3 | 4;
    value: string;
    fieldRef?: RefCallback<Field> | RefObject<Field>;
    label?: string;
    labelEnterPassword?: string;
    labelStrongPassword?: string;
    labelAllowedButUnsafe?: string;
    onChange(ev: KeyboardEvent): any;
    onValidate(result: IValidationResult): any;
}
interface IState {
    complexity: zxcvbn.ZXCVBNResult;
}
declare class PassphraseField extends PureComponent<IProps, IState> {
    static defaultProps: {
        label: any;
        labelEnterPassword: any;
        labelStrongPassword: any;
        labelAllowedButUnsafe: any;
    };
    state: {
        complexity: any;
    };
    readonly validate: ({ value, focused, allowEmpty }: IFieldState) => Promise<IValidationResult>;
    onValidate: (fieldState: IFieldState) => Promise<IValidationResult>;
    render(): JSX.Element;
}
export default PassphraseField;
