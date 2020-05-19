"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Tab = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var React = _interopRequireWildcard(require("react"));

var _languageHandler = require("../../languageHandler");

var PropTypes = _interopRequireWildcard(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../index"));

var _AutoHideScrollbar = _interopRequireDefault(require("./AutoHideScrollbar"));

/*
Copyright 2017 Travis Ralston
Copyright 2019 New Vector Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Represents a tab for the TabbedView.
 */
class Tab {
  /**
   * Creates a new tab.
   * @param {string} tabLabel The untranslated tab label.
   * @param {string} tabIconClass The class for the tab icon. This should be a simple mask.
   * @param {React.ReactNode} tabJsx The JSX for the tab container.
   */
  constructor(tabLabel
  /*: string*/
  , tabIconClass
  /*: string*/
  , tabJsx
  /*: React.ReactNode*/
  ) {
    (0, _defineProperty2.default)(this, "label", void 0);
    (0, _defineProperty2.default)(this, "icon", void 0);
    (0, _defineProperty2.default)(this, "body", void 0);
    this.label = tabLabel;
    this.icon = tabIconClass;
    this.body = tabJsx;
  }

}

exports.Tab = Tab;

class TabbedView extends React.Component
/*:: <IProps, IState>*/
{
  constructor(props
  /*: IProps*/
  ) {
    super(props);
    this.state = {
      activeTabIndex: 0
    };
  }

  _getActiveTabIndex() {
    if (!this.state || !this.state.activeTabIndex) return 0;
    return this.state.activeTabIndex;
  }
  /**
   * Shows the given tab
   * @param {Tab} tab the tab to show
   * @private
   */


  _setActiveTab(tab
  /*: Tab*/
  ) {
    const idx = this.props.tabs.indexOf(tab);

    if (idx !== -1) {
      this.setState({
        activeTabIndex: idx
      });
    } else {
      console.error("Could not find tab " + tab.label + " in tabs");
    }
  }

  _renderTabLabel(tab
  /*: Tab*/
  ) {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let classes = "mx_TabbedView_tabLabel ";
    const idx = this.props.tabs.indexOf(tab);
    if (idx === this._getActiveTabIndex()) classes += "mx_TabbedView_tabLabel_active";
    let tabIcon = null;

    if (tab.icon) {
      tabIcon = /*#__PURE__*/React.createElement("span", {
        className: "mx_TabbedView_maskedIcon ".concat(tab.icon)
      });
    }

    const onClickHandler = () => this._setActiveTab(tab);

    const label = (0, _languageHandler._t)(tab.label);
    return /*#__PURE__*/React.createElement(AccessibleButton, {
      className: classes,
      key: "tab_label_" + tab.label,
      onClick: onClickHandler
    }, tabIcon, /*#__PURE__*/React.createElement("span", {
      className: "mx_TabbedView_tabLabel_text"
    }, label));
  }

  _renderTabPanel(tab
  /*: Tab*/
  )
  /*: React.ReactNode*/
  {
    return /*#__PURE__*/React.createElement("div", {
      className: "mx_TabbedView_tabPanel",
      key: "mx_tabpanel_" + tab.label
    }, /*#__PURE__*/React.createElement(_AutoHideScrollbar.default, {
      className: "mx_TabbedView_tabPanelContent"
    }, tab.body));
  }

  render()
  /*: React.ReactNode*/
  {
    const labels = this.props.tabs.map(tab => this._renderTabLabel(tab));

    const panel = this._renderTabPanel(this.props.tabs[this._getActiveTabIndex()]);

    return /*#__PURE__*/React.createElement("div", {
      className: "mx_TabbedView"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx_TabbedView_tabLabels"
    }, labels), panel);
  }

}

