export declare type DispatcherAction = Action | string;
export declare enum Action {
    /**
     * View a user's profile. Should be used with a ViewUserPayload.
     */
    ViewUser = "view_user",
    /**
     * Open the user settings. No additional payload information required.
     */
    ViewUserSettings = "view_user_settings"
}
