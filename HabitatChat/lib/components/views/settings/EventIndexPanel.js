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

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard3(require("../../../index"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _SettingsStore = _interopRequireWildcard3(require("../../../settings/SettingsStore"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _FormattingUtils = require("../../../utils/FormattingUtils");

var _EventIndexPeg = _interopRequireDefault(require("../../../indexing/EventIndexPeg"));

/*
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
class EventIndexPanel extends _react.default.Component {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "updateCurrentRoom", async room => {
      const eventIndex = _EventIndexPeg.default.get();

      let stats;

      try {
        stats = await eventIndex.getStats();
      } catch {
        // This call may fail if sporadically, not a huge issue as we will
        // try later again and probably succeed.
        return;
      }

      this.setState({
        eventIndexSize: stats.size,
        roomCount: stats.roomCount
      });
    });
    (0, _defineProperty2.default)(this, "_onManage", async () => {
      _Modal.default.createTrackedDialogAsync('Message search', 'Message search', Promise.resolve().then(() => (0, _interopRequireWildcard2.default)(require('../../../async-components/views/dialogs/eventindex/ManageEventIndexDialog'))), {
        onFinished: () => {}
      }, null,
      /* priority = */
      false,
      /* static = */
      true);
    });
    (0, _defineProperty2.default)(this, "_onEnable", async () => {
      this.setState({
        enabling: true
      });
      await _EventIndexPeg.default.initEventIndex();
      await _EventIndexPeg.default.get().addInitialCheckpoints();
      await _EventIndexPeg.default.get().startCrawler();
      await _SettingsStore.default.setValue('enableEventIndexing', null, _SettingsStore.SettingLevel.DEVICE, true);
      await this.updateState();
    });
    this.state = {
      enabling: false,
      eventIndexSize: 0,
      roomCount: 0,
      eventIndexingEnabled: _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, 'enableEventIndexing')
    };
  }

  componentWillUnmount()
  /*: void*/
  {
    const eventIndex = _EventIndexPeg.default.get();

    if (eventIndex !== null) {
      eventIndex.removeListener("changedCheckpoint", this.updateCurrentRoom);
    }
  }

  async componentDidMount()
  /*: void*/
  {
    this.updateState();
  }

  async updateState() {
    const eventIndex = _EventIndexPeg.default.get();

    const eventIndexingEnabled = _SettingsStore.default.getValueAt(_SettingsStore.SettingLevel.DEVICE, 'enableEventIndexing');

    const enabling = false;
    let eventIndexSize = 0;
    let roomCount = 0;

    if (eventIndex !== null) {
      eventIndex.on("changedCheckpoint", this.updateCurrentRoom);

      try {
        const stats = await eventIndex.getStats();
        eventIndexSize = stats.size;
        roomCount = stats.roomCount;
      } catch {// This call may fail if sporadically, not a huge issue as we
        // will try later again in the updateCurrentRoom call and
        // probably succeed.
      }
    }

    this.setState({
      enabling,
      eventIndexSize,
      roomCount,
      eventIndexingEnabled
    });
  }

  render() {
    let eventIndexingSettings = null;
    const InlineSpinner = sdk.getComponent('elements.InlineSpinner');

    if (_EventIndexPeg.default.get() !== null) {
      eventIndexingSettings = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, _languageHandler._t)("Securely cache encrypted messages locally for them " + "to appear in search results, using "), " ", (0, _FormattingUtils.formatBytes)(this.state.eventIndexSize, 0), (0, _languageHandler._t)(" to store messages from "), (0, _FormattingUtils.formatCountLong)(this.state.roomCount), " ", (0, _languageHandler._t)("rooms.")), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "primary",
        onClick: this._onManage
      }, (0, _languageHandler._t)("Manage"))));
    } else if (!this.state.eventIndexingEnabled && _EventIndexPeg.default.supportIsInstalled()) {
      eventIndexingSettings = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, _languageHandler._t)("Securely cache encrypted messages locally for them to " + "appear in search results.")), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        kind: "primary",
        disabled: this.state.enabling,
        onClick: this._onEnable
      }, (0, _languageHandler._t)("Enable")), this.state.enabling ? /*#__PURE__*/_react.default.createElement(InlineSpinner, null) : /*#__PURE__*/_react.default.createElement("div", null)));
    } else if (_EventIndexPeg.default.platformHasSupport() && !_EventIndexPeg.default.supportIsInstalled()) {
      const nativeLink = "https://github.com/vector-im/riot-web/blob/develop/" + "docs/native-node-modules.md#" + "adding-seshat-for-search-in-e2e-encrypted-rooms";
      eventIndexingSettings = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, _languageHandler._t)("Riot is missing some components required for securely " + "caching encrypted messages locally. If you'd like to " + "experiment with this feature, build a custom Riot Desktop " + "with <nativeLink>search components added</nativeLink>.", {}, {
        'nativeLink': sub => /*#__PURE__*/_react.default.createElement("a", {
          href: nativeLink,
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      }));
    } else {
      eventIndexingSettings = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_SettingsTab_subsectionText"
      }, (0, _languageHandler._t)("Riot can't securely cache encrypted messages locally " + "while running in a web browser. Use <riotLink>Riot Desktop</riotLink> " + "for encrypted messages to appear in search results.", {}, {
        'riotLink': sub => /*#__PURE__*/_react.default.createElement("a", {
          href: "https://riot.im/download/desktop",
          target: "_blank",
          rel: "noreferrer noopener"
        }, sub)
      }));
    }

    return eventIndexingSettings;
  }

}

