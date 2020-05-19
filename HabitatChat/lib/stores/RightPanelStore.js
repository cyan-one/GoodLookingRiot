"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _dispatcher = _interopRequireDefault(require("../dispatcher/dispatcher"));

var _verification = require("../verification");

var _utils = require("flux/utils");

var _SettingsStore = _interopRequireWildcard(require("../settings/SettingsStore"));

var _RightPanelStorePhases = require("./RightPanelStorePhases");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const INITIAL_STATE = {
  // Whether or not to show the right panel at all. We split out rooms and groups
  // because they're different flows for the user to follow.
  showRoomPanel: _SettingsStore.default.getValue("showRightPanelInRoom"),
  showGroupPanel: _SettingsStore.default.getValue("showRightPanelInGroup"),
  // The last phase (screen) the right panel was showing
  lastRoomPhase: _SettingsStore.default.getValue("lastRightPanelPhaseForRoom"),
  lastGroupPhase: _SettingsStore.default.getValue("lastRightPanelPhaseForGroup"),
  // Extra information about the last phase
  lastRoomPhaseParams: {}
};
const GROUP_PHASES = Object.keys(_RightPanelStorePhases.RIGHT_PANEL_PHASES).filter(k => k.startsWith("Group"));
const MEMBER_INFO_PHASES = [_RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo, _RightPanelStorePhases.RIGHT_PANEL_PHASES.Room3pidMemberInfo, _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel];
/**
 * A class for tracking the state of the right panel between layouts and
 * sessions.
 */

class RightPanelStore extends _utils.Store {
  constructor() {
    super(_dispatcher.default); // Initialise state

    this._state = INITIAL_STATE;
  }

  get isOpenForRoom()
  /*: boolean*/
  {
    return this._state.showRoomPanel;
  }

  get isOpenForGroup()
  /*: boolean*/
  {
    return this._state.showGroupPanel;
  }

  get roomPanelPhase()
  /*: string*/
  {
    return this._state.lastRoomPhase;
  }

  get groupPanelPhase()
  /*: string*/
  {
    return this._state.lastGroupPhase;
  }

  get visibleRoomPanelPhase()
  /*: string*/
  {
    return this.isOpenForRoom ? this.roomPanelPhase : null;
  }

  get visibleGroupPanelPhase()
  /*: string*/
  {
    return this.isOpenForGroup ? this.groupPanelPhase : null;
  }

  get roomPanelPhaseParams()
  /*: any*/
  {
    return this._state.lastRoomPhaseParams || {};
  }

  _setState(newState) {
    this._state = Object.assign(this._state, newState);

    _SettingsStore.default.setValue("showRightPanelInRoom", null, _SettingsStore.SettingLevel.DEVICE, this._state.showRoomPanel);

    _SettingsStore.default.setValue("showRightPanelInGroup", null, _SettingsStore.SettingLevel.DEVICE, this._state.showGroupPanel);

    if (_RightPanelStorePhases.RIGHT_PANEL_PHASES_NO_ARGS.includes(this._state.lastRoomPhase)) {
      _SettingsStore.default.setValue("lastRightPanelPhaseForRoom", null, _SettingsStore.SettingLevel.DEVICE, this._state.lastRoomPhase);
    }

    if (_RightPanelStorePhases.RIGHT_PANEL_PHASES_NO_ARGS.includes(this._state.lastGroupPhase)) {
      _SettingsStore.default.setValue("lastRightPanelPhaseForGroup", null, _SettingsStore.SettingLevel.DEVICE, this._state.lastGroupPhase);
    }

    this.__emitChange();
  }

