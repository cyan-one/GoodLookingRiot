"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _SettingsStore = _interopRequireWildcard(require("../../../settings/SettingsStore"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _actions = require("../../../dispatcher/actions");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Travis Ralston
Copyright 2018, 2019 New Vector Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'UrlPreviewSettings',
  propTypes: {
    room: _propTypes.default.object
  },
  _onClickUserSettings: e => {
    e.preventDefault();
    e.stopPropagation();

    _dispatcher.default.fire(_actions.Action.ViewUserSettings);
  },
  render: function () {
    const SettingsFlag = sdk.getComponent("elements.SettingsFlag");
    const roomId = this.props.room.roomId;

    const isEncrypted = _MatrixClientPeg.MatrixClientPeg.get().isRoomEncrypted(roomId);

    let previewsForAccount = null;
    let previewsForRoom = null;

    if (!isEncrypted) {
      // Only show account setting state and room state setting state in non-e2ee rooms where they apply
      const accountEnabled = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.ACCOUNT, "urlPreviewsEnabled");

      if (accountEnabled) {
        previewsForAccount = (0, _languageHandler._t)("You have <a>enabled</a> URL previews by default.", {}, {
          'a': sub => /*#__PURE__*/_react.default.createElement("a", {
            onClick: this._onClickUserSettings,
            href: ""
          }, sub)
        });
      } else if (accountEnabled) {
        previewsForAccount = (0, _languageHandler._t)("You have <a>disabled</a> URL previews by default.", {}, {
          'a': sub => /*#__PURE__*/_react.default.createElement("a", {
            onClick: this._onClickUserSettings,
            href: ""
          }, sub)
        });
      }

      if (_SettingsStore.default.canSetValue("urlPreviewsEnabled", roomId, "room")) {
        previewsForRoom = /*#__PURE__*/_react.default.createElement("label", null, /*#__PURE__*/_react.default.createElement(SettingsFlag, {
          name: "urlPreviewsEnabled",
          level: _SettingsStore.SettingLevel.ROOM,
          roomId: roomId,
          isExplicit: true
        }));
      } else {
        let str = (0, _languageHandler._td)("URL previews are enabled by default for participants in this room.");

        if (!_SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.ROOM, "urlPreviewsEnabled", roomId,
        /*explicit=*/
        true)) {
          str = (0, _languageHandler._td)("URL previews are disabled by default for participants in this room.");
        }

        previewsForRoom = /*#__PURE__*/_react.default.createElement("label", null, (0, _languageHandler._t)(str));
      }
    } else {
      previewsForAccount = (0, _languageHandler._t)("In encrypted rooms, like this one, URL previews are disabled by default to ensure that your " + "homeserver (where the previews are generated) cannot gather information about links you see in " + "this room.");
    }

    const previewsForRoomAccount =
    /*#__PURE__*/
    // in an e2ee room we use a special key to enforce per-room opt-in
    _react.default.createElement(SettingsFlag, {
      name: isEncrypted ? 'urlPreviewsEnabled_e2ee' : 'urlPreviewsEnabled',
      level: _SettingsStore.SettingLevel.ROOM_ACCOUNT,
      roomId: roomId
    });

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, (0, _languageHandler._t)('When someone puts a URL in their message, a URL preview can be shown to give more ' + 'information about that link such as the title, description, and an image from the website.')), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_SettingsTab_subsectionText"
    }, previewsForAccount), previewsForRoom, /*#__PURE__*/_react.default.createElement("label", null, previewsForRoomAccount));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21fc2V0dGluZ3MvVXJsUHJldmlld1NldHRpbmdzLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsIl9vbkNsaWNrVXNlclNldHRpbmdzIiwiZSIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwiZGlzIiwiZmlyZSIsIkFjdGlvbiIsIlZpZXdVc2VyU2V0dGluZ3MiLCJyZW5kZXIiLCJTZXR0aW5nc0ZsYWciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJyb29tSWQiLCJwcm9wcyIsImlzRW5jcnlwdGVkIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiaXNSb29tRW5jcnlwdGVkIiwicHJldmlld3NGb3JBY2NvdW50IiwicHJldmlld3NGb3JSb29tIiwiYWNjb3VudEVuYWJsZWQiLCJTZXR0aW5nc1N0b3JlIiwiZ2V0VmFsdWVBdCIsIlNldHRpbmdMZXZlbCIsIkFDQ09VTlQiLCJzdWIiLCJjYW5TZXRWYWx1ZSIsIlJPT00iLCJzdHIiLCJwcmV2aWV3c0ZvclJvb21BY2NvdW50IiwiUk9PTV9BQ0NPVU5UIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQW1CQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQThCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxvQkFEZTtBQUc1QkMsRUFBQUEsU0FBUyxFQUFFO0FBQ1BDLElBQUFBLElBQUksRUFBRUMsbUJBQVVDO0FBRFQsR0FIaUI7QUFPNUJDLEVBQUFBLG9CQUFvQixFQUFHQyxDQUFELElBQU87QUFDekJBLElBQUFBLENBQUMsQ0FBQ0MsY0FBRjtBQUNBRCxJQUFBQSxDQUFDLENBQUNFLGVBQUY7O0FBQ0FDLHdCQUFJQyxJQUFKLENBQVNDLGdCQUFPQyxnQkFBaEI7QUFDSCxHQVgyQjtBQWE1QkMsRUFBQUEsTUFBTSxFQUFFLFlBQVc7QUFDZixVQUFNQyxZQUFZLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix1QkFBakIsQ0FBckI7QUFDQSxVQUFNQyxNQUFNLEdBQUcsS0FBS0MsS0FBTCxDQUFXaEIsSUFBWCxDQUFnQmUsTUFBL0I7O0FBQ0EsVUFBTUUsV0FBVyxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEdBQXNCQyxlQUF0QixDQUFzQ0wsTUFBdEMsQ0FBcEI7O0FBRUEsUUFBSU0sa0JBQWtCLEdBQUcsSUFBekI7QUFDQSxRQUFJQyxlQUFlLEdBQUcsSUFBdEI7O0FBRUEsUUFBSSxDQUFDTCxXQUFMLEVBQWtCO0FBQ2Q7QUFDQSxZQUFNTSxjQUFjLEdBQUdDLHVCQUFjQyxVQUFkLENBQXlCQyw0QkFBYUMsT0FBdEMsRUFBK0Msb0JBQS9DLENBQXZCOztBQUNBLFVBQUlKLGNBQUosRUFBb0I7QUFDaEJGLFFBQUFBLGtCQUFrQixHQUNkLHlCQUFHLGtEQUFILEVBQXVELEVBQXZELEVBQTJEO0FBQ3ZELGVBQU1PLEdBQUQsaUJBQU87QUFBRyxZQUFBLE9BQU8sRUFBRSxLQUFLekIsb0JBQWpCO0FBQXVDLFlBQUEsSUFBSSxFQUFDO0FBQTVDLGFBQWlEeUIsR0FBakQ7QUFEMkMsU0FBM0QsQ0FESjtBQUtILE9BTkQsTUFNTyxJQUFJTCxjQUFKLEVBQW9CO0FBQ3ZCRixRQUFBQSxrQkFBa0IsR0FDZCx5QkFBRyxtREFBSCxFQUF3RCxFQUF4RCxFQUE0RDtBQUN4RCxlQUFNTyxHQUFELGlCQUFPO0FBQUcsWUFBQSxPQUFPLEVBQUUsS0FBS3pCLG9CQUFqQjtBQUF1QyxZQUFBLElBQUksRUFBQztBQUE1QyxhQUFpRHlCLEdBQWpEO0FBRDRDLFNBQTVELENBREo7QUFLSDs7QUFFRCxVQUFJSix1QkFBY0ssV0FBZCxDQUEwQixvQkFBMUIsRUFBZ0RkLE1BQWhELEVBQXdELE1BQXhELENBQUosRUFBcUU7QUFDakVPLFFBQUFBLGVBQWUsZ0JBQ1gseURBQ0ksNkJBQUMsWUFBRDtBQUFjLFVBQUEsSUFBSSxFQUFDLG9CQUFuQjtBQUNjLFVBQUEsS0FBSyxFQUFFSSw0QkFBYUksSUFEbEM7QUFFYyxVQUFBLE1BQU0sRUFBRWYsTUFGdEI7QUFHYyxVQUFBLFVBQVUsRUFBRTtBQUgxQixVQURKLENBREo7QUFRSCxPQVRELE1BU087QUFDSCxZQUFJZ0IsR0FBRyxHQUFHLDBCQUFJLG9FQUFKLENBQVY7O0FBQ0EsWUFBSSxDQUFDUCx1QkFBY0MsVUFBZCxDQUF5QkMsNEJBQWFJLElBQXRDLEVBQTRDLG9CQUE1QyxFQUFrRWYsTUFBbEU7QUFBMEU7QUFBYSxZQUF2RixDQUFMLEVBQW1HO0FBQy9GZ0IsVUFBQUEsR0FBRyxHQUFHLDBCQUFJLHFFQUFKLENBQU47QUFDSDs7QUFDRFQsUUFBQUEsZUFBZSxnQkFBSSw0Q0FBUyx5QkFBR1MsR0FBSCxDQUFULENBQW5CO0FBQ0g7QUFDSixLQWpDRCxNQWlDTztBQUNIVixNQUFBQSxrQkFBa0IsR0FDZCx5QkFBRyxpR0FDQyxpR0FERCxHQUVDLFlBRkosQ0FESjtBQUtIOztBQUVELFVBQU1XLHNCQUFzQjtBQUFBO0FBQUs7QUFDN0IsaUNBQUMsWUFBRDtBQUFjLE1BQUEsSUFBSSxFQUFFZixXQUFXLEdBQUcseUJBQUgsR0FBK0Isb0JBQTlEO0FBQ2MsTUFBQSxLQUFLLEVBQUVTLDRCQUFhTyxZQURsQztBQUVjLE1BQUEsTUFBTSxFQUFFbEI7QUFGdEIsTUFESjs7QUFNQSx3QkFDSSx1REFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTSx5QkFBRyx1RkFDRCw0RkFERixDQUROLENBREosZUFLSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsT0FDTU0sa0JBRE4sQ0FMSixFQVFNQyxlQVJOLGVBU0ksNENBQVNVLHNCQUFULENBVEosQ0FESjtBQWFIO0FBakYyQixDQUFqQixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBUcmF2aXMgUmFsc3RvblxuQ29weXJpZ2h0IDIwMTgsIDIwMTkgTmV3IFZlY3RvciBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IHsgX3QsIF90ZCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uLy4uLy4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCBkaXMgZnJvbSBcIi4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlclwiO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCB7QWN0aW9ufSBmcm9tIFwiLi4vLi4vLi4vZGlzcGF0Y2hlci9hY3Rpb25zXCI7XG5cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdVcmxQcmV2aWV3U2V0dGluZ3MnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIHJvb206IFByb3BUeXBlcy5vYmplY3QsXG4gICAgfSxcblxuICAgIF9vbkNsaWNrVXNlclNldHRpbmdzOiAoZSkgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGRpcy5maXJlKEFjdGlvbi5WaWV3VXNlclNldHRpbmdzKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgU2V0dGluZ3NGbGFnID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNldHRpbmdzRmxhZ1wiKTtcbiAgICAgICAgY29uc3Qgcm9vbUlkID0gdGhpcy5wcm9wcy5yb29tLnJvb21JZDtcbiAgICAgICAgY29uc3QgaXNFbmNyeXB0ZWQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaXNSb29tRW5jcnlwdGVkKHJvb21JZCk7XG5cbiAgICAgICAgbGV0IHByZXZpZXdzRm9yQWNjb3VudCA9IG51bGw7XG4gICAgICAgIGxldCBwcmV2aWV3c0ZvclJvb20gPSBudWxsO1xuXG4gICAgICAgIGlmICghaXNFbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc2hvdyBhY2NvdW50IHNldHRpbmcgc3RhdGUgYW5kIHJvb20gc3RhdGUgc2V0dGluZyBzdGF0ZSBpbiBub24tZTJlZSByb29tcyB3aGVyZSB0aGV5IGFwcGx5XG4gICAgICAgICAgICBjb25zdCBhY2NvdW50RW5hYmxlZCA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChTZXR0aW5nTGV2ZWwuQUNDT1VOVCwgXCJ1cmxQcmV2aWV3c0VuYWJsZWRcIik7XG4gICAgICAgICAgICBpZiAoYWNjb3VudEVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBwcmV2aWV3c0ZvckFjY291bnQgPSAoXG4gICAgICAgICAgICAgICAgICAgIF90KFwiWW91IGhhdmUgPGE+ZW5hYmxlZDwvYT4gVVJMIHByZXZpZXdzIGJ5IGRlZmF1bHQuXCIsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYSc6IChzdWIpPT48YSBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrVXNlclNldHRpbmdzfSBocmVmPScnPnsgc3ViIH08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjY291bnRFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcHJldmlld3NGb3JBY2NvdW50ID0gKFxuICAgICAgICAgICAgICAgICAgICBfdChcIllvdSBoYXZlIDxhPmRpc2FibGVkPC9hPiBVUkwgcHJldmlld3MgYnkgZGVmYXVsdC5cIiwge30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhJzogKHN1Yik9PjxhIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2tVc2VyU2V0dGluZ3N9IGhyZWY9Jyc+eyBzdWIgfTwvYT4sXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFNldHRpbmdzU3RvcmUuY2FuU2V0VmFsdWUoXCJ1cmxQcmV2aWV3c0VuYWJsZWRcIiwgcm9vbUlkLCBcInJvb21cIikpIHtcbiAgICAgICAgICAgICAgICBwcmV2aWV3c0ZvclJvb20gPSAoXG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWcgbmFtZT1cInVybFByZXZpZXdzRW5hYmxlZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsPXtTZXR0aW5nTGV2ZWwuUk9PTX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vbUlkPXtyb29tSWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRXhwbGljaXQ9e3RydWV9IC8+XG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0ciA9IF90ZChcIlVSTCBwcmV2aWV3cyBhcmUgZW5hYmxlZCBieSBkZWZhdWx0IGZvciBwYXJ0aWNpcGFudHMgaW4gdGhpcyByb29tLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIVNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChTZXR0aW5nTGV2ZWwuUk9PTSwgXCJ1cmxQcmV2aWV3c0VuYWJsZWRcIiwgcm9vbUlkLCAvKmV4cGxpY2l0PSovdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gX3RkKFwiVVJMIHByZXZpZXdzIGFyZSBkaXNhYmxlZCBieSBkZWZhdWx0IGZvciBwYXJ0aWNpcGFudHMgaW4gdGhpcyByb29tLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldmlld3NGb3JSb29tID0gKDxsYWJlbD57IF90KHN0cikgfTwvbGFiZWw+KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXZpZXdzRm9yQWNjb3VudCA9IChcbiAgICAgICAgICAgICAgICBfdChcIkluIGVuY3J5cHRlZCByb29tcywgbGlrZSB0aGlzIG9uZSwgVVJMIHByZXZpZXdzIGFyZSBkaXNhYmxlZCBieSBkZWZhdWx0IHRvIGVuc3VyZSB0aGF0IHlvdXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcImhvbWVzZXJ2ZXIgKHdoZXJlIHRoZSBwcmV2aWV3cyBhcmUgZ2VuZXJhdGVkKSBjYW5ub3QgZ2F0aGVyIGluZm9ybWF0aW9uIGFib3V0IGxpbmtzIHlvdSBzZWUgaW4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInRoaXMgcm9vbS5cIilcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcmV2aWV3c0ZvclJvb21BY2NvdW50ID0gKCAvLyBpbiBhbiBlMmVlIHJvb20gd2UgdXNlIGEgc3BlY2lhbCBrZXkgdG8gZW5mb3JjZSBwZXItcm9vbSBvcHQtaW5cbiAgICAgICAgICAgIDxTZXR0aW5nc0ZsYWcgbmFtZT17aXNFbmNyeXB0ZWQgPyAndXJsUHJldmlld3NFbmFibGVkX2UyZWUnIDogJ3VybFByZXZpZXdzRW5hYmxlZCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsPXtTZXR0aW5nTGV2ZWwuUk9PTV9BQ0NPVU5UfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByb29tSWQ9e3Jvb21JZH0gLz5cbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdXaGVuIHNvbWVvbmUgcHV0cyBhIFVSTCBpbiB0aGVpciBtZXNzYWdlLCBhIFVSTCBwcmV2aWV3IGNhbiBiZSBzaG93biB0byBnaXZlIG1vcmUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnaW5mb3JtYXRpb24gYWJvdXQgdGhhdCBsaW5rIHN1Y2ggYXMgdGhlIHRpdGxlLCBkZXNjcmlwdGlvbiwgYW5kIGFuIGltYWdlIGZyb20gdGhlIHdlYnNpdGUuJykgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHsgcHJldmlld3NGb3JBY2NvdW50IH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IHByZXZpZXdzRm9yUm9vbSB9XG4gICAgICAgICAgICAgICAgPGxhYmVsPnsgcHJldmlld3NGb3JSb29tQWNjb3VudCB9PC9sYWJlbD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==