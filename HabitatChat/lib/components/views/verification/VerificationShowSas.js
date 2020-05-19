"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../../languageHandler");

var _EncryptionInfo = require("../right_panel/EncryptionInfo");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _DialogButtons = _interopRequireDefault(require("../elements/DialogButtons"));

var _FontManager = require("../../../utils/FontManager");

/*
Copyright 2019 Vector Creations Ltd

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
function capFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

class VerificationShowSas extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onMatchClick", () => {
      this.setState({
        pending: true
      });
      this.props.onDone();
    });
    (0, _defineProperty2.default)(this, "onDontMatchClick", () => {
      this.setState({
        cancelling: true
      });
      this.props.onCancel();
    });
    this.state = {
      pending: false
    };
  }

  componentWillMount() {
    // As this component is also used before login (during complete security),
    // also make sure we have a working emoji font to display the SAS emojis here.
    // This is also done from LoggedInView.
    (0, _FontManager.fixupColorFonts)();
  }

  render() {
    let sasDisplay;
    let sasCaption;

    if (this.props.sas.emoji) {
      const emojiBlocks = this.props.sas.emoji.map((emoji, i) => /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_emojiSas_block",
        key: i
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_emojiSas_emoji"
      }, emoji[0]), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_emojiSas_label"
      }, (0, _languageHandler._t)(capFirst(emoji[1])))));
      sasDisplay = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_emojiSas"
      }, emojiBlocks.slice(0, 4), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_emojiSas_break"
      }), emojiBlocks.slice(4));
      sasCaption = this.props.isSelf ? (0, _languageHandler._t)("Confirm the emoji below are displayed on both sessions, in the same order:") : (0, _languageHandler._t)("Verify this user by confirming the following emoji appear on their screen.");
    } else if (this.props.sas.decimal) {
      const numberBlocks = this.props.sas.decimal.map((num, i) => /*#__PURE__*/_react.default.createElement("span", {
        key: i
      }, num));
      sasDisplay = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_VerificationShowSas_decimalSas"
      }, numberBlocks);
      sasCaption = this.props.isSelf ? (0, _languageHandler._t)("Verify this session by confirming the following number appears on its screen.") : (0, _languageHandler._t)("Verify this user by confirming the following number appears on their screen.");
    } else {
      return /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)("Unable to find a supported verification method."), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "primary",
        onClick: this.props.onCancel,
        className: "mx_UserInfo_wideButton"
      }, (0, _languageHandler._t)('Cancel')));
    }

    let confirm;

    if (this.state.pending || this.state.cancelling) {
      let text;

      if (this.state.pending) {
        if (this.props.isSelf) {
          // device shouldn't be null in this situation but it can be, eg. if the device is
          // logged out during verification
          if (this.props.device) {
            text = (0, _languageHandler._t)("Waiting for your other session, %(deviceName)s (%(deviceId)s), to verify…", {
              deviceName: this.props.device ? this.props.device.getDisplayName() : '',
              deviceId: this.props.device ? this.props.device.deviceId : ''
            });
          } else {
            text = (0, _languageHandler._t)("Waiting for your other session to verify…");
          }
        } else {
          const {
            displayName
          } = this.props;
          text = (0, _languageHandler._t)("Waiting for %(displayName)s to verify…", {
            displayName
          });
        }
      } else {
        text = (0, _languageHandler._t)("Cancelling…");
      }

      confirm = /*#__PURE__*/_react.default.createElement(_EncryptionInfo.PendingActionSpinner, {
        text: text
      });
    } else if (this.props.inDialog) {
      // FIXME: stop using DialogButtons here once this component is only used in the right panel verification
      confirm = /*#__PURE__*/_react.default.createElement(_DialogButtons.default, {
        primaryButton: (0, _languageHandler._t)("They match"),
        onPrimaryButtonClick: this.onMatchClick,
        primaryButtonClass: "mx_UserInfo_wideButton mx_VerificationShowSas_matchButton",
        cancelButton: (0, _languageHandler._t)("They don't match"),
        onCancel: this.onDontMatchClick,
        cancelButtonClass: "mx_UserInfo_wideButton mx_VerificationShowSas_noMatchButton"
      });
    } else {
      confirm = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onDontMatchClick,
        kind: "danger"
      }, (0, _languageHandler._t)("They don't match")), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this.onMatchClick,
        kind: "primary"
      }, (0, _languageHandler._t)("They match")));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_VerificationShowSas"
    }, /*#__PURE__*/_react.default.createElement("p", null, sasCaption), sasDisplay, /*#__PURE__*/_react.default.createElement("p", null, this.props.isSelf ? "" : (0, _languageHandler._t)("To be secure, do this in person or use a trusted way to communicate.")), confirm);
  }

} // List of Emoji strings from the js-sdk, for i18n