  __onDispatch(payload) {
    switch (payload.action) {
      case 'view_room':
      case 'view_group':
        // Reset to the member list if we're viewing member info
        if (MEMBER_INFO_PHASES.includes(this._state.lastRoomPhase)) {
          this._setState({
            lastRoomPhase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberList,
            lastRoomPhaseParams: {}
          });
        } // Do the same for groups


        if (this._state.lastGroupPhase === _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberInfo) {
          this._setState({
            lastGroupPhase: _RightPanelStorePhases.RIGHT_PANEL_PHASES.GroupMemberList
          });
        }

        break;

      case 'set_right_panel_phase':
        {
          let targetPhase = payload.phase;
          let refireParams = payload.refireParams; // redirect to EncryptionPanel if there is an ongoing verification request

          if (targetPhase === _RightPanelStorePhases.RIGHT_PANEL_PHASES.RoomMemberInfo && payload.refireParams) {
            const {
              member
            } = payload.refireParams;
            const pendingRequest = (0, _verification.pendingVerificationRequestForUser)(member);

            if (pendingRequest) {
              targetPhase = _RightPanelStorePhases.RIGHT_PANEL_PHASES.EncryptionPanel;
              refireParams = {
                verificationRequest: pendingRequest,
                member
              };
            }
          }

          if (!_RightPanelStorePhases.RIGHT_PANEL_PHASES[targetPhase]) {
            console.warn("Tried to switch right panel to unknown phase: ".concat(targetPhase));
            return;
          }

          if (GROUP_PHASES.includes(targetPhase)) {
            if (targetPhase === this._state.lastGroupPhase) {
              this._setState({
                showGroupPanel: !this._state.showGroupPanel
              });
            } else {
              this._setState({
                lastGroupPhase: targetPhase,
                showGroupPanel: true
              });
            }
          } else {
            if (targetPhase === this._state.lastRoomPhase && !refireParams) {
              this._setState({
                showRoomPanel: !this._state.showRoomPanel
              });
            } else {
              this._setState({
                lastRoomPhase: targetPhase,
                showRoomPanel: true,
                lastRoomPhaseParams: refireParams || {}
              });
            }
          } // Let things like the member info panel actually open to the right member.


          _dispatcher.default.dispatch(_objectSpread({
            action: 'after_right_panel_phase_change',
            phase: targetPhase
          }, refireParams || {}));

          break;
        }

      case 'toggle_right_panel':
        if (payload.type === "room") {
          this._setState({
            showRoomPanel: !this._state.showRoomPanel
          });
        } else {
          // group
          this._setState({
            showGroupPanel: !this._state.showGroupPanel
          });
        }

        break;
    }
  }

  static getSharedInstance()
  /*: RightPanelStore*/
  {
    if (!RightPanelStore._instance) {
      RightPanelStore._instance = new RightPanelStore();
    }

    return RightPanelStore._instance;
  }

}

