"use strict";

var _interopRequireWildcard3 = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _interopRequireWildcard2 = _interopRequireDefault(require("@babel/runtime/helpers/interopRequireWildcard"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var sdk = _interopRequireWildcard3(require("../../../index"));

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

/*
Copyright 2018, 2019 New Vector Ltd
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
class LogoutDialog extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "defaultProps", {
      onFinished: function () {}
    });
    this._onSettingsLinkClick = this._onSettingsLinkClick.bind(this);
    this._onExportE2eKeysClicked = this._onExportE2eKeysClicked.bind(this);
    this._onFinished = this._onFinished.bind(this);
    this._onSetRecoveryMethodClick = this._onSetRecoveryMethodClick.bind(this);
    this._onLogoutConfirm = this._onLogoutConfirm.bind(this);

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const shouldLoadBackupStatus = cli.isCryptoEnabled() && !cli.getKeyBackupEnabled();
    this.state = {
      shouldLoadBackupStatus: shouldLoadBackupStatus,
      loading: shouldLoadBackupStatus,
      backupInfo: null,
      error: null
    };

    if (shouldLoadBackupStatus) {
      this._loadBackupStatus();
    }
  }

  async _loadBackupStatus() {
    try {
      const backupInfo = await _MatrixClientPeg.MatrixClientPeg.get().getKeyBackupVersion();
      this.setState({
        loading: false,
        backupInfo
      });
    } catch (e) {
      console.log("Unable to fetch key backup status", e);
      this.setState({
        loading: false,
        error: e
      });
    }
  }

  _onSettingsLinkClick() {
    // close dialog
    this.props.onFinished();
  }

  _onExportE2eKeysClicked() {
    _Modal.default.createTrackedDialogAsync('Export E2E Keys', '', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../async-components/views/dialogs/ExportE2eKeysDialog'))), {
      matrixClient: _MatrixClientPeg.MatrixClientPeg.get()
    });
  }

  _onFinished(confirmed) {
    if (confirmed) {
      _dispatcher.default.dispatch({
        action: 'logout'
      });
    } // close dialog


    this.props.onFinished();
  }

  _onSetRecoveryMethodClick() {
    if (this.state.backupInfo) {
      // A key backup exists for this account, but the creating device is not
      // verified, so restore the backup which will give us the keys from it and
      // allow us to trust it (ie. upload keys to it)
      const RestoreKeyBackupDialog = sdk.getComponent('dialogs.keybackup.RestoreKeyBackupDialog');

      _Modal.default.createTrackedDialog('Restore Backup', '', RestoreKeyBackupDialog, null, null,
      /* priority = */
      false,
      /* static = */
      true);
    } else {
      _Modal.default.createTrackedDialogAsync("Key Backup", "Key Backup", Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require("../../../async-components/views/dialogs/keybackup/CreateKeyBackupDialog"))), null, null,
      /* priority = */
      false,
      /* static = */
      true);
    } // close dialog


    this.props.onFinished();
  }

  _onLogoutConfirm() {
    _dispatcher.default.dispatch({
      action: 'logout'
    }); // close dialog


    this.props.onFinished();
  }

  render() {
    if (this.state.shouldLoadBackupStatus) {
      const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');

      const description = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Encrypted messages are secured with end-to-end encryption. " + "Only you and the recipient(s) have the keys to read these messages.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Back up your keys before signing out to avoid losing them.")));

      let dialogContent;

      if (this.state.loading) {
        const Spinner = sdk.getComponent('views.elements.Spinner');
        dialogContent = /*#__PURE__*/_react.default.createElement(Spinner, null);
      } else {
        const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
        let setupButtonCaption;

        if (this.state.backupInfo) {
          setupButtonCaption = (0, _languageHandler._t)("Connect this session to Key Backup");
        } else {
          // if there's an error fetching the backup info, we'll just assume there's
          // no backup for the purpose of the button caption
          setupButtonCaption = (0, _languageHandler._t)("Start using Key Backup");
        }

        dialogContent = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_Dialog_content",
          id: "mx_Dialog_content"
        }, description), /*#__PURE__*/_react.default.createElement(DialogButtons, {
          primaryButton: setupButtonCaption,
          hasCancel: false,
          onPrimaryButtonClick: this._onSetRecoveryMethodClick,
          focus: true
        }, /*#__PURE__*/_react.default.createElement("button", {
          onClick: this._onLogoutConfirm
        }, (0, _languageHandler._t)("I don't want my encrypted messages"))), /*#__PURE__*/_react.default.createElement("details", null, /*#__PURE__*/_react.default.createElement("summary", null, (0, _languageHandler._t)("Advanced")), /*#__PURE__*/_react.default.createElement("p", null, /*#__PURE__*/_react.default.createElement("button", {
          onClick: this._onExportE2eKeysClicked
        }, (0, _languageHandler._t)("Manually export keys")))));
      } // Not quite a standard question dialog as the primary button cancels
      // the action and does something else instead, whilst non-default button
      // confirms the action.


      return /*#__PURE__*/_react.default.createElement(BaseDialog, {
        title: (0, _languageHandler._t)("You'll lose access to your encrypted messages"),
        contentId: "mx_Dialog_content",
        hasCancel: true,
        onFinished: this._onFinished
      }, dialogContent);
    } else {
      const QuestionDialog = sdk.getComponent('views.dialogs.QuestionDialog');
      return /*#__PURE__*/_react.default.createElement(QuestionDialog, {
        hasCancelButton: true,
        title: (0, _languageHandler._t)("Sign out"),
        description: (0, _languageHandler._t)("Are you sure you want to sign out?"),
        button: (0, _languageHandler._t)("Sign out"),
        onFinished: this._onFinished
      });
    }
  }

}

