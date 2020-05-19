"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _SettingsStore = _interopRequireWildcard(require("../../../settings/SettingsStore"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _notifications = require("../../../notifications");

var _SdkConfig = _interopRequireDefault(require("../../../SdkConfig"));

var _LabelledToggleSwitch = _interopRequireDefault(require("../elements/LabelledToggleSwitch"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

/*
Copyright 2016 OpenMarket Ltd

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
// TODO: this "view" component still has far too much application logic in it,
// which should be factored out to other files.
// TODO: this component also does a lot of direct poking into this.state, which
// is VERY NAUGHTY.

/**
 * Rules that Vector used to set in order to override the actions of default rules.
 * These are used to port peoples existing overrides to match the current API.
 * These can be removed and forgotten once everyone has moved to the new client.
 */
const LEGACY_RULES = {
  "im.vector.rule.contains_display_name": ".m.rule.contains_display_name",
  "im.vector.rule.room_one_to_one": ".m.rule.room_one_to_one",
  "im.vector.rule.room_message": ".m.rule.message",
  "im.vector.rule.invite_for_me": ".m.rule.invite_for_me",
  "im.vector.rule.call": ".m.rule.call",
  "im.vector.rule.notices": ".m.rule.suppress_notices"
};

function portLegacyActions(actions) {
  const decoded = _notifications.NotificationUtils.decodeActions(actions);

  if (decoded !== null) {
    return _notifications.NotificationUtils.encodeActions(decoded);
  } else {
    // We don't recognise one of the actions here, so we don't try to
    // canonicalise them.
    return actions;
  }
}

var _default = (0, _createReactClass.default)({
  displayName: 'Notifications',
  phases: {
    LOADING: "LOADING",
    // The component is loading or sending data to the hs
    DISPLAY: "DISPLAY",
    // The component is ready and display data
    ERROR: "ERROR" // There was an error

  },
  getInitialState: function () {
    return {
      phase: this.phases.LOADING,
      masterPushRule: undefined,
      // The master rule ('.m.rule.master')
      vectorPushRules: [],
      // HS default push rules displayed in Vector UI
      vectorContentRules: {
        // Keyword push rules displayed in Vector UI
        vectorState: _notifications.PushRuleVectorState.ON,
        rules: []
      },
      externalPushRules: [],
      // Push rules (except content rule) that have been defined outside Vector UI
      externalContentRules: [],
      // Keyword push rules that have been defined outside Vector UI
      threepids: [] // used for email notifications

    };
  },
  componentDidMount: function () {
    this._refreshFromServer();
  },
  onEnableNotificationsChange: function (checked) {
    const self = this;
    this.setState({
      phase: this.phases.LOADING
    });

    _MatrixClientPeg.MatrixClientPeg.get().setPushRuleEnabled('global', self.state.masterPushRule.kind, self.state.masterPushRule.rule_id, !checked).then(function () {
      self._refreshFromServer();
    });
  },
  onEnableDesktopNotificationsChange: function (checked) {
    _SettingsStore.default.setValue("notificationsEnabled", null, _SettingsStore.SettingLevel.DEVICE, checked).finally(() => {
      this.forceUpdate();
    });
  },
  onEnableDesktopNotificationBodyChange: function (checked) {
    _SettingsStore.default.setValue("notificationBodyEnabled", null, _SettingsStore.SettingLevel.DEVICE, checked).finally(() => {
      this.forceUpdate();
    });
  },
  onEnableAudioNotificationsChange: function (checked) {
    _SettingsStore.default.setValue("audioNotificationsEnabled", null, _SettingsStore.SettingLevel.DEVICE, checked).finally(() => {
      this.forceUpdate();
    });
  },

  /*
   * Returns the email pusher (pusher of type 'email') for a given
   * email address. Email pushers all have the same app ID, so since
   * pushers are unique over (app ID, pushkey), there will be at most
   * one such pusher.
   */
  getEmailPusher: function (pushers, address) {
    if (pushers === undefined) {
      return undefined;
    }

    for (let i = 0; i < pushers.length; ++i) {
      if (pushers[i].kind === 'email' && pushers[i].pushkey === address) {
        return pushers[i];
      }
    }

    return undefined;
  },
  onEnableEmailNotificationsChange: function (address, checked) {
    let emailPusherPromise;

    if (checked) {
      const data = {};
      data['brand'] = _SdkConfig.default.get().brand || 'Riot';
      emailPusherPromise = _MatrixClientPeg.MatrixClientPeg.get().setPusher({
        kind: 'email',
        app_id: 'm.email',
        pushkey: address,
        app_display_name: 'Email Notifications',
        device_display_name: address,
        lang: navigator.language,
        data: data,
        append: true // We always append for email pushers since we don't want to stop other accounts notifying to the same email address

      });
    } else {
      const emailPusher = this.getEmailPusher(this.state.pushers, address);
      emailPusher.kind = null;
      emailPusherPromise = _MatrixClientPeg.MatrixClientPeg.get().setPusher(emailPusher);
    }

    emailPusherPromise.then(() => {
      this._refreshFromServer();
    }, error => {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

      _Modal.default.createTrackedDialog('Error saving email notification preferences', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Error saving email notification preferences'),
        description: (0, _languageHandler._t)('An error occurred whilst saving your email notification preferences.')
      });
    });
  },
  onNotifStateButtonClicked: function (event) {
    // FIXME: use .bind() rather than className metadata here surely
    const vectorRuleId = event.target.className.split("-")[0];
    const newPushRuleVectorState = event.target.className.split("-")[1];

    if ("_keywords" === vectorRuleId) {
      this._setKeywordsPushRuleVectorState(newPushRuleVectorState);
    } else {
      const rule = this.getRule(vectorRuleId);

      if (rule) {
        this._setPushRuleVectorState(rule, newPushRuleVectorState);
      }
    }
  },
  onKeywordsClicked: function (event) {
    const self = this; // Compute the keywords list to display

    let keywords = [];

    for (const i in this.state.vectorContentRules.rules) {
      const rule = this.state.vectorContentRules.rules[i];
      keywords.push(rule.pattern);
    }

    if (keywords.length) {
      // As keeping the order of per-word push rules hs side is a bit tricky to code,
      // display the keywords in alphabetical order to the user
      keywords.sort();
      keywords = keywords.join(", ");
    } else {
      keywords = "";
    }

    const TextInputDialog = sdk.getComponent("dialogs.TextInputDialog");

    _Modal.default.createTrackedDialog('Keywords Dialog', '', TextInputDialog, {
      title: (0, _languageHandler._t)('Keywords'),
      description: (0, _languageHandler._t)('Enter keywords separated by a comma:'),
      button: (0, _languageHandler._t)('OK'),
      value: keywords,
      onFinished: function onFinished(should_leave, newValue) {
        if (should_leave && newValue !== keywords) {
          let newKeywords = newValue.split(',');

          for (const i in newKeywords) {
            newKeywords[i] = newKeywords[i].trim();
          } // Remove duplicates and empty


          newKeywords = newKeywords.reduce(function (array, keyword) {
            if (keyword !== "" && array.indexOf(keyword) < 0) {
              array.push(keyword);
            }

            return array;
          }, []);

          self._setKeywords(newKeywords);
        }
      }
    });
  },
  getRule: function (vectorRuleId) {
    for (const i in this.state.vectorPushRules) {
      const rule = this.state.vectorPushRules[i];

      if (rule.vectorRuleId === vectorRuleId) {
        return rule;
      }
    }
  },
  _setPushRuleVectorState: function (rule, newPushRuleVectorState) {
    if (rule && rule.vectorState !== newPushRuleVectorState) {
      this.setState({
        phase: this.phases.LOADING
      });
      const self = this;

      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      const deferreds = [];
      const ruleDefinition = _notifications.VectorPushRulesDefinitions[rule.vectorRuleId];

      if (rule.rule) {
        const actions = ruleDefinition.vectorStateToActions[newPushRuleVectorState];

        if (!actions) {
          // The new state corresponds to disabling the rule.
          deferreds.push(cli.setPushRuleEnabled('global', rule.rule.kind, rule.rule.rule_id, false));
        } else {
          // The new state corresponds to enabling the rule and setting specific actions
          deferreds.push(this._updatePushRuleActions(rule.rule, actions, true));
        }
      }

      Promise.all(deferreds).then(function () {
        self._refreshFromServer();
      }, function (error) {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
        console.error("Failed to change settings: " + error);

        _Modal.default.createTrackedDialog('Failed to change settings', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Failed to change settings'),
          description: error && error.message ? error.message : (0, _languageHandler._t)('Operation failed'),
          onFinished: self._refreshFromServer
        });
      });
    }
  },
  _setKeywordsPushRuleVectorState: function (newPushRuleVectorState) {
    // Is there really a change?
    if (this.state.vectorContentRules.vectorState === newPushRuleVectorState || this.state.vectorContentRules.rules.length === 0) {
      return;
    }

    const self = this;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    this.setState({
      phase: this.phases.LOADING
    }); // Update all rules in self.state.vectorContentRules

    const deferreds = [];

    for (const i in this.state.vectorContentRules.rules) {
      const rule = this.state.vectorContentRules.rules[i];
      let enabled;
      let actions;

      switch (newPushRuleVectorState) {
        case _notifications.PushRuleVectorState.ON:
          if (rule.actions.length !== 1) {
            actions = _notifications.PushRuleVectorState.actionsFor(_notifications.PushRuleVectorState.ON);
          }

          if (this.state.vectorContentRules.vectorState === _notifications.PushRuleVectorState.OFF) {
            enabled = true;
          }

          break;

        case _notifications.PushRuleVectorState.LOUD:
          if (rule.actions.length !== 3) {
            actions = _notifications.PushRuleVectorState.actionsFor(_notifications.PushRuleVectorState.LOUD);
          }

          if (this.state.vectorContentRules.vectorState === _notifications.PushRuleVectorState.OFF) {
            enabled = true;
          }

          break;

        case _notifications.PushRuleVectorState.OFF:
          enabled = false;
          break;
      }

      if (actions) {
        // Note that the workaround in _updatePushRuleActions will automatically
        // enable the rule
        deferreds.push(this._updatePushRuleActions(rule, actions, enabled));
      } else if (enabled != undefined) {
        deferreds.push(cli.setPushRuleEnabled('global', rule.kind, rule.rule_id, enabled));
      }
    }

    Promise.all(deferreds).then(function (resps) {
      self._refreshFromServer();
    }, function (error) {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Can't update user notification settings: " + error);

      _Modal.default.createTrackedDialog('Can\'t update user notifcation settings', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Can\'t update user notification settings'),
        description: error && error.message ? error.message : (0, _languageHandler._t)('Operation failed'),
        onFinished: self._refreshFromServer
      });
    });
  },
  _setKeywords: function (newKeywords) {
    this.setState({
      phase: this.phases.LOADING
    });
    const self = this;

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    const removeDeferreds = []; // Remove per-word push rules of keywords that are no more in the list

    const vectorContentRulesPatterns = [];

    for (const i in self.state.vectorContentRules.rules) {
      const rule = self.state.vectorContentRules.rules[i];
      vectorContentRulesPatterns.push(rule.pattern);

      if (newKeywords.indexOf(rule.pattern) < 0) {
        removeDeferreds.push(cli.deletePushRule('global', rule.kind, rule.rule_id));
      }
    } // If the keyword is part of `externalContentRules`, remove the rule
    // before recreating it in the right Vector path


    for (const i in self.state.externalContentRules) {
      const rule = self.state.externalContentRules[i];

      if (newKeywords.indexOf(rule.pattern) >= 0) {
        removeDeferreds.push(cli.deletePushRule('global', rule.kind, rule.rule_id));
      }
    }

    const onError = function (error) {
      const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
      console.error("Failed to update keywords: " + error);

      _Modal.default.createTrackedDialog('Failed to update keywords', '', ErrorDialog, {
        title: (0, _languageHandler._t)('Failed to update keywords'),
        description: error && error.message ? error.message : (0, _languageHandler._t)('Operation failed'),
        onFinished: self._refreshFromServer
      });
    }; // Then, add the new ones


    Promise.all(removeDeferreds).then(function (resps) {
      const deferreds = [];
      let pushRuleVectorStateKind = self.state.vectorContentRules.vectorState;

      if (pushRuleVectorStateKind === _notifications.PushRuleVectorState.OFF) {
        // When the current global keywords rule is OFF, we need to look at
        // the flavor of rules in 'vectorContentRules' to apply the same actions
        // when creating the new rule.
        // Thus, this new rule will join the 'vectorContentRules' set.
        if (self.state.vectorContentRules.rules.length) {
          pushRuleVectorStateKind = _notifications.PushRuleVectorState.contentRuleVectorStateKind(self.state.vectorContentRules.rules[0]);
        } else {
          // ON is default
          pushRuleVectorStateKind = _notifications.PushRuleVectorState.ON;
        }
      }

      for (const i in newKeywords) {
        const keyword = newKeywords[i];

        if (vectorContentRulesPatterns.indexOf(keyword) < 0) {
          if (self.state.vectorContentRules.vectorState !== _notifications.PushRuleVectorState.OFF) {
            deferreds.push(cli.addPushRule('global', 'content', keyword, {
              actions: _notifications.PushRuleVectorState.actionsFor(pushRuleVectorStateKind),
              pattern: keyword
            }));
          } else {
            deferreds.push(self._addDisabledPushRule('global', 'content', keyword, {
              actions: _notifications.PushRuleVectorState.actionsFor(pushRuleVectorStateKind),
              pattern: keyword
            }));
          }
        }
      }

      Promise.all(deferreds).then(function (resps) {
        self._refreshFromServer();
      }, onError);
    }, onError);
  },
  // Create a push rule but disabled
  _addDisabledPushRule: function (scope, kind, ruleId, body) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    return cli.addPushRule(scope, kind, ruleId, body).then(() => cli.setPushRuleEnabled(scope, kind, ruleId, false));
  },
  // Check if any legacy im.vector rules need to be ported to the new API
  // for overriding the actions of default rules.
  _portRulesToNewAPI: function (rulesets) {
    const needsUpdate = [];

    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    for (const kind in rulesets.global) {
      const ruleset = rulesets.global[kind];

      for (let i = 0; i < ruleset.length; ++i) {
        const rule = ruleset[i];

        if (rule.rule_id in LEGACY_RULES) {
          console.log("Porting legacy rule", rule);
          needsUpdate.push(function (kind, rule) {
            return cli.setPushRuleActions('global', kind, LEGACY_RULES[rule.rule_id], portLegacyActions(rule.actions)).then(() => cli.deletePushRule('global', kind, rule.rule_id)).catch(e => {
              console.warn("Error when porting legacy rule: ".concat(e));
            });
          }(kind, rule));
        }
      }
    }

    if (needsUpdate.length > 0) {
      // If some of the rules need to be ported then wait for the porting
      // to happen and then fetch the rules again.
      return Promise.all(needsUpdate).then(() => cli.getPushRules());
    } else {
      // Otherwise return the rules that we already have.
      return rulesets;
    }
  },
  _refreshFromServer: function () {
    const self = this;

    const pushRulesPromise = _MatrixClientPeg.MatrixClientPeg.get().getPushRules().then(self._portRulesToNewAPI).then(function (rulesets) {
      /// XXX seriously? wtf is this?
      _MatrixClientPeg.MatrixClientPeg.get().pushRules = rulesets; // Get homeserver default rules and triage them by categories

      const rule_categories = {
        // The master rule (all notifications disabling)
        '.m.rule.master': 'master',
        // The default push rules displayed by Vector UI
        '.m.rule.contains_display_name': 'vector',
        '.m.rule.contains_user_name': 'vector',
        '.m.rule.roomnotif': 'vector',
        '.m.rule.room_one_to_one': 'vector',
        '.m.rule.encrypted_room_one_to_one': 'vector',
        '.m.rule.message': 'vector',
        '.m.rule.encrypted': 'vector',
        '.m.rule.invite_for_me': 'vector',
        //'.m.rule.member_event': 'vector',
        '.m.rule.call': 'vector',
        '.m.rule.suppress_notices': 'vector',
        '.m.rule.tombstone': 'vector' // Others go to others

      }; // HS default rules

      const defaultRules = {
        master: [],
        vector: {},
        others: []
      };

      for (const kind in rulesets.global) {
        for (let i = 0; i < Object.keys(rulesets.global[kind]).length; ++i) {
          const r = rulesets.global[kind][i];
          const cat = rule_categories[r.rule_id];
          r.kind = kind;

          if (r.rule_id[0] === '.') {
            if (cat === 'vector') {
              defaultRules.vector[r.rule_id] = r;
            } else if (cat === 'master') {
              defaultRules.master.push(r);
            } else {
              defaultRules['others'].push(r);
            }
          }
        }
      } // Get the master rule if any defined by the hs


      if (defaultRules.master.length > 0) {
        self.state.masterPushRule = defaultRules.master[0];
      } // parse the keyword rules into our state


      const contentRules = _notifications.ContentRules.parseContentRules(rulesets);

      self.state.vectorContentRules = {
        vectorState: contentRules.vectorState,
        rules: contentRules.rules
      };
      self.state.externalContentRules = contentRules.externalRules; // Build the rules displayed in the Vector UI matrix table

      self.state.vectorPushRules = [];
      self.state.externalPushRules = [];
      const vectorRuleIds = ['.m.rule.contains_display_name', '.m.rule.contains_user_name', '.m.rule.roomnotif', '_keywords', '.m.rule.room_one_to_one', '.m.rule.encrypted_room_one_to_one', '.m.rule.message', '.m.rule.encrypted', '.m.rule.invite_for_me', //'im.vector.rule.member_event',
      '.m.rule.call', '.m.rule.suppress_notices', '.m.rule.tombstone'];

      for (const i in vectorRuleIds) {
        const vectorRuleId = vectorRuleIds[i];

        if (vectorRuleId === '_keywords') {
          // keywords needs a special handling
          // For Vector UI, this is a single global push rule but translated in Matrix,
          // it corresponds to all content push rules (stored in self.state.vectorContentRule)
          self.state.vectorPushRules.push({
            "vectorRuleId": "_keywords",
            "description": /*#__PURE__*/_react.default.createElement("span", null, (0, _languageHandler._t)('Messages containing <span>keywords</span>', {}, {
              'span': sub => /*#__PURE__*/_react.default.createElement("span", {
                className: "mx_UserNotifSettings_keywords",
                onClick: self.onKeywordsClicked
              }, sub)
            })),
            "vectorState": self.state.vectorContentRules.vectorState
          });
        } else {
          const ruleDefinition = _notifications.VectorPushRulesDefinitions[vectorRuleId];
          const rule = defaultRules.vector[vectorRuleId];
          const vectorState = ruleDefinition.ruleToVectorState(rule); //console.log("Refreshing vectorPushRules for " + vectorRuleId +", "+ ruleDefinition.description +", " + rule +", " + vectorState);

          self.state.vectorPushRules.push({
            "vectorRuleId": vectorRuleId,
            "description": (0, _languageHandler._t)(ruleDefinition.description),
            // Text from VectorPushRulesDefinitions.js
            "rule": rule,
            "vectorState": vectorState
          }); // if there was a rule which we couldn't parse, add it to the external list

          if (rule && !vectorState) {
            rule.description = ruleDefinition.description;
            self.state.externalPushRules.push(rule);
          }
        }
      } // Build the rules not managed by Vector UI


      const otherRulesDescriptions = {
        '.m.rule.message': (0, _languageHandler._t)('Notify for all other messages/rooms'),
        '.m.rule.fallback': (0, _languageHandler._t)('Notify me for anything else')
      };

      for (const i in defaultRules.others) {
        const rule = defaultRules.others[i];
        const ruleDescription = otherRulesDescriptions[rule.rule_id]; // Show enabled default rules that was modified by the user

        if (ruleDescription && rule.enabled && !rule.default) {
          rule.description = ruleDescription;
          self.state.externalPushRules.push(rule);
        }
      }
    });

    const pushersPromise = _MatrixClientPeg.MatrixClientPeg.get().getPushers().then(function (resp) {
      self.setState({
        pushers: resp.pushers
      });
    });

    Promise.all([pushRulesPromise, pushersPromise]).then(function () {
      self.setState({
        phase: self.phases.DISPLAY
      });
    }, function (error) {
      console.error(error);
      self.setState({
        phase: self.phases.ERROR
      });
    }).finally(() => {
      // actually explicitly update our state  having been deep-manipulating it
      self.setState({
        masterPushRule: self.state.masterPushRule,
        vectorContentRules: self.state.vectorContentRules,
        vectorPushRules: self.state.vectorPushRules,
        externalContentRules: self.state.externalContentRules,
        externalPushRules: self.state.externalPushRules
      });
    });

    _MatrixClientPeg.MatrixClientPeg.get().getThreePids().then(r => this.setState({
      threepids: r.threepids
    }));
  },
  _onClearNotifications: function () {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    cli.getRooms().forEach(r => {
      if (r.getUnreadNotificationCount() > 0) {
        const events = r.getLiveTimeline().getEvents();
        if (events.length) cli.sendReadReceipt(events.pop());
      }
    });
  },
  _updatePushRuleActions: function (rule, actions, enabled) {
    const cli = _MatrixClientPeg.MatrixClientPeg.get();

    return cli.setPushRuleActions('global', rule.kind, rule.rule_id, actions).then(function () {
      // Then, if requested, enabled or disabled the rule
      if (undefined != enabled) {
        return cli.setPushRuleEnabled('global', rule.kind, rule.rule_id, enabled);
      }
    });
  },
  renderNotifRulesTableRow: function (title, className, pushRuleVectorState) {
    return /*#__PURE__*/_react.default.createElement("tr", {
      key: className
    }, /*#__PURE__*/_react.default.createElement("th", null, title), /*#__PURE__*/_react.default.createElement("th", null, /*#__PURE__*/_react.default.createElement("input", {
      className: className + "-" + _notifications.PushRuleVectorState.OFF,
      type: "radio",
      checked: pushRuleVectorState === _notifications.PushRuleVectorState.OFF,
      onChange: this.onNotifStateButtonClicked
    })), /*#__PURE__*/_react.default.createElement("th", null, /*#__PURE__*/_react.default.createElement("input", {
      className: className + "-" + _notifications.PushRuleVectorState.ON,
      type: "radio",
      checked: pushRuleVectorState === _notifications.PushRuleVectorState.ON,
      onChange: this.onNotifStateButtonClicked
    })), /*#__PURE__*/_react.default.createElement("th", null, /*#__PURE__*/_react.default.createElement("input", {
      className: className + "-" + _notifications.PushRuleVectorState.LOUD,
      type: "radio",
      checked: pushRuleVectorState === _notifications.PushRuleVectorState.LOUD,
      onChange: this.onNotifStateButtonClicked
    })));
  },
  renderNotifRulesTableRows: function () {
    const rows = [];

    for (const i in this.state.vectorPushRules) {
      const rule = this.state.vectorPushRules[i];

      if (rule.rule === undefined && rule.vectorRuleId.startsWith(".m.")) {
        console.warn("Skipping render of rule ".concat(rule.vectorRuleId, " due to no underlying rule"));
        continue;
      } //console.log("rendering: " + rule.description + ", " + rule.vectorRuleId + ", " + rule.vectorState);


      rows.push(this.renderNotifRulesTableRow(rule.description, rule.vectorRuleId, rule.vectorState));
    }

    return rows;
  },
  hasEmailPusher: function (pushers, address) {
    if (pushers === undefined) {
      return false;
    }

    for (let i = 0; i < pushers.length; ++i) {
      if (pushers[i].kind === 'email' && pushers[i].pushkey === address) {
        return true;
      }
    }

    return false;
  },
  emailNotificationsRow: function (address, label) {
    return /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: this.hasEmailPusher(this.state.pushers, address),
      onChange: this.onEnableEmailNotificationsChange.bind(this, address),
      label: label,
      key: "emailNotif_".concat(label)
    });
  },
  render: function () {
    let spinner;

    if (this.state.phase === this.phases.LOADING) {
      const Loader = sdk.getComponent("elements.Spinner");
      spinner = /*#__PURE__*/_react.default.createElement(Loader, null);
    }

    let masterPushRuleDiv;

    if (this.state.masterPushRule) {
      masterPushRuleDiv = /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
        value: !this.state.masterPushRule.enabled,
        onChange: this.onEnableNotificationsChange,
        label: (0, _languageHandler._t)('Enable notifications for this account')
      });
    }

    let clearNotificationsButton;

    if (_MatrixClientPeg.MatrixClientPeg.get().getRooms().some(r => r.getUnreadNotificationCount() > 0)) {
      clearNotificationsButton = /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
        onClick: this._onClearNotifications,
        kind: "danger"
      }, (0, _languageHandler._t)("Clear notifications"));
    } // When enabled, the master rule inhibits all existing rules
    // So do not show all notification settings


    if (this.state.masterPushRule && this.state.masterPushRule.enabled) {
      return /*#__PURE__*/_react.default.createElement("div", null, masterPushRuleDiv, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_UserNotifSettings_notifTable"
      }, (0, _languageHandler._t)('All notifications are currently disabled for all targets.')), clearNotificationsButton);
    }

    const emailThreepids = this.state.threepids.filter(tp => tp.medium === "email");
    let emailNotificationsRows;

    if (emailThreepids.length === 0) {
      emailNotificationsRows = /*#__PURE__*/_react.default.createElement("div", null, (0, _languageHandler._t)('Add an email address to configure email notifications'));
    } else {
      emailNotificationsRows = emailThreepids.map(threePid => this.emailNotificationsRow(threePid.address, "".concat((0, _languageHandler._t)('Enable email notifications'), " (").concat(threePid.address, ")")));
    } // Build external push rules


    const externalRules = [];

    for (const i in this.state.externalPushRules) {
      const rule = this.state.externalPushRules[i];
      externalRules.push( /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)(rule.description)));
    } // Show keywords not displayed by the vector UI as a single external push rule


    let externalKeywords = [];

    for (const i in this.state.externalContentRules) {
      const rule = this.state.externalContentRules[i];
      externalKeywords.push(rule.pattern);
    }

    if (externalKeywords.length) {
      externalKeywords = externalKeywords.join(", ");
      externalRules.push( /*#__PURE__*/_react.default.createElement("li", null, (0, _languageHandler._t)('Notifications on the following keywords follow rules which can’t be displayed here:'), " ", externalKeywords));
    }

    let devicesSection;

    if (this.state.pushers === undefined) {
      devicesSection = /*#__PURE__*/_react.default.createElement("div", {
        className: "error"
      }, (0, _languageHandler._t)('Unable to fetch notification target list'));
    } else if (this.state.pushers.length === 0) {
      devicesSection = null;
    } else {
      // TODO: It would be great to be able to delete pushers from here too,
      // and this wouldn't be hard to add.
      const rows = [];

      for (let i = 0; i < this.state.pushers.length; ++i) {
        rows.push( /*#__PURE__*/_react.default.createElement("tr", {
          key: i
        }, /*#__PURE__*/_react.default.createElement("td", null, this.state.pushers[i].app_display_name), /*#__PURE__*/_react.default.createElement("td", null, this.state.pushers[i].device_display_name)));
      }

      devicesSection = /*#__PURE__*/_react.default.createElement("table", {
        className: "mx_UserNotifSettings_devicesTable"
      }, /*#__PURE__*/_react.default.createElement("tbody", null, rows));
    }

    if (devicesSection) {
      devicesSection = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)('Notification targets')), devicesSection);
    }

    let advancedSettings;

    if (externalRules.length) {
      advancedSettings = /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h3", null, (0, _languageHandler._t)('Advanced notification settings')), (0, _languageHandler._t)('There are advanced notifications which are not shown here'), ".", /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)('You might have configured them in a client other than Riot. You cannot tune them in Riot but they still apply'), ".", /*#__PURE__*/_react.default.createElement("ul", null, externalRules));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, masterPushRuleDiv, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserNotifSettings_notifTable"
    }, spinner, /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: _SettingsStore.default.getValue("notificationsEnabled"),
      onChange: this.onEnableDesktopNotificationsChange,
      label: (0, _languageHandler._t)('Enable desktop notifications for this session')
    }), /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: _SettingsStore.default.getValue("notificationBodyEnabled"),
      onChange: this.onEnableDesktopNotificationBodyChange,
      label: (0, _languageHandler._t)('Show message in desktop notification')
    }), /*#__PURE__*/_react.default.createElement(_LabelledToggleSwitch.default, {
      value: _SettingsStore.default.getValue("audioNotificationsEnabled"),
      onChange: this.onEnableAudioNotificationsChange,
      label: (0, _languageHandler._t)('Enable audible notifications for this session')
    }), emailNotificationsRows, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UserNotifSettings_pushRulesTableWrapper"
    }, /*#__PURE__*/_react.default.createElement("table", {
      className: "mx_UserNotifSettings_pushRulesTable"
    }, /*#__PURE__*/_react.default.createElement("thead", null, /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("th", {
      width: "55%"
    }), /*#__PURE__*/_react.default.createElement("th", {
      width: "15%"
    }, (0, _languageHandler._t)('Off')), /*#__PURE__*/_react.default.createElement("th", {
      width: "15%"
    }, (0, _languageHandler._t)('On')), /*#__PURE__*/_react.default.createElement("th", {
      width: "15%"
    }, (0, _languageHandler._t)('Noisy')))), /*#__PURE__*/_react.default.createElement("tbody", null, this.renderNotifRulesTableRows()))), advancedSettings, devicesSection, clearNotificationsButton));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3NldHRpbmdzL05vdGlmaWNhdGlvbnMuanMiXSwibmFtZXMiOlsiTEVHQUNZX1JVTEVTIiwicG9ydExlZ2FjeUFjdGlvbnMiLCJhY3Rpb25zIiwiZGVjb2RlZCIsIk5vdGlmaWNhdGlvblV0aWxzIiwiZGVjb2RlQWN0aW9ucyIsImVuY29kZUFjdGlvbnMiLCJkaXNwbGF5TmFtZSIsInBoYXNlcyIsIkxPQURJTkciLCJESVNQTEFZIiwiRVJST1IiLCJnZXRJbml0aWFsU3RhdGUiLCJwaGFzZSIsIm1hc3RlclB1c2hSdWxlIiwidW5kZWZpbmVkIiwidmVjdG9yUHVzaFJ1bGVzIiwidmVjdG9yQ29udGVudFJ1bGVzIiwidmVjdG9yU3RhdGUiLCJQdXNoUnVsZVZlY3RvclN0YXRlIiwiT04iLCJydWxlcyIsImV4dGVybmFsUHVzaFJ1bGVzIiwiZXh0ZXJuYWxDb250ZW50UnVsZXMiLCJ0aHJlZXBpZHMiLCJjb21wb25lbnREaWRNb3VudCIsIl9yZWZyZXNoRnJvbVNlcnZlciIsIm9uRW5hYmxlTm90aWZpY2F0aW9uc0NoYW5nZSIsImNoZWNrZWQiLCJzZWxmIiwic2V0U3RhdGUiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJzZXRQdXNoUnVsZUVuYWJsZWQiLCJzdGF0ZSIsImtpbmQiLCJydWxlX2lkIiwidGhlbiIsIm9uRW5hYmxlRGVza3RvcE5vdGlmaWNhdGlvbnNDaGFuZ2UiLCJTZXR0aW5nc1N0b3JlIiwic2V0VmFsdWUiLCJTZXR0aW5nTGV2ZWwiLCJERVZJQ0UiLCJmaW5hbGx5IiwiZm9yY2VVcGRhdGUiLCJvbkVuYWJsZURlc2t0b3BOb3RpZmljYXRpb25Cb2R5Q2hhbmdlIiwib25FbmFibGVBdWRpb05vdGlmaWNhdGlvbnNDaGFuZ2UiLCJnZXRFbWFpbFB1c2hlciIsInB1c2hlcnMiLCJhZGRyZXNzIiwiaSIsImxlbmd0aCIsInB1c2hrZXkiLCJvbkVuYWJsZUVtYWlsTm90aWZpY2F0aW9uc0NoYW5nZSIsImVtYWlsUHVzaGVyUHJvbWlzZSIsImRhdGEiLCJTZGtDb25maWciLCJicmFuZCIsInNldFB1c2hlciIsImFwcF9pZCIsImFwcF9kaXNwbGF5X25hbWUiLCJkZXZpY2VfZGlzcGxheV9uYW1lIiwibGFuZyIsIm5hdmlnYXRvciIsImxhbmd1YWdlIiwiYXBwZW5kIiwiZW1haWxQdXNoZXIiLCJlcnJvciIsIkVycm9yRGlhbG9nIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiTW9kYWwiLCJjcmVhdGVUcmFja2VkRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsIm9uTm90aWZTdGF0ZUJ1dHRvbkNsaWNrZWQiLCJldmVudCIsInZlY3RvclJ1bGVJZCIsInRhcmdldCIsImNsYXNzTmFtZSIsInNwbGl0IiwibmV3UHVzaFJ1bGVWZWN0b3JTdGF0ZSIsIl9zZXRLZXl3b3Jkc1B1c2hSdWxlVmVjdG9yU3RhdGUiLCJydWxlIiwiZ2V0UnVsZSIsIl9zZXRQdXNoUnVsZVZlY3RvclN0YXRlIiwib25LZXl3b3Jkc0NsaWNrZWQiLCJrZXl3b3JkcyIsInB1c2giLCJwYXR0ZXJuIiwic29ydCIsImpvaW4iLCJUZXh0SW5wdXREaWFsb2ciLCJidXR0b24iLCJ2YWx1ZSIsIm9uRmluaXNoZWQiLCJzaG91bGRfbGVhdmUiLCJuZXdWYWx1ZSIsIm5ld0tleXdvcmRzIiwidHJpbSIsInJlZHVjZSIsImFycmF5Iiwia2V5d29yZCIsImluZGV4T2YiLCJfc2V0S2V5d29yZHMiLCJjbGkiLCJkZWZlcnJlZHMiLCJydWxlRGVmaW5pdGlvbiIsIlZlY3RvclB1c2hSdWxlc0RlZmluaXRpb25zIiwidmVjdG9yU3RhdGVUb0FjdGlvbnMiLCJfdXBkYXRlUHVzaFJ1bGVBY3Rpb25zIiwiUHJvbWlzZSIsImFsbCIsImNvbnNvbGUiLCJtZXNzYWdlIiwiZW5hYmxlZCIsImFjdGlvbnNGb3IiLCJPRkYiLCJMT1VEIiwicmVzcHMiLCJyZW1vdmVEZWZlcnJlZHMiLCJ2ZWN0b3JDb250ZW50UnVsZXNQYXR0ZXJucyIsImRlbGV0ZVB1c2hSdWxlIiwib25FcnJvciIsInB1c2hSdWxlVmVjdG9yU3RhdGVLaW5kIiwiY29udGVudFJ1bGVWZWN0b3JTdGF0ZUtpbmQiLCJhZGRQdXNoUnVsZSIsIl9hZGREaXNhYmxlZFB1c2hSdWxlIiwic2NvcGUiLCJydWxlSWQiLCJib2R5IiwiX3BvcnRSdWxlc1RvTmV3QVBJIiwicnVsZXNldHMiLCJuZWVkc1VwZGF0ZSIsImdsb2JhbCIsInJ1bGVzZXQiLCJsb2ciLCJzZXRQdXNoUnVsZUFjdGlvbnMiLCJjYXRjaCIsImUiLCJ3YXJuIiwiZ2V0UHVzaFJ1bGVzIiwicHVzaFJ1bGVzUHJvbWlzZSIsInB1c2hSdWxlcyIsInJ1bGVfY2F0ZWdvcmllcyIsImRlZmF1bHRSdWxlcyIsIm1hc3RlciIsInZlY3RvciIsIm90aGVycyIsIk9iamVjdCIsImtleXMiLCJyIiwiY2F0IiwiY29udGVudFJ1bGVzIiwiQ29udGVudFJ1bGVzIiwicGFyc2VDb250ZW50UnVsZXMiLCJleHRlcm5hbFJ1bGVzIiwidmVjdG9yUnVsZUlkcyIsInN1YiIsInJ1bGVUb1ZlY3RvclN0YXRlIiwib3RoZXJSdWxlc0Rlc2NyaXB0aW9ucyIsInJ1bGVEZXNjcmlwdGlvbiIsImRlZmF1bHQiLCJwdXNoZXJzUHJvbWlzZSIsImdldFB1c2hlcnMiLCJyZXNwIiwiZ2V0VGhyZWVQaWRzIiwiX29uQ2xlYXJOb3RpZmljYXRpb25zIiwiZ2V0Um9vbXMiLCJmb3JFYWNoIiwiZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQiLCJldmVudHMiLCJnZXRMaXZlVGltZWxpbmUiLCJnZXRFdmVudHMiLCJzZW5kUmVhZFJlY2VpcHQiLCJwb3AiLCJyZW5kZXJOb3RpZlJ1bGVzVGFibGVSb3ciLCJwdXNoUnVsZVZlY3RvclN0YXRlIiwicmVuZGVyTm90aWZSdWxlc1RhYmxlUm93cyIsInJvd3MiLCJzdGFydHNXaXRoIiwiaGFzRW1haWxQdXNoZXIiLCJlbWFpbE5vdGlmaWNhdGlvbnNSb3ciLCJsYWJlbCIsImJpbmQiLCJyZW5kZXIiLCJzcGlubmVyIiwiTG9hZGVyIiwibWFzdGVyUHVzaFJ1bGVEaXYiLCJjbGVhck5vdGlmaWNhdGlvbnNCdXR0b24iLCJzb21lIiwiZW1haWxUaHJlZXBpZHMiLCJmaWx0ZXIiLCJ0cCIsIm1lZGl1bSIsImVtYWlsTm90aWZpY2F0aW9uc1Jvd3MiLCJtYXAiLCJ0aHJlZVBpZCIsImV4dGVybmFsS2V5d29yZHMiLCJkZXZpY2VzU2VjdGlvbiIsImFkdmFuY2VkU2V0dGluZ3MiLCJnZXRWYWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFnQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBL0JBOzs7Ozs7Ozs7Ozs7Ozs7QUFpQ0E7QUFDQTtBQUVBO0FBQ0E7O0FBR0E7Ozs7O0FBS0EsTUFBTUEsWUFBWSxHQUFHO0FBQ2pCLDBDQUF3QywrQkFEdkI7QUFFakIsb0NBQWtDLHlCQUZqQjtBQUdqQixpQ0FBK0IsaUJBSGQ7QUFJakIsa0NBQWdDLHVCQUpmO0FBS2pCLHlCQUF1QixjQUxOO0FBTWpCLDRCQUEwQjtBQU5ULENBQXJCOztBQVNBLFNBQVNDLGlCQUFULENBQTJCQyxPQUEzQixFQUFvQztBQUNoQyxRQUFNQyxPQUFPLEdBQUdDLGlDQUFrQkMsYUFBbEIsQ0FBZ0NILE9BQWhDLENBQWhCOztBQUNBLE1BQUlDLE9BQU8sS0FBSyxJQUFoQixFQUFzQjtBQUNsQixXQUFPQyxpQ0FBa0JFLGFBQWxCLENBQWdDSCxPQUFoQyxDQUFQO0FBQ0gsR0FGRCxNQUVPO0FBQ0g7QUFDQTtBQUNBLFdBQU9ELE9BQVA7QUFDSDtBQUNKOztlQUVjLCtCQUFpQjtBQUM1QkssRUFBQUEsV0FBVyxFQUFFLGVBRGU7QUFHNUJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxPQUFPLEVBQUUsU0FETDtBQUNnQjtBQUNwQkMsSUFBQUEsT0FBTyxFQUFFLFNBRkw7QUFFZ0I7QUFDcEJDLElBQUFBLEtBQUssRUFBRSxPQUhILENBR1k7O0FBSFosR0FIb0I7QUFT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S0FBSyxFQUFFLHlCQUFHLHNDQUFIO0FBRjdCLE1BUkosZUFZSSw2QkFBQyw2QkFBRDtBQUFzQixNQUFBLEtBQUssRUFBRU4sdUJBQWNrSyxRQUFkLENBQXVCLDJCQUF2QixDQUE3QjtBQUNzQixNQUFBLFFBQVEsRUFBRSxLQUFLM0osZ0NBRHJDO0FBRXNCLE1BQUEsS0FBSyxFQUFFLHlCQUFHLCtDQUFIO0FBRjdCLE1BWkosRUFnQk1xSixzQkFoQk4sZUFrQkk7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLG9CQUNJO0FBQU8sTUFBQSxTQUFTLEVBQUM7QUFBakIsb0JBQ0kseURBQ0ksc0RBQ0k7QUFBSSxNQUFBLEtBQUssRUFBQztBQUFWLE1BREosZUFFSTtBQUFJLE1BQUEsS0FBSyxFQUFDO0FBQVYsT0FBa0IseUJBQUcsS0FBSCxDQUFsQixDQUZKLGVBR0k7QUFBSSxNQUFBLEtBQUssRUFBQztBQUFWLE9BQWtCLHlCQUFHLElBQUgsQ0FBbEIsQ0FISixlQUlJO0FBQUksTUFBQSxLQUFLLEVBQUM7QUFBVixPQUFrQix5QkFBRyxPQUFILENBQWxCLENBSkosQ0FESixDQURKLGVBU0ksNENBRU0sS0FBS2pCLHlCQUFMLEVBRk4sQ0FUSixDQURKLENBbEJKLEVBb0NNc0IsZ0JBcENOLEVBc0NNRCxjQXRDTixFQXdDTVYsd0JBeENOLENBSkosQ0FESjtBQWtESDtBQXgwQjJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi4vLi4vLi4vTWF0cml4Q2xpZW50UGVnJztcbmltcG9ydCBTZXR0aW5nc1N0b3JlLCB7U2V0dGluZ0xldmVsfSBmcm9tICcuLi8uLi8uLi9zZXR0aW5ncy9TZXR0aW5nc1N0b3JlJztcbmltcG9ydCBNb2RhbCBmcm9tICcuLi8uLi8uLi9Nb2RhbCc7XG5pbXBvcnQge1xuICAgIE5vdGlmaWNhdGlvblV0aWxzLFxuICAgIFZlY3RvclB1c2hSdWxlc0RlZmluaXRpb25zLFxuICAgIFB1c2hSdWxlVmVjdG9yU3RhdGUsXG4gICAgQ29udGVudFJ1bGVzLFxufSBmcm9tICcuLi8uLi8uLi9ub3RpZmljYXRpb25zJztcbmltcG9ydCBTZGtDb25maWcgZnJvbSBcIi4uLy4uLy4uL1Nka0NvbmZpZ1wiO1xuaW1wb3J0IExhYmVsbGVkVG9nZ2xlU3dpdGNoIGZyb20gXCIuLi9lbGVtZW50cy9MYWJlbGxlZFRvZ2dsZVN3aXRjaFwiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcblxuLy8gVE9ETzogdGhpcyBcInZpZXdcIiBjb21wb25lbnQgc3RpbGwgaGFzIGZhciB0b28gbXVjaCBhcHBsaWNhdGlvbiBsb2dpYyBpbiBpdCxcbi8vIHdoaWNoIHNob3VsZCBiZSBmYWN0b3JlZCBvdXQgdG8gb3RoZXIgZmlsZXMuXG5cbi8vIFRPRE86IHRoaXMgY29tcG9uZW50IGFsc28gZG9lcyBhIGxvdCBvZiBkaXJlY3QgcG9raW5nIGludG8gdGhpcy5zdGF0ZSwgd2hpY2hcbi8vIGlzIFZFUlkgTkFVR0hUWS5cblxuXG4vKipcbiAqIFJ1bGVzIHRoYXQgVmVjdG9yIHVzZWQgdG8gc2V0IGluIG9yZGVyIHRvIG92ZXJyaWRlIHRoZSBhY3Rpb25zIG9mIGRlZmF1bHQgcnVsZXMuXG4gKiBUaGVzZSBhcmUgdXNlZCB0byBwb3J0IHBlb3BsZXMgZXhpc3Rpbmcgb3ZlcnJpZGVzIHRvIG1hdGNoIHRoZSBjdXJyZW50IEFQSS5cbiAqIFRoZXNlIGNhbiBiZSByZW1vdmVkIGFuZCBmb3Jnb3R0ZW4gb25jZSBldmVyeW9uZSBoYXMgbW92ZWQgdG8gdGhlIG5ldyBjbGllbnQuXG4gKi9cbmNvbnN0IExFR0FDWV9SVUxFUyA9IHtcbiAgICBcImltLnZlY3Rvci5ydWxlLmNvbnRhaW5zX2Rpc3BsYXlfbmFtZVwiOiBcIi5tLnJ1bGUuY29udGFpbnNfZGlzcGxheV9uYW1lXCIsXG4gICAgXCJpbS52ZWN0b3IucnVsZS5yb29tX29uZV90b19vbmVcIjogXCIubS5ydWxlLnJvb21fb25lX3RvX29uZVwiLFxuICAgIFwiaW0udmVjdG9yLnJ1bGUucm9vbV9tZXNzYWdlXCI6IFwiLm0ucnVsZS5tZXNzYWdlXCIsXG4gICAgXCJpbS52ZWN0b3IucnVsZS5pbnZpdGVfZm9yX21lXCI6IFwiLm0ucnVsZS5pbnZpdGVfZm9yX21lXCIsXG4gICAgXCJpbS52ZWN0b3IucnVsZS5jYWxsXCI6IFwiLm0ucnVsZS5jYWxsXCIsXG4gICAgXCJpbS52ZWN0b3IucnVsZS5ub3RpY2VzXCI6IFwiLm0ucnVsZS5zdXBwcmVzc19ub3RpY2VzXCIsXG59O1xuXG5mdW5jdGlvbiBwb3J0TGVnYWN5QWN0aW9ucyhhY3Rpb25zKSB7XG4gICAgY29uc3QgZGVjb2RlZCA9IE5vdGlmaWNhdGlvblV0aWxzLmRlY29kZUFjdGlvbnMoYWN0aW9ucyk7XG4gICAgaWYgKGRlY29kZWQgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIE5vdGlmaWNhdGlvblV0aWxzLmVuY29kZUFjdGlvbnMoZGVjb2RlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgZG9uJ3QgcmVjb2duaXNlIG9uZSBvZiB0aGUgYWN0aW9ucyBoZXJlLCBzbyB3ZSBkb24ndCB0cnkgdG9cbiAgICAgICAgLy8gY2Fub25pY2FsaXNlIHRoZW0uXG4gICAgICAgIHJldHVybiBhY3Rpb25zO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdOb3RpZmljYXRpb25zJyxcblxuICAgIHBoYXNlczoge1xuICAgICAgICBMT0FESU5HOiBcIkxPQURJTkdcIiwgLy8gVGhlIGNvbXBvbmVudCBpcyBsb2FkaW5nIG9yIHNlbmRpbmcgZGF0YSB0byB0aGUgaHNcbiAgICAgICAgRElTUExBWTogXCJESVNQTEFZXCIsIC8vIFRoZSBjb21wb25lbnQgaXMgcmVhZHkgYW5kIGRpc3BsYXkgZGF0YVxuICAgICAgICBFUlJPUjogXCJFUlJPUlwiLCAvLyBUaGVyZSB3YXMgYW4gZXJyb3JcbiAgICB9LFxuXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLnBoYXNlcy5MT0FESU5HLFxuICAgICAgICAgICAgbWFzdGVyUHVzaFJ1bGU6IHVuZGVmaW5lZCwgLy8gVGhlIG1hc3RlciBydWxlICgnLm0ucnVsZS5tYXN0ZXInKVxuICAgICAgICAgICAgdmVjdG9yUHVzaFJ1bGVzOiBbXSwgLy8gSFMgZGVmYXVsdCBwdXNoIHJ1bGVzIGRpc3BsYXllZCBpbiBWZWN0b3IgVUlcbiAgICAgICAgICAgIHZlY3RvckNvbnRlbnRSdWxlczogeyAvLyBLZXl3b3JkIHB1c2ggcnVsZXMgZGlzcGxheWVkIGluIFZlY3RvciBVSVxuICAgICAgICAgICAgICAgIHZlY3RvclN0YXRlOiBQdXNoUnVsZVZlY3RvclN0YXRlLk9OLFxuICAgICAgICAgICAgICAgIHJ1bGVzOiBbXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHRlcm5hbFB1c2hSdWxlczogW10sIC8vIFB1c2ggcnVsZXMgKGV4Y2VwdCBjb250ZW50IHJ1bGUpIHRoYXQgaGF2ZSBiZWVuIGRlZmluZWQgb3V0c2lkZSBWZWN0b3IgVUlcbiAgICAgICAgICAgIGV4dGVybmFsQ29udGVudFJ1bGVzOiBbXSwgLy8gS2V5d29yZCBwdXNoIHJ1bGVzIHRoYXQgaGF2ZSBiZWVuIGRlZmluZWQgb3V0c2lkZSBWZWN0b3IgVUlcbiAgICAgICAgICAgIHRocmVlcGlkczogW10sIC8vIHVzZWQgZm9yIGVtYWlsIG5vdGlmaWNhdGlvbnNcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yZWZyZXNoRnJvbVNlcnZlcigpO1xuICAgIH0sXG5cbiAgICBvbkVuYWJsZU5vdGlmaWNhdGlvbnNDaGFuZ2U6IGZ1bmN0aW9uKGNoZWNrZWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcGhhc2U6IHRoaXMucGhhc2VzLkxPQURJTkcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRQdXNoUnVsZUVuYWJsZWQoJ2dsb2JhbCcsIHNlbGYuc3RhdGUubWFzdGVyUHVzaFJ1bGUua2luZCwgc2VsZi5zdGF0ZS5tYXN0ZXJQdXNoUnVsZS5ydWxlX2lkLCAhY2hlY2tlZCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgc2VsZi5fcmVmcmVzaEZyb21TZXJ2ZXIoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uRW5hYmxlRGVza3RvcE5vdGlmaWNhdGlvbnNDaGFuZ2U6IGZ1bmN0aW9uKGNoZWNrZWQpIHtcbiAgICAgICAgU2V0dGluZ3NTdG9yZS5zZXRWYWx1ZShcbiAgICAgICAgICAgIFwibm90aWZpY2F0aW9uc0VuYWJsZWRcIiwgbnVsbCxcbiAgICAgICAgICAgIFNldHRpbmdMZXZlbC5ERVZJQ0UsXG4gICAgICAgICAgICBjaGVja2VkLFxuICAgICAgICApLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25FbmFibGVEZXNrdG9wTm90aWZpY2F0aW9uQm9keUNoYW5nZTogZnVuY3Rpb24oY2hlY2tlZCkge1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFxuICAgICAgICAgICAgXCJub3RpZmljYXRpb25Cb2R5RW5hYmxlZFwiLCBudWxsLFxuICAgICAgICAgICAgU2V0dGluZ0xldmVsLkRFVklDRSxcbiAgICAgICAgICAgIGNoZWNrZWQsXG4gICAgICAgICkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbkVuYWJsZUF1ZGlvTm90aWZpY2F0aW9uc0NoYW5nZTogZnVuY3Rpb24oY2hlY2tlZCkge1xuICAgICAgICBTZXR0aW5nc1N0b3JlLnNldFZhbHVlKFxuICAgICAgICAgICAgXCJhdWRpb05vdGlmaWNhdGlvbnNFbmFibGVkXCIsIG51bGwsXG4gICAgICAgICAgICBTZXR0aW5nTGV2ZWwuREVWSUNFLFxuICAgICAgICAgICAgY2hlY2tlZCxcbiAgICAgICAgKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogUmV0dXJucyB0aGUgZW1haWwgcHVzaGVyIChwdXNoZXIgb2YgdHlwZSAnZW1haWwnKSBmb3IgYSBnaXZlblxuICAgICAqIGVtYWlsIGFkZHJlc3MuIEVtYWlsIHB1c2hlcnMgYWxsIGhhdmUgdGhlIHNhbWUgYXBwIElELCBzbyBzaW5jZVxuICAgICAqIHB1c2hlcnMgYXJlIHVuaXF1ZSBvdmVyIChhcHAgSUQsIHB1c2hrZXkpLCB0aGVyZSB3aWxsIGJlIGF0IG1vc3RcbiAgICAgKiBvbmUgc3VjaCBwdXNoZXIuXG4gICAgICovXG4gICAgZ2V0RW1haWxQdXNoZXI6IGZ1bmN0aW9uKHB1c2hlcnMsIGFkZHJlc3MpIHtcbiAgICAgICAgaWYgKHB1c2hlcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHB1c2hlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChwdXNoZXJzW2ldLmtpbmQgPT09ICdlbWFpbCcgJiYgcHVzaGVyc1tpXS5wdXNoa2V5ID09PSBhZGRyZXNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHB1c2hlcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgb25FbmFibGVFbWFpbE5vdGlmaWNhdGlvbnNDaGFuZ2U6IGZ1bmN0aW9uKGFkZHJlc3MsIGNoZWNrZWQpIHtcbiAgICAgICAgbGV0IGVtYWlsUHVzaGVyUHJvbWlzZTtcbiAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbJ2JyYW5kJ10gPSBTZGtDb25maWcuZ2V0KCkuYnJhbmQgfHwgJ1Jpb3QnO1xuICAgICAgICAgICAgZW1haWxQdXNoZXJQcm9taXNlID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldFB1c2hlcih7XG4gICAgICAgICAgICAgICAga2luZDogJ2VtYWlsJyxcbiAgICAgICAgICAgICAgICBhcHBfaWQ6ICdtLmVtYWlsJyxcbiAgICAgICAgICAgICAgICBwdXNoa2V5OiBhZGRyZXNzLFxuICAgICAgICAgICAgICAgIGFwcF9kaXNwbGF5X25hbWU6ICdFbWFpbCBOb3RpZmljYXRpb25zJyxcbiAgICAgICAgICAgICAgICBkZXZpY2VfZGlzcGxheV9uYW1lOiBhZGRyZXNzLFxuICAgICAgICAgICAgICAgIGxhbmc6IG5hdmlnYXRvci5sYW5ndWFnZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSwgLy8gV2UgYWx3YXlzIGFwcGVuZCBmb3IgZW1haWwgcHVzaGVycyBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIHN0b3Agb3RoZXIgYWNjb3VudHMgbm90aWZ5aW5nIHRvIHRoZSBzYW1lIGVtYWlsIGFkZHJlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZW1haWxQdXNoZXIgPSB0aGlzLmdldEVtYWlsUHVzaGVyKHRoaXMuc3RhdGUucHVzaGVycywgYWRkcmVzcyk7XG4gICAgICAgICAgICBlbWFpbFB1c2hlci5raW5kID0gbnVsbDtcbiAgICAgICAgICAgIGVtYWlsUHVzaGVyUHJvbWlzZSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5zZXRQdXNoZXIoZW1haWxQdXNoZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVtYWlsUHVzaGVyUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hGcm9tU2VydmVyKCk7XG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0Vycm9yIHNhdmluZyBlbWFpbCBub3RpZmljYXRpb24gcHJlZmVyZW5jZXMnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0Vycm9yIHNhdmluZyBlbWFpbCBub3RpZmljYXRpb24gcHJlZmVyZW5jZXMnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxzdCBzYXZpbmcgeW91ciBlbWFpbCBub3RpZmljYXRpb24gcHJlZmVyZW5jZXMuJyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uTm90aWZTdGF0ZUJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIEZJWE1FOiB1c2UgLmJpbmQoKSByYXRoZXIgdGhhbiBjbGFzc05hbWUgbWV0YWRhdGEgaGVyZSBzdXJlbHlcbiAgICAgICAgY29uc3QgdmVjdG9yUnVsZUlkID0gZXZlbnQudGFyZ2V0LmNsYXNzTmFtZS5zcGxpdChcIi1cIilbMF07XG4gICAgICAgIGNvbnN0IG5ld1B1c2hSdWxlVmVjdG9yU3RhdGUgPSBldmVudC50YXJnZXQuY2xhc3NOYW1lLnNwbGl0KFwiLVwiKVsxXTtcblxuICAgICAgICBpZiAoXCJfa2V5d29yZHNcIiA9PT0gdmVjdG9yUnVsZUlkKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXRLZXl3b3Jkc1B1c2hSdWxlVmVjdG9yU3RhdGUobmV3UHVzaFJ1bGVWZWN0b3JTdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5nZXRSdWxlKHZlY3RvclJ1bGVJZCk7XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldFB1c2hSdWxlVmVjdG9yU3RhdGUocnVsZSwgbmV3UHVzaFJ1bGVWZWN0b3JTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25LZXl3b3Jkc0NsaWNrZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGtleXdvcmRzIGxpc3QgdG8gZGlzcGxheVxuICAgICAgICBsZXQga2V5d29yZHMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBpIGluIHRoaXMuc3RhdGUudmVjdG9yQ29udGVudFJ1bGVzLnJ1bGVzKSB7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMucnVsZXNbaV07XG4gICAgICAgICAgICBrZXl3b3Jkcy5wdXNoKHJ1bGUucGF0dGVybik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleXdvcmRzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gQXMga2VlcGluZyB0aGUgb3JkZXIgb2YgcGVyLXdvcmQgcHVzaCBydWxlcyBocyBzaWRlIGlzIGEgYml0IHRyaWNreSB0byBjb2RlLFxuICAgICAgICAgICAgLy8gZGlzcGxheSB0aGUga2V5d29yZHMgaW4gYWxwaGFiZXRpY2FsIG9yZGVyIHRvIHRoZSB1c2VyXG4gICAgICAgICAgICBrZXl3b3Jkcy5zb3J0KCk7XG5cbiAgICAgICAgICAgIGtleXdvcmRzID0ga2V5d29yZHMuam9pbihcIiwgXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5d29yZHMgPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgVGV4dElucHV0RGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuVGV4dElucHV0RGlhbG9nXCIpO1xuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdLZXl3b3JkcyBEaWFsb2cnLCAnJywgVGV4dElucHV0RGlhbG9nLCB7XG4gICAgICAgICAgICB0aXRsZTogX3QoJ0tleXdvcmRzJyksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ0VudGVyIGtleXdvcmRzIHNlcGFyYXRlZCBieSBhIGNvbW1hOicpLFxuICAgICAgICAgICAgYnV0dG9uOiBfdCgnT0snKSxcbiAgICAgICAgICAgIHZhbHVlOiBrZXl3b3JkcyxcbiAgICAgICAgICAgIG9uRmluaXNoZWQ6IGZ1bmN0aW9uIG9uRmluaXNoZWQoc2hvdWxkX2xlYXZlLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRfbGVhdmUgJiYgbmV3VmFsdWUgIT09IGtleXdvcmRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdLZXl3b3JkcyA9IG5ld1ZhbHVlLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaSBpbiBuZXdLZXl3b3Jkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3S2V5d29yZHNbaV0gPSBuZXdLZXl3b3Jkc1tpXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlcyBhbmQgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgbmV3S2V5d29yZHMgPSBuZXdLZXl3b3Jkcy5yZWR1Y2UoZnVuY3Rpb24oYXJyYXksIGtleXdvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXl3b3JkICE9PSBcIlwiICYmIGFycmF5LmluZGV4T2Yoa2V5d29yZCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChrZXl3b3JkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICAgICAgfSwgW10pO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3NldEtleXdvcmRzKG5ld0tleXdvcmRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVsZTogZnVuY3Rpb24odmVjdG9yUnVsZUlkKSB7XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiB0aGlzLnN0YXRlLnZlY3RvclB1c2hSdWxlcykge1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMuc3RhdGUudmVjdG9yUHVzaFJ1bGVzW2ldO1xuICAgICAgICAgICAgaWYgKHJ1bGUudmVjdG9yUnVsZUlkID09PSB2ZWN0b3JSdWxlSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2V0UHVzaFJ1bGVWZWN0b3JTdGF0ZTogZnVuY3Rpb24ocnVsZSwgbmV3UHVzaFJ1bGVWZWN0b3JTdGF0ZSkge1xuICAgICAgICBpZiAocnVsZSAmJiBydWxlLnZlY3RvclN0YXRlICE9PSBuZXdQdXNoUnVsZVZlY3RvclN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBwaGFzZTogdGhpcy5waGFzZXMuTE9BRElORyxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgICAgIGNvbnN0IGRlZmVycmVkcyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcnVsZURlZmluaXRpb24gPSBWZWN0b3JQdXNoUnVsZXNEZWZpbml0aW9uc1tydWxlLnZlY3RvclJ1bGVJZF07XG5cbiAgICAgICAgICAgIGlmIChydWxlLnJ1bGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3Rpb25zID0gcnVsZURlZmluaXRpb24udmVjdG9yU3RhdGVUb0FjdGlvbnNbbmV3UHVzaFJ1bGVWZWN0b3JTdGF0ZV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG5ldyBzdGF0ZSBjb3JyZXNwb25kcyB0byBkaXNhYmxpbmcgdGhlIHJ1bGUuXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkcy5wdXNoKGNsaS5zZXRQdXNoUnVsZUVuYWJsZWQoJ2dsb2JhbCcsIHJ1bGUucnVsZS5raW5kLCBydWxlLnJ1bGUucnVsZV9pZCwgZmFsc2UpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbmV3IHN0YXRlIGNvcnJlc3BvbmRzIHRvIGVuYWJsaW5nIHRoZSBydWxlIGFuZCBzZXR0aW5nIHNwZWNpZmljIGFjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRzLnB1c2godGhpcy5fdXBkYXRlUHVzaFJ1bGVBY3Rpb25zKHJ1bGUucnVsZSwgYWN0aW9ucywgdHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVmZXJyZWRzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlZnJlc2hGcm9tU2VydmVyKCk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IEVycm9yRGlhbG9nID0gc2RrLmdldENvbXBvbmVudChcImRpYWxvZ3MuRXJyb3JEaWFsb2dcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBjaGFuZ2Ugc2V0dGluZ3M6IFwiICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZhaWxlZCB0byBjaGFuZ2Ugc2V0dGluZ3MnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IF90KCdGYWlsZWQgdG8gY2hhbmdlIHNldHRpbmdzJyksXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVycm9yICYmIGVycm9yLm1lc3NhZ2UpID8gZXJyb3IubWVzc2FnZSA6IF90KCdPcGVyYXRpb24gZmFpbGVkJykpLFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiBzZWxmLl9yZWZyZXNoRnJvbVNlcnZlcixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9zZXRLZXl3b3Jkc1B1c2hSdWxlVmVjdG9yU3RhdGU6IGZ1bmN0aW9uKG5ld1B1c2hSdWxlVmVjdG9yU3RhdGUpIHtcbiAgICAgICAgLy8gSXMgdGhlcmUgcmVhbGx5IGEgY2hhbmdlP1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMudmVjdG9yU3RhdGUgPT09IG5ld1B1c2hSdWxlVmVjdG9yU3RhdGVcbiAgICAgICAgICAgIHx8IHRoaXMuc3RhdGUudmVjdG9yQ29udGVudFJ1bGVzLnJ1bGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGNsaSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLnBoYXNlcy5MT0FESU5HLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBVcGRhdGUgYWxsIHJ1bGVzIGluIHNlbGYuc3RhdGUudmVjdG9yQ29udGVudFJ1bGVzXG4gICAgICAgIGNvbnN0IGRlZmVycmVkcyA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGkgaW4gdGhpcy5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMucnVsZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSB0aGlzLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcy5ydWxlc1tpXTtcblxuICAgICAgICAgICAgbGV0IGVuYWJsZWQ7IGxldCBhY3Rpb25zO1xuICAgICAgICAgICAgc3dpdGNoIChuZXdQdXNoUnVsZVZlY3RvclN0YXRlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQdXNoUnVsZVZlY3RvclN0YXRlLk9OOlxuICAgICAgICAgICAgICAgICAgICBpZiAocnVsZS5hY3Rpb25zLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9ucyA9IFB1c2hSdWxlVmVjdG9yU3RhdGUuYWN0aW9uc0ZvcihQdXNoUnVsZVZlY3RvclN0YXRlLk9OKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcy52ZWN0b3JTdGF0ZSA9PT0gUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PRkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBQdXNoUnVsZVZlY3RvclN0YXRlLkxPVUQ6XG4gICAgICAgICAgICAgICAgICAgIGlmIChydWxlLmFjdGlvbnMubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25zID0gUHVzaFJ1bGVWZWN0b3JTdGF0ZS5hY3Rpb25zRm9yKFB1c2hSdWxlVmVjdG9yU3RhdGUuTE9VRCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMudmVjdG9yU3RhdGUgPT09IFB1c2hSdWxlVmVjdG9yU3RhdGUuT0ZGKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PRkY6XG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoZSB3b3JrYXJvdW5kIGluIF91cGRhdGVQdXNoUnVsZUFjdGlvbnMgd2lsbCBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgLy8gZW5hYmxlIHRoZSBydWxlXG4gICAgICAgICAgICAgICAgZGVmZXJyZWRzLnB1c2godGhpcy5fdXBkYXRlUHVzaFJ1bGVBY3Rpb25zKHJ1bGUsIGFjdGlvbnMsIGVuYWJsZWQpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5hYmxlZCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZHMucHVzaChjbGkuc2V0UHVzaFJ1bGVFbmFibGVkKCdnbG9iYWwnLCBydWxlLmtpbmQsIHJ1bGUucnVsZV9pZCwgZW5hYmxlZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZS5hbGwoZGVmZXJyZWRzKS50aGVuKGZ1bmN0aW9uKHJlc3BzKSB7XG4gICAgICAgICAgICBzZWxmLl9yZWZyZXNoRnJvbVNlcnZlcigpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYW4ndCB1cGRhdGUgdXNlciBub3RpZmljYXRpb24gc2V0dGluZ3M6IFwiICsgZXJyb3IpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnQ2FuXFwndCB1cGRhdGUgdXNlciBub3RpZmNhdGlvbiBzZXR0aW5ncycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnQ2FuXFwndCB1cGRhdGUgdXNlciBub3RpZmljYXRpb24gc2V0dGluZ3MnKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogKChlcnJvciAmJiBlcnJvci5tZXNzYWdlKSA/IGVycm9yLm1lc3NhZ2UgOiBfdCgnT3BlcmF0aW9uIGZhaWxlZCcpKSxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkOiBzZWxmLl9yZWZyZXNoRnJvbVNlcnZlcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3NldEtleXdvcmRzOiBmdW5jdGlvbihuZXdLZXl3b3Jkcykge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHBoYXNlOiB0aGlzLnBoYXNlcy5MT0FESU5HLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICBjb25zdCByZW1vdmVEZWZlcnJlZHMgPSBbXTtcblxuICAgICAgICAvLyBSZW1vdmUgcGVyLXdvcmQgcHVzaCBydWxlcyBvZiBrZXl3b3JkcyB0aGF0IGFyZSBubyBtb3JlIGluIHRoZSBsaXN0XG4gICAgICAgIGNvbnN0IHZlY3RvckNvbnRlbnRSdWxlc1BhdHRlcm5zID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiBzZWxmLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcy5ydWxlcykge1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHNlbGYuc3RhdGUudmVjdG9yQ29udGVudFJ1bGVzLnJ1bGVzW2ldO1xuXG4gICAgICAgICAgICB2ZWN0b3JDb250ZW50UnVsZXNQYXR0ZXJucy5wdXNoKHJ1bGUucGF0dGVybik7XG5cbiAgICAgICAgICAgIGlmIChuZXdLZXl3b3Jkcy5pbmRleE9mKHJ1bGUucGF0dGVybikgPCAwKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRGVmZXJyZWRzLnB1c2goY2xpLmRlbGV0ZVB1c2hSdWxlKCdnbG9iYWwnLCBydWxlLmtpbmQsIHJ1bGUucnVsZV9pZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGtleXdvcmQgaXMgcGFydCBvZiBgZXh0ZXJuYWxDb250ZW50UnVsZXNgLCByZW1vdmUgdGhlIHJ1bGVcbiAgICAgICAgLy8gYmVmb3JlIHJlY3JlYXRpbmcgaXQgaW4gdGhlIHJpZ2h0IFZlY3RvciBwYXRoXG4gICAgICAgIGZvciAoY29uc3QgaSBpbiBzZWxmLnN0YXRlLmV4dGVybmFsQ29udGVudFJ1bGVzKSB7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gc2VsZi5zdGF0ZS5leHRlcm5hbENvbnRlbnRSdWxlc1tpXTtcblxuICAgICAgICAgICAgaWYgKG5ld0tleXdvcmRzLmluZGV4T2YocnVsZS5wYXR0ZXJuKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRGVmZXJyZWRzLnB1c2goY2xpLmRlbGV0ZVB1c2hSdWxlKCdnbG9iYWwnLCBydWxlLmtpbmQsIHJ1bGUucnVsZV9pZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb25FcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byB1cGRhdGUga2V5d29yZHM6IFwiICsgZXJyb3IpO1xuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRmFpbGVkIHRvIHVwZGF0ZSBrZXl3b3JkcycsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRmFpbGVkIHRvIHVwZGF0ZSBrZXl3b3JkcycpLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVycm9yICYmIGVycm9yLm1lc3NhZ2UpID8gZXJyb3IubWVzc2FnZSA6IF90KCdPcGVyYXRpb24gZmFpbGVkJykpLFxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ6IHNlbGYuX3JlZnJlc2hGcm9tU2VydmVyLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVGhlbiwgYWRkIHRoZSBuZXcgb25lc1xuICAgICAgICBQcm9taXNlLmFsbChyZW1vdmVEZWZlcnJlZHMpLnRoZW4oZnVuY3Rpb24ocmVzcHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZmVycmVkcyA9IFtdO1xuXG4gICAgICAgICAgICBsZXQgcHVzaFJ1bGVWZWN0b3JTdGF0ZUtpbmQgPSBzZWxmLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcy52ZWN0b3JTdGF0ZTtcbiAgICAgICAgICAgIGlmIChwdXNoUnVsZVZlY3RvclN0YXRlS2luZCA9PT0gUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PRkYpIHtcbiAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBjdXJyZW50IGdsb2JhbCBrZXl3b3JkcyBydWxlIGlzIE9GRiwgd2UgbmVlZCB0byBsb29rIGF0XG4gICAgICAgICAgICAgICAgLy8gdGhlIGZsYXZvciBvZiBydWxlcyBpbiAndmVjdG9yQ29udGVudFJ1bGVzJyB0byBhcHBseSB0aGUgc2FtZSBhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gd2hlbiBjcmVhdGluZyB0aGUgbmV3IHJ1bGUuXG4gICAgICAgICAgICAgICAgLy8gVGh1cywgdGhpcyBuZXcgcnVsZSB3aWxsIGpvaW4gdGhlICd2ZWN0b3JDb250ZW50UnVsZXMnIHNldC5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMucnVsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1c2hSdWxlVmVjdG9yU3RhdGVLaW5kID0gUHVzaFJ1bGVWZWN0b3JTdGF0ZS5jb250ZW50UnVsZVZlY3RvclN0YXRlS2luZChzZWxmLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcy5ydWxlc1swXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gT04gaXMgZGVmYXVsdFxuICAgICAgICAgICAgICAgICAgICBwdXNoUnVsZVZlY3RvclN0YXRlS2luZCA9IFB1c2hSdWxlVmVjdG9yU3RhdGUuT047XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgaW4gbmV3S2V5d29yZHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXl3b3JkID0gbmV3S2V5d29yZHNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAodmVjdG9yQ29udGVudFJ1bGVzUGF0dGVybnMuaW5kZXhPZihrZXl3b3JkKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc3RhdGUudmVjdG9yQ29udGVudFJ1bGVzLnZlY3RvclN0YXRlICE9PSBQdXNoUnVsZVZlY3RvclN0YXRlLk9GRikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRzLnB1c2goY2xpLmFkZFB1c2hSdWxlXG4gICAgICAgICAgICAgICAgICAgICAgICAoJ2dsb2JhbCcsICdjb250ZW50Jywga2V5d29yZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogUHVzaFJ1bGVWZWN0b3JTdGF0ZS5hY3Rpb25zRm9yKHB1c2hSdWxlVmVjdG9yU3RhdGVLaW5kKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IGtleXdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZHMucHVzaChzZWxmLl9hZGREaXNhYmxlZFB1c2hSdWxlKCdnbG9iYWwnLCAnY29udGVudCcsIGtleXdvcmQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFB1c2hSdWxlVmVjdG9yU3RhdGUuYWN0aW9uc0ZvcihwdXNoUnVsZVZlY3RvclN0YXRlS2luZCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBrZXl3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBQcm9taXNlLmFsbChkZWZlcnJlZHMpLnRoZW4oZnVuY3Rpb24ocmVzcHMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZWZyZXNoRnJvbVNlcnZlcigpO1xuICAgICAgICAgICAgfSwgb25FcnJvcik7XG4gICAgICAgIH0sIG9uRXJyb3IpO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBwdXNoIHJ1bGUgYnV0IGRpc2FibGVkXG4gICAgX2FkZERpc2FibGVkUHVzaFJ1bGU6IGZ1bmN0aW9uKHNjb3BlLCBraW5kLCBydWxlSWQsIGJvZHkpIHtcbiAgICAgICAgY29uc3QgY2xpID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICByZXR1cm4gY2xpLmFkZFB1c2hSdWxlKHNjb3BlLCBraW5kLCBydWxlSWQsIGJvZHkpLnRoZW4oKCkgPT5cbiAgICAgICAgICAgIGNsaS5zZXRQdXNoUnVsZUVuYWJsZWQoc2NvcGUsIGtpbmQsIHJ1bGVJZCwgZmFsc2UpLFxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICAvLyBDaGVjayBpZiBhbnkgbGVnYWN5IGltLnZlY3RvciBydWxlcyBuZWVkIHRvIGJlIHBvcnRlZCB0byB0aGUgbmV3IEFQSVxuICAgIC8vIGZvciBvdmVycmlkaW5nIHRoZSBhY3Rpb25zIG9mIGRlZmF1bHQgcnVsZXMuXG4gICAgX3BvcnRSdWxlc1RvTmV3QVBJOiBmdW5jdGlvbihydWxlc2V0cykge1xuICAgICAgICBjb25zdCBuZWVkc1VwZGF0ZSA9IFtdO1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBraW5kIGluIHJ1bGVzZXRzLmdsb2JhbCkge1xuICAgICAgICAgICAgY29uc3QgcnVsZXNldCA9IHJ1bGVzZXRzLmdsb2JhbFtraW5kXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXNldC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bGUgPSBydWxlc2V0W2ldO1xuICAgICAgICAgICAgICAgIGlmIChydWxlLnJ1bGVfaWQgaW4gTEVHQUNZX1JVTEVTKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUG9ydGluZyBsZWdhY3kgcnVsZVwiLCBydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgbmVlZHNVcGRhdGUucHVzaCggZnVuY3Rpb24oa2luZCwgcnVsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsaS5zZXRQdXNoUnVsZUFjdGlvbnMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2dsb2JhbCcsIGtpbmQsIExFR0FDWV9SVUxFU1tydWxlLnJ1bGVfaWRdLCBwb3J0TGVnYWN5QWN0aW9ucyhydWxlLmFjdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKS50aGVuKCgpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpLmRlbGV0ZVB1c2hSdWxlKCdnbG9iYWwnLCBraW5kLCBydWxlLnJ1bGVfaWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKS5jYXRjaCggKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVycm9yIHdoZW4gcG9ydGluZyBsZWdhY3kgcnVsZTogJHtlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0oa2luZCwgcnVsZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZWVkc1VwZGF0ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBJZiBzb21lIG9mIHRoZSBydWxlcyBuZWVkIHRvIGJlIHBvcnRlZCB0aGVuIHdhaXQgZm9yIHRoZSBwb3J0aW5nXG4gICAgICAgICAgICAvLyB0byBoYXBwZW4gYW5kIHRoZW4gZmV0Y2ggdGhlIHJ1bGVzIGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5lZWRzVXBkYXRlKS50aGVuKCgpID0+XG4gICAgICAgICAgICAgICAgY2xpLmdldFB1c2hSdWxlcygpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSByZXR1cm4gdGhlIHJ1bGVzIHRoYXQgd2UgYWxyZWFkeSBoYXZlLlxuICAgICAgICAgICAgcmV0dXJuIHJ1bGVzZXRzO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9yZWZyZXNoRnJvbVNlcnZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCBwdXNoUnVsZXNQcm9taXNlID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFB1c2hSdWxlcygpLnRoZW4oc2VsZi5fcG9ydFJ1bGVzVG9OZXdBUEkpLnRoZW4oZnVuY3Rpb24ocnVsZXNldHMpIHtcbiAgICAgICAgICAgIC8vLyBYWFggc2VyaW91c2x5PyB3dGYgaXMgdGhpcz9cbiAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5wdXNoUnVsZXMgPSBydWxlc2V0cztcblxuICAgICAgICAgICAgLy8gR2V0IGhvbWVzZXJ2ZXIgZGVmYXVsdCBydWxlcyBhbmQgdHJpYWdlIHRoZW0gYnkgY2F0ZWdvcmllc1xuICAgICAgICAgICAgY29uc3QgcnVsZV9jYXRlZ29yaWVzID0ge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBtYXN0ZXIgcnVsZSAoYWxsIG5vdGlmaWNhdGlvbnMgZGlzYWJsaW5nKVxuICAgICAgICAgICAgICAgICcubS5ydWxlLm1hc3Rlcic6ICdtYXN0ZXInLFxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGRlZmF1bHQgcHVzaCBydWxlcyBkaXNwbGF5ZWQgYnkgVmVjdG9yIFVJXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUuY29udGFpbnNfZGlzcGxheV9uYW1lJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUuY29udGFpbnNfdXNlcl9uYW1lJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUucm9vbW5vdGlmJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUucm9vbV9vbmVfdG9fb25lJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUuZW5jcnlwdGVkX3Jvb21fb25lX3RvX29uZSc6ICd2ZWN0b3InLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLm1lc3NhZ2UnOiAndmVjdG9yJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5lbmNyeXB0ZWQnOiAndmVjdG9yJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5pbnZpdGVfZm9yX21lJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgLy8nLm0ucnVsZS5tZW1iZXJfZXZlbnQnOiAndmVjdG9yJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5jYWxsJzogJ3ZlY3RvcicsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUuc3VwcHJlc3Nfbm90aWNlcyc6ICd2ZWN0b3InLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLnRvbWJzdG9uZSc6ICd2ZWN0b3InLFxuXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJzIGdvIHRvIG90aGVyc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gSFMgZGVmYXVsdCBydWxlc1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdFJ1bGVzID0ge21hc3RlcjogW10sIHZlY3Rvcjoge30sIG90aGVyczogW119O1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtpbmQgaW4gcnVsZXNldHMuZ2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBPYmplY3Qua2V5cyhydWxlc2V0cy5nbG9iYWxba2luZF0pLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBydWxlc2V0cy5nbG9iYWxba2luZF1baV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhdCA9IHJ1bGVfY2F0ZWdvcmllc1tyLnJ1bGVfaWRdO1xuICAgICAgICAgICAgICAgICAgICByLmtpbmQgPSBraW5kO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyLnJ1bGVfaWRbMF0gPT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhdCA9PT0gJ3ZlY3RvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UnVsZXMudmVjdG9yW3IucnVsZV9pZF0gPSByO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYXQgPT09ICdtYXN0ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJ1bGVzLm1hc3Rlci5wdXNoKHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UnVsZXNbJ290aGVycyddLnB1c2gocik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCB0aGUgbWFzdGVyIHJ1bGUgaWYgYW55IGRlZmluZWQgYnkgdGhlIGhzXG4gICAgICAgICAgICBpZiAoZGVmYXVsdFJ1bGVzLm1hc3Rlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZS5tYXN0ZXJQdXNoUnVsZSA9IGRlZmF1bHRSdWxlcy5tYXN0ZXJbMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBrZXl3b3JkIHJ1bGVzIGludG8gb3VyIHN0YXRlXG4gICAgICAgICAgICBjb25zdCBjb250ZW50UnVsZXMgPSBDb250ZW50UnVsZXMucGFyc2VDb250ZW50UnVsZXMocnVsZXNldHMpO1xuICAgICAgICAgICAgc2VsZi5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMgPSB7XG4gICAgICAgICAgICAgICAgdmVjdG9yU3RhdGU6IGNvbnRlbnRSdWxlcy52ZWN0b3JTdGF0ZSxcbiAgICAgICAgICAgICAgICBydWxlczogY29udGVudFJ1bGVzLnJ1bGVzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuc3RhdGUuZXh0ZXJuYWxDb250ZW50UnVsZXMgPSBjb250ZW50UnVsZXMuZXh0ZXJuYWxSdWxlcztcblxuICAgICAgICAgICAgLy8gQnVpbGQgdGhlIHJ1bGVzIGRpc3BsYXllZCBpbiB0aGUgVmVjdG9yIFVJIG1hdHJpeCB0YWJsZVxuICAgICAgICAgICAgc2VsZi5zdGF0ZS52ZWN0b3JQdXNoUnVsZXMgPSBbXTtcbiAgICAgICAgICAgIHNlbGYuc3RhdGUuZXh0ZXJuYWxQdXNoUnVsZXMgPSBbXTtcblxuICAgICAgICAgICAgY29uc3QgdmVjdG9yUnVsZUlkcyA9IFtcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5jb250YWluc19kaXNwbGF5X25hbWUnLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLmNvbnRhaW5zX3VzZXJfbmFtZScsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUucm9vbW5vdGlmJyxcbiAgICAgICAgICAgICAgICAnX2tleXdvcmRzJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5yb29tX29uZV90b19vbmUnLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLmVuY3J5cHRlZF9yb29tX29uZV90b19vbmUnLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLm1lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICcubS5ydWxlLmVuY3J5cHRlZCcsXG4gICAgICAgICAgICAgICAgJy5tLnJ1bGUuaW52aXRlX2Zvcl9tZScsXG4gICAgICAgICAgICAgICAgLy8naW0udmVjdG9yLnJ1bGUubWVtYmVyX2V2ZW50JyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5jYWxsJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5zdXBwcmVzc19ub3RpY2VzJyxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS50b21ic3RvbmUnLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBpbiB2ZWN0b3JSdWxlSWRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmVjdG9yUnVsZUlkID0gdmVjdG9yUnVsZUlkc1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICh2ZWN0b3JSdWxlSWQgPT09ICdfa2V5d29yZHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGtleXdvcmRzIG5lZWRzIGEgc3BlY2lhbCBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgVmVjdG9yIFVJLCB0aGlzIGlzIGEgc2luZ2xlIGdsb2JhbCBwdXNoIHJ1bGUgYnV0IHRyYW5zbGF0ZWQgaW4gTWF0cml4LFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBjb3JyZXNwb25kcyB0byBhbGwgY29udGVudCBwdXNoIHJ1bGVzIChzdG9yZWQgaW4gc2VsZi5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0ZS52ZWN0b3JQdXNoUnVsZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInZlY3RvclJ1bGVJZFwiOiBcIl9rZXl3b3Jkc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBfdCgnTWVzc2FnZXMgY29udGFpbmluZyA8c3Bhbj5rZXl3b3Jkczwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyAnc3Bhbic6IChzdWIpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9Vc2VyTm90aWZTZXR0aW5nc19rZXl3b3Jkc1wiIG9uQ2xpY2s9eyBzZWxmLm9uS2V5d29yZHNDbGlja2VkIH0+e3N1Yn08L3NwYW4+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmVjdG9yU3RhdGVcIjogc2VsZi5zdGF0ZS52ZWN0b3JDb250ZW50UnVsZXMudmVjdG9yU3RhdGUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJ1bGVEZWZpbml0aW9uID0gVmVjdG9yUHVzaFJ1bGVzRGVmaW5pdGlvbnNbdmVjdG9yUnVsZUlkXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcnVsZSA9IGRlZmF1bHRSdWxlcy52ZWN0b3JbdmVjdG9yUnVsZUlkXTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWN0b3JTdGF0ZSA9IHJ1bGVEZWZpbml0aW9uLnJ1bGVUb1ZlY3RvclN0YXRlKHJ1bGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJSZWZyZXNoaW5nIHZlY3RvclB1c2hSdWxlcyBmb3IgXCIgKyB2ZWN0b3JSdWxlSWQgK1wiLCBcIisgcnVsZURlZmluaXRpb24uZGVzY3JpcHRpb24gK1wiLCBcIiArIHJ1bGUgK1wiLCBcIiArIHZlY3RvclN0YXRlKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN0YXRlLnZlY3RvclB1c2hSdWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmVjdG9yUnVsZUlkXCI6IHZlY3RvclJ1bGVJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogX3QocnVsZURlZmluaXRpb24uZGVzY3JpcHRpb24pLCAvLyBUZXh0IGZyb20gVmVjdG9yUHVzaFJ1bGVzRGVmaW5pdGlvbnMuanNcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicnVsZVwiOiBydWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2ZWN0b3JTdGF0ZVwiOiB2ZWN0b3JTdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgd2FzIGEgcnVsZSB3aGljaCB3ZSBjb3VsZG4ndCBwYXJzZSwgYWRkIGl0IHRvIHRoZSBleHRlcm5hbCBsaXN0XG4gICAgICAgICAgICAgICAgICAgIGlmIChydWxlICYmICF2ZWN0b3JTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5kZXNjcmlwdGlvbiA9IHJ1bGVEZWZpbml0aW9uLmRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0ZS5leHRlcm5hbFB1c2hSdWxlcy5wdXNoKHJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBCdWlsZCB0aGUgcnVsZXMgbm90IG1hbmFnZWQgYnkgVmVjdG9yIFVJXG4gICAgICAgICAgICBjb25zdCBvdGhlclJ1bGVzRGVzY3JpcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICcubS5ydWxlLm1lc3NhZ2UnOiBfdCgnTm90aWZ5IGZvciBhbGwgb3RoZXIgbWVzc2FnZXMvcm9vbXMnKSxcbiAgICAgICAgICAgICAgICAnLm0ucnVsZS5mYWxsYmFjayc6IF90KCdOb3RpZnkgbWUgZm9yIGFueXRoaW5nIGVsc2UnKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBpbiBkZWZhdWx0UnVsZXMub3RoZXJzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcnVsZSA9IGRlZmF1bHRSdWxlcy5vdGhlcnNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgcnVsZURlc2NyaXB0aW9uID0gb3RoZXJSdWxlc0Rlc2NyaXB0aW9uc1tydWxlLnJ1bGVfaWRdO1xuXG4gICAgICAgICAgICAgICAgLy8gU2hvdyBlbmFibGVkIGRlZmF1bHQgcnVsZXMgdGhhdCB3YXMgbW9kaWZpZWQgYnkgdGhlIHVzZXJcbiAgICAgICAgICAgICAgICBpZiAocnVsZURlc2NyaXB0aW9uICYmIHJ1bGUuZW5hYmxlZCAmJiAhcnVsZS5kZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bGUuZGVzY3JpcHRpb24gPSBydWxlRGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdGUuZXh0ZXJuYWxQdXNoUnVsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHB1c2hlcnNQcm9taXNlID0gTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFB1c2hlcnMoKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIHNlbGYuc2V0U3RhdGUoe3B1c2hlcnM6IHJlc3AucHVzaGVyc30pO1xuICAgICAgICB9KTtcblxuICAgICAgICBQcm9taXNlLmFsbChbcHVzaFJ1bGVzUHJvbWlzZSwgcHVzaGVyc1Byb21pc2VdKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgcGhhc2U6IHNlbGYucGhhc2VzLkRJU1BMQVksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgcGhhc2U6IHNlbGYucGhhc2VzLkVSUk9SLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgLy8gYWN0dWFsbHkgZXhwbGljaXRseSB1cGRhdGUgb3VyIHN0YXRlICBoYXZpbmcgYmVlbiBkZWVwLW1hbmlwdWxhdGluZyBpdFxuICAgICAgICAgICAgc2VsZi5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbWFzdGVyUHVzaFJ1bGU6IHNlbGYuc3RhdGUubWFzdGVyUHVzaFJ1bGUsXG4gICAgICAgICAgICAgICAgdmVjdG9yQ29udGVudFJ1bGVzOiBzZWxmLnN0YXRlLnZlY3RvckNvbnRlbnRSdWxlcyxcbiAgICAgICAgICAgICAgICB2ZWN0b3JQdXNoUnVsZXM6IHNlbGYuc3RhdGUudmVjdG9yUHVzaFJ1bGVzLFxuICAgICAgICAgICAgICAgIGV4dGVybmFsQ29udGVudFJ1bGVzOiBzZWxmLnN0YXRlLmV4dGVybmFsQ29udGVudFJ1bGVzLFxuICAgICAgICAgICAgICAgIGV4dGVybmFsUHVzaFJ1bGVzOiBzZWxmLnN0YXRlLmV4dGVybmFsUHVzaFJ1bGVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRUaHJlZVBpZHMoKS50aGVuKChyKSA9PiB0aGlzLnNldFN0YXRlKHt0aHJlZXBpZHM6IHIudGhyZWVwaWRzfSkpO1xuICAgIH0sXG5cbiAgICBfb25DbGVhck5vdGlmaWNhdGlvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgY2xpLmdldFJvb21zKCkuZm9yRWFjaChyID0+IHtcbiAgICAgICAgICAgIGlmIChyLmdldFVucmVhZE5vdGlmaWNhdGlvbkNvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRzID0gci5nZXRMaXZlVGltZWxpbmUoKS5nZXRFdmVudHMoKTtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRzLmxlbmd0aCkgY2xpLnNlbmRSZWFkUmVjZWlwdChldmVudHMucG9wKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3VwZGF0ZVB1c2hSdWxlQWN0aW9uczogZnVuY3Rpb24ocnVsZSwgYWN0aW9ucywgZW5hYmxlZCkge1xuICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIGNsaS5zZXRQdXNoUnVsZUFjdGlvbnMoXG4gICAgICAgICAgICAnZ2xvYmFsJywgcnVsZS5raW5kLCBydWxlLnJ1bGVfaWQsIGFjdGlvbnMsXG4gICAgICAgICkudGhlbiggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBUaGVuLCBpZiByZXF1ZXN0ZWQsIGVuYWJsZWQgb3IgZGlzYWJsZWQgdGhlIHJ1bGVcbiAgICAgICAgICAgIGlmICh1bmRlZmluZWQgIT0gZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbGkuc2V0UHVzaFJ1bGVFbmFibGVkKFxuICAgICAgICAgICAgICAgICAgICAnZ2xvYmFsJywgcnVsZS5raW5kLCBydWxlLnJ1bGVfaWQsIGVuYWJsZWQsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlbmRlck5vdGlmUnVsZXNUYWJsZVJvdzogZnVuY3Rpb24odGl0bGUsIGNsYXNzTmFtZSwgcHVzaFJ1bGVWZWN0b3JTdGF0ZSkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRyIGtleT17IGNsYXNzTmFtZSB9PlxuICAgICAgICAgICAgICAgIDx0aD5cbiAgICAgICAgICAgICAgICAgICAgeyB0aXRsZSB9XG4gICAgICAgICAgICAgICAgPC90aD5cblxuICAgICAgICAgICAgICAgIDx0aD5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0ge2NsYXNzTmFtZSArIFwiLVwiICsgUHVzaFJ1bGVWZWN0b3JTdGF0ZS5PRkZ9XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwicmFkaW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17IHB1c2hSdWxlVmVjdG9yU3RhdGUgPT09IFB1c2hSdWxlVmVjdG9yU3RhdGUuT0ZGIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsgdGhpcy5vbk5vdGlmU3RhdGVCdXR0b25DbGlja2VkIH0gLz5cbiAgICAgICAgICAgICAgICA8L3RoPlxuXG4gICAgICAgICAgICAgICAgPHRoPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSB7Y2xhc3NOYW1lICsgXCItXCIgKyBQdXNoUnVsZVZlY3RvclN0YXRlLk9OfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInJhZGlvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9eyBwdXNoUnVsZVZlY3RvclN0YXRlID09PSBQdXNoUnVsZVZlY3RvclN0YXRlLk9OIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsgdGhpcy5vbk5vdGlmU3RhdGVCdXR0b25DbGlja2VkIH0gLz5cbiAgICAgICAgICAgICAgICA8L3RoPlxuXG4gICAgICAgICAgICAgICAgPHRoPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSB7Y2xhc3NOYW1lICsgXCItXCIgKyBQdXNoUnVsZVZlY3RvclN0YXRlLkxPVUR9XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwicmFkaW9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17IHB1c2hSdWxlVmVjdG9yU3RhdGUgPT09IFB1c2hSdWxlVmVjdG9yU3RhdGUuTE9VRCB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17IHRoaXMub25Ob3RpZlN0YXRlQnV0dG9uQ2xpY2tlZCB9IC8+XG4gICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHJlbmRlck5vdGlmUnVsZXNUYWJsZVJvd3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCByb3dzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiB0aGlzLnN0YXRlLnZlY3RvclB1c2hSdWxlcykge1xuICAgICAgICAgICAgY29uc3QgcnVsZSA9IHRoaXMuc3RhdGUudmVjdG9yUHVzaFJ1bGVzW2ldO1xuICAgICAgICAgICAgaWYgKHJ1bGUucnVsZSA9PT0gdW5kZWZpbmVkICYmIHJ1bGUudmVjdG9yUnVsZUlkLnN0YXJ0c1dpdGgoXCIubS5cIikpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFNraXBwaW5nIHJlbmRlciBvZiBydWxlICR7cnVsZS52ZWN0b3JSdWxlSWR9IGR1ZSB0byBubyB1bmRlcmx5aW5nIHJ1bGVgKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJyZW5kZXJpbmc6IFwiICsgcnVsZS5kZXNjcmlwdGlvbiArIFwiLCBcIiArIHJ1bGUudmVjdG9yUnVsZUlkICsgXCIsIFwiICsgcnVsZS52ZWN0b3JTdGF0ZSk7XG4gICAgICAgICAgICByb3dzLnB1c2godGhpcy5yZW5kZXJOb3RpZlJ1bGVzVGFibGVSb3cocnVsZS5kZXNjcmlwdGlvbiwgcnVsZS52ZWN0b3JSdWxlSWQsIHJ1bGUudmVjdG9yU3RhdGUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcm93cztcbiAgICB9LFxuXG4gICAgaGFzRW1haWxQdXNoZXI6IGZ1bmN0aW9uKHB1c2hlcnMsIGFkZHJlc3MpIHtcbiAgICAgICAgaWYgKHB1c2hlcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHVzaGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHB1c2hlcnNbaV0ua2luZCA9PT0gJ2VtYWlsJyAmJiBwdXNoZXJzW2ldLnB1c2hrZXkgPT09IGFkZHJlc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGVtYWlsTm90aWZpY2F0aW9uc1JvdzogZnVuY3Rpb24oYWRkcmVzcywgbGFiZWwpIHtcbiAgICAgICAgcmV0dXJuIDxMYWJlbGxlZFRvZ2dsZVN3aXRjaCB2YWx1ZT17dGhpcy5oYXNFbWFpbFB1c2hlcih0aGlzLnN0YXRlLnB1c2hlcnMsIGFkZHJlc3MpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uRW5hYmxlRW1haWxOb3RpZmljYXRpb25zQ2hhbmdlLmJpbmQodGhpcywgYWRkcmVzcyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e2xhYmVsfSBrZXk9e2BlbWFpbE5vdGlmXyR7bGFiZWx9YH0gLz47XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBzcGlubmVyO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5waGFzZSA9PT0gdGhpcy5waGFzZXMuTE9BRElORykge1xuICAgICAgICAgICAgY29uc3QgTG9hZGVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICBzcGlubmVyID0gPExvYWRlciAvPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtYXN0ZXJQdXNoUnVsZURpdjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubWFzdGVyUHVzaFJ1bGUpIHtcbiAgICAgICAgICAgIG1hc3RlclB1c2hSdWxlRGl2ID0gPExhYmVsbGVkVG9nZ2xlU3dpdGNoIHZhbHVlPXshdGhpcy5zdGF0ZS5tYXN0ZXJQdXNoUnVsZS5lbmFibGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25FbmFibGVOb3RpZmljYXRpb25zQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdFbmFibGUgbm90aWZpY2F0aW9ucyBmb3IgdGhpcyBhY2NvdW50Jyl9Lz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2xlYXJOb3RpZmljYXRpb25zQnV0dG9uO1xuICAgICAgICBpZiAoTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFJvb21zKCkuc29tZShyID0+IHIuZ2V0VW5yZWFkTm90aWZpY2F0aW9uQ291bnQoKSA+IDApKSB7XG4gICAgICAgICAgICBjbGVhck5vdGlmaWNhdGlvbnNCdXR0b24gPSA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkNsZWFyTm90aWZpY2F0aW9uc30ga2luZD0nZGFuZ2VyJz5cbiAgICAgICAgICAgICAgICB7X3QoXCJDbGVhciBub3RpZmljYXRpb25zXCIpfVxuICAgICAgICAgICAgPC9BY2Nlc3NpYmxlQnV0dG9uPjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gZW5hYmxlZCwgdGhlIG1hc3RlciBydWxlIGluaGliaXRzIGFsbCBleGlzdGluZyBydWxlc1xuICAgICAgICAvLyBTbyBkbyBub3Qgc2hvdyBhbGwgbm90aWZpY2F0aW9uIHNldHRpbmdzXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLm1hc3RlclB1c2hSdWxlICYmIHRoaXMuc3RhdGUubWFzdGVyUHVzaFJ1bGUuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICB7bWFzdGVyUHVzaFJ1bGVEaXZ9XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Vc2VyTm90aWZTZXR0aW5nc19ub3RpZlRhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IF90KCdBbGwgbm90aWZpY2F0aW9ucyBhcmUgY3VycmVudGx5IGRpc2FibGVkIGZvciBhbGwgdGFyZ2V0cy4nKSB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHtjbGVhck5vdGlmaWNhdGlvbnNCdXR0b259XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW1haWxUaHJlZXBpZHMgPSB0aGlzLnN0YXRlLnRocmVlcGlkcy5maWx0ZXIoKHRwKSA9PiB0cC5tZWRpdW0gPT09IFwiZW1haWxcIik7XG4gICAgICAgIGxldCBlbWFpbE5vdGlmaWNhdGlvbnNSb3dzO1xuICAgICAgICBpZiAoZW1haWxUaHJlZXBpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBlbWFpbE5vdGlmaWNhdGlvbnNSb3dzID0gPGRpdj5cbiAgICAgICAgICAgICAgICB7IF90KCdBZGQgYW4gZW1haWwgYWRkcmVzcyB0byBjb25maWd1cmUgZW1haWwgbm90aWZpY2F0aW9ucycpIH1cbiAgICAgICAgICAgIDwvZGl2PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVtYWlsTm90aWZpY2F0aW9uc1Jvd3MgPSBlbWFpbFRocmVlcGlkcy5tYXAoKHRocmVlUGlkKSA9PiB0aGlzLmVtYWlsTm90aWZpY2F0aW9uc1JvdyhcbiAgICAgICAgICAgICAgICB0aHJlZVBpZC5hZGRyZXNzLCBgJHtfdCgnRW5hYmxlIGVtYWlsIG5vdGlmaWNhdGlvbnMnKX0gKCR7dGhyZWVQaWQuYWRkcmVzc30pYCxcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgZXh0ZXJuYWwgcHVzaCBydWxlc1xuICAgICAgICBjb25zdCBleHRlcm5hbFJ1bGVzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiB0aGlzLnN0YXRlLmV4dGVybmFsUHVzaFJ1bGVzKSB7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5zdGF0ZS5leHRlcm5hbFB1c2hSdWxlc1tpXTtcbiAgICAgICAgICAgIGV4dGVybmFsUnVsZXMucHVzaCg8bGk+eyBfdChydWxlLmRlc2NyaXB0aW9uKSB9PC9saT4pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyBrZXl3b3JkcyBub3QgZGlzcGxheWVkIGJ5IHRoZSB2ZWN0b3IgVUkgYXMgYSBzaW5nbGUgZXh0ZXJuYWwgcHVzaCBydWxlXG4gICAgICAgIGxldCBleHRlcm5hbEtleXdvcmRzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiB0aGlzLnN0YXRlLmV4dGVybmFsQ29udGVudFJ1bGVzKSB7XG4gICAgICAgICAgICBjb25zdCBydWxlID0gdGhpcy5zdGF0ZS5leHRlcm5hbENvbnRlbnRSdWxlc1tpXTtcbiAgICAgICAgICAgIGV4dGVybmFsS2V5d29yZHMucHVzaChydWxlLnBhdHRlcm4pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChleHRlcm5hbEtleXdvcmRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZXh0ZXJuYWxLZXl3b3JkcyA9IGV4dGVybmFsS2V5d29yZHMuam9pbihcIiwgXCIpO1xuICAgICAgICAgICAgZXh0ZXJuYWxSdWxlcy5wdXNoKDxsaT57IF90KCdOb3RpZmljYXRpb25zIG9uIHRoZSBmb2xsb3dpbmcga2V5d29yZHMgZm9sbG93IHJ1bGVzIHdoaWNoIGNhbuKAmXQgYmUgZGlzcGxheWVkIGhlcmU6JykgfSB7IGV4dGVybmFsS2V5d29yZHMgfTwvbGk+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkZXZpY2VzU2VjdGlvbjtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUucHVzaGVycyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZXZpY2VzU2VjdGlvbiA9IDxkaXYgY2xhc3NOYW1lPVwiZXJyb3JcIj57IF90KCdVbmFibGUgdG8gZmV0Y2ggbm90aWZpY2F0aW9uIHRhcmdldCBsaXN0JykgfTwvZGl2PjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnB1c2hlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZXZpY2VzU2VjdGlvbiA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBJdCB3b3VsZCBiZSBncmVhdCB0byBiZSBhYmxlIHRvIGRlbGV0ZSBwdXNoZXJzIGZyb20gaGVyZSB0b28sXG4gICAgICAgICAgICAvLyBhbmQgdGhpcyB3b3VsZG4ndCBiZSBoYXJkIHRvIGFkZC5cbiAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdGF0ZS5wdXNoZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKDx0ciBrZXk9eyBpIH0+XG4gICAgICAgICAgICAgICAgICAgIDx0ZD57dGhpcy5zdGF0ZS5wdXNoZXJzW2ldLmFwcF9kaXNwbGF5X25hbWV9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkPnt0aGlzLnN0YXRlLnB1c2hlcnNbaV0uZGV2aWNlX2Rpc3BsYXlfbmFtZX08L3RkPlxuICAgICAgICAgICAgICAgIDwvdHI+KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRldmljZXNTZWN0aW9uID0gKDx0YWJsZSBjbGFzc05hbWU9XCJteF9Vc2VyTm90aWZTZXR0aW5nc19kZXZpY2VzVGFibGVcIj5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRldmljZXNTZWN0aW9uKSB7XG4gICAgICAgICAgICBkZXZpY2VzU2VjdGlvbiA9ICg8ZGl2PlxuICAgICAgICAgICAgICAgIDxoMz57IF90KCdOb3RpZmljYXRpb24gdGFyZ2V0cycpIH08L2gzPlxuICAgICAgICAgICAgICAgIHsgZGV2aWNlc1NlY3Rpb24gfVxuICAgICAgICAgICAgPC9kaXY+KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhZHZhbmNlZFNldHRpbmdzO1xuICAgICAgICBpZiAoZXh0ZXJuYWxSdWxlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFkdmFuY2VkU2V0dGluZ3MgPSAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPnsgX3QoJ0FkdmFuY2VkIG5vdGlmaWNhdGlvbiBzZXR0aW5ncycpIH08L2gzPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdUaGVyZSBhcmUgYWR2YW5jZWQgbm90aWZpY2F0aW9ucyB3aGljaCBhcmUgbm90IHNob3duIGhlcmUnKSB9LjxiciAvPlxuICAgICAgICAgICAgICAgICAgICB7IF90KCdZb3UgbWlnaHQgaGF2ZSBjb25maWd1cmVkIHRoZW0gaW4gYSBjbGllbnQgb3RoZXIgdGhhbiBSaW90LiBZb3UgY2Fubm90IHR1bmUgdGhlbSBpbiBSaW90IGJ1dCB0aGV5IHN0aWxsIGFwcGx5JykgfS5cbiAgICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBleHRlcm5hbFJ1bGVzIH1cbiAgICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdj5cblxuICAgICAgICAgICAgICAgIHttYXN0ZXJQdXNoUnVsZURpdn1cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXNlck5vdGlmU2V0dGluZ3Nfbm90aWZUYWJsZVwiPlxuXG4gICAgICAgICAgICAgICAgICAgIHsgc3Bpbm5lciB9XG5cbiAgICAgICAgICAgICAgICAgICAgPExhYmVsbGVkVG9nZ2xlU3dpdGNoIHZhbHVlPXtTZXR0aW5nc1N0b3JlLmdldFZhbHVlKFwibm90aWZpY2F0aW9uc0VuYWJsZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbkVuYWJsZURlc2t0b3BOb3RpZmljYXRpb25zQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw9e190KCdFbmFibGUgZGVza3RvcCBub3RpZmljYXRpb25zIGZvciB0aGlzIHNlc3Npb24nKX0gLz5cblxuICAgICAgICAgICAgICAgICAgICA8TGFiZWxsZWRUb2dnbGVTd2l0Y2ggdmFsdWU9e1NldHRpbmdzU3RvcmUuZ2V0VmFsdWUoXCJub3RpZmljYXRpb25Cb2R5RW5hYmxlZFwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uRW5hYmxlRGVza3RvcE5vdGlmaWNhdGlvbkJvZHlDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbD17X3QoJ1Nob3cgbWVzc2FnZSBpbiBkZXNrdG9wIG5vdGlmaWNhdGlvbicpfSAvPlxuXG4gICAgICAgICAgICAgICAgICAgIDxMYWJlbGxlZFRvZ2dsZVN3aXRjaCB2YWx1ZT17U2V0dGluZ3NTdG9yZS5nZXRWYWx1ZShcImF1ZGlvTm90aWZpY2F0aW9uc0VuYWJsZWRcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17dGhpcy5vbkVuYWJsZUF1ZGlvTm90aWZpY2F0aW9uc0NoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdCgnRW5hYmxlIGF1ZGlibGUgbm90aWZpY2F0aW9ucyBmb3IgdGhpcyBzZXNzaW9uJyl9IC8+XG5cbiAgICAgICAgICAgICAgICAgICAgeyBlbWFpbE5vdGlmaWNhdGlvbnNSb3dzIH1cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VzZXJOb3RpZlNldHRpbmdzX3B1c2hSdWxlc1RhYmxlV3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzTmFtZT1cIm14X1VzZXJOb3RpZlNldHRpbmdzX3B1c2hSdWxlc1RhYmxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggd2lkdGg9XCI1NSVcIj48L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHdpZHRoPVwiMTUlXCI+eyBfdCgnT2ZmJykgfTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggd2lkdGg9XCIxNSVcIj57IF90KCdPbicpIH08L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIHdpZHRoPVwiMTUlXCI+eyBfdCgnTm9pc3knKSB9PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMucmVuZGVyTm90aWZSdWxlc1RhYmxlUm93cygpIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7IGFkdmFuY2VkU2V0dGluZ3MgfVxuXG4gICAgICAgICAgICAgICAgICAgIHsgZGV2aWNlc1NlY3Rpb24gfVxuXG4gICAgICAgICAgICAgICAgICAgIHsgY2xlYXJOb3RpZmljYXRpb25zQnV0dG9uIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19