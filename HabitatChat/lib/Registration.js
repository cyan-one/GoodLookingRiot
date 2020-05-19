"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startAnyRegistrationFlow = startAnyRegistrationFlow;
exports.SAFE_LOCALPART_REGEX = void 0;

var _dispatcher = _interopRequireDefault(require("./dispatcher/dispatcher"));

var sdk = _interopRequireWildcard(require("./index"));

var _Modal = _interopRequireDefault(require("./Modal"));

var _languageHandler = require("./languageHandler");

/*
Copyright 2018 New Vector Ltd

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
 * Utility code for registering with a homeserver
 * Note that this is currently *not* used by the actual
 * registration code.
 */
// import {MatrixClientPeg} from './MatrixClientPeg';
// Regex for what a "safe" or "Matrix-looking" localpart would be.
// TODO: Update as needed for https://github.com/matrix-org/matrix-doc/issues/1514
const SAFE_LOCALPART_REGEX = /^[a-z0-9=_\-./]+$/;
/**
 * Starts either the ILAG or full registration flow, depending
 * on what the HS supports
 *
 * @param {object} options
 * @param {bool} options.go_home_on_cancel
 *     If true, goes to the home page if the user cancels the action
 * @param {bool} options.go_welcome_on_cancel
 *     If true, goes to the welcome page if the user cancels the action
 * @param {bool} options.screen_after
 *     If present the screen to redirect to after a successful login or register.
 */

exports.SAFE_LOCALPART_REGEX = SAFE_LOCALPART_REGEX;