exports.default = EventIndexPanel;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL0V2ZW50SW5kZXhQYW5lbC5qcyJdLCJuYW1lcyI6WyJFdmVudEluZGV4UGFuZWwiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicm9vbSIsImV2ZW50SW5kZXgiLCJFdmVudEluZGV4UGVnIiwiZ2V0Iiwic3RhdHMiLCJnZXRTdGF0cyIsInNldFN0YXRlIiwiZXZlbnRJbmRleFNpemUiLCJzaXplIiwicm9vbUNvdW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nQXN5bmMiLCJvbkZpbmlzaGVkIiwiZW5hYmxpbmciLCJpbml0RXZlbnRJbmRleCIsImFkZEluaXRpYWxDaGVja3BvaW50cyIsInN0YXJ0Q3Jhd2xlciIsIlNldHRpbmdzU3RvcmUiLCJzZXRWYWx1ZSIsIlNldHRpbmdMZXZlbCIsIkRFVklDRSIsInVwZGF0ZVN0YXRlIiwic3RhdGUiLCJldmVudEluZGV4aW5nRW5hYmxlZCIsImdldFZhbHVlQXQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUxpc3RlbmVyIiwidXBkYXRlQ3VycmVudFJvb20iLCJjb21wb25lbnREaWRNb3VudCIsIm9uIiwicmVuZGVyIiwiZXZlbnRJbmRleGluZ1NldHRpbmdzIiwiSW5saW5lU3Bpbm5lciIsInNkayIsImdldENvbXBvbmVudCIsIl9vbk1hbmFnZSIsInN1cHBvcnRJc0luc3RhbGxlZCIsIl9vbkVuYWJsZSIsInBsYXRmb3JtSGFzU3VwcG9ydCIsIm5hdGl2ZUxpbmsiLCJzdWIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztBQTBCZSxNQUFNQSxlQUFOLFNBQThCQyxlQUFNQyxTQUFwQyxDQUE4QztBQUN6REMsRUFBQUEsV0FBVyxHQUFHO0FBQ1Y7QUFEVSw2REFZTSxN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QWVILEtBaEJNLE1BZ0JBLElBQUlYLHVCQUFjb0Msa0JBQWQsTUFBc0MsQ0FBQ3BDLHVCQUFja0Msa0JBQWQsRUFBM0MsRUFBK0U7QUFDbEYsWUFBTUcsVUFBVSxHQUNaLHdEQUNBLDhCQURBLEdBRUEsaURBSEo7QUFNQVIsTUFBQUEscUJBQXFCLGdCQUNqQjtBQUFLLFFBQUEsU0FBUyxFQUFDO0FBQWYsU0FFUSx5QkFBSSwyREFDQSx1REFEQSxHQUVBLDREQUZBLEdBR0Esd0RBSEosRUFJSSxFQUpKLEVBS0k7QUFDSSxzQkFBZVMsR0FBRCxpQkFBUztBQUFHLFVBQUEsSUFBSSxFQUFFRCxVQUFUO0FBQXFCLFVBQUEsTUFBTSxFQUFDLFFBQTVCO0FBQ25CLFVBQUEsR0FBRyxFQUFDO0FBRGUsV0FDUUMsR0FEUjtBQUQzQixPQUxKLENBRlIsQ0FESjtBQWdCSCxLQXZCTSxNQXVCQTtBQUNIVCxNQUFBQSxxQkFBcUIsZ0JBQ2pCO0FBQUssUUFBQSxTQUFTLEVBQUM7QUFBZixTQUVRLHlCQUFJLDBEQUNBLHdFQURBLEdBRUEscURBRkosRUFHSSxFQUhKLEVBSUk7QUFDSSxvQkFBYVMsR0FBRCxpQkFBUztBQUFHLFVBQUEsSUFBSSxFQUFDLGtDQUFSO0FBQ2pCLFVBQUEsTUFBTSxFQUFDLFFBRFU7QUFDRCxVQUFBLEdBQUcsRUFBQztBQURILFdBQzBCQSxHQUQxQjtBQUR6QixPQUpKLENBRlIsQ0FESjtBQWVIOztBQUVELFdBQU9ULHFCQUFQO0FBQ0g7O0FBN0t3RCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAyMCBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgTW9kYWwgZnJvbSAnLi4vLi4vLi4vTW9kYWwnO1xuaW1wb3J0IFNldHRpbmdzU3RvcmUsIHtTZXR0aW5nTGV2ZWx9IGZyb20gXCIuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlXCI7XG5pbXBvcnQgQWNjZXNzaWJsZUJ1dHRvbiBmcm9tIFwiLi4vZWxlbWVudHMvQWNjZXNzaWJsZUJ1dHRvblwiO1xuaW1wb3J0IHtmb3JtYXRCeXRlcywgZm9ybWF0Q291bnRMb25nfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvRm9ybWF0dGluZ1V0aWxzXCI7XG5pbXBvcnQgRXZlbnRJbmRleFBlZyBmcm9tIFwiLi4vLi4vLi4vaW5kZXhpbmcvRXZlbnRJbmRleFBlZ1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdmVudEluZGV4UGFuZWwgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBlbmFibGluZzogZmFsc2UsXG4gICAgICAgICAgICBldmVudEluZGV4U2l6ZTogMCxcbiAgICAgICAgICAgIHJvb21Db3VudDogMCxcbiAgICAgICAgICAgIGV2ZW50SW5kZXhpbmdFbmFibGVkOlxuICAgICAgICAgICAgICAgIFNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChTZXR0aW5nTGV2ZWwuREVWSUNFLCAnZW5hYmxlRXZlbnRJbmRleGluZycpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHVwZGF0ZUN1cnJlbnRSb29tID0gYXN5bmMgKHJvb20pID0+IHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmRleCA9IEV2ZW50SW5kZXhQZWcuZ2V0KCk7XG4gICAgICAgIGxldCBzdGF0cztcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBldmVudEluZGV4LmdldFN0YXRzKCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gVGhpcyBjYWxsIG1heSBmYWlsIGlmIHNwb3JhZGljYWxseSwgbm90IGEgaHVnZSBpc3N1ZSBhcyB3ZSB3aWxsXG4gICAgICAgICAgICAvLyB0cnkgbGF0ZXIgYWdhaW4gYW5kIHByb2JhYmx5IHN1Y2NlZWQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGV2ZW50SW5kZXhTaXplOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgcm9vbUNvdW50OiBzdGF0cy5yb29tQ291bnQsXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmRleCA9IEV2ZW50SW5kZXhQZWcuZ2V0KCk7XG5cbiAgICAgICAgaWYgKGV2ZW50SW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGV2ZW50SW5kZXgucmVtb3ZlTGlzdGVuZXIoXCJjaGFuZ2VkQ2hlY2twb2ludFwiLCB0aGlzLnVwZGF0ZUN1cnJlbnRSb29tKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGNvbXBvbmVudERpZE1vdW50KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgdXBkYXRlU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50SW5kZXggPSBFdmVudEluZGV4UGVnLmdldCgpO1xuICAgICAgICBjb25zdCBldmVudEluZGV4aW5nRW5hYmxlZCA9IFNldHRpbmdzU3RvcmUuZ2V0VmFsdWVBdChTZXR0aW5nTGV2ZWwuREVWSUNFLCAnZW5hYmxlRXZlbnRJbmRleGluZycpO1xuICAgICAgICBjb25zdCBlbmFibGluZyA9IGZhbHNlO1xuXG4gICAgICAgIGxldCBldmVudEluZGV4U2l6ZSA9IDA7XG4gICAgICAgIGxldCByb29tQ291bnQgPSAwO1xuXG4gICAgICAgIGlmIChldmVudEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBldmVudEluZGV4Lm9uKFwiY2hhbmdlZENoZWNrcG9pbnRcIiwgdGhpcy51cGRhdGVDdXJyZW50Um9vbSk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBldmVudEluZGV4LmdldFN0YXRzKCk7XG4gICAgICAgICAgICAgICAgZXZlbnRJbmRleFNpemUgPSBzdGF0cy5zaXplO1xuICAgICAgICAgICAgICAgIHJvb21Db3VudCA9IHN0YXRzLnJvb21Db3VudDtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgY2FsbCBtYXkgZmFpbCBpZiBzcG9yYWRpY2FsbHksIG5vdCBhIGh1Z2UgaXNzdWUgYXMgd2VcbiAgICAgICAgICAgICAgICAvLyB3aWxsIHRyeSBsYXRlciBhZ2FpbiBpbiB0aGUgdXBkYXRlQ3VycmVudFJvb20gY2FsbCBhbmRcbiAgICAgICAgICAgICAgICAvLyBwcm9iYWJseSBzdWNjZWVkLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBlbmFibGluZyxcbiAgICAgICAgICAgIGV2ZW50SW5kZXhTaXplLFxuICAgICAgICAgICAgcm9vbUNvdW50LFxuICAgICAgICAgICAgZXZlbnRJbmRleGluZ0VuYWJsZWQsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9vbk1hbmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZ0FzeW5jKCdNZXNzYWdlIHNlYXJjaCcsICdNZXNzYWdlIHNlYXJjaCcsXG4gICAgICAgICAgICBpbXBvcnQoJy4uLy4uLy4uL2FzeW5jLWNvbXBvbmVudHMvdmlld3MvZGlhbG9ncy9ldmVudGluZGV4L01hbmFnZUV2ZW50SW5kZXhEaWFsb2cnKSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiAoKSA9PiB7fSxcbiAgICAgICAgICAgIH0sIG51bGwsIC8qIHByaW9yaXR5ID0gKi8gZmFsc2UsIC8qIHN0YXRpYyA9ICovIHRydWUsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX29uRW5hYmxlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGVuYWJsaW5nOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBFdmVudEluZGV4UGVnLmluaXRFdmVudEluZGV4KCk7XG4gICAgICAgIGF3YWl0IEV2ZW50SW5kZXhQZWcuZ2V0KCkuYWRkSW5pdGlhbENoZWNrcG9pbnRzKCk7XG4gICAgICAgIGF3YWl0IEV2ZW50SW5kZXhQZWcuZ2V0KCkuc3RhcnRDcmF3bGVyKCk7XG4gICAgICAgIGF3YWl0IFNldHRpbmdzU3RvcmUuc2V0VmFsdWUoJ2VuYWJsZUV2ZW50SW5kZXhpbmcnLCBudWxsLCBTZXR0aW5nTGV2ZWwuREVWSUNFLCB0cnVlKTtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVTdGF0ZSgpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGV2ZW50SW5kZXhpbmdTZXR0aW5ncyA9IG51bGw7XG4gICAgICAgIGNvbnN0IElubGluZVNwaW5uZXIgPSBzZGsuZ2V0Q29tcG9uZW50KCdlbGVtZW50cy5JbmxpbmVTcGlubmVyJyk7XG5cbiAgICAgICAgaWYgKEV2ZW50SW5kZXhQZWcuZ2V0KCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGV2ZW50SW5kZXhpbmdTZXR0aW5ncyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbXhfU2V0dGluZ3NUYWJfc3Vic2VjdGlvblRleHQnPlxuICAgICAgICAgICAgICAgICAgICAgICAge190KCBcIlNlY3VyZWx5IGNhY2hlIGVuY3J5cHRlZCBtZXNzYWdlcyBsb2NhbGx5IGZvciB0aGVtIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0byBhcHBlYXIgaW4gc2VhcmNoIHJlc3VsdHMsIHVzaW5nIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB7Zm9ybWF0Qnl0ZXModGhpcy5zdGF0ZS5ldmVudEluZGV4U2l6ZSwgMCl9XG4gICAgICAgICAgICAgICAgICAgICAgICB7X3QoIFwiIHRvIHN0b3JlIG1lc3NhZ2VzIGZyb20gXCIpfVxuICAgICAgICAgICAgICAgICAgICAgICAge2Zvcm1hdENvdW50TG9uZyh0aGlzLnN0YXRlLnJvb21Db3VudCl9IHtfdChcInJvb21zLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIG9uQ2xpY2s9e3RoaXMuX29uTWFuYWdlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJNYW5hZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5ldmVudEluZGV4aW5nRW5hYmxlZCAmJiBFdmVudEluZGV4UGVnLnN1cHBvcnRJc0luc3RhbGxlZCgpKSB7XG4gICAgICAgICAgICBldmVudEluZGV4aW5nU2V0dGluZ3MgPSAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YnNlY3Rpb25UZXh0Jz5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtfdCggXCJTZWN1cmVseSBjYWNoZSBlbmNyeXB0ZWQgbWVzc2FnZXMgbG9jYWxseSBmb3IgdGhlbSB0byBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXBwZWFyIGluIHNlYXJjaCByZXN1bHRzLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwicHJpbWFyeVwiIGRpc2FibGVkPXt0aGlzLnN0YXRlLmVuYWJsaW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMuX29uRW5hYmxlfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7X3QoXCJFbmFibGVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS5lbmFibGluZyA/IDxJbmxpbmVTcGlubmVyIC8+IDogPGRpdiAvPn1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKEV2ZW50SW5kZXhQZWcucGxhdGZvcm1IYXNTdXBwb3J0KCkgJiYgIUV2ZW50SW5kZXhQZWcuc3VwcG9ydElzSW5zdGFsbGVkKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZUxpbmsgPSAoXG4gICAgICAgICAgICAgICAgXCJodHRwczovL2dpdGh1Yi5jb20vdmVjdG9yLWltL3Jpb3Qtd2ViL2Jsb2IvZGV2ZWxvcC9cIiArXG4gICAgICAgICAgICAgICAgXCJkb2NzL25hdGl2ZS1ub2RlLW1vZHVsZXMubWQjXCIgK1xuICAgICAgICAgICAgICAgIFwiYWRkaW5nLXNlc2hhdC1mb3Itc2VhcmNoLWluLWUyZS1lbmNyeXB0ZWQtcm9vbXNcIlxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZXZlbnRJbmRleGluZ1NldHRpbmdzID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90KCBcIlJpb3QgaXMgbWlzc2luZyBzb21lIGNvbXBvbmVudHMgcmVxdWlyZWQgZm9yIHNlY3VyZWx5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNhY2hpbmcgZW5jcnlwdGVkIG1lc3NhZ2VzIGxvY2FsbHkuIElmIHlvdSdkIGxpa2UgdG8gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZXhwZXJpbWVudCB3aXRoIHRoaXMgZmVhdHVyZSwgYnVpbGQgYSBjdXN0b20gUmlvdCBEZXNrdG9wIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndpdGggPG5hdGl2ZUxpbms+c2VhcmNoIGNvbXBvbmVudHMgYWRkZWQ8L25hdGl2ZUxpbms+LlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hdGl2ZUxpbmsnOiAoc3ViKSA9PiA8YSBocmVmPXtuYXRpdmVMaW5rfSB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsPVwibm9yZWZlcnJlciBub29wZW5lclwiPntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXZlbnRJbmRleGluZ1NldHRpbmdzID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9TZXR0aW5nc1RhYl9zdWJzZWN0aW9uVGV4dCc+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90KCBcIlJpb3QgY2FuJ3Qgc2VjdXJlbHkgY2FjaGUgZW5jcnlwdGVkIG1lc3NhZ2VzIGxvY2FsbHkgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid2hpbGUgcnVubmluZyBpbiBhIHdlYiBicm93c2VyLiBVc2UgPHJpb3RMaW5rPlJpb3QgRGVza3RvcDwvcmlvdExpbms+IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZvciBlbmNyeXB0ZWQgbWVzc2FnZXMgdG8gYXBwZWFyIGluIHNlYXJjaCByZXN1bHRzLlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Jpb3RMaW5rJzogKHN1YikgPT4gPGEgaHJlZj1cImh0dHBzOi8vcmlvdC5pbS9kb3dubG9hZC9kZXNrdG9wXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXIgbm9vcGVuZXJcIj57c3VifTwvYT4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBldmVudEluZGV4aW5nU2V0dGluZ3M7XG4gICAgfVxufVxuIl19