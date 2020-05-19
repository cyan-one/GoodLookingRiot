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

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _matrixJsSdk = require("matrix-js-sdk");

var _GroupStore = _interopRequireDefault(require("../../../stores/GroupStore"));

var _ContextMenu = require("../../structures/ContextMenu");

/*
Copyright 2018 Vector Creations Ltd
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
class GroupInviteTileContextMenu extends _react.default.Component {
  constructor(props) {
    super(props);
    this._onClickReject = this._onClickReject.bind(this);
  }

  componentDidMount() {
    this._unmounted = false;
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _onClickReject() {
    const QuestionDialog = sdk.getComponent('dialogs.QuestionDialog');

    _Modal.default.createTrackedDialog('Reject community invite', '', QuestionDialog, {
      title: (0, _languageHandler._t)('Reject invitation'),
      description: (0, _languageHandler._t)('Are you sure you want to reject the invitation?'),
      onFinished: async shouldLeave => {
        if (!shouldLeave) return; // FIXME: controller shouldn't be loading a view :(

        const Loader = sdk.getComponent("elements.Spinner");

        const modal = _Modal.default.createDialog(Loader, null, 'mx_Dialog_spinner');

        try {
          await _GroupStore.default.leaveGroup(this.props.group.groupId);
        } catch (e) {
          console.error("Error rejecting community invite: ", e);
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Error rejecting invite', '', ErrorDialog, {
            title: (0, _languageHandler._t)("Error"),
            description: (0, _languageHandler._t)("Unable to reject invite")
          });
        } finally {
          modal.close();
        }
      }
    }); // Close the context menu


    if (this.props.onFinished) {
      this.props.onFinished();
    }
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_ContextMenu.MenuItem, {
      className: "mx_RoomTileContextMenu_leave",
      onClick: this._onClickReject
    }, /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_RoomTileContextMenu_tag_icon",
      src: require("../../../../res/img/icon_context_delete.svg"),
      width: "15",
      height: "15",
      alt: ""
    }), (0, _languageHandler._t)('Reject')));
  }

}

exports.default = GroupInviteTileContextMenu;
(0, _defineProperty2.default)(GroupInviteTileContextMenu, "propTypes", {
  group: _propTypes.default.instanceOf(_matrixJsSdk.Group).isRequired,

  /* callback called when the menu is dismissed */
  onFinished: _propTypes.default.func
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2NvbnRleHRfbWVudXMvR3JvdXBJbnZpdGVUaWxlQ29udGV4dE1lbnUuanMiXSwibmFtZXMiOlsiR3JvdXBJbnZpdGVUaWxlQ29udGV4dE1lbnUiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfb25DbGlja1JlamVjdCIsImJpbmQiLCJjb21wb25lbnREaWRNb3VudCIsIl91bm1vdW50ZWQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsIlF1ZXN0aW9uRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm9uRmluaXNoZWQiLCJzaG91bGRMZWF2ZSIsIkxvYWRlciIsIm1vZGFsIiwiY3JlYXRlRGlhbG9nIiwiR3JvdXBTdG9yZSIsImxlYXZlR3JvdXAiLCJncm91cCIsImdyb3VwSWQiLCJlIiwiY29uc29sZSIsImVycm9yIiwiRXJyb3JEaWFsb2ciLCJjbG9zZSIsInJlbmRlciIsInJlcXVpcmUiLCJQcm9wVHlwZXMiLCJpbnN0YW5jZU9mIiwiR3JvdXAiLCJpc1JlcXVpcmVkIiwiZnVuYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQmUsTUFBTUEsMEJBQU4sU0FBeUNDLGVBQU1DLFNBQS9DLENBQXlEO0FBT3BFQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFFQSxTQUFLQyxjQUFMLEdBQXNCLEtBQUtBLGNBQUwsQ0FBb0JDLElBQXBCLENBQXlCLElBQXpCLENBQXRCO0FBQ0g7O0FBRURDLEVBQUFBLGlCQUFpQixHQUFHO0FBQ2hCLFNBQUtDLFVBQUwsR0FBa0IsS0FBbEI7QUFDSDs7QUFFREMsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsU0FBS0QsVUFBTCxHQUFrQixJQUFsQjtBQUNIOztBQUVESCxFQUFBQSxjQUFjLEdBQUc7QUFDYixVQUFNSyxjQUFjLEdBQUdDLEdBQUcsQ0FBQ0MsWUFBSixDQUFpQix3QkFBakIsQ0FBdkI7O0FBQ0FDLG1CQUFNQyxtQkFBTixDQUEwQix5QkFBMUIsRUFBcUQsRUFBckQsRUFBeURKLGNBQXpELEVBQXlFO0FBQ3JFSyxNQUFBQSxLQUFLLEVBQUUseUJBQUcsbUJBQUgsQ0FEOEQ7QUFFckVDLE1BQUFBLFdBQVcsRUFBRSx5QkFBRyxpREFBSCxDQUZ3RDtBQUdyRUMsTUFBQUEsVUFBVSxFQUFFLE1BQU9DLFdBQVAsSUFBdUI7QUFDL0IsWUFBSSxDQUFDQSxXQUFMLEVBQWtCLE9BRGEsQ0FHL0I7O0FBQ0EsY0FBTUMsTUFBTSxHQUFHUixHQUFHLENBQUNDLFlBQUosQ0FBaUIsa0JBQWpCLENBQWY7O0FBQ0EsY0FBTVEsS0FBSyxHQUFHUCxlQUFNUSxZQUFOLENBQW1CRixNQUFuQixFQUEyQixJQUEzQixFQUFpQyxtQkFBakMsQ0FBZDs7QUFFQSxZQUFJO0FBQ0EsZ0JBQU1HLG9CQUFXQyxVQUFYLENBQXNCLEtBQUtuQixLQUFMLENBQVdvQixLQUFYLENBQWlCQyxPQUF2QyxDQUFOO0FBQ0gsU0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNSQyxVQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxvQ0FBZCxFQUFvREYsQ0FBcEQ7QUFDQSxnQkFBTUcsV0FBVyxHQUFHbEIsR0FBRyxDQUFDQyxZQUFKLENBQWlCLHFCQUFqQixDQUFwQjs7QUFDQUMseUJBQU1DLG1CQUFOLENBQTBCLHdCQUExQixFQUFvRCxFQUFwRCxFQUF3RGUsV0FBeEQsRUFBcUU7QUFDakVkLFlBQUFBLEtBQUssRUFBRSx5QkFBRyxPQUFILENBRDBEO0FBRWpFQyxZQUFBQSxXQUFXLEVBQUUseUJBQUcseUJBQUg7QUFGb0QsV0FBckU7QUFJSCxTQVRELFNBU1U7QUFDTkksVUFBQUEsS0FBSyxDQUFDVSxLQUFOO0FBQ0g7QUFDSjtBQXRCb0UsS0FBekUsRUFGYSxDQTJCYjs7O0FBQ0EsUUFBSSxLQUFLMUIsS0FBTCxDQUFXYSxVQUFmLEVBQTJCO0FBQ3ZCLFdBQUtiLEtBQUwsQ0FBV2EsVUFBWDtBQUNIO0FBQ0o7O0FBRURjLEVBQUFBLE1BQU0sR0FBRztBQUNMLHdCQUFPLHVEQUNILDZCQUFDLHFCQUFEO0FBQVUsTUFBQSxTQUFTLEVBQUMsOEJBQXBCO0FBQW1ELE1BQUEsT0FBTyxFQUFFLEtBQUsxQjtBQUFqRSxvQkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFDLGlDQUFmO0FBQWlELE1BQUEsR0FBRyxFQUFFMkIsT0FBTyxDQUFDLDZDQUFELENBQTdEO0FBQThHLE1BQUEsS0FBSyxFQUFDLElBQXBIO0FBQXlILE1BQUEsTUFBTSxFQUFDLElBQWhJO0FBQXFJLE1BQUEsR0FBRyxFQUFDO0FBQXpJLE1BREosRUFFTSx5QkFBRyxRQUFILENBRk4sQ0FERyxDQUFQO0FBTUg7O0FBN0RtRTs7OzhCQUFuRGhDLDBCLGVBQ0U7QUFDZndCLEVBQUFBLEtBQUssRUFBRVMsbUJBQVVDLFVBQVYsQ0FBcUJDLGtCQUFyQixFQUE0QkMsVUFEcEI7O0FBRWY7QUFDQW5CLEVBQUFBLFVBQVUsRUFBRWdCLG1CQUFVSTtBQUhQLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTggVmVjdG9yIENyZWF0aW9ucyBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IE1vZGFsIGZyb20gJy4uLy4uLy4uL01vZGFsJztcbmltcG9ydCB7R3JvdXB9IGZyb20gJ21hdHJpeC1qcy1zZGsnO1xuaW1wb3J0IEdyb3VwU3RvcmUgZnJvbSBcIi4uLy4uLy4uL3N0b3Jlcy9Hcm91cFN0b3JlXCI7XG5pbXBvcnQge01lbnVJdGVtfSBmcm9tIFwiLi4vLi4vc3RydWN0dXJlcy9Db250ZXh0TWVudVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cEludml0ZVRpbGVDb250ZXh0TWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgZ3JvdXA6IFByb3BUeXBlcy5pbnN0YW5jZU9mKEdyb3VwKS5pc1JlcXVpcmVkLFxuICAgICAgICAvKiBjYWxsYmFjayBjYWxsZWQgd2hlbiB0aGUgbWVudSBpcyBkaXNtaXNzZWQgKi9cbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLl9vbkNsaWNrUmVqZWN0ID0gdGhpcy5fb25DbGlja1JlamVjdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgdGhpcy5fdW5tb3VudGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBfb25DbGlja1JlamVjdCgpIHtcbiAgICAgICAgY29uc3QgUXVlc3Rpb25EaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCdkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nJyk7XG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlamVjdCBjb21tdW5pdHkgaW52aXRlJywgJycsIFF1ZXN0aW9uRGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoJ1JlamVjdCBpbnZpdGF0aW9uJyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZWplY3QgdGhlIGludml0YXRpb24/JyksXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiBhc3luYyAoc2hvdWxkTGVhdmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXNob3VsZExlYXZlKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogY29udHJvbGxlciBzaG91bGRuJ3QgYmUgbG9hZGluZyBhIHZpZXcgOihcbiAgICAgICAgICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RhbCA9IE1vZGFsLmNyZWF0ZURpYWxvZyhMb2FkZXIsIG51bGwsICdteF9EaWFsb2dfc3Bpbm5lcicpO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgR3JvdXBTdG9yZS5sZWF2ZUdyb3VwKHRoaXMucHJvcHMuZ3JvdXAuZ3JvdXBJZCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcmVqZWN0aW5nIGNvbW11bml0eSBpbnZpdGU6IFwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRXJyb3IgcmVqZWN0aW5nIGludml0ZScsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRXJyb3JcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoXCJVbmFibGUgdG8gcmVqZWN0IGludml0ZVwiKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDbG9zZSB0aGUgY29udGV4dCBtZW51XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uRmluaXNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxNZW51SXRlbSBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X2xlYXZlXCIgb25DbGljaz17dGhpcy5fb25DbGlja1JlamVjdH0+XG4gICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9Sb29tVGlsZUNvbnRleHRNZW51X3RhZ19pY29uXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uX2NvbnRleHRfZGVsZXRlLnN2Z1wiKX0gd2lkdGg9XCIxNVwiIGhlaWdodD1cIjE1XCIgYWx0PVwiXCIgLz5cbiAgICAgICAgICAgICAgICB7IF90KCdSZWplY3QnKSB9XG4gICAgICAgICAgICA8L01lbnVJdGVtPlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxufVxuIl19