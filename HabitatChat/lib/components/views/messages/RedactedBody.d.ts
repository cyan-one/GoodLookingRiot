import React from "react";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
interface IProps {
    mxEvent: MatrixEvent;
}
declare const RedactedBody: React.ForwardRefExoticComponent<IProps & React.RefAttributes<any>>;
export default RedactedBody;
