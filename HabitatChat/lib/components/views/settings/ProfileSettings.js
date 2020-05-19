"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _Field = _interopRequireDefault(require("../elements/Field"));

var _matrixJsSdk = require("matrix-js-sdk");

var _HostingLink = require("../../../utils/HostingLink");

var sdk = _interopRequireWildcard(require("../../../index"));

/*
Copyright 2019 New Vector Ltd

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
class ProfileSettings extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "_uploadAvatar", () => {
      this._avatarUpload.current.click();
    });
    (0, _defineProperty2.default)(this, "_removeAvatar", () => {
      // clear file upload field so same file can be selected
      this._avatarUpload.current.value = "";
      this.setState({
        avatarUrl: undefined,
        avatarFile: undefined,
        enableProfileSave: true
      });
    });
    (0, _defineProperty2.default)(this, "_saveProfile", async e => {
      e.stopPropagation();
      e.preventDefault();
      if (!this.state.enableProfileSave) return;
      this.setState({
        enableProfileSave: false
      });

      const client = _MatrixClientPeg.MatrixClientPeg.get();

      const newState = {}; // TODO: What do we do about errors?

      if (this.state.originalDisplayName !== this.state.displayName) {
        await client.setDisplayName(this.state.displayName);
        newState.originalDisplayName = this.state.displayName;
      }

      if (this.state.avatarFile) {
        const uri = await client.uploadContent(this.state.avatarFile);
        await client.setAvatarUrl(uri);
        newState.avatarUrl = client.mxcUrlToHttp(uri, 96, 96, 'crop', false);
        newState.originalAvatarUrl = newState.avatarUrl;
        newState.avatarFile = null;
      } else if (this.state.originalAvatarUrl !== this.state.avatarUrl) {
        await client.setAvatarUrl(""); // use empty string as Synapse 500s on undefined
      }

      this.setState(newState);
    });
    (0, _defineProperty2.default)(this, "_onDisplayNameChanged", e => {
      this.setState({
        displayName: e.target.value,
        enableProfileSave: true
      });
    });
    (0, _defineProperty2.default)(this, "_onAvatarChanged", e => {
      if (!e.target.files || !e.target.files.length) {
        this.setState({
          avatarUrl: this.state.originalAvatarUrl,
          avatarFile: null,
          enableProfileSave: false
        });
        return;
      }

      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = ev => {
        this.setState({
          avatarUrl: ev.target.result,
          avatarFile: file,
          enableProfileSave: true
        });
      };

      reader.readAsDataURL(file);
    });

    const _client = _MatrixClientPeg.MatrixClientPeg.get();

    let user = _client.getUser(_client.getUserId());

    if (!user) {
      // XXX: We shouldn't have to do this.
      // There seems to be a condition where the User object won't exist until a room
      // exists on the account. To work around this, we'll just create a temporary User
      // and use that.
      console.warn("User object not found - creating one for ProfileSettings");
      user = new _matrixJsSdk.User(_client.getUserId());
    }

    let avatarUrl = user.avatarUrl;
    if (avatarUrl) avatarUrl = _client.mxcUrlToHttp(avatarUrl, 96, 96, 'crop', false);
    this.state = {
      userId: user.userId,
      originalDisplayName: user.displayName,
      displayName: user.displayName,
      originalAvatarUrl: avatarUrl,
      avatarUrl: avatarUrl,
      avatarFile: null,
      enableProfileSave: false
    };
    this._avatarUpload = (0, _react.createRef)();
  }

  render() {
    const hostingSignupLink = (0, _HostingLink.getHostingLink)('user-settings');
    let hostingSignup = null;

    if (hostingSignupLink) {
      hostingSignup = /*#__PURE__*/_react.default.createElement("span", {
        className: "mx_ProfileSettings_hostingSignup"
      }, (0, _languageHandler._t)("<a>Upgrade</a> to your own domain", {}, {
        a: sub => /*#__PURE__*/_react.default.createElement("a", {
          href: hostingSignupLink,
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      }), /*#__PURE__*/_react.default.createElement("a", {
        href: hostingSignupLink,
        target: "_blank",
        rel: "noreferrer noopener"
      }, /*#__PURE__*/_react.default.createElement("img", {
        src: require("../../../../res/img/external-link.svg"),
        width: "11",
        height: "10",
        alt: ""
      })));
    }

    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    const AvatarSetting = sdk.getComponent('settings.AvatarSetting');
    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._saveProfile,
      autoComplete: "off",
      noValidate: true
    }, /*#__PURE__*/_react.default.createElement("input", {
      type: "file",
      ref: this._avatarUpload,
      className: "mx_ProfileSettings_avatarUpload",
      onChange: this._onAvatarChanged,
      accept: "image/*"
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ProfileSettings_profile"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ProfileSettings_controls"
    }, /*#__PURE__*/_react.default.createElement("p", null, this.state.userId, hostingSignup), /*#__PURE__*/_react.default.createElement(_Field.default, {
      label: (0, _languageHandler._t)("Display Name"),
      type: "text",
      value: this.state.displayName,
      autoComplete: "off",
      onChange: this._onDisplayNameChanged
    })), /*#__PURE__*/_react.default.createElement(AvatarSetting, {
      avatarUrl: this.state.avatarUrl,
      avatarName: this.state.displayName || this.state.userId,
      avatarAltText: (0, _languageHandler._t)("Profile picture"),
      uploadAvatar: this._uploadAvatar,
      removeAvatar: this._removeAvatar
    })), /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      onClick: this._saveProfile,
      kind: "primary",
      disabled: !this.state.enableProfileSave
    }, (0, _languageHandler._t)("Save")));
  }

}

