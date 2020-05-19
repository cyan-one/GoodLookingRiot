"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _IntegrationManagers = require("../../../integrations/IntegrationManagers");

var _matrixJsSdk = require("matrix-js-sdk");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Terms = require("../../../Terms");

var _classnames = _interopRequireDefault(require("classnames"));

var ScalarMessaging = _interopRequireWildcard(require("../../../ScalarMessaging"));

/*
Copyright 2019 The Matrix.org Foundation C.I.C.

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
class TabbedIntegrationManagerDialog extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "openManager", async (i
    /*: number*/
    , force = false) => {
      if (i === this.state.currentIndex && !force) return;
      const manager = this.state.managers[i];
      const client = manager.getScalarClient();
      this.setState({
        busy: true,
        currentIndex: i,
        currentLoading: true,
        currentConnected: false,
        currentScalarClient: client
      });
      ScalarMessaging.setOpenManagerUrl(manager.uiUrl);
      client.setTermsInteractionCallback((policyInfo, agreedUrls) => {
        // To avoid visual glitching of two modals stacking briefly, we customise the
        // terms dialog sizing when it will appear for the integration manager so that
        // it gets the same basic size as the IM's own modal.
        return (0, _Terms.dialogTermsInteractionCallback)(policyInfo, agreedUrls, 'mx_TermsDialog_forIntegrationManager');
      });

      try {
        await client.connect();

        if (!client.hasCredentials()) {
          this.setState({
            busy: false,
            currentLoading: false,
            currentConnected: false
          });
        } else {
          this.setState({
            busy: false,
            currentLoading: false,
            currentConnected: true
          });
        }
      } catch (e) {
        if (e instanceof _Terms.TermsNotSignedError) {
          return;
        }

        console.error(e);
        this.setState({
          busy: false,
          currentLoading: false,
          currentConnected: false
        });
      }
    });
    this.state = {
      managers: _IntegrationManagers.IntegrationManagers.sharedInstance().getOrderedManagers(),
      busy: true,
      currentIndex: 0,
      currentConnected: false,
      currentLoading: true,
      currentScalarClient: null
    };
  }

  componentDidMount()
  /*: void*/
  {
    this.openManager(0, true);
  }

  _renderTabs() {
    const AccessibleButton = sdk.getComponent("views.elements.AccessibleButton");
    return this.state.managers.map((m, i) => {
      const classes = (0, _classnames.default)({
        'mx_TabbedIntegrationManagerDialog_tab': true,
        'mx_TabbedIntegrationManagerDialog_currentTab': this.state.currentIndex === i
      });
      return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        className: classes,
        onClick: () => this.openManager(i),
        key: "tab_".concat(i),
        disabled: this.state.busy
      }, m.name);
    });
  }

  _renderTab() {
    const IntegrationManager = sdk.getComponent("views.settings.IntegrationManager");
    let uiUrl = null;

    if (this.state.currentScalarClient) {
      uiUrl = this.state.currentScalarClient.getScalarInterfaceUrlForRoom(this.props.room, this.props.screen, this.props.integrationId);
    }

    return /*#__PURE__*/_react.default.createElement(IntegrationManager, {
      configured: true,
      loading: this.state.currentLoading,
      connected: this.state.currentConnected,
      url: uiUrl,
      onFinished: () => {
        /* no-op */
      }
    });
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TabbedIntegrationManagerDialog_container"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TabbedIntegrationManagerDialog_tabs"
    }, this._renderTabs()), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_TabbedIntegrationManagerDialog_currentManager"
    }, this._renderTab()));
  }

}

