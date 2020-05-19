import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { PartCreator } from "./parts";
export declare function parsePlainTextMessage(body: string, partCreator: PartCreator, isQuotedMessage: boolean): any[];
export declare function parseEvent(event: MatrixEvent, partCreator: PartCreator, { isQuotedMessage }?: {
    isQuotedMessage?: boolean;
}): any;
