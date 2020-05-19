"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ALL_ROOMS = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _DirectoryUtils = require("../../../utils/DirectoryUtils");

var _ContextMenu = require("../../structures/ContextMenu");

var _languageHandler = require("../../../languageHandler");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _useSettings = require("../../../hooks/useSettings");

var sdk = _interopRequireWildcard(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _SettingsStore = _interopRequireDefault(require("../../../settings/SettingsStore"));

var _Validation = _interopRequireDefault(require("../elements/Validation"));

/*
Copyright 2016 OpenMarket Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2020 The Matrix.org Foundation C.I.C.

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
const ALL_ROOMS = Symbol("ALL_ROOMS");
exports.ALL_ROOMS = ALL_ROOMS;
const SETTING_NAME = "room_directory_servers";

const inPlaceOf = elementRect => ({
  right: window.innerWidth - elementRect.right,
  top: elementRect.top,
  chevronOffset: 0,
  chevronFace: "none"
});

const validServer = (0, _Validation.default)({
  rules: [{
    key: "required",
    test: async ({
      value
    }) => !!value,
    invalid: () => (0, _languageHandler._t)("Enter a server name")
  }, {
    key: "available",
    final: true,
    test: async ({
      value
    }) => {
      try {
        const opts = {
          limit: 1,
          server: value
        }; // check if we can successfully load this server's room directory

        await _MatrixClientPeg.MatrixClientPeg.get().publicRooms(opts);
        return true;
      } catch (e) {
        return false;
      }
    },
    valid: () => (0, _languageHandler._t)("Looks good"),
    invalid: () => (0, _languageHandler._t)("Can't find this server or its room list")
  }]
}); // This dropdown sources homeservers from three places:
// + your currently connected homeserver
// + homeservers in config.json["roomDirectory"]
// + homeservers in SettingsStore["room_directory_servers"]
// if a server exists in multiple, only keep the top-most entry.

const NetworkDropdown = ({
  onOptionChange,
  protocols = {},
  selectedServerName,
  selectedInstanceId
}) => {
  const [menuDisplayed, handle, openMenu, closeMenu] = (0, _ContextMenu.useContextMenu)();

  const _userDefinedServers = (0, _useSettings.useSettingValue)(SETTING_NAME);

  const [userDefinedServers, _setUserDefinedServers] = (0, _react.useState)(_userDefinedServers);

  const handlerFactory = (server, instanceId) => {
    return () => {
      onOptionChange(server, instanceId);
      closeMenu();
    };
  };

  const setUserDefinedServers = servers => {
    _setUserDefinedServers(servers);

    _SettingsStore.default.setValue(SETTING_NAME, null, "account", servers);
  }; // keep local echo up to date with external changes


  (0, _react.useEffect)(() => {
    _setUserDefinedServers(_userDefinedServers);
  }, [_userDefinedServers]); // we either show the button or the dropdown in its place.

  let content;

  if (menuDisplayed) {
    const config = _SdkConfig.default.get();

    const roomDirectory = config.roomDirectory || {};

    const hsName = _MatrixClientPeg.MatrixClientPeg.getHomeserverName();

    const configServers = new Set(roomDirectory.servers); // configured servers take preference over user-defined ones, if one occurs in both ignore the latter one.

    const removableServers = new Set(userDefinedServers.filter(s => !configServers.has(s) && s !== hsName));
    const servers = [// we always show our connected HS, this takes precedence over it being configured or user-defined
    hsName, ...Array.from(configServers).filter(s => s !== hsName).sort(), ...Array.from(removableServers).sort()]; // For our own HS, we can use the instance_ids given in the third party protocols
    // response to get the server to filter the room list by network for us.
    // We can't get thirdparty protocols for remote server yet though, so for those
    // we can only show the default room list.

    const options = servers.map(server => {
      const serverSelected = server === selectedServerName;
      const entries = [];
      const protocolsList = server === hsName ? Object.values(protocols) : [];

      if (protocolsList.length > 0) {
        // add a fake protocol with the ALL_ROOMS symbol
        protocolsList.push({
          instances: [{
            instance_id: ALL_ROOMS,
            desc: (0, _languageHandler._t)("All rooms")
          }]
        });
      }

      protocolsList.forEach(({
        instances = []
      }) => {
        [...instances].sort((b, a) => {
          return a.desc.localeCompare(b.desc);
        }).forEach(({
          desc,
          instance_id: instanceId
        }) => {
          entries.push( /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItemRadio, {
            key: String(instanceId),
            active: serverSelected && instanceId === selectedInstanceId,
            onClick: handlerFactory(server, instanceId),
            label: desc,
            className: "mx_NetworkDropdown_server_network"
          }, desc));
        });
      });
      let subtitle;

      if (server === hsName) {
        subtitle = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_NetworkDropdown_server_subtitle"
        }, (0, _languageHandler._t)("Your server"));
      }

      let removeButton;

      if (removableServers.has(server)) {
        const onClick = async () => {
          closeMenu();
          const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

          const {
            finished
          } = _Modal.default.createTrackedDialog("Network Dropdown", "Remove server", QuestionDialog, {
            title: (0, _languageHandler._t)("Are you sure?"),
            description: (0, _languageHandler._t)("Are you sure you want to remove <b>%(serverName)s</b>", {
              serverName: server
            }, {
              b: serverName => /*#__PURE__*/_react.default.createElement("b", null, serverName)
            }),
            button: (0, _languageHandler._t)("Remove"),
            fixedWidth: false
          }, "mx_NetworkDropdown_dialog");

          const [ok] = await finished;
          if (!ok) return; // delete from setting

          setUserDefinedServers(servers.filter(s => s !== server)); // the selected server is being removed, reset to our HS

          if (serverSelected === server) {
            onOptionChange(hsName, undefined);
          }
        };

        removeButton = /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
          onClick: onClick,
          label: (0, _languageHandler._t)("Remove server")
        });
      } // ARIA: in actual fact the entire menu is one large radio group but for better screen reader support
      // we use group to notate server wrongly.


      return /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuGroup, {
        label: server,
        className: "mx_NetworkDropdown_server",
        key: server
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_NetworkDropdown_server_title"
      }, server, removeButton), subtitle, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItemRadio, {
        active: serverSelected && !selectedInstanceId,
        onClick: handlerFactory(server, undefined),
        label: (0, _languageHandler._t)("Matrix"),
        className: "mx_NetworkDropdown_server_network"
      }, (0, _languageHandler._t)("Matrix")), entries);
    });

    const onClick = async () => {
      closeMenu();
      const TextInputDialog = sdk.getComponent("dialogs.TextInputDialog");

      const {
        finished
      } = _Modal.default.createTrackedDialog("Network Dropdown", "Add a new server", TextInputDialog, {
        title: (0, _languageHandler._t)("Add a new server"),
        description: (0, _languageHandler._t)("Enter the name of a new server you want to explore."),
        button: (0, _languageHandler._t)("Add"),
        hasCancel: false,
        placeholder: (0, _languageHandler._t)("Server name"),
        validator: validServer,
        fixedWidth: false
      }, "mx_NetworkDropdown_dialog");

      const [ok, newServer] = await finished;
      if (!ok) return;

      if (!userDefinedServers.includes(newServer)) {
        setUserDefinedServers([...userDefinedServers, newServer]);
      }

      onOptionChange(newServer); // change filter to the new server
    };

    const buttonRect = handle.current.getBoundingClientRect();
    content = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenu, (0, _extends2.default)({}, inPlaceOf(buttonRect), {
      onFinished: closeMenu
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_NetworkDropdown_menu"
    }, options, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_NetworkDropdown_server_add",
      label: undefined,
      onClick: onClick
    }, (0, _languageHandler._t)("Add a new server..."))));
  } else {
    let currentValue;

    if (selectedInstanceId === ALL_ROOMS) {
      currentValue = (0, _languageHandler._t)("All rooms");
    } else if (selectedInstanceId) {
      const instance = (0, _DirectoryUtils.instanceForInstanceId)(protocols, selectedInstanceId);
      currentValue = (0, _languageHandler._t)("%(networkName)s rooms", {
        networkName: instance.desc
      });
    } else {
      currentValue = (0, _languageHandler._t)("Matrix rooms");
    }

    content = /*#__PURE__*/_react.default.createElement(_ContextMenu.ContextMenuButton, {
      className: "mx_NetworkDropdown_handle",
      onClick: openMenu,
      isExpanded: menuDisplayed
    }, /*#__PURE__*/_react.default.createElement("span", null, currentValue), " ", /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_NetworkDropdown_handle_server"
    }, "(", selectedServerName, ")"));
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_NetworkDropdown",
    ref: handle
  }, content);
};

