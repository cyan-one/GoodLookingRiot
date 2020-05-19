"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var sdk = _interopRequireWildcard(require("./index"));

var _Modal = _interopRequireDefault(require("./Modal"));

var _languageHandler = require("./languageHandler");

var _IdentityAuthClient = _interopRequireDefault(require("./IdentityAuthClient"));

var _InteractiveAuthEntryComponents = require("./components/views/auth/InteractiveAuthEntryComponents");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
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
function getIdServerDomain() {
  return _MatrixClientPeg.MatrixClientPeg.get().idBaseUrl.split("://")[1];
}
/**
 * Allows a user to add a third party identifier to their homeserver and,
 * optionally, the identity servers.
 *
 * This involves getting an email token from the identity server to "prove" that
 * the client owns the given email address, which is then passed to the
 * add threepid API on the homeserver.
 *
 * Diagrams of the intended API flows here are available at:
 *
 * https://gist.github.com/jryans/839a09bf0c5a70e2f36ed990d50ed928
 */


class AddThreepid {
  constructor() {
    (0, _defineProperty2.default)(this, "_makeAddThreepidOnlyRequest", auth => {
      return _MatrixClientPeg.MatrixClientPeg.get().addThreePidOnly({
        sid: this.sessionId,
        client_secret: this.clientSecret,
        auth
      });
    });
    this.clientSecret = _MatrixClientPeg.MatrixClientPeg.get().generateClientSecret();
    this.sessionId = null;
    this.submitUrl = null;
  }
  /**
   * Attempt to add an email threepid to the homeserver.
   * This will trigger a side-effect of sending an email to the provided email address.
   * @param {string} emailAddress The email address to add
   * @return {Promise} Resolves when the email has been sent. Then call checkEmailLinkClicked().
   */


  addEmailAddress(emailAddress) {
    return _MatrixClientPeg.MatrixClientPeg.get().requestAdd3pidEmailToken(emailAddress, this.clientSecret, 1).then(res => {
      this.sessionId = res.sid;
      return res;
    }, function (err) {
      if (err.errcode === 'M_THREEPID_IN_USE') {
        err.message = (0, _languageHandler._t)('This email address is already in use');
      } else if (err.httpStatus) {
        err.message = err.message + " (Status ".concat(err.httpStatus, ")");
      }

      throw err;
    });
  }
  /**
   * Attempt to bind an email threepid on the identity server via the homeserver.
   * This will trigger a side-effect of sending an email to the provided email address.
   * @param {string} emailAddress The email address to add
   * @return {Promise} Resolves when the email has been sent. Then call checkEmailLinkClicked().
   */


  async bindEmailAddress(emailAddress) {
    this.bind = true;

    if (await _MatrixClientPeg.MatrixClientPeg.get().doesServerSupportSeparateAddAndBind()) {
      // For separate bind, request a token directly from the IS.
      const authClient = new _IdentityAuthClient.default();
      const identityAccessToken = await authClient.getAccessToken();
      return _MatrixClientPeg.MatrixClientPeg.get().requestEmailToken(emailAddress, this.clientSecret, 1, undefined, undefined, identityAccessToken).then(res => {
        this.sessionId = res.sid;
        return res;
      }, function (err) {
        if (err.errcode === 'M_THREEPID_IN_USE') {
          err.message = (0, _languageHandler._t)('This email address is already in use');
        } else if (err.httpStatus) {
          err.message = err.message + " (Status ".concat(err.httpStatus, ")");
        }

        throw err;
      });
    } else {
      // For tangled bind, request a token via the HS.
      return this.addEmailAddress(emailAddress);
    }
  }
  /**
   * Attempt to add a MSISDN threepid to the homeserver.
   * This will trigger a side-effect of sending an SMS to the provided phone number.
   * @param {string} phoneCountry The ISO 2 letter code of the country to resolve phoneNumber in
   * @param {string} phoneNumber The national or international formatted phone number to add
   * @return {Promise} Resolves when the text message has been sent. Then call haveMsisdnToken().
   */


  addMsisdn(phoneCountry, phoneNumber) {
    return _MatrixClientPeg.MatrixClientPeg.get().requestAdd3pidMsisdnToken(phoneCountry, phoneNumber, this.clientSecret, 1).then(res => {
      this.sessionId = res.sid;
      this.submitUrl = res.submit_url;
      return res;
    }, function (err) {
      if (err.errcode === 'M_THREEPID_IN_USE') {
        err.message = (0, _languageHandler._t)('This phone number is already in use');
      } else if (err.httpStatus) {
        err.message = err.message + " (Status ".concat(err.httpStatus, ")");
      }

      throw err;
    });
  }
  /**
   * Attempt to bind a MSISDN threepid on the identity server via the homeserver.
   * This will trigger a side-effect of sending an SMS to the provided phone number.
   * @param {string} phoneCountry The ISO 2 letter code of the country to resolve phoneNumber in
   * @param {string} phoneNumber The national or international formatted phone number to add
   * @return {Promise} Resolves when the text message has been sent. Then call haveMsisdnToken().
   */


  async bindMsisdn(phoneCountry, phoneNumber) {
    this.bind = true;

    if (await _MatrixClientPeg.MatrixClientPeg.get().doesServerSupportSeparateAddAndBind()) {
      // For separate bind, request a token directly from the IS.
      const authClient = new _IdentityAuthClient.default();
      const identityAccessToken = await authClient.getAccessToken();
      return _MatrixClientPeg.MatrixClientPeg.get().requestMsisdnToken(phoneCountry, phoneNumber, this.clientSecret, 1, undefined, undefined, identityAccessToken).then(res => {
        this.sessionId = res.sid;
        return res;
      }, function (err) {
        if (err.errcode === 'M_THREEPID_IN_USE') {
          err.message = (0, _languageHandler._t)('This phone number is already in use');
        } else if (err.httpStatus) {
          err.message = err.message + " (Status ".concat(err.httpStatus, ")");
        }

        throw err;
      });
    } else {
      // For tangled bind, request a token via the HS.
      return this.addMsisdn(phoneCountry, phoneNumber);
    }
  }
  /**
   * Checks if the email link has been clicked by attempting to add the threepid
   * @return {Promise} Resolves if the email address was added. Rejects with an object
   * with a "message" property which contains a human-readable message detailing why
   * the request failed.
   */


