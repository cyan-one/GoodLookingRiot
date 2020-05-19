"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PendingActionSpinner = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

/*
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
const PendingActionSpinner = ({
  text
}) => {
  const Spinner = sdk.getComponent('elements.Spinner');
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_EncryptionInfo_spinner"
  }, /*#__PURE__*/_react.default.createElement(Spinner, null), text);
};

exports.PendingActionSpinner = PendingActionSpinner;

const EncryptionInfo = ({
  waitingForOtherParty,
  waitingForNetwork,
  member,
  onStartVerification,
  isRoomEncrypted,
  inDialog,
  isSelfVerification
}) => {
  let content;

  if (waitingForOtherParty || waitingForNetwork) {
    let text;

    if (waitingForOtherParty) {
      if (isSelfVerification) {
        text = (0, _languageHandler._t)("Waiting for you to accept on your other session…");
      } else {
        text = (0, _languageHandler._t)("Waiting for %(displayName)s to accept…", {
          displayName: member.displayName || member.name || member.userId
        });
      }
    } else {
      text = (0, _languageHandler._t)("Accepting…");
    }

    content = /*#__PURE__*/_react.default.createElement(PendingActionSpinner, {
      text: text
    });
  } else {
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    content = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
      kind: "primary",
      className: "mx_UserInfo_wideButton",
      onClick: onStartVerification
    }, (0, _languageHandler._t)("Start Verification"));
  }

  let description;

  if (isRoomEncrypted) {
    description = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Messages in this room are end-to-end encrypted.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Your messages are secured and only you and the recipient have the unique keys to unlock them.")));
  } else {
    description = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Messages in this room are not end-to-end encrypted.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("In encrypted rooms, your messages are secured and only you and the recipient have the unique keys to unlock them.")));
  }

  if (inDialog) {
    return content;
  }

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container"
  }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Encryption")), description), /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_UserInfo_container"
  }, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)("Verify User")), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("For extra security, verify this user by checking a one-time code on both of your devices.")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("To be secure, do this in person or use a trusted way to communicate.")), content)));
};

