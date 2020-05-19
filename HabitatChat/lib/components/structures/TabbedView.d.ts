import * as React from "react";
import * as PropTypes from "prop-types";
/**
 * Represents a tab for the TabbedView.
 */
export declare class Tab {
    label: string;
    icon: string;
    body: React.ReactNode;
    /**
     * Creates a new tab.
     * @param {string} tabLabel The untranslated tab label.
     * @param {string} tabIconClass The class for the tab icon. This should be a simple mask.
     * @param {React.ReactNode} tabJsx The JSX for the tab container.
     */
    constructor(tabLabel: string, tabIconClass: string, tabJsx: React.ReactNode);
}
interface IProps {
    tabs: Tab[];
}
interface IState {
    activeTabIndex: number;
}
export default class TabbedView extends React.Component<IProps, IState> {
    static propTypes: {
        tabs: PropTypes.Validator<Tab[]>;
    };
    constructor(props: IProps);
    private _getActiveTabIndex;
    /**
     * Shows the given tab
     * @param {Tab} tab the tab to show
     * @private
     */
    private _setActiveTab;
    private _renderTabLabel;
    private _renderTabPanel;
    render(): React.ReactNode;
}
export {};