exports.default = TabbedView;
(0, _defineProperty2.default)(TabbedView, "propTypes", {
  // The tabs to show
  tabs: PropTypes.arrayOf(PropTypes.instanceOf(Tab)).isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvVGFiYmVkVmlldy50c3giXSwibmFtZXMiOlsiVGFiIiwiY29uc3RydWN0b3IiLCJ0YWJMYWJlbCIsInRhYkljb25DbGFzcyIsInRhYkpzeCIsImxhYmVsIiwiaWNvbiIsImJvZHkiLCJUYWJiZWRWaWV3IiwiUmVhY3QiLCJDb21wb25lbnQiLCJwcm9wcyIsInN0YXRlIiwiYWN0aXZlVGFiSW5kZXgiLCJfZ2V0QWN0aXZlVGFiSW5kZXgiLCJfc2V0QWN0aXZlVGFiIiwidGFiIiwiaWR4IiwidGFicyIsImluZGV4T2YiLCJzZXRTdGF0ZSIsImNvbnNvbGUiLCJlcnJvciIsIl9yZW5kZXJUYWJMYWJlbCIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJjbGFzc2VzIiwidGFiSWNvbiIsIm9uQ2xpY2tIYW5kbGVyIiwiX3JlbmRlclRhYlBhbmVsIiwicmVuZGVyIiwibGFiZWxzIiwibWFwIiwicGFuZWwiLCJQcm9wVHlwZXMiLCJhcnJheU9mIiwiaW5zdGFuY2VPZiIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkE7OztBQUdPLE1BQU1BLEdBQU4sQ0FBVTtBQUtiOzs7Ozs7QUFNQUMsRUFBQUEsV0FBVyxDQUFDQztBQUFEO0FBQUEsSUFBbUJDO0FBQW5CO0FBQUEsSUFBeUNDO0FBQXpDO0FBQUEsSUFBa0U7QUFBQTtBQUFBO0FBQUE7QUFDekUsU0FBS0MsS0FBTCxHQUFhSCxRQUFiO0FBQ0EsU0FBS0ksSUFBTCxHQUFZSCxZQUFaO0FBQ0EsU0FBS0ksSUFBTCxHQUFZSCxNQUFaO0FBQ0g7O0FBZlk7Ozs7QUEwQkYsTUFBTUksVUFBTixTQUF5QkMsS0FBSyxDQUFDQztBQUEvQjtBQUF5RDtBQU1wRVQsRUFBQUEsV0FBVyxDQUFDVTtBQUFEO0FB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QVFIOztBQWpGbUU7Ozs4QkFBbkQxQixVLGVBQ0U7QUFDZjtBQUNBVSxFQUFBQSxJQUFJLEVBQUVpQixTQUFTLENBQUNDLE9BQVYsQ0FBa0JELFNBQVMsQ0FBQ0UsVUFBVixDQUFxQnJDLEdBQXJCLENBQWxCLEVBQTZDc0M7QUFGcEMsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNyBUcmF2aXMgUmFsc3RvblxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5LCAyMDIwIFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQge190fSBmcm9tICcuLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0ICogYXMgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uL2luZGV4XCI7XG5pbXBvcnQgQXV0b0hpZGVTY3JvbGxiYXIgZnJvbSAnLi9BdXRvSGlkZVNjcm9sbGJhcic7XG5pbXBvcnQgeyBSZWFjdE5vZGUgfSBmcm9tIFwicmVhY3RcIjtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgdGFiIGZvciB0aGUgVGFiYmVkVmlldy5cbiAqL1xuZXhwb3J0IGNsYXNzIFRhYiB7XG4gICAgcHVibGljIGxhYmVsOiBzdHJpbmc7XG4gICAgcHVibGljIGljb246IHN0cmluZztcbiAgICBwdWJsaWMgYm9keTogUmVhY3QuUmVhY3ROb2RlO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyB0YWIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhYkxhYmVsIFRoZSB1bnRyYW5zbGF0ZWQgdGFiIGxhYmVsLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YWJJY29uQ2xhc3MgVGhlIGNsYXNzIGZvciB0aGUgdGFiIGljb24uIFRoaXMgc2hvdWxkIGJlIGEgc2ltcGxlIG1hc2suXG4gICAgICogQHBhcmFtIHtSZWFjdC5SZWFjdE5vZGV9IHRhYkpzeCBUaGUgSlNYIGZvciB0aGUgdGFiIGNvbnRhaW5lci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0YWJMYWJlbDogc3RyaW5nLCB0YWJJY29uQ2xhc3M6IHN0cmluZywgdGFiSnN4OiBSZWFjdC5SZWFjdE5vZGUpIHtcbiAgICAgICAgdGhpcy5sYWJlbCA9IHRhYkxhYmVsO1xuICAgICAgICB0aGlzLmljb24gPSB0YWJJY29uQ2xhc3M7XG4gICAgICAgIHRoaXMuYm9keSA9IHRhYkpzeDtcbiAgICB9XG59XG5cbmludGVyZmFjZSBJUHJvcHMge1xuICAgIHRhYnM6IFRhYltdO1xufVxuXG5pbnRlcmZhY2UgSVN0YXRlIHtcbiAgICBhY3RpdmVUYWJJbmRleDogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUYWJiZWRWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PElQcm9wcywgSVN0YXRlPiB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLy8gVGhlIHRhYnMgdG8gc2hvd1xuICAgICAgICB0YWJzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuaW5zdGFuY2VPZihUYWIpKS5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgYWN0aXZlVGFiSW5kZXg6IDAsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QWN0aXZlVGFiSW5kZXgoKSB7XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZSB8fCAhdGhpcy5zdGF0ZS5hY3RpdmVUYWJJbmRleCkgcmV0dXJuIDA7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmFjdGl2ZVRhYkluZGV4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3dzIHRoZSBnaXZlbiB0YWJcbiAgICAgKiBAcGFyYW0ge1RhYn0gdGFiIHRoZSB0YWIgdG8gc2hvd1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBfc2V0QWN0aXZlVGFiKHRhYjogVGFiKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMucHJvcHMudGFicy5pbmRleE9mKHRhYik7XG4gICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHthY3RpdmVUYWJJbmRleDogaWR4fSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGZpbmQgdGFiIFwiICsgdGFiLmxhYmVsICsgXCIgaW4gdGFic1wiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbmRlclRhYkxhYmVsKHRhYjogVGFiKSB7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG5cbiAgICAgICAgbGV0IGNsYXNzZXMgPSBcIm14X1RhYmJlZFZpZXdfdGFiTGFiZWwgXCI7XG5cbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5wcm9wcy50YWJzLmluZGV4T2YodGFiKTtcbiAgICAgICAgaWYgKGlkeCA9PT0gdGhpcy5fZ2V0QWN0aXZlVGFiSW5kZXgoKSkgY2xhc3NlcyArPSBcIm14X1RhYmJlZFZpZXdfdGFiTGFiZWxfYWN0aXZlXCI7XG5cbiAgICAgICAgbGV0IHRhYkljb24gPSBudWxsO1xuICAgICAgICBpZiAodGFiLmljb24pIHtcbiAgICAgICAgICAgIHRhYkljb24gPSA8c3BhbiBjbGFzc05hbWU9e2BteF9UYWJiZWRWaWV3X21hc2tlZEljb24gJHt0YWIuaWNvbn1gfSAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9uQ2xpY2tIYW5kbGVyID0gKCkgPT4gdGhpcy5fc2V0QWN0aXZlVGFiKHRhYik7XG5cbiAgICAgICAgY29uc3QgbGFiZWwgPSBfdCh0YWIubGFiZWwpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gY2xhc3NOYW1lPXtjbGFzc2VzfSBrZXk9e1widGFiX2xhYmVsX1wiICsgdGFiLmxhYmVsfSBvbkNsaWNrPXtvbkNsaWNrSGFuZGxlcn0+XG4gICAgICAgICAgICAgICAge3RhYkljb259XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibXhfVGFiYmVkVmlld190YWJMYWJlbF90ZXh0XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgbGFiZWwgfVxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW5kZXJUYWJQYW5lbCh0YWI6IFRhYik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1RhYmJlZFZpZXdfdGFiUGFuZWxcIiBrZXk9e1wibXhfdGFicGFuZWxfXCIgKyB0YWIubGFiZWx9PlxuICAgICAgICAgICAgICAgIDxBdXRvSGlkZVNjcm9sbGJhciBjbGFzc05hbWU9J214X1RhYmJlZFZpZXdfdGFiUGFuZWxDb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAge3RhYi5ib2R5fVxuICAgICAgICAgICAgICAgIDwvQXV0b0hpZGVTY3JvbGxiYXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgICAgIGNvbnN0IGxhYmVscyA9IHRoaXMucHJvcHMudGFicy5tYXAodGFiID0+IHRoaXMuX3JlbmRlclRhYkxhYmVsKHRhYikpO1xuICAgICAgICBjb25zdCBwYW5lbCA9IHRoaXMuX3JlbmRlclRhYlBhbmVsKHRoaXMucHJvcHMudGFic1t0aGlzLl9nZXRBY3RpdmVUYWJJbmRleCgpXSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVGFiYmVkVmlld1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVGFiYmVkVmlld190YWJMYWJlbHNcIj5cbiAgICAgICAgICAgICAgICAgICAge2xhYmVsc31cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7cGFuZWx9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=