EncryptionInfo.propTypes = {
  member: _propTypes.default.object.isRequired,
  onStartVerification: _propTypes.default.func.isRequired,
  request: _propTypes.default.object
};
var _default = EncryptionInfo;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3JpZ2h0X3BhbmVsL0VuY3J5cHRpb25JbmZvLmpzIl0sIm5hbWVzIjpbIlBlbmRpbmdBY3Rpb25TcGlubmVyIiwidGV4dCIsIlNwaW5uZXIiLCJzZGsiLCJnZXRDb21wb25lbnQiLCJFbmNyeXB0aW9uSW5mbyIsIndhaXRpbmdGb3JPdGhlclBhcnR5Iiwid2FpdGluZ0Zvck5ldHdvcmsiLCJtZW1iZXIiLCJvblN0YXJ0VmVyaWZpY2F0aW9uIiwiaXNSb29tRW5jcnlwdGVkIiwiaW5EaWFsb2ciLCJpc1NlbGZWZXJpZmljYXRpb24iLCJjb250ZW50IiwiZGlzcGxheU5hbWUiLCJuYW1lIiwidXNlcklkIiwiQWNjZXNzaWJsZUJ1dHRvbiIsImRlc2NyaXB0aW9uIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImZ1bmMiLCJyZXF1ZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFwQkE7Ozs7Ozs7Ozs7Ozs7OztBQXNCTyxNQUFNQSxvQkFBb0IsR0FBRyxDQUFDO0FBQUNDLEVBQUFBO0FBQUQsQ0FBRCxLQUFZO0FBQzVDLFFBQU1DLE9BQU8sR0FBR0MsR0FBRyxDQUFDQyxZQUFKLENBQWlCLGtCQUFqQixDQUFoQjtBQUNBLHNCQUFPO0FBQUssSUFBQSxTQUFTLEVBQUM7QUFBZixrQkFDSCw2QkFBQyxPQUFELE9BREcsRUFFREgsSUFGQyxDQUFQO0FBSUgsQ0FOTTs7OztBQVFQLE1BQU1JLGNBQWMsR0FBRyxDQUFDO0FBQ3BCQyxFQUFBQSxvQkFEb0I7QUFFcEJDLEVBQUFBLGlCQUZvQjtBQUdwQkMsRUFBQUEsTUFIb0I7QUFJcEJDLEVBQUFBLG1CQUpvQjtBQUtwQkMsRUFBQUEsZUFMb0I7QUFNcEJDLEVBQUFBLFFBTm9CO0FBT3BCQyxFQUFBQTtBQVBvQixDQUFELEtBUWpCO0FBQ0YsTUFBSUMsT0FBSjs7QUFDQSxNQUFJUCxvQkFBb0IsSUFBSUMsaUJBQTVCLEVBQStDO0FBQzNDLFFBQUlOLElBQUo7O0FBQ0EsUUFBSUssb0JBQUosRUFBMEI7QUFDdEIsVUFBSU0sa0JBQUosRUFBd0I7QUFDcEJYLFFBQUFBLElBQUksR0FBRyx5QkFBRyxrREFBSCxDQUFQO0FBQ0gsT0FGRCxNQUVPO0FBQ0hBLFFBQUFBLElBQUksR0FBRyx5QkFBRyx3Q0FBSCxFQUE2QztBQUNoRGEsVUFBQUEsV0FBVyxFQUFFTixNQUFNLENBQUNNLFdBQVAsSUFBc0JOLE1BQU0sQ0FBQ08sSUFBN0IsSUFBcUNQLE1BQU0sQ0FBQ1E7QUFEVCxTQUE3QyxDQUFQO0FBR0g7QUFDSixLQVJELE1BUU87QUFDSGYsTUFBQUEsSUFBSSxHQUFHLHlCQUFHLFlBQUgsQ0FBUDtBQUNIOztBQUNEWSxJQUFBQSxPQUFPLGdCQUFHLDZCQUFDLG9CQUFEO0FBQXNCLE1BQUEsSUFBSSxFQUFFWjtBQUE1QixNQUFWO0FBQ0gsR0FkRCxNQWNPO0FBQ0gsVUFBTWdCLGdCQUFnQixHQUFHZCxHQUFHLENBQUNDLFlBQUosQ0FBaUIsMkJBQWpCLENBQXpCO0FBQ0FTLElBQUFBLE9BQU8sZ0JBQ0gsNkJBQUMsZ0JBQUQ7QUFBa0IsTUFBQSxJQUFJLEVBQUMsU0FBdkI7QUFBaUMsTUFBQSxTQUFTLEVBQUMsd0JBQTNDO0FBQW9FLE1BQUEsT0FBTyxFQUFFSjtBQUE3RSxPQUNLLHlCQUFHLG9CQUFILENBREwsQ0FESjtBQUtIOztBQUVELE1BQUlTLFdBQUo7O0FBQ0EsTUFBSVIsZUFBSixFQUFxQjtBQUNqQlEsSUFBQUEsV0FBVyxnQkFDUCx1REFDSSx3Q0FBSSx5QkFBRyxpREFBSCxDQUFKLENBREosZUFFSSx3Q0FBSSx5QkFBRywrRkFBSCxDQUFKLENBRkosQ0FESjtBQU1ILEdBUEQsTUFPTztBQUNIQSxJQUFBQSxXQUFXLGdCQUNQLHVEQUNJLHdDQUFJLHlCQUFHLHFEQUFILENBQUosQ0FESixlQUVJLHdDQUFJLHlCQUFHLG1IQUFILENBQUosQ0FGSixDQURKO0FBTUg7O0FBRUQsTUFBSVAsUUFBSixFQUFjO0FBQ1YsV0FBT0UsT0FBUDtBQUNIOztBQUVELHNCQUFPLDZCQUFDLGNBQUQsQ0FBTyxRQUFQLHFCQUNIO0FBQUssSUFBQSxTQUFTLEVBQUM7QUFBZixrQkFDSSx5Q0FBSyx5QkFBRyxZQUFILENBQUwsQ0FESixFQUVNSyxXQUZOLENBREcsZUFLSDtBQUFLLElBQUEsU0FBUyxFQUFDO0FBQWYsa0JBQ0kseUNBQUsseUJBQUcsYUFBSCxDQUFMLENBREosZUFFSSx1REFDSSx3Q0FBSSx5QkFBRywyRkFBSCxDQUFKLENBREosZUFFSSx3Q0FBSSx5QkFBRyxzRUFBSCxDQUFKLENBRkosRUFHTUwsT0FITixDQUZKLENBTEcsQ0FBUDtBQWNILENBcEVEOztBQXFFQVIsY0FBYyxDQUFDYyxTQUFmLEdBQTJCO0FBQ3ZCWCxFQUFBQSxNQUFNLEVBQUVZLG1CQUFVQyxNQUFWLENBQWlCQyxVQURGO0FBRXZCYixFQUFBQSxtQkFBbUIsRUFBRVcsbUJBQVVHLElBQVYsQ0FBZUQsVUFGYjtBQUd2QkUsRUFBQUEsT0FBTyxFQUFFSixtQkFBVUM7QUFISSxDQUEzQjtlQU1laEIsYyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSwgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSBcInByb3AtdHlwZXNcIjtcblxuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IHtfdH0gZnJvbSBcIi4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlclwiO1xuXG5leHBvcnQgY29uc3QgUGVuZGluZ0FjdGlvblNwaW5uZXIgPSAoe3RleHR9KSA9PiB7XG4gICAgY29uc3QgU3Bpbm5lciA9IHNkay5nZXRDb21wb25lbnQoJ2VsZW1lbnRzLlNwaW5uZXInKTtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9FbmNyeXB0aW9uSW5mb19zcGlubmVyXCI+XG4gICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgIHsgdGV4dCB9XG4gICAgPC9kaXY+O1xufTtcblxuY29uc3QgRW5jcnlwdGlvbkluZm8gPSAoe1xuICAgIHdhaXRpbmdGb3JPdGhlclBhcnR5LFxuICAgIHdhaXRpbmdGb3JOZXR3b3JrLFxuICAgIG1lbWJlcixcbiAgICBvblN0YXJ0VmVyaWZpY2F0aW9uLFxuICAgIGlzUm9vbUVuY3J5cHRlZCxcbiAgICBpbkRpYWxvZyxcbiAgICBpc1NlbGZWZXJpZmljYXRpb24sXG59KSA9PiB7XG4gICAgbGV0IGNvbnRlbnQ7XG4gICAgaWYgKHdhaXRpbmdGb3JPdGhlclBhcnR5IHx8IHdhaXRpbmdGb3JOZXR3b3JrKSB7XG4gICAgICAgIGxldCB0ZXh0O1xuICAgICAgICBpZiAod2FpdGluZ0Zvck90aGVyUGFydHkpIHtcbiAgICAgICAgICAgIGlmIChpc1NlbGZWZXJpZmljYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0ZXh0ID0gX3QoXCJXYWl0aW5nIGZvciB5b3UgdG8gYWNjZXB0IG9uIHlvdXIgb3RoZXIgc2Vzc2lvbuKAplwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IF90KFwiV2FpdGluZyBmb3IgJShkaXNwbGF5TmFtZSlzIHRvIGFjY2VwdOKAplwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBtZW1iZXIuZGlzcGxheU5hbWUgfHwgbWVtYmVyLm5hbWUgfHwgbWVtYmVyLnVzZXJJZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRleHQgPSBfdChcIkFjY2VwdGluZ+KAplwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZW50ID0gPFBlbmRpbmdBY3Rpb25TcGlubmVyIHRleHQ9e3RleHR9IC8+O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IEFjY2Vzc2libGVCdXR0b24gPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5BY2Nlc3NpYmxlQnV0dG9uJyk7XG4gICAgICAgIGNvbnRlbnQgPSAoXG4gICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX3dpZGVCdXR0b25cIiBvbkNsaWNrPXtvblN0YXJ0VmVyaWZpY2F0aW9ufT5cbiAgICAgICAgICAgICAgICB7X3QoXCJTdGFydCBWZXJpZmljYXRpb25cIil9XG4gICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IGRlc2NyaXB0aW9uO1xuICAgIGlmIChpc1Jvb21FbmNyeXB0ZWQpIHtcbiAgICAgICAgZGVzY3JpcHRpb24gPSAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcIk1lc3NhZ2VzIGluIHRoaXMgcm9vbSBhcmUgZW5kLXRvLWVuZCBlbmNyeXB0ZWQuXCIpfTwvcD5cbiAgICAgICAgICAgICAgICA8cD57X3QoXCJZb3VyIG1lc3NhZ2VzIGFyZSBzZWN1cmVkIGFuZCBvbmx5IHlvdSBhbmQgdGhlIHJlY2lwaWVudCBoYXZlIHRoZSB1bmlxdWUga2V5cyB0byB1bmxvY2sgdGhlbS5cIil9PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGVzY3JpcHRpb24gPSAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcIk1lc3NhZ2VzIGluIHRoaXMgcm9vbSBhcmUgbm90IGVuZC10by1lbmQgZW5jcnlwdGVkLlwiKX08L3A+XG4gICAgICAgICAgICAgICAgPHA+e190KFwiSW4gZW5jcnlwdGVkIHJvb21zLCB5b3VyIG1lc3NhZ2VzIGFyZSBzZWN1cmVkIGFuZCBvbmx5IHlvdSBhbmQgdGhlIHJlY2lwaWVudCBoYXZlIHRoZSB1bmlxdWUga2V5cyB0byB1bmxvY2sgdGhlbS5cIil9PC9wPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGluRGlhbG9nKSB7XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cblxuICAgIHJldHVybiA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlckluZm9fY29udGFpbmVyXCI+XG4gICAgICAgICAgICA8aDM+e190KFwiRW5jcnlwdGlvblwiKX08L2gzPlxuICAgICAgICAgICAgeyBkZXNjcmlwdGlvbiB9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJJbmZvX2NvbnRhaW5lclwiPlxuICAgICAgICAgICAgPGgzPntfdChcIlZlcmlmeSBVc2VyXCIpfTwvaDM+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxwPntfdChcIkZvciBleHRyYSBzZWN1cml0eSwgdmVyaWZ5IHRoaXMgdXNlciBieSBjaGVja2luZyBhIG9uZS10aW1lIGNvZGUgb24gYm90aCBvZiB5b3VyIGRldmljZXMuXCIpfTwvcD5cbiAgICAgICAgICAgICAgICA8cD57X3QoXCJUbyBiZSBzZWN1cmUsIGRvIHRoaXMgaW4gcGVyc29uIG9yIHVzZSBhIHRydXN0ZWQgd2F5IHRvIGNvbW11bmljYXRlLlwiKX08L3A+XG4gICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L1JlYWN0LkZyYWdtZW50Pjtcbn07XG5FbmNyeXB0aW9uSW5mby5wcm9wVHlwZXMgPSB7XG4gICAgbWVtYmVyOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgb25TdGFydFZlcmlmaWNhdGlvbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICByZXF1ZXN0OiBQcm9wVHlwZXMub2JqZWN0LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgRW5jcnlwdGlvbkluZm87XG4iXX0=