exports.default = RightPanelStore;
(0, _defineProperty2.default)(RightPanelStore, "_instance", void 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdG9yZXMvUmlnaHRQYW5lbFN0b3JlLmpzIl0sIm5hbWVzIjpbIklOSVRJQUxfU1RBVEUiLCJzaG93Um9vbVBhbmVsIiwiU2V0dGluZ3NTdG9yZSIsImdldFZhbHVlIiwic2hvd0dyb3VwUGFuZWwiLCJsYXN0Um9vbVBoYXNlIiwibGFzdEdyb3VwUGhhc2UiLCJsYXN0Um9vbVBoYXNlUGFyYW1zIiwiR1JPVVBfUEhBU0VTIiwiT2JqZWN0Iiwia2V5cyIsIlJJR0hUX1BBTkVMX1BIQVNFUyIsImZpbHRlciIsImsiLCJzdGFydHNXaXRoIiwiTUVNQkVSX0lORk9fUEhBU0VTIiwiUm9vbU1lbWJlckluZm8iLCJSb29tM3BpZE1lbWJlckluZm8iLCJFbmNyeXB0aW9uUGFuZWwiLCJSaWdodFBhbmVsU3RvcmUiLCJTdG9yZSIsImNvbnN0cnVjdG9yIiwiZGlzIiwiX3N0YXRlIiwiaXNPcGVuRm9yUm9vbSIsImlzT3BlbkZvckdyb3VwIiwicm9vbVBhbmVsUGhhc2UiLCJncm91cFBhbmVsUGhhc2UiLCJ2aXNpYmxlUm9vbVBhbmVsUGhhc2UiLCJ2aXNpYmxlR3JvdXBQYW5lbFBoYXNlIiwicm9vbVBhbmVsUGhhc2VQYXJhbXMiLCJfc2V0U3RhdGUiLCJuZXdTdGF0ZSIsImFzc2lnbiIsInNldFZhbHVlIiwiU2V0dGluZ0xldmVsIiwiREVWSUNFIiwiUklHSFRfUEFORUxfUEhBU0VTX05PX0FSR1MiLCJpbmNsdWRlcyIsIl9fZW1pdENoYW5nZSIsIl9fb25EaXNwYXRjaCIsInBheWxvYWQiLCJhY3Rpb24iLCJSb29tTWVtYmVyTGlzdCIsIkdyb3VwTWVtYmVySW5mbyIsIkdyb3VwTWVtYmVyTGlzdCIsInRhcmdldFBoYXNlIiwicGhhc2UiLCJyZWZpcmVQYXJhbXMiLCJtZW1iZXIiLCJwZW5kaW5nUmVxdWVzdCIsInZlcmlmaWNhdGlvblJlcXVlc3QiLCJjb25zb2xlIiwid2FybiIsImRpc3BhdGNoIiwidHlwZSIsImdldFNoYXJlZEluc3RhbmNl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LE9BQU8sQ0FBQ2MsSUFBUixLQUFpQixNQUFyQixFQUE2QjtBQUN6QixlQUFLeEIsU0FBTCxDQUFlO0FBQUU5QixZQUFBQSxhQUFhLEVBQUUsQ0FBQyxLQUFLc0IsTUFBTCxDQUFZdEI7QUFBOUIsV0FBZjtBQUNILFNBRkQsTUFFTztBQUFFO0FBQ0wsZUFBSzhCLFNBQUwsQ0FBZTtBQUFFM0IsWUFBQUEsY0FBYyxFQUFFLENBQUMsS0FBS21CLE1BQUwsQ0FBWW5CO0FBQS9CLFdBQWY7QUFDSDs7QUFDRDtBQTFFUjtBQTRFSDs7QUFFRCxTQUFPb0QsaUJBQVA7QUFBQTtBQUE0QztBQUN4QyxRQUFJLENBQUNyQyxlQUFlLENBQUNzQyxTQUFyQixFQUFnQztBQUM1QnRDLE1BQUFBLGVBQWUsQ0FBQ3NDLFNBQWhCLEdBQTRCLElBQUl0QyxlQUFKLEVBQTVCO0FBQ0g7O0FBQ0QsV0FBT0EsZUFBZSxDQUFDc0MsU0FBdkI7QUFDSDs7QUE5SjhDOzs7OEJBQTlCdEMsZSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBkaXMgZnJvbSAnLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyJztcbmltcG9ydCB7cGVuZGluZ1ZlcmlmaWNhdGlvblJlcXVlc3RGb3JVc2VyfSBmcm9tICcuLi92ZXJpZmljYXRpb24nO1xuaW1wb3J0IHtTdG9yZX0gZnJvbSAnZmx1eC91dGlscyc7XG5pbXBvcnQgU2V0dGluZ3NTdG9yZSwge1NldHRpbmdMZXZlbH0gZnJvbSBcIi4uL3NldHRpbmdzL1NldHRpbmdzU3RvcmVcIjtcbmltcG9ydCB7UklHSFRfUEFORUxfUEhBU0VTLCBSSUdIVF9QQU5FTF9QSEFTRVNfTk9fQVJHU30gZnJvbSBcIi4vUmlnaHRQYW5lbFN0b3JlUGhhc2VzXCI7XG5cbmNvbnN0IElOSVRJQUxfU1RBVEUgPSB7XG4gICAgLy8gV2hldGhlciBvciBub3QgdG8gc2hvdyB0aGUgcmlnaHQgcGFuZWwgYXQgYWxsLiBXZSBzcGxpdCBvdXQgcm9vbXMgYW5kIGdyb3Vwc1xuICAgIC8vIGJlY2F1c2UgdGhleSdyZSBkaWZmZXJlbnQgZmxvd3MgZm9yIHRoZSB1c2VyIHRvIGZvbGxvdy5cbiAgICBzaG93Um9vbVBhbmVsOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwic2hvd1JpZ2h0UGFuZWxJblJvb21cIiksXG4gICAgc2hvd0dyb3VwUGFuZWw6IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJzaG93UmlnaHRQYW5lbEluR3JvdXBcIiksXG5cbiAgICAvLyBUaGUgbGFzdCBwaGFzZSAoc2NyZWVuKSB0aGUgcmlnaHQgcGFuZWwgd2FzIHNob3dpbmdcbiAgICBsYXN0Um9vbVBoYXNlOiBTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwibGFzdFJpZ2h0UGFuZWxQaGFzZUZvclJvb21cIiksXG4gICAgbGFzdEdyb3VwUGhhc2U6IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJsYXN0UmlnaHRQYW5lbFBoYXNlRm9yR3JvdXBcIiksXG5cbiAgICAvLyBFeHRyYSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGFzdCBwaGFzZVxuICAgIGxhc3RSb29tUGhhc2VQYXJhbXM6IHt9LFxufTtcblxuY29uc3QgR1JPVVBfUEhBU0VTID0gT2JqZWN0LmtleXMoUklHSFRfUEFORUxfUEhBU0VTKS5maWx0ZXIoayA9PiBrLnN0YXJ0c1dpdGgoXCJHcm91cFwiKSk7XG5cbmNvbnN0IE1FTUJFUl9JTkZPX1BIQVNFUyA9IFtcbiAgICBSSUdIVF9QQU5FTF9QSEFTRVMuUm9vbU1lbWJlckluZm8sXG4gICAgUklHSFRfUEFORUxfUEhBU0VTLlJvb20zcGlkTWVtYmVySW5mbyxcbiAgICBSSUdIVF9QQU5FTF9QSEFTRVMuRW5jcnlwdGlvblBhbmVsLFxuXTtcblxuLyoqXG4gKiBBIGNsYXNzIGZvciB0cmFja2luZyB0aGUgc3RhdGUgb2YgdGhlIHJpZ2h0IHBhbmVsIGJldHdlZW4gbGF5b3V0cyBhbmRcbiAqIHNlc3Npb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSaWdodFBhbmVsU3RvcmUgZXh0ZW5kcyBTdG9yZSB7XG4gICAgc3RhdGljIF9pbnN0YW5jZTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihkaXMpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpc2Ugc3RhdGVcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBJTklUSUFMX1NUQVRFO1xuICAgIH1cblxuICAgIGdldCBpc09wZW5Gb3JSb29tKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUuc2hvd1Jvb21QYW5lbDtcbiAgICB9XG5cbiAgICBnZXQgaXNPcGVuRm9yR3JvdXAoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5zaG93R3JvdXBQYW5lbDtcbiAgICB9XG5cbiAgICBnZXQgcm9vbVBhbmVsUGhhc2UoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlLmxhc3RSb29tUGhhc2U7XG4gICAgfVxuXG4gICAgZ2V0IGdyb3VwUGFuZWxQaGFzZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGUubGFzdEdyb3VwUGhhc2U7XG4gICAgfVxuXG4gICAgZ2V0IHZpc2libGVSb29tUGFuZWxQaGFzZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5pc09wZW5Gb3JSb29tID8gdGhpcy5yb29tUGFuZWxQaGFzZSA6IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHZpc2libGVHcm91cFBhbmVsUGhhc2UoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNPcGVuRm9yR3JvdXAgPyB0aGlzLmdyb3VwUGFuZWxQaGFzZSA6IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHJvb21QYW5lbFBoYXNlUGFyYW1zKCk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0ZS5sYXN0Um9vbVBoYXNlUGFyYW1zIHx8IHt9O1xuICAgIH1cblxuICAgIF9zZXRTdGF0ZShuZXdTdGF0ZSkge1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IE9iamVjdC5hc3NpZ24odGhpcy5fc3RhdGUsIG5ld1N0YXRlKTtcblxuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFxuICAgICAgICAgICAgXCJzaG93UmlnaHRQYW5lbEluUm9vbVwiLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIFNldHRpbmdMZXZlbC5ERVZJQ0UsXG4gICAgICAgICAgICB0aGlzLl9zdGF0ZS5zaG93Um9vbVBhbmVsLFxuICAgICAgICApO1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFxuICAgICAgICAgICAgXCJzaG93UmlnaHRQYW5lbEluR3JvdXBcIixcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBTZXR0aW5nTGV2ZWwuREVWSUNFLFxuICAgICAgICAgICAgdGhpcy5fc3RhdGUuc2hvd0dyb3VwUGFuZWwsXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKFJJR0hUX1BBTkVMX1BIQVNFU19OT19BUkdTLmluY2x1ZGVzKHRoaXMuX3N0YXRlLmxhc3RSb29tUGhhc2UpKSB7XG4gICAgICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgIFwibGFzdFJpZ2h0UGFuZWxQaGFzZUZvclJvb21cIixcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIFNldHRpbmdMZXZlbC5ERVZJQ0UsXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUubGFzdFJvb21QaGFzZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFJJR0hUX1BBTkVMX1BIQVNFU19OT19BUkdTLmluY2x1ZGVzKHRoaXMuX3N0YXRlLmxhc3RHcm91cFBoYXNlKSkge1xuICAgICAgICAgICAgU2V0dGluZ3NTdG9yZS5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICBcImxhc3RSaWdodFBhbmVsUGhhc2VGb3JHcm91cFwiLFxuICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgU2V0dGluZ0xldmVsLkRFVklDRSxcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0ZS5sYXN0R3JvdXBQaGFzZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9fZW1pdENoYW5nZSgpO1xuICAgIH1cblxuICAgIF9fb25EaXNwYXRjaChwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXdfcm9vbSc6XG4gICAgICAgICAgICBjYXNlICd2aWV3X2dyb3VwJzpcbiAgICAgICAgICAgICAgICAvLyBSZXNldCB0byB0aGUgbWVtYmVyIGxpc3QgaWYgd2UncmUgdmlld2luZyBtZW1iZXIgaW5mb1xuICAgICAgICAgICAgICAgIGlmIChNRU1CRVJfSU5GT19QSEFTRVMuaW5jbHVkZXModGhpcy5fc3RhdGUubGFzdFJvb21QaGFzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoe2xhc3RSb29tUGhhc2U6IFJJR0hUX1BBTkVMX1BIQVNFUy5Sb29tTWVtYmVyTGlzdCwgbGFzdFJvb21QaGFzZVBhcmFtczoge319KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBEbyB0aGUgc2FtZSBmb3IgZ3JvdXBzXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmxhc3RHcm91cFBoYXNlID09PSBSSUdIVF9QQU5FTF9QSEFTRVMuR3JvdXBNZW1iZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtsYXN0R3JvdXBQaGFzZTogUklHSFRfUEFORUxfUEhBU0VTLkdyb3VwTWVtYmVyTGlzdH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnc2V0X3JpZ2h0X3BhbmVsX3BoYXNlJzoge1xuICAgICAgICAgICAgICAgIGxldCB0YXJnZXRQaGFzZSA9IHBheWxvYWQucGhhc2U7XG4gICAgICAgICAgICAgICAgbGV0IHJlZmlyZVBhcmFtcyA9IHBheWxvYWQucmVmaXJlUGFyYW1zO1xuICAgICAgICAgICAgICAgIC8vIHJlZGlyZWN0IHRvIEVuY3J5cHRpb25QYW5lbCBpZiB0aGVyZSBpcyBhbiBvbmdvaW5nIHZlcmlmaWNhdGlvbiByZXF1ZXN0XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBoYXNlID09PSBSSUdIVF9QQU5FTF9QSEFTRVMuUm9vbU1lbWJlckluZm8gJiYgcGF5bG9hZC5yZWZpcmVQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qge21lbWJlcn0gPSBwYXlsb2FkLnJlZmlyZVBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGVuZGluZ1JlcXVlc3QgPSBwZW5kaW5nVmVyaWZpY2F0aW9uUmVxdWVzdEZvclVzZXIobWVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdSZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRQaGFzZSA9IFJJR0hUX1BBTkVMX1BIQVNFUy5FbmNyeXB0aW9uUGFuZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWZpcmVQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uUmVxdWVzdDogcGVuZGluZ1JlcXVlc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIVJJR0hUX1BBTkVMX1BIQVNFU1t0YXJnZXRQaGFzZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBUcmllZCB0byBzd2l0Y2ggcmlnaHQgcGFuZWwgdG8gdW5rbm93biBwaGFzZTogJHt0YXJnZXRQaGFzZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChHUk9VUF9QSEFTRVMuaW5jbHVkZXModGFyZ2V0UGhhc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRQaGFzZSA9PT0gdGhpcy5fc3RhdGUubGFzdEdyb3VwUGhhc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93R3JvdXBQYW5lbDogIXRoaXMuX3N0YXRlLnNob3dHcm91cFBhbmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEdyb3VwUGhhc2U6IHRhcmdldFBoYXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dHcm91cFBhbmVsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0UGhhc2UgPT09IHRoaXMuX3N0YXRlLmxhc3RSb29tUGhhc2UgJiYgIXJlZmlyZVBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dSb29tUGFuZWw6ICF0aGlzLl9zdGF0ZS5zaG93Um9vbVBhbmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFJvb21QaGFzZTogdGFyZ2V0UGhhc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1Jvb21QYW5lbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0Um9vbVBoYXNlUGFyYW1zOiByZWZpcmVQYXJhbXMgfHwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIExldCB0aGluZ3MgbGlrZSB0aGUgbWVtYmVyIGluZm8gcGFuZWwgYWN0dWFsbHkgb3BlbiB0byB0aGUgcmlnaHQgbWVtYmVyLlxuICAgICAgICAgICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2FmdGVyX3JpZ2h0X3BhbmVsX3BoYXNlX2NoYW5nZScsXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiB0YXJnZXRQaGFzZSxcbiAgICAgICAgICAgICAgICAgICAgLi4uKHJlZmlyZVBhcmFtcyB8fCB7fSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ3RvZ2dsZV9yaWdodF9wYW5lbCc6XG4gICAgICAgICAgICAgICAgaWYgKHBheWxvYWQudHlwZSA9PT0gXCJyb29tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0U3RhdGUoeyBzaG93Um9vbVBhbmVsOiAhdGhpcy5fc3RhdGUuc2hvd1Jvb21QYW5lbCB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBncm91cFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRTdGF0ZSh7IHNob3dHcm91cFBhbmVsOiAhdGhpcy5fc3RhdGUuc2hvd0dyb3VwUGFuZWwgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFNoYXJlZEluc3RhbmNlKCk6IFJpZ2h0UGFuZWxTdG9yZSB7XG4gICAgICAgIGlmICghUmlnaHRQYW5lbFN0b3JlLl9pbnN0YW5jZSkge1xuICAgICAgICAgICAgUmlnaHRQYW5lbFN0b3JlLl9pbnN0YW5jZSA9IG5ldyBSaWdodFBhbmVsU3RvcmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUmlnaHRQYW5lbFN0b3JlLl9pbnN0YW5jZTtcbiAgICB9XG59XG4iXX0=