NetworkDropdown.propTypes = {
  onOptionChange: _propTypes.default.func.isRequired,
  protocols: _propTypes.default.object
};
var _default = NetworkDropdown;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpcmVjdG9yeS9OZXR3b3JrRHJvcGRvd24uanMiXSwibmFtZXMiOlsiQUxMX1JPT01TIiwiU3ltYm9sIiwiU0VUVElOR19OQU1FIiwiaW5QbGFjZU9mIiwiZWxlbWVudFJlY3QiLCJyaWdodCIsIndpbmRvdyIsImlubmVyV2lkdGgiLCJ0b3AiLCJjaGV2cm9uT2Zmc2V0IiwiY2hldnJvbkZhY2UiLCJ2YWxpZFNlcnZlciIsInJ1bGVzIiwia2V5IiwidGVzdCIsInZhbHVlIiwiaW52YWxpZCIsImZpbmFsIiwib3B0cyIsImxpbWl0Iiwic2VydmVyIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwicHVibGljUm9vbXMiLCJlIiwidmFsaWQiLCJOZXR3b3JrRHJvcGRvd24iLCJvbk9wdGlvbkNoYW5nZSIsInByb3RvY29scyIsInNlbGVjdGVkU2VydmVyTmFtZSIsInNlbGVjdGVkSW5zdGFuY2VJZCIsIm1lbnVEaXNwbGF5ZWQiLCJoYW5kbGUiLCJvcGVuTWVudSIsImNsb3NlTWVudSIsIl91c2VyRGVmaW5lZFNlcnZlcnMiLCJ1c2VyRGVmaW5lZFNlcnZlcnMiLCJfc2V0VXNlckRlZmluZWRTZXJ2ZXJzIiwiaGFuZGxlckZhY3RvcnkiLCJpbnN0YW5jZUlkIiwic2V0VXNlckRlZmluZWRTZXJ2ZXJzIiwic2VydmVycyIsIlNldHRpbmdzU3RvcmUiLCJzZXRWYWx1ZSIsImNvbnRlbnQiLCJjb25maWciLCJTZGtDb25maWciLCJyb29tRGlyZWN0b3J5IiwiaHNOYW1lIiwiZ2V0SG9tZXNlcnZlck5hbWUiLCJjb25maWdTZXJ2ZXJzIiwiU2V0IiwicmVtb3ZhYmxlU2VydmVycyIsImZpbHRlciIsInMiLCJoYXMiLCJBcnJheSIsImZyb20iLCJzb3J0Iiwib3B0aW9ucyIsIm1hcCIsInNlcnZlclNlbGVjdGVkIiwiZW50cmllcyIsInByb3RvY29sc0xpc3QiLCJPYmplY3QiLCJ2YWx1ZXMiLCJsZW5ndGgiLCJwdXNoIiwiaW5zdGFuY2VzIiwiaW5zdGFuY2VfaWQiLCJkZXNjIiwiZm9yRWFjaCIsImIiLCJhIiwibG9jYWxlQ29tcGFyZSIsIlN0cmluZyIsInN1YnRpdGxlIiwicmVtb3ZlQnV0dG9uIiwib25DbGljayIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiZmluaXNoZWQiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwic2VydmVyTmFtZSIsImJ1dHRvbiIsImZpeGVkV2lkdGgiLCJvayIsInVuZGVmaW5lZCIsIlRleHRJbnB1dERpYWxvZyIsImhhc0NhbmNlbCIsInBsYWNlaG9sZGVyIiwidmFsaWRhdG9yIiwibmV3U2VydmVyIiwiaW5jbHVkZXMiLCJidXR0b25SZWN0IiwiY3VycmVudCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImN1cnJlbnRWYWx1ZSIsImluc3RhbmNlIiwibmV0d29ya05hbWUiLCJwcm9wVHlwZXMiLCJQcm9wVHlwZXMiLCJmdW5jIiwiaXNSZXF1aXJlZCIsIm9iamVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFRQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFyQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUNPLE1BQU1BLFNBQVMsR0FBR0MsTUFBTSxDQUFDLFdBQUQsQ0FBeEI7O0FBRVAsTUFBTUMsWUFBWSxHQUFHLHdCQUFyQjs7QUFFQSxNQUFNQyxTQUFTLEdBQUlDLFdBQUQsS0FBa0I7QUFDaENDLEVBQUFBLEtBQUssRUFBRUMsTUFBTSxDQUFDQyxVQUFQLEdBQW9CSCxXQUFXLENBQUNDLEtBRFA7QUFFaENHLEVBQUFBLEdBQUcsRUFBRUosV0FBVyxDQUFDSSxHQUZlO0FBR2hDQyxFQUFBQSxhQUFhLEVBQUUsQ0FIaUI7QUFJaENDLEVBQUFBLFdBQVcsRUFBRTtBQUptQixDQUFsQixDQUFsQjs7QUFPQSxN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QUFQO0FBR0gsQ0F0TUQ7O0FBd01BbEIsZUFBZSxDQUFDOEUsU0FBaEIsR0FBNEI7QUFDeEI3RSxFQUFBQSxjQUFjLEVBQUU4RSxtQkFBVUMsSUFBVixDQUFlQyxVQURQO0FBRXhCL0UsRUFBQUEsU0FBUyxFQUFFNkUsbUJBQVVHO0FBRkcsQ0FBNUI7ZUFLZWxGLGUiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VFZmZlY3QsIHVzZVN0YXRlfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCB7aW5zdGFuY2VGb3JJbnN0YW5jZUlkfSBmcm9tICcuLi8uLi8uLi91dGlscy9EaXJlY3RvcnlVdGlscyc7XG5pbXBvcnQge1xuICAgIENvbnRleHRNZW51LFxuICAgIHVzZUNvbnRleHRNZW51LFxuICAgIENvbnRleHRNZW51QnV0dG9uLFxuICAgIE1lbnVJdGVtUmFkaW8sXG4gICAgTWVudUl0ZW0sXG4gICAgTWVudUdyb3VwLFxufSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuaW1wb3J0IFNka0NvbmZpZyBmcm9tIFwiLi4vLi4vLi4vU2RrQ29uZmlnXCI7XG5pbXBvcnQge3VzZVNldHRpbmdWYWx1ZX0gZnJvbSBcIi4uLy4uLy4uL2hvb2tzL3VzZVNldHRpbmdzXCI7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uLy4uL01vZGFsXCI7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSBmcm9tIFwiLi4vLi4vLi4vc2V0dGluZ3MvU2V0dGluZ3NTdG9yZVwiO1xuaW1wb3J0IHdpdGhWYWxpZGF0aW9uIGZyb20gXCIuLi9lbGVtZW50cy9WYWxpZGF0aW9uXCI7XG5cbmV4cG9ydCBjb25zdCBBTExfUk9PTVMgPSBTeW1ib2woXCJBTExfUk9PTVNcIik7XG5cbmNvbnN0IFNFVFRJTkdfTkFNRSA9IFwicm9vbV9kaXJlY3Rvcnlfc2VydmVyc1wiO1xuXG5jb25zdCBpblBsYWNlT2YgPSAoZWxlbWVudFJlY3QpID0+ICh7XG4gICAgcmlnaHQ6IHdpbmRvdy5pbm5lcldpZHRoIC0gZWxlbWVudFJlY3QucmlnaHQsXG4gICAgdG9wOiBlbGVtZW50UmVjdC50b3AsXG4gICAgY2hldnJvbk9mZnNldDogMCxcbiAgICBjaGV2cm9uRmFjZTogXCJub25lXCIsXG59KTtcblxuY29uc3QgdmFsaWRTZXJ2ZXIgPSB3aXRoVmFsaWRhdGlvbih7XG4gICAgcnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAga2V5OiBcInJlcXVpcmVkXCIsXG4gICAgICAgICAgICB0ZXN0OiBhc3luYyAoeyB2YWx1ZSB9KSA9PiAhIXZhbHVlLFxuICAgICAgICAgICAgaW52YWxpZDogKCkgPT4gX3QoXCJFbnRlciBhIHNlcnZlciBuYW1lXCIpLFxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBrZXk6IFwiYXZhaWxhYmxlXCIsXG4gICAgICAgICAgICBmaW5hbDogdHJ1ZSxcbiAgICAgICAgICAgIHRlc3Q6IGFzeW5jICh7IHZhbHVlIH0pID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXI6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB3ZSBjYW4gc3VjY2Vzc2Z1bGx5IGxvYWQgdGhpcyBzZXJ2ZXIncyByb29tIGRpcmVjdG9yeVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucHVibGljUm9vbXMob3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWxpZDogKCkgPT4gX3QoXCJMb29rcyBnb29kXCIpLFxuICAgICAgICAgICAgaW52YWxpZDogKCkgPT4gX3QoXCJDYW4ndCBmaW5kIHRoaXMgc2VydmVyIG9yIGl0cyByb29tIGxpc3RcIiksXG4gICAgICAgIH0sXG4gICAgXSxcbn0pO1xuXG4vLyBUaGlzIGRyb3Bkb3duIHNvdXJjZXMgaG9tZXNlcnZlcnMgZnJvbSB0aHJlZSBwbGFjZXM6XG4vLyArIHlvdXIgY3VycmVudGx5IGNvbm5lY3RlZCBob21lc2VydmVyXG4vLyArIGhvbWVzZXJ2ZXJzIGluIGNvbmZpZy5qc29uW1wicm9vbURpcmVjdG9yeVwiXVxuLy8gKyBob21lc2VydmVycyBpbiBTZXR0aW5nc1N0b3JlW1wicm9vbV9kaXJlY3Rvcnlfc2VydmVyc1wiXVxuLy8gaWYgYSBzZXJ2ZXIgZXhpc3RzIGluIG11bHRpcGxlLCBvbmx5IGtlZXAgdGhlIHRvcC1tb3N0IGVudHJ5LlxuXG5jb25zdCBOZXR3b3JrRHJvcGRvd24gPSAoe29uT3B0aW9uQ2hhbmdlLCBwcm90b2NvbHMgPSB7fSwgc2VsZWN0ZWRTZXJ2ZXJOYW1lLCBzZWxlY3RlZEluc3RhbmNlSWR9KSA9PiB7XG4gICAgY29uc3QgW21lbnVEaXNwbGF5ZWQsIGhhbmRsZSwgb3Blbk1lbnUsIGNsb3NlTWVudV0gPSB1c2VDb250ZXh0TWVudSgpO1xuICAgIGNvbnN0IF91c2VyRGVmaW5lZFNlcnZlcnMgPSB1c2VTZXR0aW5nVmFsdWUoU0VUVElOR19OQU1FKTtcbiAgICBjb25zdCBbdXNlckRlZmluZWRTZXJ2ZXJzLCBfc2V0VXNlckRlZmluZWRTZXJ2ZXJzXSA9IHVzZVN0YXRlKF91c2VyRGVmaW5lZFNlcnZlcnMpO1xuXG4gICAgY29uc3QgaGFuZGxlckZhY3RvcnkgPSAoc2VydmVyLCBpbnN0YW5jZUlkKSA9PiB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBvbk9wdGlvbkNoYW5nZShzZXJ2ZXIsIGluc3RhbmNlSWQpO1xuICAgICAgICAgICAgY2xvc2VNZW51KCk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGNvbnN0IHNldFVzZXJEZWZpbmVkU2VydmVycyA9IHNlcnZlcnMgPT4ge1xuICAgICAgICBfc2V0VXNlckRlZmluZWRTZXJ2ZXJzKHNlcnZlcnMpO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFNFVFRJTkdfTkFNRSwgbnVsbCwgXCJhY2NvdW50XCIsIHNlcnZlcnMpO1xuICAgIH07XG4gICAgLy8ga2VlcCBsb2NhbCBlY2hvIHVwIHRvIGRhdGUgd2l0aCBleHRlcm5hbCBjaGFuZ2VzXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgX3NldFVzZXJEZWZpbmVkU2VydmVycyhfdXNlckRlZmluZWRTZXJ2ZXJzKTtcbiAgICB9LCBbX3VzZXJEZWZpbmVkU2VydmVyc10pO1xuXG4gICAgLy8gd2UgZWl0aGVyIHNob3cgdGhlIGJ1dHRvbiBvciB0aGUgZHJvcGRvd24gaW4gaXRzIHBsYWNlLlxuICAgIGxldCBjb250ZW50O1xuICAgIGlmIChtZW51RGlzcGxheWVkKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IFNka0NvbmZpZy5nZXQoKTtcbiAgICAgICAgY29uc3Qgcm9vbURpcmVjdG9yeSA9IGNvbmZpZy5yb29tRGlyZWN0b3J5IHx8IHt9O1xuXG4gICAgICAgIGNvbnN0IGhzTmFtZSA9IE1hdHJpeENsaWVudFBlZy5nZXRIb21lc2VydmVyTmFtZSgpO1xuICAgICAgICBjb25zdCBjb25maWdTZXJ2ZXJzID0gbmV3IFNldChyb29tRGlyZWN0b3J5LnNlcnZlcnMpO1xuXG4gICAgICAgIC8vIGNvbmZpZ3VyZWQgc2VydmVycyB0YWtlIHByZWZlcmVuY2Ugb3ZlciB1c2VyLWRlZmluZWQgb25lcywgaWYgb25lIG9jY3VycyBpbiBib3RoIGlnbm9yZSB0aGUgbGF0dGVyIG9uZS5cbiAgICAgICAgY29uc3QgcmVtb3ZhYmxlU2VydmVycyA9IG5ldyBTZXQodXNlckRlZmluZWRTZXJ2ZXJzLmZpbHRlcihzID0+ICFjb25maWdTZXJ2ZXJzLmhhcyhzKSAmJiBzICE9PSBoc05hbWUpKTtcbiAgICAgICAgY29uc3Qgc2VydmVycyA9IFtcbiAgICAgICAgICAgIC8vIHdlIGFsd2F5cyBzaG93IG91ciBjb25uZWN0ZWQgSFMsIHRoaXMgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGl0IGJlaW5nIGNvbmZpZ3VyZWQgb3IgdXNlci1kZWZpbmVkXG4gICAgICAgICAgICBoc05hbWUsXG4gICAgICAgICAgICAuLi5BcnJheS5mcm9tKGNvbmZpZ1NlcnZlcnMpLmZpbHRlcihzID0+IHMgIT09IGhzTmFtZSkuc29ydCgpLFxuICAgICAgICAgICAgLi4uQXJyYXkuZnJvbShyZW1vdmFibGVTZXJ2ZXJzKS5zb3J0KCksXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gRm9yIG91ciBvd24gSFMsIHdlIGNhbiB1c2UgdGhlIGluc3RhbmNlX2lkcyBnaXZlbiBpbiB0aGUgdGhpcmQgcGFydHkgcHJvdG9jb2xzXG4gICAgICAgIC8vIHJlc3BvbnNlIHRvIGdldCB0aGUgc2VydmVyIHRvIGZpbHRlciB0aGUgcm9vbSBsaXN0IGJ5IG5ldHdvcmsgZm9yIHVzLlxuICAgICAgICAvLyBXZSBjYW4ndCBnZXQgdGhpcmRwYXJ0eSBwcm90b2NvbHMgZm9yIHJlbW90ZSBzZXJ2ZXIgeWV0IHRob3VnaCwgc28gZm9yIHRob3NlXG4gICAgICAgIC8vIHdlIGNhbiBvbmx5IHNob3cgdGhlIGRlZmF1bHQgcm9vbSBsaXN0LlxuICAgICAgICBjb25zdCBvcHRpb25zID0gc2VydmVycy5tYXAoc2VydmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlcnZlclNlbGVjdGVkID0gc2VydmVyID09PSBzZWxlY3RlZFNlcnZlck5hbWU7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gW107XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3RvY29sc0xpc3QgPSBzZXJ2ZXIgPT09IGhzTmFtZSA/IE9iamVjdC52YWx1ZXMocHJvdG9jb2xzKSA6IFtdO1xuICAgICAgICAgICAgaWYgKHByb3RvY29sc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIGFkZCBhIGZha2UgcHJvdG9jb2wgd2l0aCB0aGUgQUxMX1JPT01TIHN5bWJvbFxuICAgICAgICAgICAgICAgIHByb3RvY29sc0xpc3QucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlczogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlX2lkOiBBTExfUk9PTVMsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjOiBfdChcIkFsbCByb29tc1wiKSxcbiAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb3RvY29sc0xpc3QuZm9yRWFjaCgoe2luc3RhbmNlcz1bXX0pID0+IHtcbiAgICAgICAgICAgICAgICBbLi4uaW5zdGFuY2VzXS5zb3J0KChiLCBhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmRlc2MubG9jYWxlQ29tcGFyZShiLmRlc2MpO1xuICAgICAgICAgICAgICAgIH0pLmZvckVhY2goKHtkZXNjLCBpbnN0YW5jZV9pZDogaW5zdGFuY2VJZH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZW50cmllcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgPE1lbnVJdGVtUmFkaW9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e1N0cmluZyhpbnN0YW5jZUlkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e3NlcnZlclNlbGVjdGVkICYmIGluc3RhbmNlSWQgPT09IHNlbGVjdGVkSW5zdGFuY2VJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVyRmFjdG9yeShzZXJ2ZXIsIGluc3RhbmNlSWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtkZXNjfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X05ldHdvcmtEcm9wZG93bl9zZXJ2ZXJfbmV0d29ya1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBkZXNjIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvTWVudUl0ZW1SYWRpbz4pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCBzdWJ0aXRsZTtcbiAgICAgICAgICAgIGlmIChzZXJ2ZXIgPT09IGhzTmFtZSkge1xuICAgICAgICAgICAgICAgIHN1YnRpdGxlID0gKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X05ldHdvcmtEcm9wZG93bl9zZXJ2ZXJfc3VidGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIllvdXIgc2VydmVyXCIpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcmVtb3ZlQnV0dG9uO1xuICAgICAgICAgICAgaWYgKHJlbW92YWJsZVNlcnZlcnMuaGFzKHNlcnZlcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5RdWVzdGlvbkRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2ZpbmlzaGVkfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXCJOZXR3b3JrIERyb3Bkb3duXCIsIFwiUmVtb3ZlIHNlcnZlclwiLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiQXJlIHlvdSBzdXJlP1wiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcIkFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZW1vdmUgPGI+JShzZXJ2ZXJOYW1lKXM8L2I+XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJOYW1lOiBzZXJ2ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogc2VydmVyTmFtZSA9PiA8Yj57IHNlcnZlck5hbWUgfTwvYj4sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJSZW1vdmVcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXhlZFdpZHRoOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfSwgXCJteF9OZXR3b3JrRHJvcGRvd25fZGlhbG9nXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtva10gPSBhd2FpdCBmaW5pc2hlZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlbGV0ZSBmcm9tIHNldHRpbmdcbiAgICAgICAgICAgICAgICAgICAgc2V0VXNlckRlZmluZWRTZXJ2ZXJzKHNlcnZlcnMuZmlsdGVyKHMgPT4gcyAhPT0gc2VydmVyKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHNlbGVjdGVkIHNlcnZlciBpcyBiZWluZyByZW1vdmVkLCByZXNldCB0byBvdXIgSFNcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlcnZlclNlbGVjdGVkID09PSBzZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uT3B0aW9uQ2hhbmdlKGhzTmFtZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVtb3ZlQnV0dG9uID0gPE1lbnVJdGVtIG9uQ2xpY2s9e29uQ2xpY2t9IGxhYmVsPXtfdChcIlJlbW92ZSBzZXJ2ZXJcIil9IC8+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBUklBOiBpbiBhY3R1YWwgZmFjdCB0aGUgZW50aXJlIG1lbnUgaXMgb25lIGxhcmdlIHJhZGlvIGdyb3VwIGJ1dCBmb3IgYmV0dGVyIHNjcmVlbiByZWFkZXIgc3VwcG9ydFxuICAgICAgICAgICAgLy8gd2UgdXNlIGdyb3VwIHRvIG5vdGF0ZSBzZXJ2ZXIgd3JvbmdseS5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPE1lbnVHcm91cCBsYWJlbD17c2VydmVyfSBjbGFzc05hbWU9XCJteF9OZXR3b3JrRHJvcGRvd25fc2VydmVyXCIga2V5PXtzZXJ2ZXJ9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X05ldHdvcmtEcm9wZG93bl9zZXJ2ZXJfdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc2VydmVyIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgcmVtb3ZlQnV0dG9uIH1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgc3VidGl0bGUgfVxuXG4gICAgICAgICAgICAgICAgICAgIDxNZW51SXRlbVJhZGlvXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU9e3NlcnZlclNlbGVjdGVkICYmICFzZWxlY3RlZEluc3RhbmNlSWR9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVyRmFjdG9yeShzZXJ2ZXIsIHVuZGVmaW5lZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoXCJNYXRyaXhcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9OZXR3b3JrRHJvcGRvd25fc2VydmVyX25ldHdvcmtcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJNYXRyaXhcIil9XG4gICAgICAgICAgICAgICAgICAgIDwvTWVudUl0ZW1SYWRpbz5cbiAgICAgICAgICAgICAgICAgICAgeyBlbnRyaWVzIH1cbiAgICAgICAgICAgICAgICA8L01lbnVHcm91cD5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG9uQ2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjbG9zZU1lbnUoKTtcbiAgICAgICAgICAgIGNvbnN0IFRleHRJbnB1dERpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlRleHRJbnB1dERpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnN0IHsgZmluaXNoZWQgfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coXCJOZXR3b3JrIERyb3Bkb3duXCIsIFwiQWRkIGEgbmV3IHNlcnZlclwiLCBUZXh0SW5wdXREaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJBZGQgYSBuZXcgc2VydmVyXCIpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdChcIkVudGVyIHRoZSBuYW1lIG9mIGEgbmV3IHNlcnZlciB5b3Ugd2FudCB0byBleHBsb3JlLlwiKSxcbiAgICAgICAgICAgICAgICBidXR0b246IF90KFwiQWRkXCIpLFxuICAgICAgICAgICAgICAgIGhhc0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IF90KFwiU2VydmVyIG5hbWVcIiksXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yOiB2YWxpZFNlcnZlcixcbiAgICAgICAgICAgICAgICBmaXhlZFdpZHRoOiBmYWxzZSxcbiAgICAgICAgICAgIH0sIFwibXhfTmV0d29ya0Ryb3Bkb3duX2RpYWxvZ1wiKTtcblxuICAgICAgICAgICAgY29uc3QgW29rLCBuZXdTZXJ2ZXJdID0gYXdhaXQgZmluaXNoZWQ7XG4gICAgICAgICAgICBpZiAoIW9rKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICghdXNlckRlZmluZWRTZXJ2ZXJzLmluY2x1ZGVzKG5ld1NlcnZlcikpIHtcbiAgICAgICAgICAgICAgICBzZXRVc2VyRGVmaW5lZFNlcnZlcnMoWy4uLnVzZXJEZWZpbmVkU2VydmVycywgbmV3U2VydmVyXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9uT3B0aW9uQ2hhbmdlKG5ld1NlcnZlcik7IC8vIGNoYW5nZSBmaWx0ZXIgdG8gdGhlIG5ldyBzZXJ2ZXJcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBidXR0b25SZWN0ID0gaGFuZGxlLmN1cnJlbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnRlbnQgPSA8Q29udGV4dE1lbnUgey4uLmluUGxhY2VPZihidXR0b25SZWN0KX0gb25GaW5pc2hlZD17Y2xvc2VNZW51fT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfTmV0d29ya0Ryb3Bkb3duX21lbnVcIj5cbiAgICAgICAgICAgICAgICB7b3B0aW9uc31cbiAgICAgICAgICAgICAgICA8TWVudUl0ZW0gY2xhc3NOYW1lPVwibXhfTmV0d29ya0Ryb3Bkb3duX3NlcnZlcl9hZGRcIiBsYWJlbD17dW5kZWZpbmVkfSBvbkNsaWNrPXtvbkNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAge190KFwiQWRkIGEgbmV3IHNlcnZlci4uLlwiKX1cbiAgICAgICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvQ29udGV4dE1lbnU+O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBjdXJyZW50VmFsdWU7XG4gICAgICAgIGlmIChzZWxlY3RlZEluc3RhbmNlSWQgPT09IEFMTF9ST09NUykge1xuICAgICAgICAgICAgY3VycmVudFZhbHVlID0gX3QoXCJBbGwgcm9vbXNcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWRJbnN0YW5jZUlkKSB7XG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlRm9ySW5zdGFuY2VJZChwcm90b2NvbHMsIHNlbGVjdGVkSW5zdGFuY2VJZCk7XG4gICAgICAgICAgICBjdXJyZW50VmFsdWUgPSBfdChcIiUobmV0d29ya05hbWUpcyByb29tc1wiLCB7XG4gICAgICAgICAgICAgICAgbmV0d29ya05hbWU6IGluc3RhbmNlLmRlc2MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IF90KFwiTWF0cml4IHJvb21zXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGVudCA9IDxDb250ZXh0TWVudUJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfTmV0d29ya0Ryb3Bkb3duX2hhbmRsZVwiXG4gICAgICAgICAgICBvbkNsaWNrPXtvcGVuTWVudX1cbiAgICAgICAgICAgIGlzRXhwYW5kZWQ9e21lbnVEaXNwbGF5ZWR9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIHtjdXJyZW50VmFsdWV9XG4gICAgICAgICAgICA8L3NwYW4+IDxzcGFuIGNsYXNzTmFtZT1cIm14X05ldHdvcmtEcm9wZG93bl9oYW5kbGVfc2VydmVyXCI+XG4gICAgICAgICAgICAgICAgKHtzZWxlY3RlZFNlcnZlck5hbWV9KVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L0NvbnRleHRNZW51QnV0dG9uPjtcbiAgICB9XG5cbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9OZXR3b3JrRHJvcGRvd25cIiByZWY9e2hhbmRsZX0+XG4gICAgICAgIHtjb250ZW50fVxuICAgIDwvZGl2Pjtcbn07XG5cbk5ldHdvcmtEcm9wZG93bi5wcm9wVHlwZXMgPSB7XG4gICAgb25PcHRpb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgcHJvdG9jb2xzOiBQcm9wVHlwZXMub2JqZWN0LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgTmV0d29ya0Ryb3Bkb3duO1xuIl19