exports.default = ProfileSettings;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL1Byb2ZpbGVTZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJQcm9maWxlU2V0dGluZ3MiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiX2F2YXRhclVwbG9hZCIsImN1cnJlbnQiLCJjbGljayIsInZhbHVlIiwic2V0U3RhdGUiLCJhdmF0YXJVcmwiLCJ1bmRlZmluZWQiLCJhdmF0YXJGaWxlIiwiZW5hYmxlUHJvZmlsZVNhdmUiLCJlIiwic3RvcFByb3BhZ2F0aW9uIiwicHJldmVudERlZmF1bHQiLCJzdGF0ZSIsImNsaWVudCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm5ld1N0YXRlIiwib3JpZ2luYWxEaXNwbGF5TmFtZSIsImRpc3BsYXlOYW1lIiwic2V0RGlzcGxheU5hbWUiLCJ1cmkiLCJ1cGxvYWRDb250ZW50Iiwic2V0QXZhdGFyVXJsIiwibXhjVXJsVG9IdHRwIiwib3JpZ2luYWxBdmF0YXJVcmwiLCJ0YXJnZXQiLCJmaWxlcyIsImxlbmd0aCIsImZpbGUiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwib25sb2FkIiwiZXYiLCJyZXN1bHQiLCJyZWFkQXNEYXRhVVJMIiwidXNlciIsImdldFVzZXIiLCJnZXRVc2VySWQiLCJjb25zb2xlIiwid2FybiIsIlVzZXIiLCJ1c2VySWQiLCJyZW5kZXIiLCJob3N0aW5nU2lnbnVwTGluayIsImhvc3RpbmdTaWdudXAiLCJhIiwic3ViIiwicmVxdWlyZSIsIkFjY2Vzc2libGVCdXR0b24iLCJzZGsiLCJnZXRDb21wb25lbnQiLCJBdmF0YXJTZXR0aW5nIiwiX3NhdmVQcm9maWxlIiwiX29uQXZhdGFyQ2hhbmdlZCIsIl9vbkRpc3BsYXlOYW1lQ2hhbmdlZCIsIl91cGxvYWRBdmF0YXIiLCJfcmVtb3ZlQXZhdGFyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7O0FBd0JlLE1BQU1BLGVBQU4sU0FBOEJDLGVBQU1DLFNBQXBDLENBQThDO0FBQ3pEQyxFQUFBQSxXQUFXLEdBQUc7QUFDVjtBQURVLHlEQTRCRSxNQUFNO0FBQ2xCLFdBQUtDLGFBQUwsQ0FBbUJDLE9BQW5CLENBQTJCQyxLQUEzQjtBQUNILEtBOUJhO0FBQUEseURBZ0NFLE1BQU07QUFDbEI7QUFDQSxXQUFLRixhQUFMLENBQW1CQyxPQUFuQixDQUEyQkUsS0FBM0IsR0FBbUMsRUFBbkM7QUFDQSxXQUFLQyxRQUFMLENBQWM7QUFDVkMsUUFBQUEsU0FBUyxFQUFFQyxTQUREO0FBRVZDLFFBQUFBLFVBQVUsRUFBRUQsU0FGRjtBQUdWRSxRQUFBQSxpQkFBaUIsRUFBRTtBQUhULE9BQWQ7QUFLSCxLQXhDYTtBQUFBLHdEQTBDQyxNQUFPQyxDQUFQLElBQWE7QUFDeEJBLE1BQUFBLENBQUMsQ0FBQ0MsZUFBRjtBQUNBRCxNQUFBQSxDQUFDLENBQUNFLGNBQUY7QUFFQSxVQUFJLENBQUMsS0FBS0MsS0FBTCxDQUFXSixpQkFBaEIsRUFBbUM7QUFDbkMsV0FBS0osUUFBTCxDQUFjO0FBQUNJLFFBQUFBLGlCQUFpQixFQUFFO0FBQXBCLE9BQWQ7O0FBRUEsWUFBTUssTUFBTSxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQWY7O0FBQ0EsWUFBTUMsUUFBUSxHQUFHLEVBQWpCLENBUndCLENBVXhCOztBQUVBLFVBQUksS0FBS0osS0FBTCxDQUFXSyxtQkFBWCxLQUFtQyxLQUFLTCxLQUFMLENBQVdNLFdBQWxELEVBQStEO0FBQzNELGNBQU1MLE1BQU0sQ0FBQ00sY0FBUCxDQUFzQixLQUFLUCxLQUFMLENBQVdNLFdBQWpDLENBQU47QUFDQUYsUUFBQUEsUUFBUSxDQUFDQyxtQkFBVCxHQUErQixLQUFLTCxLQUFMLENBQVdNLFdBQTFDO0FBQ0g7O0FBRUQsVUFBSSxLQUFLTixLQUFMLENBQVdMLFVBQWYsRUFBMkI7QUFDdkIsY0FBTWEsR0FBRyxHQUFHLE1BQU1QLE1BQU0sQ0FBQ1EsYUFBUCxDQUFxQixLQUFLVCxLQUFMLENBQVdMLFVBQWhDLENBQWxCO0FBQ0EsY0FBTU0sTUFBTSxDQUFDUyxZQUFQLENBQW9CRixHQUFwQixDQUFOO0FBQ0FKLFFBQUFBLFFBQVEsQ0FBQ1gsU0FBVCxHQUFxQlEsTUFBTSxDQUFDVSxZQUFQLENBQW9CSCxHQUFwQixFQUF5QixFQUF6QixFQUE2QixFQUE3QixFQUFpQyxNQUFqQyxFQUF5QyxLQUF6QyxDQUFyQjtBQUNBSixRQUFBQSxRQUFRLENBQUNRLGlCQUFULEdBQTZCUixRQUFRLENBQUNYLFNBQXRDO0FBQ0FXLFFBQUFBLFFBQVEsQ0FBQ1QsVUFBVCxHQUFzQixJQUF0QjtBQUNILE9BTkQsTUFNTyxJQUFJLEtBQUtLLEtBQUwsQ0FBV1ksaUJBQVgsS0FBaUMsS0FBS1osS0FBTCxDQUFXUCxTQUFoRCxFQUEyRDtBQUM5RCxjQUFNUSxNQUFNLENBQUNTLFlBQVAsQ0FBb0IsRUFBcEIsQ0FBTixDQUQ4RCxDQUMvQjtBQUNsQzs7QUFFRCxXQUFLbEIsUUFBTCxDQUFjWSxRQUFkO0FBQ0gsS0F0RWE7QUFBQSxpRUF3RVdQLENBQUQsSUFBTztBQUMzQixXQUFLTCxRQUFMLENBQWM7QUFDVmMsUUFBQUEsV0FBVyxFQUFFVCxDQUFDLENBQUNnQixNQUFGLENBQVN0QixLQURaO0FBRVZLLFFBQUFBLGlCQUFpQixFQUFFO0FBRlQsT0FBZDtBQUlILEtBN0VhO0FBQUEsNERBK0VNQyxDQUFELElBQU87QUFDdEIsVUFBSSxDQUFDQSxDQUFDLENBQUNnQixNQUFGLENBQVNDLEtBQVYsSUFBbUIsQ0FBQ2pCLENBQUMsQ0FBQ2dCLE1BQUYsQ0FBU0MsS0FBVCxDQUFlQyxNQUF2QyxFQUErQztBQUMzQyxhQUFLdkIsUUFBTCxDQUFjO0FBQ1ZDLFVBQUFBLFNBQVMsRUFBRSxLQUFLTyxLQUFMLENBQVdZLGlCQURaO0FBRVZqQixVQUFBQSxVQUFVLEVBQUUsSUFGRjtBQUdWQyxVQUFBQSxpQkFBaUIsRUFBRTtBQUhULFNBQWQ7QUFLQTtBQUNIOztBQUVELFlBQU1vQixJQUFJLEdBQUduQixDQUFDLENBQUNnQixNQUFGLENBQVNDLEtBQVQsQ0FBZSxDQUFmLENBQWI7QUFDQSxZQUFNRyxNQUFNLEdBQUcsSUFBSUMsVUFBSixFQUFmOztBQUNBRCxNQUFBQSxNQUFNLENBQUNFLE1BQVAsR0FBaUJDLEVBQUQsSUFBUTtBQUNwQixhQUFLNUIsUUFBTCxDQUFjO0FBQ1ZDLFVBQUFBLFNBQVMsRUFBRTJCLEVBQUUsQ0FBQ1AsTUFBSCxDQUFVUSxNQURYO0FBRVYxQixVQUFBQSxVQUFVLEVBQUVxQixJQUZGO0FBR1ZwQixVQUFBQSxpQkFBaUIsRUFBRTtBQUhULFNBQWQ7QUFLSCxPQU5EOztBQU9BcUIsTUFBQUEsTUFBTSxDQUFDSyxhQUFQLENBQXFCTixJQUFyQjtBQUNILEtBbkdhOztBQUdWLFVBQU1mLE9BQU0sR0FBR0MsaUNBQWdCQyxHQUFoQixFQUFmOztBQUNBLFFBQUlvQixJQUFJLEdBQUd0QixPQUFNLENBQUN1QixPQUFQLENBQWV2QixPQUFNLENBQUN3QixTQUFQLEVBQWYsQ0FBWDs7QUFDQSxRQUFJLENBQUNGLElBQUwsRUFBVztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0FHLE1BQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLDBEQUFiO0FBQ0FKLE1BQUFBLElBQUksR0FBRyxJQUFJSyxpQkFBSixDQUFTM0IsT0FBTSxDQUFDd0IsU0FBUCxFQUFULENBQVA7QUFDSDs7QUFDRCxRQUFJaEMsU0FBUyxHQUFHOEIsSUFBSSxDQUFDOUIsU0FBckI7QUFDQSxRQUFJQSxTQUFKLEVBQWVBLFNBQVMsR0FBR1EsT0FBTSxDQUFDVSxZQUFQLENBQW9CbEIsU0FBcEIsRUFBK0IsRUFBL0IsRUFBbUMsRUFBbkMsRUFBdUMsTUFBdkMsRUFBK0MsS0FBL0MsQ0FBWjtBQUNmLFNBQUtPLEtBQUwsR0FBYTtBQUNUNkIsTUFBQUEsTUFBTSxFQUFFTixJQUFJLENBQUNNLE1BREo7QUFFVHhCLE1BQUFBLG1CQUFtQixFQUFFa0IsSUFBSSxDQUFDakIsV0FGakI7QUFHVEEsTUFBQUEsV0FBVyxFQUFFaUIsSUFBSSxDQUFDakIsV0FIVDtBQUlUTSxNQUFBQSxpQkFBaUIsRUFBRW5CLFNBSlY7QUFLVEEsTUFBQUEsU0FBUyxFQUFFQSxTQUxGO0FBTVRFLE1BQUFBLFVBQVUsRUFBRSxJQU5IO0FBT1RDLE1BQUFBLGlCQUFpQixFQUFFO0FBUFYsS0FBYjtBQVVBLFNBQUtSLGFBQUwsR0FBcUIsdUJBQXJCO0FBQ0g7O0FBMkVEMEMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsaUJBQWlCLEdBQUcsaUNBQWUsZUFBZixDQUExQjtBQUNBLFFBQUlDLGFBQWEsR0FBRyxJQUFwQjs7QUFDQSxRQUFJRCxpQkFBSixFQUF1QjtBQUNuQkMsTUFBQUEsYUFBYSxnQkFBRztBQUFNLFFBQUEsU0FBUyxFQUFDO0FBQWhCLFNBQ1gseUJBQ0csbUNBREgsRUFDd0MsRUFEeEMsRUFFRztBQUNJQyxRQUFBQSxDQUFDLEVBQUVDLEdBQUcsaUJBQUk7QUFBRyxVQUFBLElBQUksRUFBRUgsaUJBQVQ7QUFBNEIsVUFBQSxNQUFNLEVBQUMsUUFBbkM7QUFBNEMsVUFBQSxHQUFHLEVBQUM7QUFBaEQsV0FBdUVHLEdBQXZFO0FBRGQsT0FGSCxDQURXLGVBT1o7QUFBRyxRQUFBLElBQUksRUFBRUgsaUJBQVQ7QUFBNEIsUUFBQSxNQUFNLEVBQUMsUUFBbkM7QUFBNEMsUUFBQSxHQUFHLEVBQUM7QUFBaEQsc0JBQ0k7QUFBSyxRQUFBLEdBQUcsRUFBRUksT0FBTyxDQUFDLHVDQUFELENBQWpCO0FBQTRELFFBQUEsS0FBSyxFQUFDLElBQWxFO0FBQXVFLFFBQUEsTUFBTSxFQUFDLElBQTlFO0FBQW1GLFFBQUEsR0FBRyxFQUFDO0FBQXZGLFFBREosQ0FQWSxDQUFoQjtBQVdIOztBQUVELFVBQU1DLGdCQUFnQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBQ0EsVUFBTUMsYUFBYSxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXRCO0FBQ0Esd0JBQ0k7QUFBTSxNQUFBLFFBQVEsRUFBRSxLQUFLRSxZQUFyQjtBQUFtQyxNQUFBLFlBQVksRUFBQyxLQUFoRDtBQUFzRCxNQUFBLFVBQVUsRUFBRTtBQUFsRSxvQkFDSTtBQUFPLE1BQUEsSUFBSSxFQUFDLE1BQVo7QUFBbUIsTUFBQSxHQUFHLEVBQUUsS0FBS3BELGFBQTdCO0FBQTRDLE1BQUEsU0FBUyxFQUFDLGlDQUF0RDtBQUNPLE1BQUEsUUFBUSxFQUFFLEtBQUtxRCxnQkFEdEI7QUFDd0MsTUFBQSxNQUFNLEVBQUM7QUFEL0MsTUFESixlQUdJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDO0FBQWYsb0JBQ0ksd0NBQ0ssS0FBS3pDLEtBQUwsQ0FBVzZCLE1BRGhCLEVBRUtHLGFBRkwsQ0FESixlQUtJLDZCQUFDLGNBQUQ7QUFBTyxNQUFBLEtBQUssRUFBRSx5QkFBRyxjQUFILENBQWQ7QUFDTyxNQUFBLElBQUksRUFBQyxNQURaO0FBQ21CLE1BQUEsS0FBSyxFQUFFLEtBQUtoQyxLQUFMLENBQVdNLFdBRHJDO0FBQ2tELE1BQUEsWUFBWSxFQUFDLEtBRC9EO0FBRU8sTUFBQSxRQUFRLEVBQUUsS0FBS29DO0FBRnRCLE1BTEosQ0FESixlQVVJLDZCQUFDLGFBQUQ7QUFDSSxNQUFBLFNBQVMsRUFBRSxLQUFLMUMsS0FBTCxDQUFXUCxTQUQxQjtBQUVJLE1BQUEsVUFBVSxFQUFFLEtBQUtPLEtBQUwsQ0FBV00sV0FBWCxJQUEwQixLQUFLTixLQUFMLENBQVc2QixNQUZyRDtBQUdJLE1BQUEsYUFBYSxFQUFFLHlCQUFHLGlCQUFILENBSG5CO0FBSUksTUFBQSxZQUFZLEVBQUUsS0FBS2MsYUFKdkI7QUFLSSxNQUFBLFlBQVksRUFBRSxLQUFLQztBQUx2QixNQVZKLENBSEosZUFvQkksNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxPQUFPLEVBQUUsS0FBS0osWUFBaEM7QUFBOEMsTUFBQSxJQUFJLEVBQUMsU0FBbkQ7QUFDa0IsTUFBQSxRQUFRLEVBQUUsQ0FBQyxLQUFLeEMsS0FBTCxDQUFXSjtBQUR4QyxPQUVLLHlCQUFHLE1BQUgsQ0FGTCxDQXBCSixDQURKO0FBMkJIOztBQXBKd0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtjcmVhdGVSZWZ9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7X3R9IGZyb20gXCIuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXJcIjtcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tIFwiLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnXCI7XG5pbXBvcnQgRmllbGQgZnJvbSBcIi4uL2VsZW1lbnRzL0ZpZWxkXCI7XG5pbXBvcnQge1VzZXJ9IGZyb20gXCJtYXRyaXgtanMtc2RrXCI7XG5pbXBvcnQgeyBnZXRIb3N0aW5nTGluayB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL0hvc3RpbmdMaW5rJztcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvZmlsZVNldHRpbmdzIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGxldCB1c2VyID0gY2xpZW50LmdldFVzZXIoY2xpZW50LmdldFVzZXJJZCgpKTtcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICAvLyBYWFg6IFdlIHNob3VsZG4ndCBoYXZlIHRvIGRvIHRoaXMuXG4gICAgICAgICAgICAvLyBUaGVyZSBzZWVtcyB0byBiZSBhIGNvbmRpdGlvbiB3aGVyZSB0aGUgVXNlciBvYmplY3Qgd29uJ3QgZXhpc3QgdW50aWwgYSByb29tXG4gICAgICAgICAgICAvLyBleGlzdHMgb24gdGhlIGFjY291bnQuIFRvIHdvcmsgYXJvdW5kIHRoaXMsIHdlJ2xsIGp1c3QgY3JlYXRlIGEgdGVtcG9yYXJ5IFVzZXJcbiAgICAgICAgICAgIC8vIGFuZCB1c2UgdGhhdC5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVzZXIgb2JqZWN0IG5vdCBmb3VuZCAtIGNyZWF0aW5nIG9uZSBmb3IgUHJvZmlsZVNldHRpbmdzXCIpO1xuICAgICAgICAgICAgdXNlciA9IG5ldyBVc2VyKGNsaWVudC5nZXRVc2VySWQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGF2YXRhclVybCA9IHVzZXIuYXZhdGFyVXJsO1xuICAgICAgICBpZiAoYXZhdGFyVXJsKSBhdmF0YXJVcmwgPSBjbGllbnQubXhjVXJsVG9IdHRwKGF2YXRhclVybCwgOTYsIDk2LCAnY3JvcCcsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHVzZXJJZDogdXNlci51c2VySWQsXG4gICAgICAgICAgICBvcmlnaW5hbERpc3BsYXlOYW1lOiB1c2VyLmRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IHVzZXIuZGlzcGxheU5hbWUsXG4gICAgICAgICAgICBvcmlnaW5hbEF2YXRhclVybDogYXZhdGFyVXJsLFxuICAgICAgICAgICAgYXZhdGFyVXJsOiBhdmF0YXJVcmwsXG4gICAgICAgICAgICBhdmF0YXJGaWxlOiBudWxsLFxuICAgICAgICAgICAgZW5hYmxlUHJvZmlsZVNhdmU6IGZhbHNlLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX2F2YXRhclVwbG9hZCA9IGNyZWF0ZVJlZigpO1xuICAgIH1cblxuICAgIF91cGxvYWRBdmF0YXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX2F2YXRhclVwbG9hZC5jdXJyZW50LmNsaWNrKCk7XG4gICAgfTtcblxuICAgIF9yZW1vdmVBdmF0YXIgPSAoKSA9PiB7XG4gICAgICAgIC8vIGNsZWFyIGZpbGUgdXBsb2FkIGZpZWxkIHNvIHNhbWUgZmlsZSBjYW4gYmUgc2VsZWN0ZWRcbiAgICAgICAgdGhpcy5fYXZhdGFyVXBsb2FkLmN1cnJlbnQudmFsdWUgPSBcIlwiO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGF2YXRhclVybDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgYXZhdGFyRmlsZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZW5hYmxlUHJvZmlsZVNhdmU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfc2F2ZVByb2ZpbGUgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmVuYWJsZVByb2ZpbGVTYXZlKSByZXR1cm47XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2VuYWJsZVByb2ZpbGVTYXZlOiBmYWxzZX0pO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgbmV3U3RhdGUgPSB7fTtcblxuICAgICAgICAvLyBUT0RPOiBXaGF0IGRvIHdlIGRvIGFib3V0IGVycm9ycz9cblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5vcmlnaW5hbERpc3BsYXlOYW1lICE9PSB0aGlzLnN0YXRlLmRpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICBhd2FpdCBjbGllbnQuc2V0RGlzcGxheU5hbWUodGhpcy5zdGF0ZS5kaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICBuZXdTdGF0ZS5vcmlnaW5hbERpc3BsYXlOYW1lID0gdGhpcy5zdGF0ZS5kaXNwbGF5TmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF2YXRhckZpbGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHVyaSA9IGF3YWl0IGNsaWVudC51cGxvYWRDb250ZW50KHRoaXMuc3RhdGUuYXZhdGFyRmlsZSk7XG4gICAgICAgICAgICBhd2FpdCBjbGllbnQuc2V0QXZhdGFyVXJsKHVyaSk7XG4gICAgICAgICAgICBuZXdTdGF0ZS5hdmF0YXJVcmwgPSBjbGllbnQubXhjVXJsVG9IdHRwKHVyaSwgOTYsIDk2LCAnY3JvcCcsIGZhbHNlKTtcbiAgICAgICAgICAgIG5ld1N0YXRlLm9yaWdpbmFsQXZhdGFyVXJsID0gbmV3U3RhdGUuYXZhdGFyVXJsO1xuICAgICAgICAgICAgbmV3U3RhdGUuYXZhdGFyRmlsZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5vcmlnaW5hbEF2YXRhclVybCAhPT0gdGhpcy5zdGF0ZS5hdmF0YXJVcmwpIHtcbiAgICAgICAgICAgIGF3YWl0IGNsaWVudC5zZXRBdmF0YXJVcmwoXCJcIik7IC8vIHVzZSBlbXB0eSBzdHJpbmcgYXMgU3luYXBzZSA1MDBzIG9uIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gICAgfTtcblxuICAgIF9vbkRpc3BsYXlOYW1lQ2hhbmdlZCA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZGlzcGxheU5hbWU6IGUudGFyZ2V0LnZhbHVlLFxuICAgICAgICAgICAgZW5hYmxlUHJvZmlsZVNhdmU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBfb25BdmF0YXJDaGFuZ2VkID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCFlLnRhcmdldC5maWxlcyB8fCAhZS50YXJnZXQuZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IHRoaXMuc3RhdGUub3JpZ2luYWxBdmF0YXJVcmwsXG4gICAgICAgICAgICAgICAgYXZhdGFyRmlsZTogbnVsbCxcbiAgICAgICAgICAgICAgICBlbmFibGVQcm9maWxlU2F2ZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSBlLnRhcmdldC5maWxlc1swXTtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IChldikgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBldi50YXJnZXQucmVzdWx0LFxuICAgICAgICAgICAgICAgIGF2YXRhckZpbGU6IGZpbGUsXG4gICAgICAgICAgICAgICAgZW5hYmxlUHJvZmlsZVNhdmU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfTtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgaG9zdGluZ1NpZ251cExpbmsgPSBnZXRIb3N0aW5nTGluaygndXNlci1zZXR0aW5ncycpO1xuICAgICAgICBsZXQgaG9zdGluZ1NpZ251cCA9IG51bGw7XG4gICAgICAgIGlmIChob3N0aW5nU2lnbnVwTGluaykge1xuICAgICAgICAgICAgaG9zdGluZ1NpZ251cCA9IDxzcGFuIGNsYXNzTmFtZT1cIm14X1Byb2ZpbGVTZXR0aW5nc19ob3N0aW5nU2lnbnVwXCI+XG4gICAgICAgICAgICAgICAge190KFxuICAgICAgICAgICAgICAgICAgICBcIjxhPlVwZ3JhZGU8L2E+IHRvIHlvdXIgb3duIGRvbWFpblwiLCB7fSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgYTogc3ViID0+IDxhIGhyZWY9e2hvc3RpbmdTaWdudXBMaW5rfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCI+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPGEgaHJlZj17aG9zdGluZ1NpZ251cExpbmt9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi8uLi9yZXMvaW1nL2V4dGVybmFsLWxpbmsuc3ZnXCIpfSB3aWR0aD1cIjExXCIgaGVpZ2h0PVwiMTBcIiBhbHQ9JycgLz5cbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICA8L3NwYW4+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgQWNjZXNzaWJsZUJ1dHRvbiA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLkFjY2Vzc2libGVCdXR0b24nKTtcbiAgICAgICAgY29uc3QgQXZhdGFyU2V0dGluZyA9IHNkay5nZXRDb21wb25lbnQoJ3NldHRpbmdzLkF2YXRhclNldHRpbmcnKTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXt0aGlzLl9zYXZlUHJvZmlsZX0gYXV0b0NvbXBsZXRlPVwib2ZmXCIgbm9WYWxpZGF0ZT17dHJ1ZX0+XG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJmaWxlXCIgcmVmPXt0aGlzLl9hdmF0YXJVcGxvYWR9IGNsYXNzTmFtZT1cIm14X1Byb2ZpbGVTZXR0aW5nc19hdmF0YXJVcGxvYWRcIlxuICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5fb25BdmF0YXJDaGFuZ2VkfSBhY2NlcHQ9XCJpbWFnZS8qXCIgLz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Byb2ZpbGVTZXR0aW5nc19wcm9maWxlXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUHJvZmlsZVNldHRpbmdzX2NvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS51c2VySWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2hvc3RpbmdTaWdudXB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RmllbGQgbGFiZWw9e190KFwiRGlzcGxheSBOYW1lXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9e3RoaXMuc3RhdGUuZGlzcGxheU5hbWV9IGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uRGlzcGxheU5hbWVDaGFuZ2VkfSAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPEF2YXRhclNldHRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YXRhclVybD17dGhpcy5zdGF0ZS5hdmF0YXJVcmx9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJOYW1lPXt0aGlzLnN0YXRlLmRpc3BsYXlOYW1lIHx8IHRoaXMuc3RhdGUudXNlcklkfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyQWx0VGV4dD17X3QoXCJQcm9maWxlIHBpY3R1cmVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRBdmF0YXI9e3RoaXMuX3VwbG9hZEF2YXRhcn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUF2YXRhcj17dGhpcy5fcmVtb3ZlQXZhdGFyfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxBY2Nlc3NpYmxlQnV0dG9uIG9uQ2xpY2s9e3RoaXMuX3NhdmVQcm9maWxlfSBraW5kPVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyF0aGlzLnN0YXRlLmVuYWJsZVByb2ZpbGVTYXZlfT5cbiAgICAgICAgICAgICAgICAgICAge190KFwiU2F2ZVwiKX1cbiAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19