async function startAnyRegistrationFlow(options) {
  if (options === undefined) options = {}; // look for an ILAG compatible flow. We define this as one
  // which has only dummy or recaptcha flows. In practice it
  // would support any stage InteractiveAuth supports, just not
  // ones like email & msisdn which require the user to supply
  // the relevant details in advance. We err on the side of
  // caution though.
  // XXX: ILAG is disabled for now,
  // see https://github.com/vector-im/riot-web/issues/8222
  // const flows = await _getRegistrationFlows();
  // const hasIlagFlow = flows.some((flow) => {
  //     return flow.stages.every((stage) => {
  //         return ['m.login.dummy', 'm.login.recaptcha', 'm.login.terms'].includes(stage);
  //     });
  // });
  // if (hasIlagFlow) {
  //     dis.dispatch({
  //         action: 'view_set_mxid',
  //         go_home_on_cancel: options.go_home_on_cancel,
  //     });
  //} else {

  const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");

  const modal = _Modal.default.createTrackedDialog('Registration required', '', QuestionDialog, {
    hasCancelButton: true,
    quitOnly: true,
    title: (0, _languageHandler._t)("Sign In or Create Account"),
    description: (0, _languageHandler._t)("Use your account or create a new one to continue."),
    button: (0, _languageHandler._t)("Create Account"),
    extraButtons: [/*#__PURE__*/React.createElement("button", {
      key: "start_login",
      onClick: () => {
        modal.close();

        _dispatcher.default.dispatch({
          action: 'start_login',
          screenAfterLogin: options.screen_after
        });
      }
    }, (0, _languageHandler._t)('Sign In'))],
    onFinished: proceed => {
      if (proceed) {
        _dispatcher.default.dispatch({
          action: 'start_registration',
          screenAfterLogin: options.screen_after
        });
      } else if (options.go_home_on_cancel) {
        _dispatcher.default.dispatch({
          action: 'view_home_page'
        });
      } else if (options.go_welcome_on_cancel) {
        _dispatcher.default.dispatch({
          action: 'view_welcome_page'
        });
      }
    }
  }); //}

} // async function _getRegistrationFlows() {
//     try {
//         await MatrixClientPeg.get().register(
//             null,
//             null,
//             undefined,
//             {},
//             {},
//         );
//         console.log("Register request succeeded when it should have returned 401!");
//     } catch (e) {
//         if (e.httpStatus === 401) {
//             return e.data.flows;
//         }
//         throw e;
//     }
//     throw new Error("Register request succeeded when it should have returned 401!");
// }
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9SZWdpc3RyYXRpb24uanMiXSwibmFtZXMiOlsiU0FGRV9MT0NBTFBBUlRfUkVHRVgiLCJzdGFydEFueVJlZ2lzdHJhdGlvbkZsb3ciLCJvcHRpb25zIiwidW5kZWZpbmVkIiwiUXVlc3Rpb25EaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJtb2RhbCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsImhhc0NhbmNlbEJ1dHRvbiIsInF1aXRPbmx5IiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImJ1dHRvbiIsImV4dHJhQnV0dG9ucyIsImNsb3NlIiwiZGlzIiwiZGlzcGF0Y2giLCJhY3Rpb24iLCJzY3JlZW5BZnRlckxvZ2luIiwic2NyZWVuX2FmdGVyIiwib25GaW5pc2hlZCIsInByb2NlZWQiLCJnb19ob21lX29uX2NhbmNlbCIsImdvX3dlbGNvbWVfb25fY2FuY2VsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFzQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBekJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBOzs7OztBQVVBO0FBRUE7QUFDQTtBQUNPLE1BQU1BLG9CQUFvQixHQUFHLG1CQUE3QjtBQUVQOzs7Ozs7Ozs7Ozs7Ozs7QUFZTyxlQUFlQyx3QkFBZixDQUF3Q0MsT0FBeEMsRUFBaUQ7QUFDcEQsTUFBSUEsT0FBTyxLQUFLQyxTQUFoQixFQUEyQkQsT0FBTyxHQUFHLEVBQVYsQ0FEeUIsQ0FFcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDSSxRQUFNRSxjQUFjLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBdkI7O0FBQ0EsUUFBTUMsS0FBSyxHQUFHQyxlQUFNQyxtQkFBTixDQUEwQix1QkFBMUIsRUFBbUQsRUFBbkQsRUFBdURMLGNBQXZELEVBQXVFO0FBQ2pGTSxJQUFBQSxlQUFlLEVBQUUsSUFEZ0U7QUFFakZDLElBQUFBLFFBQVEsRUFBRSxJQUZ1RTtBQUdqRkMsSUFBQUEsS0FBSyxFQUFFLHlCQUFHLDJCQUFILENBSDBFO0FBSWpGQyxJQUFBQSxXQUFXLEVBQUUseUJBQUcsbURBQUgsQ0FKb0U7QUFLakZDLElBQUFBLE1BQU0sRUFBRSx5QkFBRyxnQkFBSCxDQUx5RTtBQU1qRkMsSUFBQUEsWUFBWSxFQUFFLGNBQ1Y7QUFBUSxNQUFBLEdBQUcsRUFBQyxhQUFaO0FBQTBCLE1BQUEsT0FBTyxFQUFFLE1BQU07QUFDckNSLFFBQUFBLEtBQUssQ0FBQ1MsS0FBTjs7QUFDQUMsNEJBQUlDLFFBQUosQ0FBYTtBQUFDQyxVQUFBQSxNQUFNLEVBQUUsYUFBVDtBQUF3QkMsVUFBQUEsZ0JBQWdCLEVBQUVsQixPQUFPLENBQUNtQjtBQUFsRCxTQUFiO0FBQ0g7QUFIRCxPQUdLLHlCQUFHLFNBQUgsQ0FITCxDQURVLENBTm1FO0FBWWpGQyxJQUFBQSxVQUFVLEVBQUdDLE9BQUQsSUFBYTtBQUNyQixVQUFJQSxPQUFKLEVBQWE7QUFDVE4sNEJBQUlDLFFBQUosQ0FBYTtBQUFDQyxVQUFBQSxNQUFNLEVBQUUsb0JBQVQ7QUFBK0JDLFVBQUFBLGdCQUFnQixFQUFFbEIsT0FBTyxDQUFDbUI7QUFBekQsU0FBYjtBQUNILE9BRkQsTUFFTyxJQUFJbkIsT0FBTyxDQUFDc0IsaUJBQVosRUFBK0I7QUFDbENQLDRCQUFJQyxRQUFKLENBQWE7QUFBQ0MsVUFBQUEsTUFBTSxFQUFFO0FBQVQsU0FBYjtBQUNILE9BRk0sTUFFQSxJQUFJakIsT0FBTyxDQUFDdUIsb0JBQVosRUFBa0M7QUFDckNSLDRCQUFJQyxRQUFKLENBQWE7QUFBQ0MsVUFBQUEsTUFBTSxFQUFFO0FBQVQsU0FBYjtBQUNIO0FBQ0o7QUFwQmdGLEdBQXZFLENBQWQsQ0ExQmdELENBZ0RwRDs7QUFDSCxDLENBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE4IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLyoqXG4gKiBVdGlsaXR5IGNvZGUgZm9yIHJlZ2lzdGVyaW5nIHdpdGggYSBob21lc2VydmVyXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBjdXJyZW50bHkgKm5vdCogdXNlZCBieSB0aGUgYWN0dWFsXG4gKiByZWdpc3RyYXRpb24gY29kZS5cbiAqL1xuXG5pbXBvcnQgZGlzIGZyb20gJy4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuL2luZGV4JztcbmltcG9ydCBNb2RhbCBmcm9tICcuL01vZGFsJztcbmltcG9ydCB7IF90IH0gZnJvbSAnLi9sYW5ndWFnZUhhbmRsZXInO1xuLy8gaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4vTWF0cml4Q2xpZW50UGVnJztcblxuLy8gUmVnZXggZm9yIHdoYXQgYSBcInNhZmVcIiBvciBcIk1hdHJpeC1sb29raW5nXCIgbG9jYWxwYXJ0IHdvdWxkIGJlLlxuLy8gVE9ETzogVXBkYXRlIGFzIG5lZWRlZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL21hdHJpeC1vcmcvbWF0cml4LWRvYy9pc3N1ZXMvMTUxNFxuZXhwb3J0IGNvbnN0IFNBRkVfTE9DQUxQQVJUX1JFR0VYID0gL15bYS16MC05PV9cXC0uL10rJC87XG5cbi8qKlxuICogU3RhcnRzIGVpdGhlciB0aGUgSUxBRyBvciBmdWxsIHJlZ2lzdHJhdGlvbiBmbG93LCBkZXBlbmRpbmdcbiAqIG9uIHdoYXQgdGhlIEhTIHN1cHBvcnRzXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7Ym9vbH0gb3B0aW9ucy5nb19ob21lX29uX2NhbmNlbFxuICogICAgIElmIHRydWUsIGdvZXMgdG8gdGhlIGhvbWUgcGFnZSBpZiB0aGUgdXNlciBjYW5jZWxzIHRoZSBhY3Rpb25cbiAqIEBwYXJhbSB7Ym9vbH0gb3B0aW9ucy5nb193ZWxjb21lX29uX2NhbmNlbFxuICogICAgIElmIHRydWUsIGdvZXMgdG8gdGhlIHdlbGNvbWUgcGFnZSBpZiB0aGUgdXNlciBjYW5jZWxzIHRoZSBhY3Rpb25cbiAqIEBwYXJhbSB7Ym9vbH0gb3B0aW9ucy5zY3JlZW5fYWZ0ZXJcbiAqICAgICBJZiBwcmVzZW50IHRoZSBzY3JlZW4gdG8gcmVkaXJlY3QgdG8gYWZ0ZXIgYSBzdWNjZXNzZnVsIGxvZ2luIG9yIHJlZ2lzdGVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRBbnlSZWdpc3RyYXRpb25GbG93KG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSBvcHRpb25zID0ge307XG4gICAgLy8gbG9vayBmb3IgYW4gSUxBRyBjb21wYXRpYmxlIGZsb3cuIFdlIGRlZmluZSB0aGlzIGFzIG9uZVxuICAgIC8vIHdoaWNoIGhhcyBvbmx5IGR1bW15IG9yIHJlY2FwdGNoYSBmbG93cy4gSW4gcHJhY3RpY2UgaXRcbiAgICAvLyB3b3VsZCBzdXBwb3J0IGFueSBzdGFnZSBJbnRlcmFjdGl2ZUF1dGggc3VwcG9ydHMsIGp1c3Qgbm90XG4gICAgLy8gb25lcyBsaWtlIGVtYWlsICYgbXNpc2RuIHdoaWNoIHJlcXVpcmUgdGhlIHVzZXIgdG8gc3VwcGx5XG4gICAgLy8gdGhlIHJlbGV2YW50IGRldGFpbHMgaW4gYWR2YW5jZS4gV2UgZXJyIG9uIHRoZSBzaWRlIG9mXG4gICAgLy8gY2F1dGlvbiB0aG91Z2guXG5cbiAgICAvLyBYWFg6IElMQUcgaXMgZGlzYWJsZWQgZm9yIG5vdyxcbiAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3ZlY3Rvci1pbS9yaW90LXdlYi9pc3N1ZXMvODIyMlxuXG4gICAgLy8gY29uc3QgZmxvd3MgPSBhd2FpdCBfZ2V0UmVnaXN0cmF0aW9uRmxvd3MoKTtcbiAgICAvLyBjb25zdCBoYXNJbGFnRmxvdyA9IGZsb3dzLnNvbWUoKGZsb3cpID0+IHtcbiAgICAvLyAgICAgcmV0dXJuIGZsb3cuc3RhZ2VzLmV2ZXJ5KChzdGFnZSkgPT4ge1xuICAgIC8vICAgICAgICAgcmV0dXJuIFsnbS5sb2dpbi5kdW1teScsICdtLmxvZ2luLnJlY2FwdGNoYScsICdtLmxvZ2luLnRlcm1zJ10uaW5jbHVkZXMoc3RhZ2UpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9KTtcblxuICAgIC8vIGlmIChoYXNJbGFnRmxvdykge1xuICAgIC8vICAgICBkaXMuZGlzcGF0Y2goe1xuICAgIC8vICAgICAgICAgYWN0aW9uOiAndmlld19zZXRfbXhpZCcsXG4gICAgLy8gICAgICAgICBnb19ob21lX29uX2NhbmNlbDogb3B0aW9ucy5nb19ob21lX29uX2NhbmNlbCxcbiAgICAvLyAgICAgfSk7XG4gICAgLy99IGVsc2Uge1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICBjb25zdCBtb2RhbCA9IE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlZ2lzdHJhdGlvbiByZXF1aXJlZCcsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgaGFzQ2FuY2VsQnV0dG9uOiB0cnVlLFxuICAgICAgICAgICAgcXVpdE9ubHk6IHRydWUsXG4gICAgICAgICAgICB0aXRsZTogX3QoXCJTaWduIEluIG9yIENyZWF0ZSBBY2NvdW50XCIpLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFwiVXNlIHlvdXIgYWNjb3VudCBvciBjcmVhdGUgYSBuZXcgb25lIHRvIGNvbnRpbnVlLlwiKSxcbiAgICAgICAgICAgIGJ1dHRvbjogX3QoXCJDcmVhdGUgQWNjb3VudFwiKSxcbiAgICAgICAgICAgIGV4dHJhQnV0dG9uczogW1xuICAgICAgICAgICAgICAgIDxidXR0b24ga2V5PVwic3RhcnRfbG9naW5cIiBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7YWN0aW9uOiAnc3RhcnRfbG9naW4nLCBzY3JlZW5BZnRlckxvZ2luOiBvcHRpb25zLnNjcmVlbl9hZnRlcn0pO1xuICAgICAgICAgICAgICAgIH19PnsgX3QoJ1NpZ24gSW4nKSB9PC9idXR0b24+LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IChwcm9jZWVkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHByb2NlZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdzdGFydF9yZWdpc3RyYXRpb24nLCBzY3JlZW5BZnRlckxvZ2luOiBvcHRpb25zLnNjcmVlbl9hZnRlcn0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5nb19ob21lX29uX2NhbmNlbCkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfaG9tZV9wYWdlJ30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5nb193ZWxjb21lX29uX2NhbmNlbCkge1xuICAgICAgICAgICAgICAgICAgICBkaXMuZGlzcGF0Y2goe2FjdGlvbjogJ3ZpZXdfd2VsY29tZV9wYWdlJ30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIC8vfVxufVxuXG4vLyBhc3luYyBmdW5jdGlvbiBfZ2V0UmVnaXN0cmF0aW9uRmxvd3MoKSB7XG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLnJlZ2lzdGVyKFxuLy8gICAgICAgICAgICAgbnVsbCxcbi8vICAgICAgICAgICAgIG51bGwsXG4vLyAgICAgICAgICAgICB1bmRlZmluZWQsXG4vLyAgICAgICAgICAgICB7fSxcbi8vICAgICAgICAgICAgIHt9LFxuLy8gICAgICAgICApO1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIlJlZ2lzdGVyIHJlcXVlc3Qgc3VjY2VlZGVkIHdoZW4gaXQgc2hvdWxkIGhhdmUgcmV0dXJuZWQgNDAxIVwiKTtcbi8vICAgICB9IGNhdGNoIChlKSB7XG4vLyAgICAgICAgIGlmIChlLmh0dHBTdGF0dXMgPT09IDQwMSkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIGUuZGF0YS5mbG93cztcbi8vICAgICAgICAgfVxuLy8gICAgICAgICB0aHJvdyBlO1xuLy8gICAgIH1cbi8vICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWdpc3RlciByZXF1ZXN0IHN1Y2NlZWRlZCB3aGVuIGl0IHNob3VsZCBoYXZlIHJldHVybmVkIDQwMSFcIik7XG4vLyB9XG4iXX0=