exports.default = VerificationShowSas;
(0, _defineProperty2.default)(VerificationShowSas, "propTypes", {
  pending: _propTypes.default.bool,
  displayName: _propTypes.default.string,
  // required if pending is true
  device: _propTypes.default.object,
  onDone: _propTypes.default.func.isRequired,
  onCancel: _propTypes.default.func.isRequired,
  sas: _propTypes.default.object.isRequired,
  isSelf: _propTypes.default.bool,
  inDialog: _propTypes.default.bool // whether this component is being shown in a dialog and to use DialogButtons

});
(0, _languageHandler._td)("Dog");
(0, _languageHandler._td)("Cat");
(0, _languageHandler._td)("Lion");
(0, _languageHandler._td)("Horse");
(0, _languageHandler._td)("Unicorn");
(0, _languageHandler._td)("Pig");
(0, _languageHandler._td)("Elephant");
(0, _languageHandler._td)("Rabbit");
(0, _languageHandler._td)("Panda");
(0, _languageHandler._td)("Rooster");
(0, _languageHandler._td)("Penguin");
(0, _languageHandler._td)("Turtle");
(0, _languageHandler._td)("Fish");
(0, _languageHandler._td)("Octopus");
(0, _languageHandler._td)("Butterfly");
(0, _languageHandler._td)("Flower");
(0, _languageHandler._td)("Tree");
(0, _languageHandler._td)("Cactus");
(0, _languageHandler._td)("Mushroom");
(0, _languageHandler._td)("Globe");
(0, _languageHandler._td)("Moon");
(0, _languageHandler._td)("Cloud");
(0, _languageHandler._td)("Fire");
(0, _languageHandler._td)("Banana");
(0, _languageHandler._td)("Apple");
(0, _languageHandler._td)("Strawberry");
(0, _languageHandler._td)("Corn");
(0, _languageHandler._td)("Pizza");
(0, _languageHandler._td)("Cake");
(0, _languageHandler._td)("Heart");
(0, _languageHandler._td)("Smiley");
(0, _languageHandler._td)("Robot");
(0, _languageHandler._td)("Hat");
(0, _languageHandler._td)("Glasses");
(0, _languageHandler._td)("Spanner");
(0, _languageHandler._td)("Santa");
(0, _languageHandler._td)("Thumbs up");
(0, _languageHandler._td)("Umbrella");
(0, _languageHandler._td)("Hourglass");
(0, _languageHandler._td)("Clock");
(0, _languageHandler._td)("Gift");
(0, _languageHandler._td)("Light bulb");
(0, _languageHandler._td)("Book");
(0, _languageHandler._td)("Pencil");
(0, _languageHandler._td)("Paperclip");
(0, _languageHandler._td)("Scissors");
(0, _languageHandler._td)("Lock");
(0, _languageHandler._td)("Key");
(0, _languageHandler._td)("Hammer");
(0, _languageHandler._td)("Telephone");
(0, _languageHandler._td)("Flag");
(0, _languageHandler._td)("Train");
(0, _languageHandler._td)("Bicycle");
(0, _languageHandler._td)("Aeroplane");
(0, _languageHandler._td)("Rocket");
(0, _languageHandler._td)("Trophy");
(0, _languageHandler._td)("Ball");
(0, _languageHandler._td)("Guitar");
(0, _languageHandler._td)("Trumpet");
(0, _languageHandler._td)("Bell");
(0, _languageHandler._td)("Anchor");
(0, _languageHandler._td)("Headphones");
(0, _languageHandler._td)("Folder");
(0, _languageHandler._td)("Pin");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3ZlcmlmaWNhdGlvbi9WZXJpZmljYXRpb25TaG93U2FzLmpzIl0sIm5hbWVzIjpbImNhcEZpcnN0IiwicyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic2xpY2UiLCJWZXJpZmljYXRpb25TaG93U2FzIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwic2V0U3RhdGUiLCJwZW5kaW5nIiwib25Eb25lIiwiY2FuY2VsbGluZyIsIm9uQ2FuY2VsIiwic3RhdGUiLCJjb21wb25lbnRXaWxsTW91bnQiLCJyZW5kZXIiLCJzYXNEaXNwbGF5Iiwic2FzQ2FwdGlvbiIsInNhcyIsImVtb2ppIiwiZW1vamlCbG9ja3MiLCJtYXAiLCJpIiwiaXNTZWxmIiwiZGVjaW1hbCIsIm51bWJlckJsb2NrcyIsIm51bSIsImNvbmZpcm0iLCJ0ZXh0IiwiZGV2aWNlIiwiZGV2aWNlTmFtZSIsImdldERpc3BsYXlOYW1lIiwiZGV2aWNlSWQiLCJkaXNwbGF5TmFtZSIsImluRGlhbG9nIiwib25NYXRjaENsaWNrIiwib25Eb250TWF0Y2hDbGljayIsIlByb3BUeXBlcyIsImJvb2wiLCJzdHJpbmciLCJvYmplY3QiLCJmdW5jIiwiaXNSZXF1aXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBdEJBOzs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsU0FBU0EsUUFBVCxDQUFrQkMsQ0FBbEIsRUFBcUI7QUFDakIsU0FBT0EsQ0FBQyxDQUFDQyxNQUFGLENBQVMsQ0FBVCxFQUFZQyxXQUFaLEtBQTRCRixDQUFDLENBQUNHLEtBQUYsQ0FBUSxDQUFSLENBQW5DO0FBQ0g7O0FBRWMsTUFBTUMsbUJBQU4sU0FBa0NDLGVBQU1DLFNBQXhDLENBQWtEO0FBWTdEQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtB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MEJBQUksU0FBSjtBQUNBLDBCQUFJLEtBQUo7QUFDQSwwQkFBSSxVQUFKO0FBQ0EsMEJBQUksUUFBSjtBQUNBLDBCQUFJLE9BQUo7QUFDQSwwQkFBSSxTQUFKO0FBQ0EsMEJBQUksU0FBSjtBQUNBLDBCQUFJLFFBQUo7QUFDQSwwQkFBSSxNQUFKO0FBQ0EsMEJBQUksU0FBSjtBQUNBLDBCQUFJLFdBQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksTUFBSjtBQUNBLDBCQUFJLFFBQUo7QUFDQSwwQkFBSSxVQUFKO0FBQ0EsMEJBQUksT0FBSjtBQUNBLDBCQUFJLE1BQUo7QUFDQSwwQkFBSSxPQUFKO0FBQ0EsMEJBQUksTUFBSjtBQUNBLDBCQUFJLFFBQUo7QUFDQSwwQkFBSSxPQUFKO0FBQ0EsMEJBQUksWUFBSjtBQUNBLDBCQUFJLE1BQUo7QUFDQSwwQkFBSSxPQUFKO0FBQ0EsMEJBQUksTUFBSjtBQUNBLDBCQUFJLE9BQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksT0FBSjtBQUNBLDBCQUFJLEtBQUo7QUFDQSwwQkFBSSxTQUFKO0FBQ0EsMEJBQUksU0FBSjtBQUNBLDBCQUFJLE9BQUo7QUFDQSwwQkFBSSxXQUFKO0FBQ0EsMEJBQUksVUFBSjtBQUNBLDBCQUFJLFdBQUo7QUFDQSwwQkFBSSxPQUFKO0FBQ0EsMEJBQUksTUFBSjtBQUNBLDBCQUFJLFlBQUo7QUFDQSwwQkFBSSxNQUFKO0FBQ0EsMEJBQUksUUFBSjtBQUNBLDBCQUFJLFdBQUo7QUFDQSwwQkFBSSxVQUFKO0FBQ0EsMEJBQUksTUFBSjtBQUNBLDBCQUFJLEtBQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksV0FBSjtBQUNBLDBCQUFJLE1BQUo7QUFDQSwwQkFBSSxPQUFKO0FBQ0EsMEJBQUksU0FBSjtBQUNBLDBCQUFJLFdBQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksUUFBSjtBQUNBLDBCQUFJLE1BQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksU0FBSjtBQUNBLDBCQUFJLE1BQUo7QUFDQSwwQkFBSSxRQUFKO0FBQ0EsMEJBQUksWUFBSjtBQUNBLDBCQUFJLFFBQUo7QUFDQSwwQkFBSSxLQUFKIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE5IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCwgX3RkIH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7UGVuZGluZ0FjdGlvblNwaW5uZXJ9IGZyb20gXCIuLi9yaWdodF9wYW5lbC9FbmNyeXB0aW9uSW5mb1wiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcbmltcG9ydCBEaWFsb2dCdXR0b25zIGZyb20gXCIuLi9lbGVtZW50cy9EaWFsb2dCdXR0b25zXCI7XG5pbXBvcnQgeyBmaXh1cENvbG9yRm9udHMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9Gb250TWFuYWdlcic7XG5cbmZ1bmN0aW9uIGNhcEZpcnN0KHMpIHtcbiAgICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlcmlmaWNhdGlvblNob3dTYXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHBlbmRpbmc6IFByb3BUeXBlcy5ib29sLFxuICAgICAgICBkaXNwbGF5TmFtZTogUHJvcFR5cGVzLnN0cmluZywgLy8gcmVxdWlyZWQgaWYgcGVuZGluZyBpcyB0cnVlXG4gICAgICAgIGRldmljZTogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgb25Eb25lOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBvbkNhbmNlbDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgc2FzOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICAgIGlzU2VsZjogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgIGluRGlhbG9nOiBQcm9wVHlwZXMuYm9vbCwgLy8gd2hldGhlciB0aGlzIGNvbXBvbmVudCBpcyBiZWluZyBzaG93biBpbiBhIGRpYWxvZyBhbmQgdG8gdXNlIERpYWxvZ0J1dHRvbnNcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgICAgIC8vIEFzIHRoaXMgY29tcG9uZW50IGlzIGFsc28gdXNlZCBiZWZvcmUgbG9naW4gKGR1cmluZyBjb21wbGV0ZSBzZWN1cml0eSksXG4gICAgICAgIC8vIGFsc28gbWFrZSBzdXJlIHdlIGhhdmUgYSB3b3JraW5nIGVtb2ppIGZvbnQgdG8gZGlzcGxheSB0aGUgU0FTIGVtb2ppcyBoZXJlLlxuICAgICAgICAvLyBUaGlzIGlzIGFsc28gZG9uZSBmcm9tIExvZ2dlZEluVmlldy5cbiAgICAgICAgZml4dXBDb2xvckZvbnRzKCk7XG4gICAgfVxuXG4gICAgb25NYXRjaENsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgcGVuZGluZzogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkRvbmUoKTtcbiAgICB9O1xuXG4gICAgb25Eb250TWF0Y2hDbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGNhbmNlbGxpbmc6IHRydWUgfSk7XG4gICAgICAgIHRoaXMucHJvcHMub25DYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgc2FzRGlzcGxheTtcbiAgICAgICAgbGV0IHNhc0NhcHRpb247XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnNhcy5lbW9qaSkge1xuICAgICAgICAgICAgY29uc3QgZW1vamlCbG9ja3MgPSB0aGlzLnByb3BzLnNhcy5lbW9qaS5tYXAoXG4gICAgICAgICAgICAgICAgKGVtb2ppLCBpKSA9PiA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZlcmlmaWNhdGlvblNob3dTYXNfZW1vamlTYXNfYmxvY2tcIiBrZXk9e2l9PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZlcmlmaWNhdGlvblNob3dTYXNfZW1vamlTYXNfZW1vamlcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZW1vamlbMF0gfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9WZXJpZmljYXRpb25TaG93U2FzX2Vtb2ppU2FzX2xhYmVsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoY2FwRmlyc3QoZW1vamlbMV0pKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHNhc0Rpc3BsYXkgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZlcmlmaWNhdGlvblNob3dTYXNfZW1vamlTYXNcIj5cbiAgICAgICAgICAgICAgICB7ZW1vamlCbG9ja3Muc2xpY2UoMCwgNCl9XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9WZXJpZmljYXRpb25TaG93U2FzX2Vtb2ppU2FzX2JyZWFrXCIgLz5cbiAgICAgICAgICAgICAgICB7ZW1vamlCbG9ja3Muc2xpY2UoNCl9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICBzYXNDYXB0aW9uID0gdGhpcy5wcm9wcy5pc1NlbGYgP1xuICAgICAgICAgICAgICAgIF90KFxuICAgICAgICAgICAgICAgICAgICBcIkNvbmZpcm0gdGhlIGVtb2ppIGJlbG93IGFyZSBkaXNwbGF5ZWQgb24gYm90aCBzZXNzaW9ucywgaW4gdGhlIHNhbWUgb3JkZXI6XCIsXG4gICAgICAgICAgICAgICAgKTpcbiAgICAgICAgICAgICAgICBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJWZXJpZnkgdGhpcyB1c2VyIGJ5IGNvbmZpcm1pbmcgdGhlIGZvbGxvd2luZyBlbW9qaSBhcHBlYXIgb24gdGhlaXIgc2NyZWVuLlwiLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5zYXMuZGVjaW1hbCkge1xuICAgICAgICAgICAgY29uc3QgbnVtYmVyQmxvY2tzID0gdGhpcy5wcm9wcy5zYXMuZGVjaW1hbC5tYXAoKG51bSwgaSkgPT4gPHNwYW4ga2V5PXtpfT5cbiAgICAgICAgICAgICAgICB7bnVtfVxuICAgICAgICAgICAgPC9zcGFuPik7XG4gICAgICAgICAgICBzYXNEaXNwbGF5ID0gPGRpdiBjbGFzc05hbWU9XCJteF9WZXJpZmljYXRpb25TaG93U2FzX2RlY2ltYWxTYXNcIj5cbiAgICAgICAgICAgICAgICB7bnVtYmVyQmxvY2tzfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICAgICAgc2FzQ2FwdGlvbiA9IHRoaXMucHJvcHMuaXNTZWxmID9cbiAgICAgICAgICAgICAgICBfdChcbiAgICAgICAgICAgICAgICAgICAgXCJWZXJpZnkgdGhpcyBzZXNzaW9uIGJ5IGNvbmZpcm1pbmcgdGhlIGZvbGxvd2luZyBudW1iZXIgYXBwZWFycyBvbiBpdHMgc2NyZWVuLlwiLFxuICAgICAgICAgICAgICAgICk6XG4gICAgICAgICAgICAgICAgX3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVmVyaWZ5IHRoaXMgdXNlciBieSBjb25maXJtaW5nIHRoZSBmb2xsb3dpbmcgbnVtYmVyIGFwcGVhcnMgb24gdGhlaXIgc2NyZWVuLlwiLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgICAgICB7X3QoXCJVbmFibGUgdG8gZmluZCBhIHN1cHBvcnRlZCB2ZXJpZmljYXRpb24gbWV0aG9kLlwiKX1cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIG9uQ2xpY2s9e3RoaXMucHJvcHMub25DYW5jZWx9IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3dpZGVCdXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAge190KCdDYW5jZWwnKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29uZmlybTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucGVuZGluZyB8fCB0aGlzLnN0YXRlLmNhbmNlbGxpbmcpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucGVuZGluZykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmlzU2VsZikge1xuICAgICAgICAgICAgICAgICAgICAvLyBkZXZpY2Ugc2hvdWxkbid0IGJlIG51bGwgaW4gdGhpcyBzaXR1YXRpb24gYnV0IGl0IGNhbiBiZSwgZWcuIGlmIHRoZSBkZXZpY2UgaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9nZ2VkIG91dCBkdXJpbmcgdmVyaWZpY2F0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmRldmljZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IF90KFwiV2FpdGluZyBmb3IgeW91ciBvdGhlciBzZXNzaW9uLCAlKGRldmljZU5hbWUpcyAoJShkZXZpY2VJZClzKSwgdG8gdmVyaWZ54oCmXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VOYW1lOiB0aGlzLnByb3BzLmRldmljZSA/IHRoaXMucHJvcHMuZGV2aWNlLmdldERpc3BsYXlOYW1lKCkgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VJZDogdGhpcy5wcm9wcy5kZXZpY2UgPyB0aGlzLnByb3BzLmRldmljZS5kZXZpY2VJZCA6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gX3QoXCJXYWl0aW5nIGZvciB5b3VyIG90aGVyIHNlc3Npb24gdG8gdmVyaWZ54oCmXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge2Rpc3BsYXlOYW1lfSA9IHRoaXMucHJvcHM7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBfdChcIldhaXRpbmcgZm9yICUoZGlzcGxheU5hbWUpcyB0byB2ZXJpZnnigKZcIiwge2Rpc3BsYXlOYW1lfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gX3QoXCJDYW5jZWxsaW5n4oCmXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uZmlybSA9IDxQZW5kaW5nQWN0aW9uU3Bpbm5lciB0ZXh0PXt0ZXh0fSAvPjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmluRGlhbG9nKSB7XG4gICAgICAgICAgICAvLyBGSVhNRTogc3RvcCB1c2luZyBEaWFsb2dCdXR0b25zIGhlcmUgb25jZSB0aGlzIGNvbXBvbmVudCBpcyBvbmx5IHVzZWQgaW4gdGhlIHJpZ2h0IHBhbmVsIHZlcmlmaWNhdGlvblxuICAgICAgICAgICAgY29uZmlybSA9IDxEaWFsb2dCdXR0b25zXG4gICAgICAgICAgICAgICAgcHJpbWFyeUJ1dHRvbj17X3QoXCJUaGV5IG1hdGNoXCIpfVxuICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLm9uTWF0Y2hDbGlja31cbiAgICAgICAgICAgICAgICBwcmltYXJ5QnV0dG9uQ2xhc3M9XCJteF9Vc2VySW5mb193aWRlQnV0dG9uIG14X1ZlcmlmaWNhdGlvblNob3dTYXNfbWF0Y2hCdXR0b25cIlxuICAgICAgICAgICAgICAgIGNhbmNlbEJ1dHRvbj17X3QoXCJUaGV5IGRvbid0IG1hdGNoXCIpfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXt0aGlzLm9uRG9udE1hdGNoQ2xpY2t9XG4gICAgICAgICAgICAgICAgY2FuY2VsQnV0dG9uQ2xhc3M9XCJteF9Vc2VySW5mb193aWRlQnV0dG9uIG14X1ZlcmlmaWNhdGlvblNob3dTYXNfbm9NYXRjaEJ1dHRvblwiXG4gICAgICAgICAgICAvPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbmZpcm0gPSA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5vbkRvbnRNYXRjaENsaWNrfSBraW5kPVwiZGFuZ2VyXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJUaGV5IGRvbid0IG1hdGNoXCIpIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5vbk1hdGNoQ2xpY2t9IGtpbmQ9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJUaGV5IG1hdGNoXCIpIH1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50PjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZlcmlmaWNhdGlvblNob3dTYXNcIj5cbiAgICAgICAgICAgIDxwPntzYXNDYXB0aW9ufTwvcD5cbiAgICAgICAgICAgIHtzYXNEaXNwbGF5fVxuICAgICAgICAgICAgPHA+e3RoaXMucHJvcHMuaXNTZWxmID9cbiAgICAgICAgICAgICAgICBcIlwiOlxuICAgICAgICAgICAgICAgIF90KFwiVG8gYmUgc2VjdXJlLCBkbyB0aGlzIGluIHBlcnNvbiBvciB1c2UgYSB0cnVzdGVkIHdheSB0byBjb21tdW5pY2F0ZS5cIil9PC9wPlxuICAgICAgICAgICAge2NvbmZpcm19XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG5cbi8vIExpc3Qgb2YgRW1vamkgc3RyaW5ncyBmcm9tIHRoZSBqcy1zZGssIGZvciBpMThuXG5fdGQoXCJEb2dcIik7XG5fdGQoXCJDYXRcIik7XG5fdGQoXCJMaW9uXCIpO1xuX3RkKFwiSG9yc2VcIik7XG5fdGQoXCJVbmljb3JuXCIpO1xuX3RkKFwiUGlnXCIpO1xuX3RkKFwiRWxlcGhhbnRcIik7XG5fdGQoXCJSYWJiaXRcIik7XG5fdGQoXCJQYW5kYVwiKTtcbl90ZChcIlJvb3N0ZXJcIik7XG5fdGQoXCJQZW5ndWluXCIpO1xuX3RkKFwiVHVydGxlXCIpO1xuX3RkKFwiRmlzaFwiKTtcbl90ZChcIk9jdG9wdXNcIik7XG5fdGQoXCJCdXR0ZXJmbHlcIik7XG5fdGQoXCJGbG93ZXJcIik7XG5fdGQoXCJUcmVlXCIpO1xuX3RkKFwiQ2FjdHVzXCIpO1xuX3RkKFwiTXVzaHJvb21cIik7XG5fdGQoXCJHbG9iZVwiKTtcbl90ZChcIk1vb25cIik7XG5fdGQoXCJDbG91ZFwiKTtcbl90ZChcIkZpcmVcIik7XG5fdGQoXCJCYW5hbmFcIik7XG5fdGQoXCJBcHBsZVwiKTtcbl90ZChcIlN0cmF3YmVycnlcIik7XG5fdGQoXCJDb3JuXCIpO1xuX3RkKFwiUGl6emFcIik7XG5fdGQoXCJDYWtlXCIpO1xuX3RkKFwiSGVhcnRcIik7XG5fdGQoXCJTbWlsZXlcIik7XG5fdGQoXCJSb2JvdFwiKTtcbl90ZChcIkhhdFwiKTtcbl90ZChcIkdsYXNzZXNcIik7XG5fdGQoXCJTcGFubmVyXCIpO1xuX3RkKFwiU2FudGFcIik7XG5fdGQoXCJUaHVtYnMgdXBcIik7XG5fdGQoXCJVbWJyZWxsYVwiKTtcbl90ZChcIkhvdXJnbGFzc1wiKTtcbl90ZChcIkNsb2NrXCIpO1xuX3RkKFwiR2lmdFwiKTtcbl90ZChcIkxpZ2h0IGJ1bGJcIik7XG5fdGQoXCJCb29rXCIpO1xuX3RkKFwiUGVuY2lsXCIpO1xuX3RkKFwiUGFwZXJjbGlwXCIpO1xuX3RkKFwiU2Npc3NvcnNcIik7XG5fdGQoXCJMb2NrXCIpO1xuX3RkKFwiS2V5XCIpO1xuX3RkKFwiSGFtbWVyXCIpO1xuX3RkKFwiVGVsZXBob25lXCIpO1xuX3RkKFwiRmxhZ1wiKTtcbl90ZChcIlRyYWluXCIpO1xuX3RkKFwiQmljeWNsZVwiKTtcbl90ZChcIkFlcm9wbGFuZVwiKTtcbl90ZChcIlJvY2tldFwiKTtcbl90ZChcIlRyb3BoeVwiKTtcbl90ZChcIkJhbGxcIik7XG5fdGQoXCJHdWl0YXJcIik7XG5fdGQoXCJUcnVtcGV0XCIpO1xuX3RkKFwiQmVsbFwiKTtcbl90ZChcIkFuY2hvclwiKTtcbl90ZChcIkhlYWRwaG9uZXNcIik7XG5fdGQoXCJGb2xkZXJcIik7XG5fdGQoXCJQaW5cIik7XG4iXX0=