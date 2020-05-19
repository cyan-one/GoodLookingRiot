interface IOpts {
    label?: string;
    userText?: string;
    sendLogs?: boolean;
    progressCallback?: (string: any) => void;
}
/**
 * Send a bug report.
 *
 * @param {string} bugReportEndpoint HTTP url to send the report to
 *
 * @param {object} opts optional dictionary of options
 *
 * @param {string} opts.userText Any additional user input.
 *
 * @param {boolean} opts.sendLogs True to send logs
 *
 * @param {function(string)} opts.progressCallback Callback to call with progress updates
 *
 * @return {Promise} Resolved when the bug report is sent.
 */
export default function sendBugReport(bugReportEndpoint: string, opts: IOpts): Promise<void>;
export {};
