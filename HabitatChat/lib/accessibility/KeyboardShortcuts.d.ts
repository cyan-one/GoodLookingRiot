export declare enum Categories {
    NAVIGATION = "Navigation",
    CALLS = "Calls",
    COMPOSER = "Composer",
    ROOM_LIST = "Room List",
    ROOM = "Room",
    AUTOCOMPLETE = "Autocomplete"
}
export declare enum Modifiers {
    ALT = "Alt",
    ALT_GR = "Alt Gr",
    SHIFT = "Shift",
    SUPER = "Super",
    COMMAND = "Command",
    CONTROL = "Ctrl"
}
export declare const CMD_OR_CTRL: Modifiers;
interface IKeybind {
    modifiers?: Modifiers[];
    key: string;
}
interface IShortcut {
    keybinds: IKeybind[];
    description: string;
}
export declare const toggleDialog: () => void;
export declare const registerShortcut: (category: Categories, defn: IShortcut) => void;
export {};