  async checkEmailLinkClicked() {
    try {
      if (await _MatrixClientPeg.MatrixClientPeg.get().doesServerSupportSeparateAddAndBind()) {
        if (this.bind) {
          const authClient = new _IdentityAuthClient.default();
          const identityAccessToken = await authClient.getAccessToken();
          await _MatrixClientPeg.MatrixClientPeg.get().bindThreePid({
            sid: this.sessionId,
            client_secret: this.clientSecret,
            id_server: getIdServerDomain(),
            id_access_token: identityAccessToken
          });
        } else {
          try {
            await this._makeAddThreepidOnlyRequest(); // The spec has always required this to use UI auth but synapse briefly
            // implemented it without, so this may just succeed and that's OK.

            return;
          } catch (e) {
            if (e.httpStatus !== 401 || !e.data || !e.data.flows) {
              // doesn't look like an interactive-auth failure
              throw e;
            } // pop up an interactive auth dialog


            const InteractiveAuthDialog = sdk.getComponent("dialogs.InteractiveAuthDialog");
            const dialogAesthetics = {
              [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
                title: (0, _languageHandler._t)("Use Single Sign On to continue"),
                body: (0, _languageHandler._t)("Confirm adding this email address by using " + "Single Sign On to prove your identity."),
                continueText: (0, _languageHandler._t)("Single Sign On"),
                continueKind: "primary"
              },
              [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
                title: (0, _languageHandler._t)("Confirm adding email"),
                body: (0, _languageHandler._t)("Click the button below to confirm adding this email address."),
                continueText: (0, _languageHandler._t)("Confirm"),
                continueKind: "primary"
              }
            };

            const {
              finished
            } = _Modal.default.createTrackedDialog('Add Email', '', InteractiveAuthDialog, {
              title: (0, _languageHandler._t)("Add Email Address"),
              matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
              authData: e.data,
              makeRequest: this._makeAddThreepidOnlyRequest,
              aestheticsForStagePhases: {
                [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: dialogAesthetics,
                [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: dialogAesthetics
              }
            });

            return finished;
          }
        }
      } else {
        await _MatrixClientPeg.MatrixClientPeg.get().addThreePid({
          sid: this.sessionId,
          client_secret: this.clientSecret,
          id_server: getIdServerDomain()
        }, this.bind);
      }
    } catch (err) {
      if (err.httpStatus === 401) {
        err.message = (0, _languageHandler._t)('Failed to verify email address: make sure you clicked the link in the email');
      } else if (err.httpStatus) {
        err.message += " (Status ".concat(err.httpStatus, ")");
      }

      throw err;
    }
  }
  /**
   * @param {Object} auth UI auth object
   * @return {Promise<Object>} Response from /3pid/add call (in current spec, an empty object)
   */


  /**
   * Takes a phone number verification code as entered by the user and validates
   * it with the ID server, then if successful, adds the phone number.
   * @param {string} msisdnToken phone number verification code as entered by the user
   * @return {Promise} Resolves if the phone number was added. Rejects with an object
   * with a "message" property which contains a human-readable message detailing why
   * the request failed.
   */
  async haveMsisdnToken(msisdnToken) {
    const authClient = new _IdentityAuthClient.default();
    const supportsSeparateAddAndBind = await _MatrixClientPeg.MatrixClientPeg.get().doesServerSupportSeparateAddAndBind();
    let result;

    if (this.submitUrl) {
      result = await _MatrixClientPeg.MatrixClientPeg.get().submitMsisdnTokenOtherUrl(this.submitUrl, this.sessionId, this.clientSecret, msisdnToken);
    } else if (this.bind || !supportsSeparateAddAndBind) {
      result = await _MatrixClientPeg.MatrixClientPeg.get().submitMsisdnToken(this.sessionId, this.clientSecret, msisdnToken, (await authClient.getAccessToken()));
    } else {
      throw new Error("The add / bind with MSISDN flow is misconfigured");
    }

    if (result.errcode) {
      throw result;
    }

    if (supportsSeparateAddAndBind) {
      if (this.bind) {
        await _MatrixClientPeg.MatrixClientPeg.get().bindThreePid({
          sid: this.sessionId,
          client_secret: this.clientSecret,
          id_server: getIdServerDomain(),
          id_access_token: await authClient.getAccessToken()
        });
      } else {
        try {
          await this._makeAddThreepidOnlyRequest(); // The spec has always required this to use UI auth but synapse briefly
          // implemented it without, so this may just succeed and that's OK.

          return;
        } catch (e) {
          if (e.httpStatus !== 401 || !e.data || !e.data.flows) {
            // doesn't look like an interactive-auth failure
            throw e;
          } // pop up an interactive auth dialog


          const InteractiveAuthDialog = sdk.getComponent("dialogs.InteractiveAuthDialog");
          const dialogAesthetics = {
            [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_PREAUTH]: {
              title: (0, _languageHandler._t)("Use Single Sign On to continue"),
              body: (0, _languageHandler._t)("Confirm adding this phone number by using " + "Single Sign On to prove your identity."),
              continueText: (0, _languageHandler._t)("Single Sign On"),
              continueKind: "primary"
            },
            [_InteractiveAuthEntryComponents.SSOAuthEntry.PHASE_POSTAUTH]: {
              title: (0, _languageHandler._t)("Confirm adding phone number"),
              body: (0, _languageHandler._t)("Click the button below to confirm adding this phone number."),
              continueText: (0, _languageHandler._t)("Confirm"),
              continueKind: "primary"
            }
          };

          const {
            finished
          } = _Modal.default.createTrackedDialog('Add MSISDN', '', InteractiveAuthDialog, {
            title: (0, _languageHandler._t)("Add Phone Number"),
            matrixClient: _MatrixClientPeg.MatrixClientPeg.get(),
            authData: e.data,
            makeRequest: this._makeAddThreepidOnlyRequest,
            aestheticsForStagePhases: {
              [_InteractiveAuthEntryComponents.SSOAuthEntry.LOGIN_TYPE]: dialogAesthetics,
              [_InteractiveAuthEntryComponents.SSOAuthEntry.UNSTABLE_LOGIN_TYPE]: dialogAesthetics
            }
          });

          return finished;
        }
      }
    } else {
      await _MatrixClientPeg.MatrixClientPeg.get().addThreePid({
        sid: this.sessionId,
        client_secret: this.clientSecret,
        id_server: getIdServerDomain()
      }, this.bind);
    }
  }

}

exports.default = AddThreepid;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BZGRUaHJlZXBpZC5qcyJdLCJuYW1lcyI6WyJnZXRJZFNlcnZlckRvbWFpbiIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsImlkQmFzZVVybCIsInNwbGl0IiwiQWRkVGhyZWVwaWQiLCJjb25zdHJ1Y3RvciIsImF1dGgiLCJhZGRUaHJlZVBpZE9ubHkiLCJzaWQiLCJzZXNzaW9uSWQiLCJjbGllbnRfc2VjcmV0IiwiY2xpZW50U2VjcmV0IiwiZ2VuZXJhdGVDbGllbnRTZWNyZXQiLCJzdWJtaXRVcmwiLCJhZGRFbWFpbEFkZHJlc3MiLCJlbWFpbEFkZHJlc3MiLCJyZXF1ZXN0QWRkM3BpZEVtYWlsVG9rZW4iLCJ0aGVuIiwicmVzIiwiZXJyIiwiZXJyY29kZSIsIm1lc3NhZ2UiLCJodHRwU3RhdHVzIiwiYmluZEVtYWlsQWRkcmVzcyIsImJpbmQiLCJkb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCIsImF1dGhDbGllbnQiLCJJZGVudGl0eUF1dGhDbGllbnQiLCJpZGVudGl0eUFjY2Vzc1Rva2VuIiwiZ2V0QWNjZXNzVG9rZW4iLCJyZXF1ZXN0RW1haWxUb2tlbiIsInVuZGVmaW5lZCIsImFkZE1zaXNkbiIsInBob25lQ291bnRyeSIsInBob25lTnVtYmVyIiwicmVxdWVzdEFkZDNwaWRNc2lzZG5Ub2tlbiIsInN1Ym1pdF91cmwiLCJiaW5kTXNpc2RuIiwicmVxdWVzdE1zaXNkblRva2VuIiwiY2hlY2tFbWFpbExpbmtDbGlja2VkIiwiYmluZFRocmVlUGlkIiwiaWRfc2VydmVyIiwiaWRfYWNjZXNzX3Rva2VuIiwiX21ha2VBZGRUaHJlZXBpZE9ubHlSZXF1ZXN0IiwiZSIsImRhdGEiLCJmbG93cyIsIkludGVyYWN0aXZlQXV0aERpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsImRpYWxvZ0Flc3RoZXRpY3MiLCJTU09BdXRoRW50cnkiLCJQSEFTRV9QUkVBVVRIIiwidGl0bGUiLCJib2R5IiwiY29udGludWVUZXh0IiwiY29udGludWVLaW5kIiwiUEhBU0VfUE9TVEFVVEgiLCJmaW5pc2hlZCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsIm1hdHJpeENsaWVudCIsImF1dGhEYXRhIiwibWFrZVJlcXVlc3QiLCJhZXN0aGV0aWNzRm9yU3RhZ2VQaGFzZXMiLCJMT0dJTl9UWVBFIiwiVU5TVEFCTEVfTE9HSU5fVFlQRSIsImFkZFRocmVlUGlkIiwiaGF2ZU1zaXNkblRva2VuIiwibXNpc2RuVG9rZW4iLCJzdXBwb3J0c1NlcGFyYXRlQWRkQW5kQmluZCIsInJlc3VsdCIsInN1Ym1pdE1zaXNkblRva2VuT3RoZXJVcmwiLCJzdWJtaXRNc2lzZG5Ub2tlbiIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkEsU0FBU0EsaUJBQVQsR0FBNkI7QUFDekIsU0FBT0MsaUNBQWdCQyxHQUFoQixHQUFzQkMsU0FBdEIsQ0FBZ0NDLEtBQWhDLENBQXNDLEtBQXRDLEVBQTZDLENBQTdDLENBQVA7QUFDSDtBQUVEOzs7Ozs7Ozs7Ozs7OztBQVllLE1BQU1DLFdBQU4sQ0FBa0I7QUFDN0JDLEVBQUFBLFdBQVcsR0FBRztBQUFBLHVFQXVNaUJDLElBQUQsSUFBVTtBQUNwQyxhQUFPTixpQ0FBZ0JDLEdBQWhCLEdBQXNCTSxlQUF0QixDQUFzQztBQUN6Q0MsUUFBQUEsR0FBRyxFQUFFLEtBQUtDLFNBRCtCO0FBRXpDQyxRQUFBQSxhQUFhLEVBQUUsS0FBS0MsWUFGcUI7QUFHekNMLFFBQUFBO0FBSHlDLE9BQXRDLENBQVA7QUFLSCxLQTdNYTtBQUNWLFNBQUtLLFlBQUwsR0FBb0JYLGlDQUFnQkMsR0FBaEIsR0FBc0JXLG9CQUF0QixFQUFwQjtBQUNBLFNBQUtILFNBQUwsR0FBaUIsSUFBakI7QUFDQSxTQUFLSSxTQUFMLEdBQWlCLElBQWpCO0FBQ0g7QUFFRDs7Ozs7Ozs7QUFNQUMsRUFBQUEsZUFBZSxD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Q0FIYTtBQUkzQkMsY0FBQUEsWUFBWSxFQUFFO0FBSmE7QUFSVixXQUF6Qjs7QUFlQSxnQkFBTTtBQUFFRSxZQUFBQTtBQUFGLGNBQWVDLGVBQU1DLG1CQUFOLENBQTBCLFlBQTFCLEVBQXdDLEVBQXhDLEVBQTRDYixxQkFBNUMsRUFBbUU7QUFDcEZNLFlBQUFBLEtBQUssRUFBRSx5QkFBRyxrQkFBSCxDQUQ2RTtBQUVwRlEsWUFBQUEsWUFBWSxFQUFFN0QsaUNBQWdCQyxHQUFoQixFQUZzRTtBQUdwRjZELFlBQUFBLFFBQVEsRUFBRWxCLENBQUMsQ0FBQ0MsSUFId0U7QUFJcEZrQixZQUFBQSxXQUFXLEVBQUUsS0FBS3BCLDJCQUprRTtBQUtwRnFCLFlBQUFBLHdCQUF3QixFQUFFO0FBQ3RCLGVBQUNiLDZDQUFhYyxVQUFkLEdBQTJCZixnQkFETDtBQUV0QixlQUFDQyw2Q0FBYWUsbUJBQWQsR0FBb0NoQjtBQUZkO0FBTDBELFdBQW5FLENBQXJCOztBQVVBLGlCQUFPUSxRQUFQO0FBQ0g7QUFDSjtBQUNKLEtBcERELE1Bb0RPO0FBQ0gsWUFBTTFELGlDQUFnQkMsR0FBaEIsR0FBc0JrRSxXQUF0QixDQUFrQztBQUNwQzNELFFBQUFBLEdBQUcsRUFBRSxLQUFLQyxTQUQwQjtBQUVwQ0MsUUFBQUEsYUFBYSxFQUFFLEtBQUtDLFlBRmdCO0FBR3BDOEIsUUFBQUEsU0FBUyxFQUFFMUMsaUJBQWlCO0FBSFEsT0FBbEMsRUFJSCxLQUFLeUIsSUFKRixDQUFOO0FBS0g7QUFDSjs7QUE5UzRCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxNyBWZWN0b3IgQ3JlYXRpb25zIEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4vTW9kYWwnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgSWRlbnRpdHlBdXRoQ2xpZW50IGZyb20gJy4vSWRlbnRpdHlBdXRoQ2xpZW50JztcbmltcG9ydCB7U1NPQXV0aEVudHJ5fSBmcm9tIFwiLi9jb21wb25lbnRzL3ZpZXdzL2F1dGgvSW50ZXJhY3RpdmVBdXRoRW50cnlDb21wb25lbnRzXCI7XG5cbmZ1bmN0aW9uIGdldElkU2VydmVyRG9tYWluKCkge1xuICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuaWRCYXNlVXJsLnNwbGl0KFwiOi8vXCIpWzFdO1xufVxuXG4vKipcbiAqIEFsbG93cyBhIHVzZXIgdG8gYWRkIGEgdGhpcmQgcGFydHkgaWRlbnRpZmllciB0byB0aGVpciBob21lc2VydmVyIGFuZCxcbiAqIG9wdGlvbmFsbHksIHRoZSBpZGVudGl0eSBzZXJ2ZXJzLlxuICpcbiAqIFRoaXMgaW52b2x2ZXMgZ2V0dGluZyBhbiBlbWFpbCB0b2tlbiBmcm9tIHRoZSBpZGVudGl0eSBzZXJ2ZXIgdG8gXCJwcm92ZVwiIHRoYXRcbiAqIHRoZSBjbGllbnQgb3ducyB0aGUgZ2l2ZW4gZW1haWwgYWRkcmVzcywgd2hpY2ggaXMgdGhlbiBwYXNzZWQgdG8gdGhlXG4gKiBhZGQgdGhyZWVwaWQgQVBJIG9uIHRoZSBob21lc2VydmVyLlxuICpcbiAqIERpYWdyYW1zIG9mIHRoZSBpbnRlbmRlZCBBUEkgZmxvd3MgaGVyZSBhcmUgYXZhaWxhYmxlIGF0OlxuICpcbiAqIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2pyeWFucy84MzlhMDliZjBjNWE3MGUyZjM2ZWQ5OTBkNTBlZDkyOFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBZGRUaHJlZXBpZCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2xpZW50U2VjcmV0ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdlbmVyYXRlQ2xpZW50U2VjcmV0KCk7XG4gICAgICAgIHRoaXMuc2Vzc2lvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdWJtaXRVcmwgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGVtcHQgdG8gYWRkIGFuIGVtYWlsIHRocmVlcGlkIHRvIHRoZSBob21lc2VydmVyLlxuICAgICAqIFRoaXMgd2lsbCB0cmlnZ2VyIGEgc2lkZS1lZmZlY3Qgb2Ygc2VuZGluZyBhbiBlbWFpbCB0byB0aGUgcHJvdmlkZWQgZW1haWwgYWRkcmVzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZW1haWxBZGRyZXNzIFRoZSBlbWFpbCBhZGRyZXNzIHRvIGFkZFxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gdGhlIGVtYWlsIGhhcyBiZWVuIHNlbnQuIFRoZW4gY2FsbCBjaGVja0VtYWlsTGlua0NsaWNrZWQoKS5cbiAgICAgKi9cbiAgICBhZGRFbWFpbEFkZHJlc3MoZW1haWxBZGRyZXNzKSB7XG4gICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkucmVxdWVzdEFkZDNwaWRFbWFpbFRva2VuKGVtYWlsQWRkcmVzcywgdGhpcy5jbGllbnRTZWNyZXQsIDEpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXNzaW9uSWQgPSByZXMuc2lkO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09ICdNX1RIUkVFUElEX0lOX1VTRScpIHtcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSA9IF90KCdUaGlzIGVtYWlsIGFkZHJlc3MgaXMgYWxyZWFkeSBpbiB1c2UnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyLmh0dHBTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlICsgYCAoU3RhdHVzICR7ZXJyLmh0dHBTdGF0dXN9KWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGVtcHQgdG8gYmluZCBhbiBlbWFpbCB0aHJlZXBpZCBvbiB0aGUgaWRlbnRpdHkgc2VydmVyIHZpYSB0aGUgaG9tZXNlcnZlci5cbiAgICAgKiBUaGlzIHdpbGwgdHJpZ2dlciBhIHNpZGUtZWZmZWN0IG9mIHNlbmRpbmcgYW4gZW1haWwgdG8gdGhlIHByb3ZpZGVkIGVtYWlsIGFkZHJlc3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGVtYWlsQWRkcmVzcyBUaGUgZW1haWwgYWRkcmVzcyB0byBhZGRcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHRoZSBlbWFpbCBoYXMgYmVlbiBzZW50LiBUaGVuIGNhbGwgY2hlY2tFbWFpbExpbmtDbGlja2VkKCkuXG4gICAgICovXG4gICAgYXN5bmMgYmluZEVtYWlsQWRkcmVzcyhlbWFpbEFkZHJlc3MpIHtcbiAgICAgICAgdGhpcy5iaW5kID0gdHJ1ZTtcbiAgICAgICAgaWYgKGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5kb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCgpKSB7XG4gICAgICAgICAgICAvLyBGb3Igc2VwYXJhdGUgYmluZCwgcmVxdWVzdCBhIHRva2VuIGRpcmVjdGx5IGZyb20gdGhlIElTLlxuICAgICAgICAgICAgY29uc3QgYXV0aENsaWVudCA9IG5ldyBJZGVudGl0eUF1dGhDbGllbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGlkZW50aXR5QWNjZXNzVG9rZW4gPSBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlcXVlc3RFbWFpbFRva2VuKFxuICAgICAgICAgICAgICAgIGVtYWlsQWRkcmVzcywgdGhpcy5jbGllbnRTZWNyZXQsIDEsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGlkZW50aXR5QWNjZXNzVG9rZW4sXG4gICAgICAgICAgICApLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbklkID0gcmVzLnNpZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyci5lcnJjb2RlID09PSAnTV9USFJFRVBJRF9JTl9VU0UnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gX3QoJ1RoaXMgZW1haWwgYWRkcmVzcyBpcyBhbHJlYWR5IGluIHVzZScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyLmh0dHBTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBlcnIubWVzc2FnZSArIGAgKFN0YXR1cyAke2Vyci5odHRwU3RhdHVzfSlgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZvciB0YW5nbGVkIGJpbmQsIHJlcXVlc3QgYSB0b2tlbiB2aWEgdGhlIEhTLlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkRW1haWxBZGRyZXNzKGVtYWlsQWRkcmVzcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0IHRvIGFkZCBhIE1TSVNETiB0aHJlZXBpZCB0byB0aGUgaG9tZXNlcnZlci5cbiAgICAgKiBUaGlzIHdpbGwgdHJpZ2dlciBhIHNpZGUtZWZmZWN0IG9mIHNlbmRpbmcgYW4gU01TIHRvIHRoZSBwcm92aWRlZCBwaG9uZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBob25lQ291bnRyeSBUaGUgSVNPIDIgbGV0dGVyIGNvZGUgb2YgdGhlIGNvdW50cnkgdG8gcmVzb2x2ZSBwaG9uZU51bWJlciBpblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwaG9uZU51bWJlciBUaGUgbmF0aW9uYWwgb3IgaW50ZXJuYXRpb25hbCBmb3JtYXR0ZWQgcGhvbmUgbnVtYmVyIHRvIGFkZFxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gdGhlIHRleHQgbWVzc2FnZSBoYXMgYmVlbiBzZW50LiBUaGVuIGNhbGwgaGF2ZU1zaXNkblRva2VuKCkuXG4gICAgICovXG4gICAgYWRkTXNpc2RuKHBob25lQ291bnRyeSwgcGhvbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIE1hdHJpeENsaWVudFBlZy5nZXQoKS5yZXF1ZXN0QWRkM3BpZE1zaXNkblRva2VuKFxuICAgICAgICAgICAgcGhvbmVDb3VudHJ5LCBwaG9uZU51bWJlciwgdGhpcy5jbGllbnRTZWNyZXQsIDEsXG4gICAgICAgICkudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25JZCA9IHJlcy5zaWQ7XG4gICAgICAgICAgICB0aGlzLnN1Ym1pdFVybCA9IHJlcy5zdWJtaXRfdXJsO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09ICdNX1RIUkVFUElEX0lOX1VTRScpIHtcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSA9IF90KCdUaGlzIHBob25lIG51bWJlciBpcyBhbHJlYWR5IGluIHVzZScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIuaHR0cFN0YXR1cykge1xuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gZXJyLm1lc3NhZ2UgKyBgIChTdGF0dXMgJHtlcnIuaHR0cFN0YXR1c30pYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdCB0byBiaW5kIGEgTVNJU0ROIHRocmVlcGlkIG9uIHRoZSBpZGVudGl0eSBzZXJ2ZXIgdmlhIHRoZSBob21lc2VydmVyLlxuICAgICAqIFRoaXMgd2lsbCB0cmlnZ2VyIGEgc2lkZS1lZmZlY3Qgb2Ygc2VuZGluZyBhbiBTTVMgdG8gdGhlIHByb3ZpZGVkIHBob25lIG51bWJlci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGhvbmVDb3VudHJ5IFRoZSBJU08gMiBsZXR0ZXIgY29kZSBvZiB0aGUgY291bnRyeSB0byByZXNvbHZlIHBob25lTnVtYmVyIGluXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBob25lTnVtYmVyIFRoZSBuYXRpb25hbCBvciBpbnRlcm5hdGlvbmFsIGZvcm1hdHRlZCBwaG9uZSBudW1iZXIgdG8gYWRkXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiB0aGUgdGV4dCBtZXNzYWdlIGhhcyBiZWVuIHNlbnQuIFRoZW4gY2FsbCBoYXZlTXNpc2RuVG9rZW4oKS5cbiAgICAgKi9cbiAgICBhc3luYyBiaW5kTXNpc2RuKHBob25lQ291bnRyeSwgcGhvbmVOdW1iZXIpIHtcbiAgICAgICAgdGhpcy5iaW5kID0gdHJ1ZTtcbiAgICAgICAgaWYgKGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5kb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCgpKSB7XG4gICAgICAgICAgICAvLyBGb3Igc2VwYXJhdGUgYmluZCwgcmVxdWVzdCBhIHRva2VuIGRpcmVjdGx5IGZyb20gdGhlIElTLlxuICAgICAgICAgICAgY29uc3QgYXV0aENsaWVudCA9IG5ldyBJZGVudGl0eUF1dGhDbGllbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGlkZW50aXR5QWNjZXNzVG9rZW4gPSBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlcXVlc3RNc2lzZG5Ub2tlbihcbiAgICAgICAgICAgICAgICBwaG9uZUNvdW50cnksIHBob25lTnVtYmVyLCB0aGlzLmNsaWVudFNlY3JldCwgMSxcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgaWRlbnRpdHlBY2Nlc3NUb2tlbixcbiAgICAgICAgICAgICkudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uSWQgPSByZXMuc2lkO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09ICdNX1RIUkVFUElEX0lOX1VTRScpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBfdCgnVGhpcyBwaG9uZSBudW1iZXIgaXMgYWxyZWFkeSBpbiB1c2UnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVyci5odHRwU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gZXJyLm1lc3NhZ2UgKyBgIChTdGF0dXMgJHtlcnIuaHR0cFN0YXR1c30pYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBGb3IgdGFuZ2xlZCBiaW5kLCByZXF1ZXN0IGEgdG9rZW4gdmlhIHRoZSBIUy5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZE1zaXNkbihwaG9uZUNvdW50cnksIHBob25lTnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgZW1haWwgbGluayBoYXMgYmVlbiBjbGlja2VkIGJ5IGF0dGVtcHRpbmcgdG8gYWRkIHRoZSB0aHJlZXBpZFxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFJlc29sdmVzIGlmIHRoZSBlbWFpbCBhZGRyZXNzIHdhcyBhZGRlZC4gUmVqZWN0cyB3aXRoIGFuIG9iamVjdFxuICAgICAqIHdpdGggYSBcIm1lc3NhZ2VcIiBwcm9wZXJ0eSB3aGljaCBjb250YWlucyBhIGh1bWFuLXJlYWRhYmxlIG1lc3NhZ2UgZGV0YWlsaW5nIHdoeVxuICAgICAqIHRoZSByZXF1ZXN0IGZhaWxlZC5cbiAgICAgKi9cbiAgICBhc3luYyBjaGVja0VtYWlsTGlua0NsaWNrZWQoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmRvZXNTZXJ2ZXJTdXBwb3J0U2VwYXJhdGVBZGRBbmRCaW5kKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5iaW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhDbGllbnQgPSBuZXcgSWRlbnRpdHlBdXRoQ2xpZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlkZW50aXR5QWNjZXNzVG9rZW4gPSBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5iaW5kVGhyZWVQaWQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHRoaXMuY2xpZW50U2VjcmV0LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWRfc2VydmVyOiBnZXRJZFNlcnZlckRvbWFpbigpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWRfYWNjZXNzX3Rva2VuOiBpZGVudGl0eUFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fbWFrZUFkZFRocmVlcGlkT25seVJlcXVlc3QoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHNwZWMgaGFzIGFsd2F5cyByZXF1aXJlZCB0aGlzIHRvIHVzZSBVSSBhdXRoIGJ1dCBzeW5hcHNlIGJyaWVmbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGltcGxlbWVudGVkIGl0IHdpdGhvdXQsIHNvIHRoaXMgbWF5IGp1c3Qgc3VjY2VlZCBhbmQgdGhhdCdzIE9LLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5odHRwU3RhdHVzICE9PSA0MDEgfHwgIWUuZGF0YSB8fCAhZS5kYXRhLmZsb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9lc24ndCBsb29rIGxpa2UgYW4gaW50ZXJhY3RpdmUtYXV0aCBmYWlsdXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcG9wIHVwIGFuIGludGVyYWN0aXZlIGF1dGggZGlhbG9nXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBJbnRlcmFjdGl2ZUF1dGhEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5JbnRlcmFjdGl2ZUF1dGhEaWFsb2dcIik7XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlhbG9nQWVzdGhldGljcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdChcIlVzZSBTaW5nbGUgU2lnbiBPbiB0byBjb250aW51ZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogX3QoXCJDb25maXJtIGFkZGluZyB0aGlzIGVtYWlsIGFkZHJlc3MgYnkgdXNpbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJTaW5nbGUgU2lnbiBPbiB0byBwcm92ZSB5b3VyIGlkZW50aXR5LlwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIlNpbmdsZSBTaWduIE9uXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZUtpbmQ6IFwicHJpbWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5QSEFTRV9QT1NUQVVUSF06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiQ29uZmlybSBhZGRpbmcgZW1haWxcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiQ2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byBjb25maXJtIGFkZGluZyB0aGlzIGVtYWlsIGFkZHJlc3MuXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVRleHQ6IF90KFwiQ29uZmlybVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcInByaW1hcnlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZmluaXNoZWQgfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0FkZCBFbWFpbCcsICcnLCBJbnRlcmFjdGl2ZUF1dGhEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJBZGQgRW1haWwgQWRkcmVzc1wiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRyaXhDbGllbnQ6IE1hdHJpeENsaWVudFBlZy5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRoRGF0YTogZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ha2VSZXF1ZXN0OiB0aGlzLl9tYWtlQWRkVGhyZWVwaWRPbmx5UmVxdWVzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZXN0aGV0aWNzRm9yU3RhZ2VQaGFzZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5MT0dJTl9UWVBFXTogZGlhbG9nQWVzdGhldGljcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5VTlNUQUJMRV9MT0dJTl9UWVBFXTogZGlhbG9nQWVzdGhldGljcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmluaXNoZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5hZGRUaHJlZVBpZCh7XG4gICAgICAgICAgICAgICAgICAgIHNpZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHRoaXMuY2xpZW50U2VjcmV0LFxuICAgICAgICAgICAgICAgICAgICBpZF9zZXJ2ZXI6IGdldElkU2VydmVyRG9tYWluKCksXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5iaW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLmh0dHBTdGF0dXMgPT09IDQwMSkge1xuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gX3QoJ0ZhaWxlZCB0byB2ZXJpZnkgZW1haWwgYWRkcmVzczogbWFrZSBzdXJlIHlvdSBjbGlja2VkIHRoZSBsaW5rIGluIHRoZSBlbWFpbCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIuaHR0cFN0YXR1cykge1xuICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlICs9IGAgKFN0YXR1cyAke2Vyci5odHRwU3RhdHVzfSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGF1dGggVUkgYXV0aCBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPE9iamVjdD59IFJlc3BvbnNlIGZyb20gLzNwaWQvYWRkIGNhbGwgKGluIGN1cnJlbnQgc3BlYywgYW4gZW1wdHkgb2JqZWN0KVxuICAgICAqL1xuICAgIF9tYWtlQWRkVGhyZWVwaWRPbmx5UmVxdWVzdCA9IChhdXRoKSA9PiB7XG4gICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuYWRkVGhyZWVQaWRPbmx5KHtcbiAgICAgICAgICAgIHNpZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgICAgICBjbGllbnRfc2VjcmV0OiB0aGlzLmNsaWVudFNlY3JldCxcbiAgICAgICAgICAgIGF1dGgsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRha2VzIGEgcGhvbmUgbnVtYmVyIHZlcmlmaWNhdGlvbiBjb2RlIGFzIGVudGVyZWQgYnkgdGhlIHVzZXIgYW5kIHZhbGlkYXRlc1xuICAgICAqIGl0IHdpdGggdGhlIElEIHNlcnZlciwgdGhlbiBpZiBzdWNjZXNzZnVsLCBhZGRzIHRoZSBwaG9uZSBudW1iZXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zaXNkblRva2VuIHBob25lIG51bWJlciB2ZXJpZmljYXRpb24gY29kZSBhcyBlbnRlcmVkIGJ5IHRoZSB1c2VyXG4gICAgICogQHJldHVybiB7UHJvbWlzZX0gUmVzb2x2ZXMgaWYgdGhlIHBob25lIG51bWJlciB3YXMgYWRkZWQuIFJlamVjdHMgd2l0aCBhbiBvYmplY3RcbiAgICAgKiB3aXRoIGEgXCJtZXNzYWdlXCIgcHJvcGVydHkgd2hpY2ggY29udGFpbnMgYSBodW1hbi1yZWFkYWJsZSBtZXNzYWdlIGRldGFpbGluZyB3aHlcbiAgICAgKiB0aGUgcmVxdWVzdCBmYWlsZWQuXG4gICAgICovXG4gICAgYXN5bmMgaGF2ZU1zaXNkblRva2VuKG1zaXNkblRva2VuKSB7XG4gICAgICAgIGNvbnN0IGF1dGhDbGllbnQgPSBuZXcgSWRlbnRpdHlBdXRoQ2xpZW50KCk7XG4gICAgICAgIGNvbnN0IHN1cHBvcnRzU2VwYXJhdGVBZGRBbmRCaW5kID1cbiAgICAgICAgICAgIGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5kb2VzU2VydmVyU3VwcG9ydFNlcGFyYXRlQWRkQW5kQmluZCgpO1xuXG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIGlmICh0aGlzLnN1Ym1pdFVybCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLnN1Ym1pdE1zaXNkblRva2VuT3RoZXJVcmwoXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJtaXRVcmwsXG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgdGhpcy5jbGllbnRTZWNyZXQsXG4gICAgICAgICAgICAgICAgbXNpc2RuVG9rZW4sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYmluZCB8fCAhc3VwcG9ydHNTZXBhcmF0ZUFkZEFuZEJpbmQpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5zdWJtaXRNc2lzZG5Ub2tlbihcbiAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudFNlY3JldCxcbiAgICAgICAgICAgICAgICBtc2lzZG5Ub2tlbixcbiAgICAgICAgICAgICAgICBhd2FpdCBhdXRoQ2xpZW50LmdldEFjY2Vzc1Rva2VuKCksXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGFkZCAvIGJpbmQgd2l0aCBNU0lTRE4gZmxvdyBpcyBtaXNjb25maWd1cmVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQuZXJyY29kZSkge1xuICAgICAgICAgICAgdGhyb3cgcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1cHBvcnRzU2VwYXJhdGVBZGRBbmRCaW5kKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmJpbmRUaHJlZVBpZCh7XG4gICAgICAgICAgICAgICAgICAgIHNpZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudF9zZWNyZXQ6IHRoaXMuY2xpZW50U2VjcmV0LFxuICAgICAgICAgICAgICAgICAgICBpZF9zZXJ2ZXI6IGdldElkU2VydmVyRG9tYWluKCksXG4gICAgICAgICAgICAgICAgICAgIGlkX2FjY2Vzc190b2tlbjogYXdhaXQgYXV0aENsaWVudC5nZXRBY2Nlc3NUb2tlbigpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9tYWtlQWRkVGhyZWVwaWRPbmx5UmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBzcGVjIGhhcyBhbHdheXMgcmVxdWlyZWQgdGhpcyB0byB1c2UgVUkgYXV0aCBidXQgc3luYXBzZSBicmllZmx5XG4gICAgICAgICAgICAgICAgICAgIC8vIGltcGxlbWVudGVkIGl0IHdpdGhvdXQsIHNvIHRoaXMgbWF5IGp1c3Qgc3VjY2VlZCBhbmQgdGhhdCdzIE9LLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5odHRwU3RhdHVzICE9PSA0MDEgfHwgIWUuZGF0YSB8fCAhZS5kYXRhLmZsb3dzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb2Vzbid0IGxvb2sgbGlrZSBhbiBpbnRlcmFjdGl2ZS1hdXRoIGZhaWx1cmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBwb3AgdXAgYW4gaW50ZXJhY3RpdmUgYXV0aCBkaWFsb2dcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgSW50ZXJhY3RpdmVBdXRoRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuSW50ZXJhY3RpdmVBdXRoRGlhbG9nXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpYWxvZ0Flc3RoZXRpY3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlBIQVNFX1BSRUFVVEhdOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiVXNlIFNpbmdsZSBTaWduIE9uIHRvIGNvbnRpbnVlXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiQ29uZmlybSBhZGRpbmcgdGhpcyBwaG9uZSBudW1iZXIgYnkgdXNpbmcgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlNpbmdsZSBTaWduIE9uIHRvIHByb3ZlIHlvdXIgaWRlbnRpdHkuXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlVGV4dDogX3QoXCJTaW5nbGUgU2lnbiBPblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZUtpbmQ6IFwicHJpbWFyeVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtTU09BdXRoRW50cnkuUEhBU0VfUE9TVEFVVEhdOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiQ29uZmlybSBhZGRpbmcgcGhvbmUgbnVtYmVyXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IF90KFwiQ2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byBjb25maXJtIGFkZGluZyB0aGlzIHBob25lIG51bWJlci5cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVUZXh0OiBfdChcIkNvbmZpcm1cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVLaW5kOiBcInByaW1hcnlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZmluaXNoZWQgfSA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0FkZCBNU0lTRE4nLCAnJywgSW50ZXJhY3RpdmVBdXRoRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJBZGQgUGhvbmUgTnVtYmVyXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0cml4Q2xpZW50OiBNYXRyaXhDbGllbnRQZWcuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRoRGF0YTogZS5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFrZVJlcXVlc3Q6IHRoaXMuX21ha2VBZGRUaHJlZXBpZE9ubHlSZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWVzdGhldGljc0ZvclN0YWdlUGhhc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW1NTT0F1dGhFbnRyeS5MT0dJTl9UWVBFXTogZGlhbG9nQWVzdGhldGljcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbU1NPQXV0aEVudHJ5LlVOU1RBQkxFX0xPR0lOX1RZUEVdOiBkaWFsb2dBZXN0aGV0aWNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaW5pc2hlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuYWRkVGhyZWVQaWQoe1xuICAgICAgICAgICAgICAgIHNpZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgY2xpZW50X3NlY3JldDogdGhpcy5jbGllbnRTZWNyZXQsXG4gICAgICAgICAgICAgICAgaWRfc2VydmVyOiBnZXRJZFNlcnZlckRvbWFpbigpLFxuICAgICAgICAgICAgfSwgdGhpcy5iaW5kKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==