exports.default = TabbedIntegrationManagerDialog;
(0, _defineProperty2.default)(TabbedIntegrationManagerDialog, "propTypes", {
  /**
   * Called with:
   *     * success {bool} True if the user accepted any douments, false if cancelled
   *     * agreedUrls {string[]} List of agreed URLs
   */
  onFinished: _propTypes.default.func.isRequired,

  /**
   * Optional room where the integration manager should be open to
   */
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room),

  /**
   * Optional screen to open on the integration manager
   */
  screen: _propTypes.default.string,

  /**
   * Optional integration ID to open in the integration manager
   */
  integrationId: _propTypes.default.string
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvVGFiYmVkSW50ZWdyYXRpb25NYW5hZ2VyRGlhbG9nLmpzIl0sIm5hbWVzIjpbIlRhYmJlZEludGVncmF0aW9uTWFuYWdlckRpYWxvZyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsImkiLCJmb3JjZSIsInN0YXRlIiwiY3VycmVudEluZGV4IiwibWFuYWdlciIsIm1hbmFnZXJzIiwiY2xpZW50IiwiZ2V0U2NhbGFyQ2xpZW50Iiwic2V0U3RhdGUiLCJidXN5IiwiY3VycmVudExvYWRpbmciLCJjdXJyZW50Q29ubmVjdGVkIiwiY3VycmVudFNjYWxhckNsaWVudCIsIlNjYWxhck1lc3NhZ2luZyIsInNldE9wZW5NYW5hZ2VyVXJsIiwidWlVcmwiLCJzZXRUZXJtc0ludGVyYWN0aW9uQ2FsbGJhY2siLCJwb2xpY3lJbmZvIiwiYWdyZWVkVXJscyIsImNvbm5lY3QiLCJoYXNDcmVkZW50aWFscyIsImUiLCJUZXJtc05vdFNpZ25lZEVycm9yIiwiY29uc29sZSIsImVycm9yIiwiSW50ZWdyYXRpb25NYW5hZ2VycyIsInNoYXJlZEluc3RhbmNlIiwiZ2V0T3JkZXJlZE1hbmFnZXJzIiwiY29tcG9uZW50RGlkTW91bnQiLCJvcGVuTWFuYWdlciIsIl9yZW5kZXJUYWJzIiwiQWNjZXNzaWJsZUJ1dHRvbiIsInNkayIsImdldENvbXBvbmVudCIsIm1hcCIsIm0iLCJjbGFzc2VzIiwibmFtZSIsIl9yZW5kZXJUYWIiLCJJbnRlZ3JhdGlvbk1hbmFnZXIiLCJnZXRTY2FsYXJJbnRlcmZhY2VVcmxGb3JSb29tIiwicm9vbSIsInNjcmVlbiIsImludGVncmF0aW9uSWQiLCJyZW5kZXIiLCJvbkZpbmlzaGVkIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJpbnN0YW5jZU9mIiwiUm9vbSIsInN0cmluZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztB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UyxFQUFDO0FBQWYsb0JBQ0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQ0ssS0FBS2QsV0FBTCxFQURMLENBREosZUFJSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDSyxLQUFLUSxVQUFMLEVBREwsQ0FKSixDQURKO0FBVUg7O0FBakp1RTs7OzhCQUF2RDNDLDhCLGVBQ0U7QUFDZjs7Ozs7QUFLQWtELEVBQUFBLFVBQVUsRUFBRUMsbUJBQVVDLElBQVYsQ0FBZUMsVUFOWjs7QUFRZjs7O0FBR0FQLEVBQUFBLElBQUksRUFBRUssbUJBQVVHLFVBQVYsQ0FBcUJDLGlCQUFyQixDQVhTOztBQWFmOzs7QUFHQVIsRUFBQUEsTUFBTSxFQUFFSSxtQkFBVUssTUFoQkg7O0FBa0JmOzs7QUFHQVIsRUFBQUEsYUFBYSxFQUFFRyxtQkFBVUs7QUFyQlYsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtJbnRlZ3JhdGlvbk1hbmFnZXJzfSBmcm9tIFwiLi4vLi4vLi4vaW50ZWdyYXRpb25zL0ludGVncmF0aW9uTWFuYWdlcnNcIjtcbmltcG9ydCB7Um9vbX0gZnJvbSBcIm1hdHJpeC1qcy1zZGtcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQge2RpYWxvZ1Rlcm1zSW50ZXJhY3Rpb25DYWxsYmFjaywgVGVybXNOb3RTaWduZWRFcnJvcn0gZnJvbSBcIi4uLy4uLy4uL1Rlcm1zXCI7XG5pbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcbmltcG9ydCAqIGFzIFNjYWxhck1lc3NhZ2luZyBmcm9tIFwiLi4vLi4vLi4vU2NhbGFyTWVzc2FnaW5nXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRhYmJlZEludGVncmF0aW9uTWFuYWdlckRpYWxvZyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxlZCB3aXRoOlxuICAgICAgICAgKiAgICAgKiBzdWNjZXNzIHtib29sfSBUcnVlIGlmIHRoZSB1c2VyIGFjY2VwdGVkIGFueSBkb3VtZW50cywgZmFsc2UgaWYgY2FuY2VsbGVkXG4gICAgICAgICAqICAgICAqIGFncmVlZFVybHMge3N0cmluZ1tdfSBMaXN0IG9mIGFncmVlZCBVUkxzXG4gICAgICAgICAqL1xuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25hbCByb29tIHdoZXJlIHRoZSBpbnRlZ3JhdGlvbiBtYW5hZ2VyIHNob3VsZCBiZSBvcGVuIHRvXG4gICAgICAgICAqL1xuICAgICAgICByb29tOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihSb29tKSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9uYWwgc2NyZWVuIHRvIG9wZW4gb24gdGhlIGludGVncmF0aW9uIG1hbmFnZXJcbiAgICAgICAgICovXG4gICAgICAgIHNjcmVlbjogUHJvcFR5cGVzLnN0cmluZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9uYWwgaW50ZWdyYXRpb24gSUQgdG8gb3BlbiBpbiB0aGUgaW50ZWdyYXRpb24gbWFuYWdlclxuICAgICAgICAgKi9cbiAgICAgICAgaW50ZWdyYXRpb25JZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBtYW5hZ2VyczogSW50ZWdyYXRpb25NYW5hZ2Vycy5zaGFyZWRJbnN0YW5jZSgpLmdldE9yZGVyZWRNYW5hZ2VycygpLFxuICAgICAgICAgICAgYnVzeTogdHJ1ZSxcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDogMCxcbiAgICAgICAgICAgIGN1cnJlbnRDb25uZWN0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgY3VycmVudExvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICBjdXJyZW50U2NhbGFyQ2xpZW50OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCk6IHZvaWQge1xuICAgICAgICB0aGlzLm9wZW5NYW5hZ2VyKDAsIHRydWUpO1xuICAgIH1cblxuICAgIG9wZW5NYW5hZ2VyID0gYXN5bmMgKGk6IG51bWJlciwgZm9yY2UgPSBmYWxzZSkgPT4ge1xuICAgICAgICBpZiAoaSA9PT0gdGhpcy5zdGF0ZS5jdXJyZW50SW5kZXggJiYgIWZvcmNlKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgbWFuYWdlciA9IHRoaXMuc3RhdGUubWFuYWdlcnNbaV07XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IG1hbmFnZXIuZ2V0U2NhbGFyQ2xpZW50KCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYnVzeTogdHJ1ZSxcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDogaSxcbiAgICAgICAgICAgIGN1cnJlbnRMb2FkaW5nOiB0cnVlLFxuICAgICAgICAgICAgY3VycmVudENvbm5lY3RlZDogZmFsc2UsXG4gICAgICAgICAgICBjdXJyZW50U2NhbGFyQ2xpZW50OiBjbGllbnQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIFNjYWxhck1lc3NhZ2luZy5zZXRPcGVuTWFuYWdlclVybChtYW5hZ2VyLnVpVXJsKTtcblxuICAgICAgICBjbGllbnQuc2V0VGVybXNJbnRlcmFjdGlvbkNhbGxiYWNrKChwb2xpY3lJbmZvLCBhZ3JlZWRVcmxzKSA9PiB7XG4gICAgICAgICAgICAvLyBUbyBhdm9pZCB2aXN1YWwgZ2xpdGNoaW5nIG9mIHR3byBtb2RhbHMgc3RhY2tpbmcgYnJpZWZseSwgd2UgY3VzdG9taXNlIHRoZVxuICAgICAgICAgICAgLy8gdGVybXMgZGlhbG9nIHNpemluZyB3aGVuIGl0IHdpbGwgYXBwZWFyIGZvciB0aGUgaW50ZWdyYXRpb24gbWFuYWdlciBzbyB0aGF0XG4gICAgICAgICAgICAvLyBpdCBnZXRzIHRoZSBzYW1lIGJhc2ljIHNpemUgYXMgdGhlIElNJ3Mgb3duIG1vZGFsLlxuICAgICAgICAgICAgcmV0dXJuIGRpYWxvZ1Rlcm1zSW50ZXJhY3Rpb25DYWxsYmFjayhcbiAgICAgICAgICAgICAgICBwb2xpY3lJbmZvLCBhZ3JlZWRVcmxzLCAnbXhfVGVybXNEaWFsb2dfZm9ySW50ZWdyYXRpb25NYW5hZ2VyJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgaWYgKCFjbGllbnQuaGFzQ3JlZGVudGlhbHMoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudExvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q29ubmVjdGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50TG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDb25uZWN0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgVGVybXNOb3RTaWduZWRFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGJ1c3k6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29ubmVjdGVkOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9yZW5kZXJUYWJzKCkge1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLmVsZW1lbnRzLkFjY2Vzc2libGVCdXR0b25cIik7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLm1hbmFnZXJzLm1hcCgobSwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgICdteF9UYWJiZWRJbnRlZ3JhdGlvbk1hbmFnZXJEaWFsb2dfdGFiJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAnbXhfVGFiYmVkSW50ZWdyYXRpb25NYW5hZ2VyRGlhbG9nX2N1cnJlbnRUYWInOiB0aGlzLnN0YXRlLmN1cnJlbnRJbmRleCA9PT0gaSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXN9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMub3Blbk1hbmFnZXIoaSl9XG4gICAgICAgICAgICAgICAgICAgIGtleT17YHRhYl8ke2l9YH1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUuYnVzeX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHttLm5hbWV9XG4gICAgICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3JlbmRlclRhYigpIHtcbiAgICAgICAgY29uc3QgSW50ZWdyYXRpb25NYW5hZ2VyID0gc2RrLmdldENvbXBvbmVudChcInZpZXdzLnNldHRpbmdzLkludGVncmF0aW9uTWFuYWdlclwiKTtcbiAgICAgICAgbGV0IHVpVXJsID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY3VycmVudFNjYWxhckNsaWVudCkge1xuICAgICAgICAgICAgdWlVcmwgPSB0aGlzLnN0YXRlLmN1cnJlbnRTY2FsYXJDbGllbnQuZ2V0U2NhbGFySW50ZXJmYWNlVXJsRm9yUm9vbShcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLnJvb20sXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5zY3JlZW4sXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5pbnRlZ3JhdGlvbklkLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEludGVncmF0aW9uTWFuYWdlclxuICAgICAgICAgICAgY29uZmlndXJlZD17dHJ1ZX1cbiAgICAgICAgICAgIGxvYWRpbmc9e3RoaXMuc3RhdGUuY3VycmVudExvYWRpbmd9XG4gICAgICAgICAgICBjb25uZWN0ZWQ9e3RoaXMuc3RhdGUuY3VycmVudENvbm5lY3RlZH1cbiAgICAgICAgICAgIHVybD17dWlVcmx9XG4gICAgICAgICAgICBvbkZpbmlzaGVkPXsoKSA9PiB7Lyogbm8tb3AgKi99fVxuICAgICAgICAvPjtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfVGFiYmVkSW50ZWdyYXRpb25NYW5hZ2VyRGlhbG9nX2NvbnRhaW5lcic+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1RhYmJlZEludGVncmF0aW9uTWFuYWdlckRpYWxvZ190YWJzJz5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclRhYnMoKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfVGFiYmVkSW50ZWdyYXRpb25NYW5hZ2VyRGlhbG9nX2N1cnJlbnRNYW5hZ2VyJz5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclRhYigpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19