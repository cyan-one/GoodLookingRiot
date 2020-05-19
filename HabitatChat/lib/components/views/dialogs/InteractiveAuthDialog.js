"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _InteractiveAuth = require("../../structures/InteractiveAuth");

var _InteractiveAuthEntryComponents = require("../auth/InteractiveAuthEntryComponents");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'InteractiveAuthDialog',
  propTypes: {
    // matrix client to use for UI auth requests
    matrixClient: _propTypes.default.object.isRequired,
    // response from initial request. If not supplied, will do a request on
    // mount.
    authData: _propTypes.default.shape({
      flows: _propTypes.default.array,
      params: _propTypes.default.object,
      session: _propTypes.default.string
    }),
    // callback
    makeRequest: _propTypes.default.func.isRequired,
    onFinished: _propTypes.default.func.isRequired,
    // Optional title and body to show when not showing a particular stage
    title: _propTypes.default.string,
    body: _propTypes.default.string,
    // Optional title and body pairs for particular stages and phases within
    // those stages. Object structure/example is:
    // {
    //     "org.example.stage_type": {
    //         1: {
    //             "body": "This is a body for phase 1" of org.example.stage_type,
    //             "title": "Title for phase 1 of org.example.stage_type"
    //         },
    //         2: {
    //             "body": "This is a body for phase 2 of org.example.stage_type",
    //             "title": "Title for phase 2 of org.example.stage_type"
    //             "continueText": "Confirm identity with Example Auth",
    //             "continueKind": "danger"
    //         }
    //     }
    // }
    //
    // Default is defined in _getDefaultDialogAesthetics()
    aestheticsForStagePhases: _propTypes.default.object
  },
  getInitialState: function () {
    return {
      authError: null,
      // See _onUpdateStagePhase()
      uiaStage: null,
      uiaStagePhase: null
    };
  },
  _getDefaultDialogAesthetics: function () {
    const ssoAesthetics = {
      [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
        title: (0, _languageHandler._t)("Use Single Sign On to continue"),
        body: (0, _languageHandler._t)("To continue, use Single Sign On to prove your identity."),
        continueText: (0, _languageHandler._t)("Single Sign On"),
        continueKind: "primary"
      },
      [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
        title: (0, _languageHandler._t)("Confirm to continue"),
        body: (0, _languageHandler._t)("Click the button below to confirm your identity."),
        continueText: (0, _languageHandler._t)("Confirm"),
        continueKind: "primary"
      }
    };
    return {
      [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: ssoAesthetics,
      [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: ssoAesthetics
    };
  },
  _onAuthFinished: function (success, result) {
    if (success) {
      this.props.onFinished(true, result);
    } else {
      if (result === _InteractiveAuth.ERROR_USER_CANCELLED) {
        this.props.onFinished(false, null);
      } else {
        this.setState({
          authError: result
        });
      }
    }
  },
  _onUpdateStagePhase: function (newStage, newPhase) {
    // We copy the stage and stage phase params into state for title selection in render()
    this.setState({
      uiaStage: newStage,
      uiaStagePhase: newPhase
    });
  },
  _onDismissClick: function () {
    this.props.onFinished(false);
  },
  render: function () {
    const InteractiveAuth = sdk.getComponent("structures.InteractiveAuth");
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog'); // Let's pick a title, body, and other params text that we'll show to the user. The order
    // is most specific first, so stagePhase > our props > defaults.

    let title = this.state.authError ? 'Error' : this.props.title || (0, _languageHandler._t)('Authentication');
    let body = this.state.authError ? null : this.props.body;
    let continueText = null;
    let continueKind = null;

    const dialogAesthetics = this.props.aestheticsForStagePhases || this._getDefaultDialogAesthetics();

    if (!this.state.authError && dialogAesthetics) {
      if (dialogAesthetics[this.state.uiaStage]) {
        const aesthetics = dialogAesthetics[this.state.uiaStage][this.state.uiaStagePhase];
        if (aesthetics && aesthetics.title) title = aesthetics.title;
        if (aesthetics && aesthetics.body) body = aesthetics.body;
        if (aesthetics && aesthetics.continueText) continueText = aesthetics.continueText;
        if (aesthetics && aesthetics.continueKind) continueKind = aesthetics.continueKind;
      }
    }

    let content;

    if (this.state.authError) {
      content = /*#__PURE__*/_react.default.createElement("div", {
        id: "mx_Dialog_content"
      }, /*#__PURE__*/_react.default.createElement("div", {
        role: "alert"
      }, this.state.authError.message || this.state.authError.toString()), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onDismissClick,
        className: "mx_GeneralButton",
        autoFocus: "true"
      }, (0, _languageHandler._t)("Dismiss")));
    } else {
      content = /*#__PURE__*/_react.default.createElement("div", {
        id: "mx_Dialog_content"
      }, body, /*#__PURE__*/_react.default.createElement(InteractiveAuth, {
        ref: this._collectInteractiveAuth,
        matrixClient: this.props.matrixClient,
        authData: this.props.authData,
        makeRequest: this.props.makeRequest,
        onAuthFinished: this._onAuthFinished,
        onStagePhaseChange: this._onUpdateStagePhase,
        continueText: continueText,
        continueKind: continueKind
      }));
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_InteractiveAuthDialog",
      onFinished: this.props.onFinished,
      title: title,
      contentId: "mx_Dialog_content"
    }, content);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvSW50ZXJhY3RpdmVBdXRoRGlhbG9nLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwibWF0cml4Q2xpZW50IiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImF1dGhEYXRhIiwic2hhcGUiLCJmbG93cyIsImFycmF5IiwicGFyYW1zIiwic2Vzc2lvbiIsInN0cmluZyIsIm1ha2VSZXF1ZXN0IiwiZnVuYyIsIm9uRmluaXNoZWQiLCJ0aXRsZSIsImJvZHkiLCJhZXN0aGV0aWNzRm9yU3RhZ2VQaGFzZXMiLCJnZXRJbml0aWFsU3RhdGUiLCJhdXRoRXJyb3IiLCJ1aWFTdGFnZSIsInVpYVN0YWdlUGhhc2UiLCJfZ2V0RGVmYXVsdERpYWxvZ0Flc3RoZXRpY3MiLCJzc29BZXN0aGV0aWNzIiwiU1NPQXV0aEVudHJ5IiwiUEhBU0VfUFJFQVVUSCIsImNvbnRpbnVlVGV4dCIsImNvbnRpbnVlS2luZCIsIlBIQVNFX1BPU1RBVVRIIiwiTE9HSU5fVFlQRSIsIlVOU1RBQkxFX0xPR0lOX1RZUEUiLCJfb25BdXRoRmluaXNoZWQiLCJzdWNjZXNzIiwicmVzdWx0IiwicHJvcHMiLCJFUlJPUl9VU0VSX0NBTkNFTExFRCIsInNldFN0YXRlIiwiX29uVXBkYXRlU3RhZ2VQaGFzZSIsIm5ld1N0YWdlIiwibmV3UGhhc2UiLCJfb25EaXNtaXNzQ2xpY2siLCJyZW5kZXIiLCJJbnRlcmFjdGl2ZUF1dGgiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJCYXNlRGlhbG9nIiwic3RhdGUiLCJkaWFsb2dBZXN0aGV0aWNzIiwiYWVzdGhldGljcyIsImNvbnRlbnQiLCJtZXNzYWdlIiwidG9TdHJpbmciLCJfY29sbGVjdEludGVyYWN0aXZlQXV0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FB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bUJBTjdCO0FBT0ksUUFBQSxZQUFZLEVBQUVYLFlBUGxCO0FBUUksUUFBQSxZQUFZLEVBQUVDO0FBUmxCLFFBRkosQ0FESjtBQWVIOztBQUVELHdCQUNJLDZCQUFDLFVBQUQ7QUFBWSxNQUFBLFNBQVMsRUFBQywwQkFBdEI7QUFDSSxNQUFBLFVBQVUsRUFBRSxLQUFLTyxLQUFMLENBQVdwQixVQUQzQjtBQUVJLE1BQUEsS0FBSyxFQUFFQyxLQUZYO0FBR0ksTUFBQSxTQUFTLEVBQUM7QUFIZCxPQUtNa0MsT0FMTixDQURKO0FBU0g7QUFuSzJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IFZlY3RvciBDcmVhdGlvbnMgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcblxuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSAnLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvbic7XG5pbXBvcnQge0VSUk9SX1VTRVJfQ0FOQ0VMTEVEfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9JbnRlcmFjdGl2ZUF1dGhcIjtcbmltcG9ydCB7U1NPQXV0aEVudHJ5fSBmcm9tIFwiLi4vYXV0aC9JbnRlcmFjdGl2ZUF1dGhFbnRyeUNvbXBvbmVudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdJbnRlcmFjdGl2ZUF1dGhEaWFsb2cnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIC8vIG1hdHJpeCBjbGllbnQgdG8gdXNlIGZvciBVSSBhdXRoIHJlcXVlc3RzXG4gICAgICAgIG1hdHJpeENsaWVudDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIHJlc3BvbnNlIGZyb20gaW5pdGlhbCByZXF1ZXN0LiBJZiBub3Qgc3VwcGxpZWQsIHdpbGwgZG8gYSByZXF1ZXN0IG9uXG4gICAgICAgIC8vIG1vdW50LlxuICAgICAgICBhdXRoRGF0YTogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgICAgICAgIGZsb3dzOiBQcm9wVHlwZXMuYXJyYXksXG4gICAgICAgICAgICBwYXJhbXM6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgICAgICAgICBzZXNzaW9uOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICB9KSxcblxuICAgICAgICAvLyBjYWxsYmFja1xuICAgICAgICBtYWtlUmVxdWVzdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcblxuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuXG4gICAgICAgIC8vIE9wdGlvbmFsIHRpdGxlIGFuZCBib2R5IHRvIHNob3cgd2hlbiBub3Qgc2hvd2luZyBhIHBhcnRpY3VsYXIgc3RhZ2VcbiAgICAgICAgdGl0bGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGJvZHk6IFByb3BUeXBlcy5zdHJpbmcsXG5cbiAgICAgICAgLy8gT3B0aW9uYWwgdGl0bGUgYW5kIGJvZHkgcGFpcnMgZm9yIHBhcnRpY3VsYXIgc3RhZ2VzIGFuZCBwaGFzZXMgd2l0aGluXG4gICAgICAgIC8vIHRob3NlIHN0YWdlcy4gT2JqZWN0IHN0cnVjdHVyZS9leGFtcGxlIGlzOlxuICAgICAgICAvLyB7XG4gICAgICAgIC8vICAgICBcIm9yZy5leGFtcGxlLnN0YWdlX3R5cGVcIjoge1xuICAgICAgICAvLyAgICAgICAgIDE6IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgXCJib2R5XCI6IFwiVGhpcyBpcyBhIGJvZHkgZm9yIHBoYXNlIDFcIiBvZiBvcmcuZXhhbXBsZS5zdGFnZV90eXBlLFxuICAgICAgICAvLyAgICAgICAgICAgICBcInRpdGxlXCI6IFwiVGl0bGUgZm9yIHBoYXNlIDEgb2Ygb3JnLmV4YW1wbGUuc3RhZ2VfdHlwZVwiXG4gICAgICAgIC8vICAgICAgICAgfSxcbiAgICAgICAgLy8gICAgICAgICAyOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIFwiYm9keVwiOiBcIlRoaXMgaXMgYSBib2R5IGZvciBwaGFzZSAyIG9mIG9yZy5leGFtcGxlLnN0YWdlX3R5cGVcIixcbiAgICAgICAgLy8gICAgICAgICAgICAgXCJ0aXRsZVwiOiBcIlRpdGxlIGZvciBwaGFzZSAyIG9mIG9yZy5leGFtcGxlLnN0YWdlX3R5cGVcIlxuICAgICAgICAvLyAgICAgICAgICAgICBcImNvbnRpbnVlVGV4dFwiOiBcIkNvbmZpcm0gaWRlbnRpdHkgd2l0aCBFeGFtcGxlIEF1dGhcIixcbiAgICAgICAgLy8gICAgICAgICAgICAgXCJjb250aW51ZUtpbmRcIjogXCJkYW5nZXJcIlxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvL1xuICAgICAgICAvLyBEZWZhdWx0IGlzIGRlZmluZWQgaW4gX2dldERlZmF1bHREaWFsb2dBZXN0aGV0aWNzKClcbiAgICAgICAgYWVzdGhldGljc0ZvclN0YWdlUGhhc2VzOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYXV0aEVycm9yOiBudWxsLFxuXG4gICAgICAgICAgICAvLyBTZWUgX29uVXBkYXRlU3RhZ2VQaGFzZSgpXG4gICAgICAgICAgICB1aWFTdGFnZTogbnVsbCxcbiAgICAgICAgICAgIHVpYVN0YWdlUGhhc2U6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIF9nZXREZWZhdWx0RGlhbG9nQWVzdGhldGljczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHNzb0Flc3RoZXRpY3MgPSB7XG4gICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVXNlIFNpbmdsZSBTaWduIE9uIHRvIGNvbnRpbnVlXCIpLFxuICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiVG8gY29udGludWUsIHVzZSBTaW5nbGUgU2lnbiBPbiB0byBwcm92ZSB5b3VyIGlkZW50aXR5LlwiKSxcbiAgICAgICAgICAgICAgICBjb250aW51ZVRleHQ6IF90KFwiU2luZ2xlIFNpZ24gT25cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcInByaW1hcnlcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BPU1RBVVRIXToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIkNvbmZpcm0gdG8gY29udGludWVcIiksXG4gICAgICAgICAgICAgICAgYm9keTogX3QoXCJDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIGNvbmZpcm0geW91ciBpZGVudGl0eS5cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIkNvbmZpcm1cIiksXG4gICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcInByaW1hcnlcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFtTU09BdXRoRW50cnkuTE9HSU5fVFlQRV06IHNzb0Flc3RoZXRpY3MsXG4gICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlVOU1RBQkxFX0xPR0lOX1RZUEVdOiBzc29BZXN0aGV0aWNzLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBfb25BdXRoRmluaXNoZWQ6IGZ1bmN0aW9uKHN1Y2Nlc3MsIHJlc3VsdCkge1xuICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKHRydWUsIHJlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSBFUlJPUl9VU0VSX0NBTkNFTExFRCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSwgbnVsbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICBhdXRoRXJyb3I6IHJlc3VsdCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25VcGRhdGVTdGFnZVBoYXNlOiBmdW5jdGlvbihuZXdTdGFnZSwgbmV3UGhhc2UpIHtcbiAgICAgICAgLy8gV2UgY29weSB0aGUgc3RhZ2UgYW5kIHN0YWdlIHBoYXNlIHBhcmFtcyBpbnRvIHN0YXRlIGZvciB0aXRsZSBzZWxlY3Rpb24gaW4gcmVuZGVyKClcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dWlhU3RhZ2U6IG5ld1N0YWdlLCB1aWFTdGFnZVBoYXNlOiBuZXdQaGFzZX0pO1xuICAgIH0sXG5cbiAgICBfb25EaXNtaXNzQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBJbnRlcmFjdGl2ZUF1dGggPSBzZGsuZ2V0Q29tcG9uZW50KFwic3RydWN0dXJlcy5JbnRlcmFjdGl2ZUF1dGhcIik7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcblxuICAgICAgICAvLyBMZXQncyBwaWNrIGEgdGl0bGUsIGJvZHksIGFuZCBvdGhlciBwYXJhbXMgdGV4dCB0aGF0IHdlJ2xsIHNob3cgdG8gdGhlIHVzZXIuIFRoZSBvcmRlclxuICAgICAgICAvLyBpcyBtb3N0IHNwZWNpZmljIGZpcnN0LCBzbyBzdGFnZVBoYXNlID4gb3VyIHByb3BzID4gZGVmYXVsdHMuXG5cbiAgICAgICAgbGV0IHRpdGxlID0gdGhpcy5zdGF0ZS5hdXRoRXJyb3IgPyAnRXJyb3InIDogKHRoaXMucHJvcHMudGl0bGUgfHwgX3QoJ0F1dGhlbnRpY2F0aW9uJykpO1xuICAgICAgICBsZXQgYm9keSA9IHRoaXMuc3RhdGUuYXV0aEVycm9yID8gbnVsbCA6IHRoaXMucHJvcHMuYm9keTtcbiAgICAgICAgbGV0IGNvbnRpbnVlVGV4dCA9IG51bGw7XG4gICAgICAgIGxldCBjb250aW51ZUtpbmQgPSBudWxsO1xuICAgICAgICBjb25zdCBkaWFsb2dBZXN0aGV0aWNzID0gdGhpcy5wcm9wcy5hZXN0aGV0aWNzRm9yU3RhZ2VQaGFzZXMgfHwgdGhpcy5fZ2V0RGVmYXVsdERpYWxvZ0Flc3RoZXRpY3MoKTtcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmF1dGhFcnJvciAmJiBkaWFsb2dBZXN0aGV0aWNzKSB7XG4gICAgICAgICAgICBpZiAoZGlhbG9nQWVzdGhldGljc1t0aGlzLnN0YXRlLnVpYVN0YWdlXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFlc3RoZXRpY3MgPSBkaWFsb2dBZXN0aGV0aWNzW3RoaXMuc3RhdGUudWlhU3RhZ2VdW3RoaXMuc3RhdGUudWlhU3RhZ2VQaGFzZV07XG4gICAgICAgICAgICAgICAgaWYgKGFlc3RoZXRpY3MgJiYgYWVzdGhldGljcy50aXRsZSkgdGl0bGUgPSBhZXN0aGV0aWNzLnRpdGxlO1xuICAgICAgICAgICAgICAgIGlmIChhZXN0aGV0aWNzICYmIGFlc3RoZXRpY3MuYm9keSkgYm9keSA9IGFlc3RoZXRpY3MuYm9keTtcbiAgICAgICAgICAgICAgICBpZiAoYWVzdGhldGljcyAmJiBhZXN0aGV0aWNzLmNvbnRpbnVlVGV4dCkgY29udGludWVUZXh0ID0gYWVzdGhldGljcy5jb250aW51ZVRleHQ7XG4gICAgICAgICAgICAgICAgaWYgKGFlc3RoZXRpY3MgJiYgYWVzdGhldGljcy5jb250aW51ZUtpbmQpIGNvbnRpbnVlS2luZCA9IGFlc3RoZXRpY3MuY29udGludWVLaW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvbnRlbnQ7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmF1dGhFcnJvcikge1xuICAgICAgICAgICAgY29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGlkPSdteF9EaWFsb2dfY29udGVudCc+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgcm9sZT1cImFsZXJ0XCI+eyB0aGlzLnN0YXRlLmF1dGhFcnJvci5tZXNzYWdlIHx8IHRoaXMuc3RhdGUuYXV0aEVycm9yLnRvU3RyaW5nKCkgfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24gb25DbGljaz17dGhpcy5fb25EaXNtaXNzQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9HZW5lcmFsQnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9Gb2N1cz1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KFwiRGlzbWlzc1wiKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50ID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9J214X0RpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAge2JvZHl9XG4gICAgICAgICAgICAgICAgICAgIDxJbnRlcmFjdGl2ZUF1dGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZj17dGhpcy5fY29sbGVjdEludGVyYWN0aXZlQXV0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudD17dGhpcy5wcm9wcy5tYXRyaXhDbGllbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRoRGF0YT17dGhpcy5wcm9wcy5hdXRoRGF0YX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VSZXF1ZXN0PXt0aGlzLnByb3BzLm1ha2VSZXF1ZXN0fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25BdXRoRmluaXNoZWQ9e3RoaXMuX29uQXV0aEZpbmlzaGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25TdGFnZVBoYXNlQ2hhbmdlPXt0aGlzLl9vblVwZGF0ZVN0YWdlUGhhc2V9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVRleHQ9e2NvbnRpbnVlVGV4dH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlS2luZD17Y29udGludWVLaW5kfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9XCJteF9JbnRlcmFjdGl2ZUF1dGhEaWFsb2dcIlxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH1cbiAgICAgICAgICAgICAgICB0aXRsZT17dGl0bGV9XG4gICAgICAgICAgICAgICAgY29udGVudElkPSdteF9EaWFsb2dfY29udGVudCdcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IGNvbnRlbnQgfVxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==