exports.default = LogoutDialog;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvTG9nb3V0RGlhbG9nLmpzIl0sIm5hbWVzIjpbIkxvZ291dERpYWxvZyIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJvbkZpbmlzaGVkIiwiX29uU2V0dGluZ3NMaW5rQ2xpY2siLCJiaW5kIiwiX29uRXhwb3J0RTJlS2V5c0NsaWNrZWQiLCJfb25GaW5pc2hlZCIsIl9vblNldFJlY292ZXJ5TWV0aG9kQ2xpY2siLCJfb25Mb2dvdXRDb25maXJtIiwiY2xpIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0Iiwic2hvdWxkTG9hZEJhY2t1cFN0YXR1cyIsImlzQ3J5cHRvRW5hYmxlZCIsImdldEtleUJhY2t1cEVuYWJsZWQiLCJzdGF0ZSIsImxvYWRpbmciLCJiYWNrdXBJbmZvIiwiZXJyb3IiLCJfbG9hZEJhY2t1cFN0YXR1cyIsImdldEtleUJhY2t1cFZlcnNpb24iLCJzZXRTdGF0ZSIsImUiLCJjb25zb2xlIiwibG9nIiwicHJvcHMiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2dBc3luYyIsIm1hdHJpeENsaWVudCIsImNvbmZpcm1lZCIsImRpcyIsImRpc3BhdGNoIiwiYWN0aW9uIiwiUmVzdG9yZUtleUJhY2t1cERpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJyZW5kZXIiLCJCYXNlRGlhbG9nIiwiZGVzY3JpcHRpb24iLCJkaWFsb2dDb250ZW50IiwiU3Bpbm5lciIsIkRpYWxvZ0J1dHRvbnMiLCJzZXR1cEJ1dHRvbkNhcHRpb24iLCJRdWVzdGlvbkRpYWxvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXRCQTs7Ozs7Ozs7Ozs7Ozs7OztBQXdCZSxNQUFNQSxZQUFOLFNBQTJCQyxlQUFNQyxTQUFqQyxDQUEyQztBQUt0REMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSx3REFKQztBQUNYQyxNQUFBQSxVQUFVLEVBQUUsWUFBVyxDQUFFO0FBRGQsS0FJRDtBQUVWLFNBQUtDLG9CQUFMLEdBQTRCLEtBQUtBLG9CQUFMLENBQTBCQyxJQUExQixDQUErQixJQUEvQixDQUE1QjtBQUNBLFNBQUtDLHVCQUFMLEdBQStCLEtBQUtBLHVCQUFMLENBQTZCRCxJQUE3QixDQUFrQyxJQUFsQyxDQUEvQjtBQUNBLFNBQUtFLFdBQUwsR0FBbUIsS0FBS0EsV0FBTCxDQUFpQkYsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBbkI7QUFDQSxTQUFLRyx5QkFBTCxHQUFpQyxLQUFLQSx5QkFBTCxDQUErQkgsSUFBL0IsQ0FBb0MsSUFBcEMsQ0FBakM7QUFDQSxTQUFLSSxnQkFBTCxHQUF3QixLQUFLQSxnQkFBTCxDQUFzQkosSUFBdEIsQ0FBMkIsSUFBM0IsQ0FBeEI7O0FBRUEsVUFBTUssR0FBRyxHQUFHQyxpQ0FBZ0JDLEdBQWhCLEVBQVo7O0FBQ0EsVUFBTUMsc0JBQXNCLEdBQUdILEdBQUcsQ0FBQ0ksZUFBSixNQUF5QixDQUFDSixHQUFHLENBQUNLLG1CQUFKLEVBQXpEO0FBRUEsU0FBS0MsS0FBTCxHQUFhO0FBQ1RILE1BQUFBLHNCQUFzQixFQUFFQSxzQkFEZjtBQUVUSSxNQUFBQSxPQUFPLEVBQUVKLHNCQUZBO0FBR1RLLE1BQUFBLFVBQVUsRUFBRSxJQUhIO0FBSVRDLE1BQUFBLEtBQUssRUFBRTtBQUpFLEtBQWI7O0FBT0EsUUFBSU4sc0JBQUosRUFBNEI7QUFDeEIsV0FBS08saUJBQUw7QUFDSDtBQUNKOztBQUVELFFBQU1BLGlCQUFOLEdBQTBCO0FBQ3RCLFFBQUk7QUFDQSxZQUFNRixVQUFVLEdBQUcsTUFBTVAsaUNBQWdCQyxHQUFoQixHQUFzQlMsbUJBQXRCLEVBQXpCO0FBQ0EsV0FBS0MsUUFBTCxDQUFjO0FBQ1ZMLFFBQUFBLE9BQU8sRUFBRSxLQURDO0FBRVZDLFFBQUFBO0FBRlUsT0FBZDtBQUlILEtBTkQsQ0FNRSxPQUFPSyxDQUFQLEVBQVU7QUFDUkMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksbUNBQVosRUFBaURGLENBQWpEO0FBQ0EsV0FBS0QsUUFBTCxDQUFjO0FBQ1ZMLFFBQUFBLE9BQU8sRUFBRSxLQURDO0FBRVZFLFFBQUFBLEtBQUssRUFBRUk7QUFGRyxPQUFkO0FBSUg7QUFDSjs7QUFFRG5CLEVBQUFBLG9CQUFvQixHQUFHO0FBQ25CO0FBQ0EsU0FBS3NCLEtBQUwsQ0FBV3ZCLFVBQVg7QUFDSDs7QUFFREcsRUFBQUEsdUJBQXVCLEdBQUc7QUFDdEJxQixtQkFBTUMsd0JBQU4sQ0FBK0IsaUJBQS9CLEVBQWtELEVBQWxELDZFQUNXLDZEQURYLEtBRUk7QUFDSUMsTUFBQUEsWUFBWSxFQUFFbEIsaUNBQWdCQyxHQUFoQjtBQURsQixLQUZKO0FBTUg7O0FBRURMLEVBQUFBLFdBQVcsQ0FBQ3VCLFNBQUQsRUFBWTtBQUNuQixRQUFJQSxTQUFKLEVBQWU7QUFDWEMsMEJBQUlDLFFBQUosQ0FBYTtBQUFDQyxRQUFBQSxNQUFNLEVBQUU7QUFBVCxPQUFiO0FBQ0gsS0FIa0IsQ0FJbkI7OztBQUNBLFNBQUtQLEtBQUwsQ0FBV3ZCLFVBQVg7QUFDSDs7QUFFREssRUFBQUEseUJBQXlCLEdBQUc7QUFDeEIsUUFBSSxLQUFLUSxLQUFMLENBQVdFLFVBQWYsRUFBMkI7QUFDdkI7QUFDQTtBQUNBO0FBQ0EsWUFBTWdCLHNCQUFzQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMENBQWpCLENBQS9COztBQUNBVCxxQkFBTVUsbUJBQU4sQ0FDSSxnQkFESixFQUNzQixFQUR0QixFQUMwQkgsc0JBRDFCLEVBQ2tELElBRGxELEVBQ3dELElBRHhEO0FBRUk7QUFBaUIsV0FGckI7QUFFNEI7QUFBZSxVQUYzQztBQUlILEtBVEQsTUFTTztBQUNIUCxxQkFBTUMsd0JBQU4sQ0FBK0IsWUFBL0IsRUFBNkMsWUFBN0MsNkVBQ1cseUVBRFgsS0FFSSxJQUZKLEVBRVUsSUFGVjtBQUVnQjtBQUFpQixXQUZqQztBQUV3QztBQUFlLFVBRnZEO0FBSUgsS0FmdUIsQ0FpQnhCOzs7QUFDQSxTQUFLRixLQUFMLENBQVd2QixVQUFYO0FBQ0g7O0FBRURNLEVBQUFBLGdCQUFnQixHQUFHO0FBQ2ZzQix3QkFBSUMsUUFBSixDQUFhO0FBQUNDLE1BQUFBLE1BQU0sRUFBRTtBQUFULEtBQWIsRUFEZSxDQUdmOzs7QUFDQSxTQUFLUCxLQUFMLENBQVd2QixVQUFYO0FBQ0g7O0FBRURtQyxFQUFBQSxNQUFNLEdBQUc7QUFDTCxRQUFJLEtBQUt0QixLQUFMLENBQVdILHNCQUFmLEVBQXVDO0FBQ25DLFlBQU0wQixVQUFVLEdBQUdKLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiwwQkFBakIsQ0FBbkI7O0FBRUEsWUFBTUksV0FBVyxnQkFBRyx1REFDaEIsd0NBQUkseUJBQ0EsZ0VBQ0EscUVBRkEsQ0FBSixDQURnQixlQUtoQix3Q0FBSSx5QkFBRyw0REFBSCxDQUFKLENBTGdCLENBQXBCOztBQVFBLFVBQUlDLGFBQUo7O0FBQ0EsVUFBSSxLQUFLekIsS0FBTCxDQUFXQyxPQUFmLEVBQXdCO0FBQ3BCLGNBQU15QixPQUFPLEdBQUdQLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBaEI7QUFFQUssUUFBQUEsYUFBYSxnQkFBRyw2QkFBQyxPQUFELE9BQWhCO0FBQ0gsT0FKRCxNQUlPO0FBQ0gsY0FBTUUsYUFBYSxHQUFHUixHQUFHLENBQUNDLFlBQUosQ0FBaUIsOEJBQWpCLENBQXRCO0FBQ0EsWUFBSVEsa0JBQUo7O0FBQ0EsWUFBSSxLQUFLNUIsS0FBTCxDQUFXRSxVQUFmLEVBQTJCO0FBQ3ZCMEIsVUFBQUEsa0JBQWtCLEdBQUcseUJBQUcsb0NBQUgsQ0FBckI7QUFDSCxTQUZELE1BRU87QUFDSDtBQUNBO0FBQ0FBLFVBQUFBLGtCQUFrQixHQUFHLHlCQUFHLHdCQUFILENBQXJCO0FBQ0g7O0FBRURILFFBQUFBLGFBQWEsZ0JBQUcsdURBQ1o7QUFBSyxVQUFBLFNBQVMsRUFBQyxtQkFBZjtBQUFtQyxVQUFBLEVBQUUsRUFBQztBQUF0QyxXQUNNRCxXQUROLENBRFksZUFJWiw2QkFBQyxhQUFEO0FBQWUsVUFBQSxhQUFhLEVBQUVJLGtCQUE5QjtBQUNJLFVBQUEsU0FBUyxFQUFFLEtBRGY7QUFFSSxVQUFBLG9CQUFvQixFQUFFLEtBQUtwQyx5QkFGL0I7QUFHSSxVQUFBLEtBQUssRUFBRTtBQUhYLHdCQUtJO0FBQVEsVUFBQSxPQUFPLEVBQUUsS0FBS0M7QUFBdEIsV0FDSyx5QkFBRyxvQ0FBSCxDQURMLENBTEosQ0FKWSxlQWFaLDJEQUNJLDhDQUFVLHlCQUFHLFVBQUgsQ0FBVixDQURKLGVBRUkscURBQUc7QUFBUSxVQUFBLE9BQU8sRUFBRSxLQUFLSDtBQUF0QixXQUNFLHlCQUFHLHNCQUFILENBREYsQ0FBSCxDQUZKLENBYlksQ0FBaEI7QUFvQkgsT0EvQ2tDLENBZ0RuQztBQUNBO0FBQ0E7OztBQUNBLDBCQUFRLDZCQUFDLFVBQUQ7QUFDSixRQUFBLEtBQUssRUFBRSx5QkFBRywrQ0FBSCxDQURIO0FBRUosUUFBQSxTQUFTLEVBQUMsbUJBRk47QUFHSixRQUFBLFNBQVMsRUFBRSxJQUhQO0FBSUosUUFBQSxVQUFVLEVBQUUsS0FBS0M7QUFKYixTQU1Ia0MsYUFORyxDQUFSO0FBUUgsS0EzREQsTUEyRE87QUFDSCxZQUFNSSxjQUFjLEdBQUdWLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQiw4QkFBakIsQ0FBdkI7QUFDQSwwQkFBUSw2QkFBQyxjQUFEO0FBQ0osUUFBQSxlQUFlLEVBQUUsSUFEYjtBQUVKLFFBQUEsS0FBSyxFQUFFLHlCQUFHLFVBQUgsQ0FGSDtBQUdKLFFBQUEsV0FBVyxFQUFFLHlCQUNULG9DQURTLENBSFQ7QUFNSixRQUFBLE1BQU0sRUFBRSx5QkFBRyxVQUFILENBTko7QUFPSixRQUFBLFVBQVUsRUFBRSxLQUFLN0I7QUFQYixRQUFSO0FBU0g7QUFDSjs7QUF0S3FEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4uLy4uLy4uL2luZGV4JztcbmltcG9ydCBkaXMgZnJvbSAnLi4vLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2dvdXREaWFsb2cgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgb25GaW5pc2hlZDogZnVuY3Rpb24oKSB7fSxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX29uU2V0dGluZ3NMaW5rQ2xpY2sgPSB0aGlzLl9vblNldHRpbmdzTGlua0NsaWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uRXhwb3J0RTJlS2V5c0NsaWNrZWQgPSB0aGlzLl9vbkV4cG9ydEUyZUtleXNDbGlja2VkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uRmluaXNoZWQgPSB0aGlzLl9vbkZpbmlzaGVkLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uU2V0UmVjb3ZlcnlNZXRob2RDbGljayA9IHRoaXMuX29uU2V0UmVjb3ZlcnlNZXRob2RDbGljay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9vbkxvZ291dENvbmZpcm0gPSB0aGlzLl9vbkxvZ291dENvbmZpcm0uYmluZCh0aGlzKTtcblxuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgIGNvbnN0IHNob3VsZExvYWRCYWNrdXBTdGF0dXMgPSBjbGkuaXNDcnlwdG9FbmFibGVkKCkgJiYgIWNsaS5nZXRLZXlCYWNrdXBFbmFibGVkKCk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHNob3VsZExvYWRCYWNrdXBTdGF0dXM6IHNob3VsZExvYWRCYWNrdXBTdGF0dXMsXG4gICAgICAgICAgICBsb2FkaW5nOiBzaG91bGRMb2FkQmFja3VwU3RhdHVzLFxuICAgICAgICAgICAgYmFja3VwSW5mbzogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzaG91bGRMb2FkQmFja3VwU3RhdHVzKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkQmFja3VwU3RhdHVzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBfbG9hZEJhY2t1cFN0YXR1cygpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cEluZm8gPSBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0S2V5QmFja3VwVmVyc2lvbigpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgYmFja3VwSW5mbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVuYWJsZSB0byBmZXRjaCBrZXkgYmFja3VwIHN0YXR1c1wiLCBlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfb25TZXR0aW5nc0xpbmtDbGljaygpIHtcbiAgICAgICAgLy8gY2xvc2UgZGlhbG9nXG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgIH1cblxuICAgIF9vbkV4cG9ydEUyZUtleXNDbGlja2VkKCkge1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMoJ0V4cG9ydCBFMkUgS2V5cycsICcnLFxuICAgICAgICAgICAgaW1wb3J0KCcuLi8uLi8uLi9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRXhwb3J0RTJlS2V5c0RpYWxvZycpLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hdHJpeENsaWVudDogTWF0cml4Q2xpZW50UGVnLmdldCgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBfb25GaW5pc2hlZChjb25maXJtZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpcm1lZCkge1xuICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdsb2dvdXQnfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2xvc2UgZGlhbG9nXG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgIH1cblxuICAgIF9vblNldFJlY292ZXJ5TWV0aG9kQ2xpY2soKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmJhY2t1cEluZm8pIHtcbiAgICAgICAgICAgIC8vIEEga2V5IGJhY2t1cCBleGlzdHMgZm9yIHRoaXMgYWNjb3VudCwgYnV0IHRoZSBjcmVhdGluZyBkZXZpY2UgaXMgbm90XG4gICAgICAgICAgICAvLyB2ZXJpZmllZCwgc28gcmVzdG9yZSB0aGUgYmFja3VwIHdoaWNoIHdpbGwgZ2l2ZSB1cyB0aGUga2V5cyBmcm9tIGl0IGFuZFxuICAgICAgICAgICAgLy8gYWxsb3cgdXMgdG8gdHJ1c3QgaXQgKGllLiB1cGxvYWQga2V5cyB0byBpdClcbiAgICAgICAgICAgIGNvbnN0IFJlc3RvcmVLZXlCYWNrdXBEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLmtleWJhY2t1cC5SZXN0b3JlS2V5QmFja3VwRGlhbG9nJyk7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKFxuICAgICAgICAgICAgICAgICdSZXN0b3JlIEJhY2t1cCcsICcnLCBSZXN0b3JlS2V5QmFja3VwRGlhbG9nLCBudWxsLCBudWxsLFxuICAgICAgICAgICAgICAgIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIHRydWUsXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jKFwiS2V5IEJhY2t1cFwiLCBcIktleSBCYWNrdXBcIixcbiAgICAgICAgICAgICAgICBpbXBvcnQoXCIuLi8uLi8uLi9hc3luYy1jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3Mva2V5YmFja3VwL0NyZWF0ZUtleUJhY2t1cERpYWxvZ1wiKSxcbiAgICAgICAgICAgICAgICBudWxsLCBudWxsLCAvKiBwcmlvcml0eSA9ICovIGZhbHNlLCAvKiBzdGF0aWMgPSAqLyB0cnVlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsb3NlIGRpYWxvZ1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICB9XG5cbiAgICBfb25Mb2dvdXRDb25maXJtKCkge1xuICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ2xvZ291dCd9KTtcblxuICAgICAgICAvLyBjbG9zZSBkaWFsb2dcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5zaG91bGRMb2FkQmFja3VwU3RhdHVzKSB7XG4gICAgICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gPGRpdj5cbiAgICAgICAgICAgICAgICA8cD57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiRW5jcnlwdGVkIG1lc3NhZ2VzIGFyZSBzZWN1cmVkIHdpdGggZW5kLXRvLWVuZCBlbmNyeXB0aW9uLiBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwiT25seSB5b3UgYW5kIHRoZSByZWNpcGllbnQocykgaGF2ZSB0aGUga2V5cyB0byByZWFkIHRoZXNlIG1lc3NhZ2VzLlwiLFxuICAgICAgICAgICAgICAgICl9PC9wPlxuICAgICAgICAgICAgICAgIDxwPntfdChcIkJhY2sgdXAgeW91ciBrZXlzIGJlZm9yZSBzaWduaW5nIG91dCB0byBhdm9pZCBsb3NpbmcgdGhlbS5cIil9PC9wPlxuICAgICAgICAgICAgPC9kaXY+O1xuXG4gICAgICAgICAgICBsZXQgZGlhbG9nQ29udGVudDtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuU3Bpbm5lcicpO1xuXG4gICAgICAgICAgICAgICAgZGlhbG9nQ29udGVudCA9IDxTcGlubmVyIC8+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBEaWFsb2dCdXR0b25zID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuRGlhbG9nQnV0dG9ucycpO1xuICAgICAgICAgICAgICAgIGxldCBzZXR1cEJ1dHRvbkNhcHRpb247XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYmFja3VwSW5mbykge1xuICAgICAgICAgICAgICAgICAgICBzZXR1cEJ1dHRvbkNhcHRpb24gPSBfdChcIkNvbm5lY3QgdGhpcyBzZXNzaW9uIHRvIEtleSBCYWNrdXBcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBhbiBlcnJvciBmZXRjaGluZyB0aGUgYmFja3VwIGluZm8sIHdlJ2xsIGp1c3QgYXNzdW1lIHRoZXJlJ3NcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gYmFja3VwIGZvciB0aGUgcHVycG9zZSBvZiB0aGUgYnV0dG9uIGNhcHRpb25cbiAgICAgICAgICAgICAgICAgICAgc2V0dXBCdXR0b25DYXB0aW9uID0gX3QoXCJTdGFydCB1c2luZyBLZXkgQmFja3VwXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRpYWxvZ0NvbnRlbnQgPSA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCIgaWQ9J214X0RpYWxvZ19jb250ZW50Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZGVzY3JpcHRpb24gfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPERpYWxvZ0J1dHRvbnMgcHJpbWFyeUJ1dHRvbj17c2V0dXBCdXR0b25DYXB0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzQ2FuY2VsPXtmYWxzZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uUHJpbWFyeUJ1dHRvbkNsaWNrPXt0aGlzLl9vblNldFJlY292ZXJ5TWV0aG9kQ2xpY2t9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkxvZ291dENvbmZpcm19PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtfdChcIkkgZG9uJ3Qgd2FudCBteSBlbmNyeXB0ZWQgbWVzc2FnZXNcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9EaWFsb2dCdXR0b25zPlxuICAgICAgICAgICAgICAgICAgICA8ZGV0YWlscz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5PntfdChcIkFkdmFuY2VkXCIpfTwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPjxidXR0b24gb25DbGljaz17dGhpcy5fb25FeHBvcnRFMmVLZXlzQ2xpY2tlZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge190KFwiTWFudWFsbHkgZXhwb3J0IGtleXNcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj48L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGV0YWlscz5cbiAgICAgICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOb3QgcXVpdGUgYSBzdGFuZGFyZCBxdWVzdGlvbiBkaWFsb2cgYXMgdGhlIHByaW1hcnkgYnV0dG9uIGNhbmNlbHNcbiAgICAgICAgICAgIC8vIHRoZSBhY3Rpb24gYW5kIGRvZXMgc29tZXRoaW5nIGVsc2UgaW5zdGVhZCwgd2hpbHN0IG5vbi1kZWZhdWx0IGJ1dHRvblxuICAgICAgICAgICAgLy8gY29uZmlybXMgdGhlIGFjdGlvbi5cbiAgICAgICAgICAgIHJldHVybiAoPEJhc2VEaWFsb2dcbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJZb3UnbGwgbG9zZSBhY2Nlc3MgdG8geW91ciBlbmNyeXB0ZWQgbWVzc2FnZXNcIil9XG4gICAgICAgICAgICAgICAgY29udGVudElkPSdteF9EaWFsb2dfY29udGVudCdcbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5fb25GaW5pc2hlZH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7ZGlhbG9nQ29udGVudH1cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLlF1ZXN0aW9uRGlhbG9nJyk7XG4gICAgICAgICAgICByZXR1cm4gKDxRdWVzdGlvbkRpYWxvZ1xuICAgICAgICAgICAgICAgIGhhc0NhbmNlbEJ1dHRvbj17dHJ1ZX1cbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJTaWduIG91dFwiKX1cbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj17X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHNpZ24gb3V0P1wiLFxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgYnV0dG9uPXtfdChcIlNpZ24gb3V0XCIpfVxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMuX29uRmluaXNoZWR9XG4gICAgICAgICAgICAvPik7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=