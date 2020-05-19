"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

var _FormattingUtils = require("../../../utils/FormattingUtils");

var sdk = _interopRequireWildcard(require("../../../index"));

var _matrixJsSdk = require("matrix-js-sdk");

/*
Copyright 2016 OpenMarket Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>

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
  displayName: 'MemberEventListSummary',
  propTypes: {
    // An array of member events to summarise
    events: _propTypes.default.arrayOf(_propTypes.default.instanceOf(_matrixJsSdk.MatrixEvent)).isRequired,
    // An array of EventTiles to render when expanded
    children: _propTypes.default.array.isRequired,
    // The maximum number of names to show in either each summary e.g. 2 would result "A, B and 234 others left"
    summaryLength: _propTypes.default.number,
    // The maximum number of avatars to display in the summary
    avatarsMaxLength: _propTypes.default.number,
    // The minimum number of events needed to trigger summarisation
    threshold: _propTypes.default.number,
    // Called when the MELS expansion is toggled
    onToggle: _propTypes.default.func,
    // Whether or not to begin with state.expanded=true
    startExpanded: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      summaryLength: 1,
      threshold: 3,
      avatarsMaxLength: 5
    };
  },
  shouldComponentUpdate: function (nextProps) {
    // Update if
    //  - The number of summarised events has changed
    //  - or if the summary is about to toggle to become collapsed
    //  - or if there are fewEvents, meaning the child eventTiles are shown as-is
    return nextProps.events.length !== this.props.events.length || nextProps.events.length < this.props.threshold;
  },

  /**
   * Generate the text for users aggregated by their transition sequences (`eventAggregates`) where
   * the sequences are ordered by `orderedTransitionSequences`.
   * @param {object[]} eventAggregates a map of transition sequence to array of user display names
   * or user IDs.
   * @param {string[]} orderedTransitionSequences an array which is some ordering of
   * `Object.keys(eventAggregates)`.
   * @returns {string} the textual summary of the aggregated events that occurred.
   */
  _generateSummary: function (eventAggregates, orderedTransitionSequences) {
    const summaries = orderedTransitionSequences.map(transitions => {
      const userNames = eventAggregates[transitions];

      const nameList = this._renderNameList(userNames);

      const splitTransitions = transitions.split(','); // Some neighbouring transitions are common, so canonicalise some into "pair"
      // transitions

      const canonicalTransitions = this._getCanonicalTransitions(splitTransitions); // Transform into consecutive repetitions of the same transition (like 5
      // consecutive 'joined_and_left's)


      const coalescedTransitions = this._coalesceRepeatedTransitions(canonicalTransitions);

      const descs = coalescedTransitions.map(t => {
        return this._getDescriptionForTransition(t.transitionType, userNames.length, t.repeats);
      });
      const desc = (0, _FormattingUtils.formatCommaSeparatedList)(descs);
      return (0, _languageHandler._t)('%(nameList)s %(transitionList)s', {
        nameList: nameList,
        transitionList: desc
      });
    });

    if (!summaries) {
      return null;
    }

    return summaries.join(", ");
  },

  /**
   * @param {string[]} users an array of user display names or user IDs.
   * @returns {string} a comma-separated list that ends with "and [n] others" if there are
   * more items in `users` than `this.props.summaryLength`, which is the number of names
   * included before "and [n] others".
   */
  _renderNameList: function (users) {
    return (0, _FormattingUtils.formatCommaSeparatedList)(users, this.props.summaryLength);
  },

  /**
   * Canonicalise an array of transitions such that some pairs of transitions become
   * single transitions. For example an input ['joined','left'] would result in an output
   * ['joined_and_left'].
   * @param {string[]} transitions an array of transitions.
   * @returns {string[]} an array of transitions.
   */
  _getCanonicalTransitions: function (transitions) {
    const modMap = {
      'joined': {
        'after': 'left',
        'newTransition': 'joined_and_left'
      },
      'left': {
        'after': 'joined',
        'newTransition': 'left_and_joined'
      } // $currentTransition : {
      //     'after' : $nextTransition,
      //     'newTransition' : 'new_transition_type',
      // },

    };
    const res = [];

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];
      const t2 = transitions[i + 1];
      let transition = t;

      if (i < transitions.length - 1 && modMap[t] && modMap[t].after === t2) {
        transition = modMap[t].newTransition;
        i++;
      }

      res.push(transition);
    }

    return res;
  },

  /**
   * Transform an array of transitions into an array of transitions and how many times
   * they are repeated consecutively.
   *
   * An array of 123 "joined_and_left" transitions, would result in:
   * ```
   * [{
   *   transitionType: "joined_and_left"
   *   repeats: 123
   * }]
   * ```
   * @param {string[]} transitions the array of transitions to transform.
   * @returns {object[]} an array of coalesced transitions.
   */
  _coalesceRepeatedTransitions: function (transitions) {
    const res = [];

    for (let i = 0; i < transitions.length; i++) {
      if (res.length > 0 && res[res.length - 1].transitionType === transitions[i]) {
        res[res.length - 1].repeats += 1;
      } else {
        res.push({
          transitionType: transitions[i],
          repeats: 1
        });
      }
    }

    return res;
  },

  /**
   * For a certain transition, t, describe what happened to the users that
   * underwent the transition.
   * @param {string} t the transition type.
   * @param {number} userCount number of usernames
   * @param {number} repeats the number of times the transition was repeated in a row.
   * @returns {string} the written Human Readable equivalent of the transition.
   */
  _getDescriptionForTransition(t, userCount, repeats) {
    // The empty interpolations 'severalUsers' and 'oneUser'
    // are there only to show translators to non-English languages
    // that the verb is conjugated to plural or singular Subject.
    let res = null;

    switch (t) {
      case "joined":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)sjoined %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)sjoined %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "left":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)sleft %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)sleft %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "joined_and_left":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)sjoined and left %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)sjoined and left %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "left_and_joined":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)sleft and rejoined %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)sleft and rejoined %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "invite_reject":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)srejected their invitations %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)srejected their invitation %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "invite_withdrawal":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)shad their invitations withdrawn %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)shad their invitation withdrawn %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "invited":
        res = userCount > 1 ? (0, _languageHandler._t)("were invited %(count)s times", {
          count: repeats
        }) : (0, _languageHandler._t)("was invited %(count)s times", {
          count: repeats
        });
        break;

      case "banned":
        res = userCount > 1 ? (0, _languageHandler._t)("were banned %(count)s times", {
          count: repeats
        }) : (0, _languageHandler._t)("was banned %(count)s times", {
          count: repeats
        });
        break;

      case "unbanned":
        res = userCount > 1 ? (0, _languageHandler._t)("were unbanned %(count)s times", {
          count: repeats
        }) : (0, _languageHandler._t)("was unbanned %(count)s times", {
          count: repeats
        });
        break;

      case "kicked":
        res = userCount > 1 ? (0, _languageHandler._t)("were kicked %(count)s times", {
          count: repeats
        }) : (0, _languageHandler._t)("was kicked %(count)s times", {
          count: repeats
        });
        break;

      case "changed_name":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)schanged their name %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)schanged their name %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "changed_avatar":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)schanged their avatar %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)schanged their avatar %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;

      case "no_change":
        res = userCount > 1 ? (0, _languageHandler._t)("%(severalUsers)smade no changes %(count)s times", {
          severalUsers: "",
          count: repeats
        }) : (0, _languageHandler._t)("%(oneUser)smade no changes %(count)s times", {
          oneUser: "",
          count: repeats
        });
        break;
    }

    return res;
  },

  _getTransitionSequence: function (events) {
    return events.map(this._getTransition);
  },

  /**
   * Label a given membership event, `e`, where `getContent().membership` has
   * changed for each transition allowed by the Matrix protocol. This attempts to
   * label the membership changes that occur in `../../../TextForEvent.js`.
   * @param {MatrixEvent} e the membership change event to label.
   * @returns {string?} the transition type given to this event. This defaults to `null`
   * if a transition is not recognised.
   */
  _getTransition: function (e) {
    if (e.mxEvent.getType() === 'm.room.third_party_invite') {
      // Handle 3pid invites the same as invites so they get bundled together
      return 'invited';
    }

    switch (e.mxEvent.getContent().membership) {
      case 'invite':
        return 'invited';

      case 'ban':
        return 'banned';

      case 'join':
        if (e.mxEvent.getPrevContent().membership === 'join') {
          if (e.mxEvent.getContent().displayname !== e.mxEvent.getPrevContent().displayname) {
            return 'changed_name';
          } else if (e.mxEvent.getContent().avatar_url !== e.mxEvent.getPrevContent().avatar_url) {
            return 'changed_avatar';
          } // console.log("MELS ignoring duplicate membership join event");


          return 'no_change';
        } else {
          return 'joined';
        }

      case 'leave':
        if (e.mxEvent.getSender() === e.mxEvent.getStateKey()) {
          switch (e.mxEvent.getPrevContent().membership) {
            case 'invite':
              return 'invite_reject';

            default:
              return 'left';
          }
        }

        switch (e.mxEvent.getPrevContent().membership) {
          case 'invite':
            return 'invite_withdrawal';

          case 'ban':
            return 'unbanned';
          // sender is not target and made the target leave, if not from invite/ban then this is a kick

          default:
            return 'kicked';
        }

      default:
        return null;
    }
  },
  _getAggregate: function (userEvents) {
    // A map of aggregate type to arrays of display names. Each aggregate type
    // is a comma-delimited string of transitions, e.g. "joined,left,kicked".
    // The array of display names is the array of users who went through that
    // sequence during eventsToRender.
    const aggregate = {// $aggregateType : []:string
    }; // A map of aggregate types to the indices that order them (the index of
    // the first event for a given transition sequence)

    const aggregateIndices = {// $aggregateType : int
    };
    const users = Object.keys(userEvents);
    users.forEach(userId => {
      const firstEvent = userEvents[userId][0];
      const displayName = firstEvent.displayName;

      const seq = this._getTransitionSequence(userEvents[userId]);

      if (!aggregate[seq]) {
        aggregate[seq] = [];
        aggregateIndices[seq] = -1;
      }

      aggregate[seq].push(displayName);

      if (aggregateIndices[seq] === -1 || firstEvent.index < aggregateIndices[seq]) {
        aggregateIndices[seq] = firstEvent.index;
      }
    });
    return {
      names: aggregate,
      indices: aggregateIndices
    };
  },
  render: function () {
    const eventsToRender = this.props.events; // Map user IDs to an array of objects:

    const userEvents = {// $userId : [{
      //     // The original event
      //     mxEvent: e,
      //     // The display name of the user (if not, then user ID)
      //     displayName: e.target.name || userId,
      //     // The original index of the event in this.props.events
      //     index: index,
      // }]
    };
    const avatarMembers = [];
    eventsToRender.forEach((e, index) => {
      const userId = e.getStateKey(); // Initialise a user's events

      if (!userEvents[userId]) {
        userEvents[userId] = [];
        if (e.target) avatarMembers.push(e.target);
      }

      let displayName = userId;

      if (e.getType() === 'm.room.third_party_invite') {
        displayName = e.getContent().display_name;
      } else if (e.target) {
        displayName = e.target.name;
      }

      userEvents[userId].push({
        mxEvent: e,
        displayName,
        index: index
      });
    });

    const aggregate = this._getAggregate(userEvents); // Sort types by order of lowest event index within sequence


    const orderedTransitionSequences = Object.keys(aggregate.names).sort((seq1, seq2) => aggregate.indices[seq1] > aggregate.indices[seq2]);
    const EventListSummary = sdk.getComponent("views.elements.EventListSummary");
    return /*#__PURE__*/_react.default.createElement(EventListSummary, {
      events: this.props.events,
      threshold: this.props.threshold,
      onToggle: this.props.onToggle,
      startExpanded: this.props.startExpanded,
      children: this.props.children,
      summaryMembers: avatarMembers,
      summaryText: this._generateSummary(aggregate.names, orderedTransitionSequences)
    });
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL01lbWJlckV2ZW50TGlzdFN1bW1hcnkuanMiXSwibmFtZXMiOlsiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJldmVudHMiLCJQcm9wVHlwZXMiLCJhcnJheU9mIiwiaW5zdGFuY2VPZiIsIk1hdHJpeEV2ZW50IiwiaXNSZXF1aXJlZCIsImNoaWxkcmVuIiwiYXJyYXkiLCJzdW1tYXJ5TGVuZ3RoIiwibnVtYmVyIiwiYXZhdGFyc01heExlbmd0aCIsInRocmVzaG9sZCIsIm9uVG9nZ2xlIiwiZnVuYyIsInN0YXJ0RXhwYW5kZWQiLCJib29sIiwiZ2V0RGVmYXVsdFByb3BzIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwibmV4dFByb3BzIiwibGVuZ3RoIiwicHJvcHMiLCJfZ2VuZXJhdGVTdW1tYXJ5IiwiZXZlbnRBZ2dyZWdhdGVzIiwib3JkZXJlZFRyYW5zaXRpb25TZXF1ZW5jZXMiLCJzdW1tYXJpZXMiLCJtYXAiLCJ0cmFuc2l0aW9ucyIsInVzZXJOYW1lcyIsIm5hbWVMaXN0IiwiX3JlbmRlck5hbWVMaXN0Iiwic3BsaXRUcmFuc2l0aW9ucyIsInNwbGl0IiwiY2Fub25pY2FsVHJhbnNpdGlvbnMiLCJfZ2V0Q2Fub25pY2FsVHJhbnNpdGlvbnMiLCJjb2FsZXNjZWRUcmFuc2l0aW9ucyIsIl9jb2FsZXNjZVJlcGVhdGVkVHJhbnNpdGlvbnMiLCJkZXNjcyIsInQiLCJfZ2V0RGVzY3JpcHRpb25Gb3JUcmFuc2l0aW9uIiwidHJhbnNpdGlvblR5cGUiLCJyZXBlYXRzIiwiZGVzYyIsInRyYW5zaXRpb25MaXN0Iiwiam9pbiIsInVzZXJzIiwibW9kTWFwIiwicmVzIiwiaSIsInQyIiwidHJhbnNpdGlvbiIsImFmdGVyIiwibmV3VHJhbnNpdGlvbiIsInB1c2giLCJ1c2VyQ291bnQiLCJzZXZlcmFsVXNlcnMiLCJjb3VudCIsIm9uZVVzZXIiLCJfZ2V0VHJhbnNpdGlvblNlcXVlbmNlIiwiX2dldFRyYW5zaXRpb24iLCJlIiwibXhFdmVudCIsImdldFR5cGUiLCJnZXRDb250ZW50IiwibWVtYmVyc2hpcCIsImdldFByZXZDb250ZW50IiwiZGlzcGxheW5hbWUiLCJhdmF0YXJfdXJsIiwiZ2V0U2VuZGVyIiwiZ2V0U3RhdGVLZXkiLCJfZ2V0QWdncmVnYXRlIiwidXNlckV2ZW50cyIsImFnZ3JlZ2F0ZSIsImFnZ3JlZ2F0ZUluZGljZXMiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsInVzZXJJZCIsImZpcnN0RXZlbnQiLCJzZXEiLCJpbmRleCIsIm5hbWVzIiwiaW5kaWNlcyIsInJlbmRlciIsImV2ZW50c1RvUmVuZGVyIiwiYXZhdGFyTWVtYmVycyIsInRhcmdldCIsImRpc3BsYXlfbmFtZSIsIm5hbWUiLCJzb3J0Iiwic2VxMSIsInNlcTIiLCJFdmVudExpc3RTdW1tYXJ5Iiwic2RrIiwiZ2V0Q29tcG9uZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBMEJlLCtCQUFpQjtBQUM1QkEsRUFBQUEsV0FBVyxFQUFFLHdCQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUDtBQUNBQyxJQUFBQSxNQUFNLEVBQUVDLG1CQUFVQyxPQUFWLENBQWtCRCxtQkFBVUUsVUFBVixDQUFxQkMsd0JBQXJCLENBQWxCLEVBQXFEQyxVQUZ0RDtBQUdQO0FBQ0FDLElBQUFBLFFBQVEsRUFBRUwsbUJBQVVNLEtBQVYsQ0FBZ0JGLFVBSm5CO0FBS1A7QUFDQUcsSUFBQUEsYUFBYSxFQUFFUCxtQkFBVVEsTUFObEI7QUFPUDtBQUNBQyxJQUFBQSxnQkFBZ0IsRUFBRVQsbUJBQVVRLE1BUnJCO0FBU1A7QUFDQUUsSUFBQUEsU0FBUyxFQUFFVixtQkFBVVEsTUFWZDtBQVdQO0FBQ0FHLElBQUFBLFFBQVEsRUFBRVgsbUJBQVVZLElBWmI7QUFhUDtBQUNBQyxJQUFBQSxhQUFh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QUlBLFVBQU1DLGdCQUFnQixHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsaUNBQWpCLENBQXpCO0FBQ0Esd0JBQU8sNkJBQUMsZ0JBQUQ7QUFDSCxNQUFBLE1BQU0sRUFBRSxLQUFLekUsS0FBTCxDQUFXcEIsTUFEaEI7QUFFSCxNQUFBLFNBQVMsRUFBRSxLQUFLb0IsS0FBTCxDQUFXVCxTQUZuQjtBQUdILE1BQUEsUUFBUSxFQUFFLEtBQUtTLEtBQUwsQ0FBV1IsUUFIbEI7QUFJSCxNQUFBLGFBQWEsRUFBRSxLQUFLUSxLQUFMLENBQVdOLGFBSnZCO0FBS0gsTUFBQSxRQUFRLEVBQUUsS0FBS00sS0FBTCxDQUFXZCxRQUxsQjtBQU1ILE1BQUEsY0FBYyxFQUFFOEUsYUFOYjtBQU9ILE1BQUEsV0FBVyxFQUFFLEtBQUsvRCxnQkFBTCxDQUFzQmtELFNBQVMsQ0FBQ1MsS0FBaEMsRUFBdUN6RCwwQkFBdkM7QUFQVixNQUFQO0FBUUg7QUF4WTJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgeyBmb3JtYXRDb21tYVNlcGFyYXRlZExpc3QgfSBmcm9tICcuLi8uLi8uLi91dGlscy9Gb3JtYXR0aW5nVXRpbHMnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi8uLi9pbmRleFwiO1xuaW1wb3J0IHtNYXRyaXhFdmVudH0gZnJvbSBcIm1hdHJpeC1qcy1zZGtcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdNZW1iZXJFdmVudExpc3RTdW1tYXJ5JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICAvLyBBbiBhcnJheSBvZiBtZW1iZXIgZXZlbnRzIHRvIHN1bW1hcmlzZVxuICAgICAgICBldmVudHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5pbnN0YW5jZU9mKE1hdHJpeEV2ZW50KSkuaXNSZXF1aXJlZCxcbiAgICAgICAgLy8gQW4gYXJyYXkgb2YgRXZlbnRUaWxlcyB0byByZW5kZXIgd2hlbiBleHBhbmRlZFxuICAgICAgICBjaGlsZHJlbjogUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBuYW1lcyB0byBzaG93IGluIGVpdGhlciBlYWNoIHN1bW1hcnkgZS5nLiAyIHdvdWxkIHJlc3VsdCBcIkEsIEIgYW5kIDIzNCBvdGhlcnMgbGVmdFwiXG4gICAgICAgIHN1bW1hcnlMZW5ndGg6IFByb3BUeXBlcy5udW1iZXIsXG4gICAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBhdmF0YXJzIHRvIGRpc3BsYXkgaW4gdGhlIHN1bW1hcnlcbiAgICAgICAgYXZhdGFyc01heExlbmd0aDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgLy8gVGhlIG1pbmltdW0gbnVtYmVyIG9mIGV2ZW50cyBuZWVkZWQgdG8gdHJpZ2dlciBzdW1tYXJpc2F0aW9uXG4gICAgICAgIHRocmVzaG9sZDogUHJvcFR5cGVzLm51bWJlcixcbiAgICAgICAgLy8gQ2FsbGVkIHdoZW4gdGhlIE1FTFMgZXhwYW5zaW9uIGlzIHRvZ2dsZWRcbiAgICAgICAgb25Ub2dnbGU6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICAvLyBXaGV0aGVyIG9yIG5vdCB0byBiZWdpbiB3aXRoIHN0YXRlLmV4cGFuZGVkPXRydWVcbiAgICAgICAgc3RhcnRFeHBhbmRlZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgfSxcblxuICAgIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdW1tYXJ5TGVuZ3RoOiAxLFxuICAgICAgICAgICAgdGhyZXNob2xkOiAzLFxuICAgICAgICAgICAgYXZhdGFyc01heExlbmd0aDogNSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbihuZXh0UHJvcHMpIHtcbiAgICAgICAgLy8gVXBkYXRlIGlmXG4gICAgICAgIC8vICAtIFRoZSBudW1iZXIgb2Ygc3VtbWFyaXNlZCBldmVudHMgaGFzIGNoYW5nZWRcbiAgICAgICAgLy8gIC0gb3IgaWYgdGhlIHN1bW1hcnkgaXMgYWJvdXQgdG8gdG9nZ2xlIHRvIGJlY29tZSBjb2xsYXBzZWRcbiAgICAgICAgLy8gIC0gb3IgaWYgdGhlcmUgYXJlIGZld0V2ZW50cywgbWVhbmluZyB0aGUgY2hpbGQgZXZlbnRUaWxlcyBhcmUgc2hvd24gYXMtaXNcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIG5leHRQcm9wcy5ldmVudHMubGVuZ3RoICE9PSB0aGlzLnByb3BzLmV2ZW50cy5sZW5ndGggfHxcbiAgICAgICAgICAgIG5leHRQcm9wcy5ldmVudHMubGVuZ3RoIDwgdGhpcy5wcm9wcy50aHJlc2hvbGRcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgdGhlIHRleHQgZm9yIHVzZXJzIGFnZ3JlZ2F0ZWQgYnkgdGhlaXIgdHJhbnNpdGlvbiBzZXF1ZW5jZXMgKGBldmVudEFnZ3JlZ2F0ZXNgKSB3aGVyZVxuICAgICAqIHRoZSBzZXF1ZW5jZXMgYXJlIG9yZGVyZWQgYnkgYG9yZGVyZWRUcmFuc2l0aW9uU2VxdWVuY2VzYC5cbiAgICAgKiBAcGFyYW0ge29iamVjdFtdfSBldmVudEFnZ3JlZ2F0ZXMgYSBtYXAgb2YgdHJhbnNpdGlvbiBzZXF1ZW5jZSB0byBhcnJheSBvZiB1c2VyIGRpc3BsYXkgbmFtZXNcbiAgICAgKiBvciB1c2VyIElEcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBvcmRlcmVkVHJhbnNpdGlvblNlcXVlbmNlcyBhbiBhcnJheSB3aGljaCBpcyBzb21lIG9yZGVyaW5nIG9mXG4gICAgICogYE9iamVjdC5rZXlzKGV2ZW50QWdncmVnYXRlcylgLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSB0ZXh0dWFsIHN1bW1hcnkgb2YgdGhlIGFnZ3JlZ2F0ZWQgZXZlbnRzIHRoYXQgb2NjdXJyZWQuXG4gICAgICovXG4gICAgX2dlbmVyYXRlU3VtbWFyeTogZnVuY3Rpb24oZXZlbnRBZ2dyZWdhdGVzLCBvcmRlcmVkVHJhbnNpdGlvblNlcXVlbmNlcykge1xuICAgICAgICBjb25zdCBzdW1tYXJpZXMgPSBvcmRlcmVkVHJhbnNpdGlvblNlcXVlbmNlcy5tYXAoKHRyYW5zaXRpb25zKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1c2VyTmFtZXMgPSBldmVudEFnZ3JlZ2F0ZXNbdHJhbnNpdGlvbnNdO1xuICAgICAgICAgICAgY29uc3QgbmFtZUxpc3QgPSB0aGlzLl9yZW5kZXJOYW1lTGlzdCh1c2VyTmFtZXMpO1xuXG4gICAgICAgICAgICBjb25zdCBzcGxpdFRyYW5zaXRpb25zID0gdHJhbnNpdGlvbnMuc3BsaXQoJywnKTtcblxuICAgICAgICAgICAgLy8gU29tZSBuZWlnaGJvdXJpbmcgdHJhbnNpdGlvbnMgYXJlIGNvbW1vbiwgc28gY2Fub25pY2FsaXNlIHNvbWUgaW50byBcInBhaXJcIlxuICAgICAgICAgICAgLy8gdHJhbnNpdGlvbnNcbiAgICAgICAgICAgIGNvbnN0IGNhbm9uaWNhbFRyYW5zaXRpb25zID0gdGhpcy5fZ2V0Q2Fub25pY2FsVHJhbnNpdGlvbnMoc3BsaXRUcmFuc2l0aW9ucyk7XG4gICAgICAgICAgICAvLyBUcmFuc2Zvcm0gaW50byBjb25zZWN1dGl2ZSByZXBldGl0aW9ucyBvZiB0aGUgc2FtZSB0cmFuc2l0aW9uIChsaWtlIDVcbiAgICAgICAgICAgIC8vIGNvbnNlY3V0aXZlICdqb2luZWRfYW5kX2xlZnQncylcbiAgICAgICAgICAgIGNvbnN0IGNvYWxlc2NlZFRyYW5zaXRpb25zID0gdGhpcy5fY29hbGVzY2VSZXBlYXRlZFRyYW5zaXRpb25zKFxuICAgICAgICAgICAgICAgIGNhbm9uaWNhbFRyYW5zaXRpb25zLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgZGVzY3MgPSBjb2FsZXNjZWRUcmFuc2l0aW9ucy5tYXAoKHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RGVzY3JpcHRpb25Gb3JUcmFuc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0LnRyYW5zaXRpb25UeXBlLCB1c2VyTmFtZXMubGVuZ3RoLCB0LnJlcGVhdHMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBkZXNjID0gZm9ybWF0Q29tbWFTZXBhcmF0ZWRMaXN0KGRlc2NzKTtcblxuICAgICAgICAgICAgcmV0dXJuIF90KCclKG5hbWVMaXN0KXMgJSh0cmFuc2l0aW9uTGlzdClzJywgeyBuYW1lTGlzdDogbmFtZUxpc3QsIHRyYW5zaXRpb25MaXN0OiBkZXNjIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXN1bW1hcmllcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VtbWFyaWVzLmpvaW4oXCIsIFwiKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gdXNlcnMgYW4gYXJyYXkgb2YgdXNlciBkaXNwbGF5IG5hbWVzIG9yIHVzZXIgSURzLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGEgY29tbWEtc2VwYXJhdGVkIGxpc3QgdGhhdCBlbmRzIHdpdGggXCJhbmQgW25dIG90aGVyc1wiIGlmIHRoZXJlIGFyZVxuICAgICAqIG1vcmUgaXRlbXMgaW4gYHVzZXJzYCB0aGFuIGB0aGlzLnByb3BzLnN1bW1hcnlMZW5ndGhgLCB3aGljaCBpcyB0aGUgbnVtYmVyIG9mIG5hbWVzXG4gICAgICogaW5jbHVkZWQgYmVmb3JlIFwiYW5kIFtuXSBvdGhlcnNcIi5cbiAgICAgKi9cbiAgICBfcmVuZGVyTmFtZUxpc3Q6IGZ1bmN0aW9uKHVzZXJzKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRDb21tYVNlcGFyYXRlZExpc3QodXNlcnMsIHRoaXMucHJvcHMuc3VtbWFyeUxlbmd0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbm9uaWNhbGlzZSBhbiBhcnJheSBvZiB0cmFuc2l0aW9ucyBzdWNoIHRoYXQgc29tZSBwYWlycyBvZiB0cmFuc2l0aW9ucyBiZWNvbWVcbiAgICAgKiBzaW5nbGUgdHJhbnNpdGlvbnMuIEZvciBleGFtcGxlIGFuIGlucHV0IFsnam9pbmVkJywnbGVmdCddIHdvdWxkIHJlc3VsdCBpbiBhbiBvdXRwdXRcbiAgICAgKiBbJ2pvaW5lZF9hbmRfbGVmdCddLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHRyYW5zaXRpb25zIGFuIGFycmF5IG9mIHRyYW5zaXRpb25zLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmdbXX0gYW4gYXJyYXkgb2YgdHJhbnNpdGlvbnMuXG4gICAgICovXG4gICAgX2dldENhbm9uaWNhbFRyYW5zaXRpb25zOiBmdW5jdGlvbih0cmFuc2l0aW9ucykge1xuICAgICAgICBjb25zdCBtb2RNYXAgPSB7XG4gICAgICAgICAgICAnam9pbmVkJzoge1xuICAgICAgICAgICAgICAgICdhZnRlcic6ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAnbmV3VHJhbnNpdGlvbic6ICdqb2luZWRfYW5kX2xlZnQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdsZWZ0Jzoge1xuICAgICAgICAgICAgICAgICdhZnRlcic6ICdqb2luZWQnLFxuICAgICAgICAgICAgICAgICduZXdUcmFuc2l0aW9uJzogJ2xlZnRfYW5kX2pvaW5lZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gJGN1cnJlbnRUcmFuc2l0aW9uIDoge1xuICAgICAgICAgICAgLy8gICAgICdhZnRlcicgOiAkbmV4dFRyYW5zaXRpb24sXG4gICAgICAgICAgICAvLyAgICAgJ25ld1RyYW5zaXRpb24nIDogJ25ld190cmFuc2l0aW9uX3R5cGUnLFxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0cmFuc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdCA9IHRyYW5zaXRpb25zW2ldO1xuICAgICAgICAgICAgY29uc3QgdDIgPSB0cmFuc2l0aW9uc1tpICsgMV07XG5cbiAgICAgICAgICAgIGxldCB0cmFuc2l0aW9uID0gdDtcblxuICAgICAgICAgICAgaWYgKGkgPCB0cmFuc2l0aW9ucy5sZW5ndGggLSAxICYmIG1vZE1hcFt0XSAmJiBtb2RNYXBbdF0uYWZ0ZXIgPT09IHQyKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbiA9IG1vZE1hcFt0XS5uZXdUcmFuc2l0aW9uO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLnB1c2godHJhbnNpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJhbnNmb3JtIGFuIGFycmF5IG9mIHRyYW5zaXRpb25zIGludG8gYW4gYXJyYXkgb2YgdHJhbnNpdGlvbnMgYW5kIGhvdyBtYW55IHRpbWVzXG4gICAgICogdGhleSBhcmUgcmVwZWF0ZWQgY29uc2VjdXRpdmVseS5cbiAgICAgKlxuICAgICAqIEFuIGFycmF5IG9mIDEyMyBcImpvaW5lZF9hbmRfbGVmdFwiIHRyYW5zaXRpb25zLCB3b3VsZCByZXN1bHQgaW46XG4gICAgICogYGBgXG4gICAgICogW3tcbiAgICAgKiAgIHRyYW5zaXRpb25UeXBlOiBcImpvaW5lZF9hbmRfbGVmdFwiXG4gICAgICogICByZXBlYXRzOiAxMjNcbiAgICAgKiB9XVxuICAgICAqIGBgYFxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHRyYW5zaXRpb25zIHRoZSBhcnJheSBvZiB0cmFuc2l0aW9ucyB0byB0cmFuc2Zvcm0uXG4gICAgICogQHJldHVybnMge29iamVjdFtdfSBhbiBhcnJheSBvZiBjb2FsZXNjZWQgdHJhbnNpdGlvbnMuXG4gICAgICovXG4gICAgX2NvYWxlc2NlUmVwZWF0ZWRUcmFuc2l0aW9uczogZnVuY3Rpb24odHJhbnNpdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHJhbnNpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMCAmJiByZXNbcmVzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb25UeXBlID09PSB0cmFuc2l0aW9uc1tpXSkge1xuICAgICAgICAgICAgICAgIHJlc1tyZXMubGVuZ3RoIC0gMV0ucmVwZWF0cyArPSAxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25UeXBlOiB0cmFuc2l0aW9uc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgcmVwZWF0czogMSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGb3IgYSBjZXJ0YWluIHRyYW5zaXRpb24sIHQsIGRlc2NyaWJlIHdoYXQgaGFwcGVuZWQgdG8gdGhlIHVzZXJzIHRoYXRcbiAgICAgKiB1bmRlcndlbnQgdGhlIHRyYW5zaXRpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHQgdGhlIHRyYW5zaXRpb24gdHlwZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdXNlckNvdW50IG51bWJlciBvZiB1c2VybmFtZXNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmVwZWF0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSB0cmFuc2l0aW9uIHdhcyByZXBlYXRlZCBpbiBhIHJvdy5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgd3JpdHRlbiBIdW1hbiBSZWFkYWJsZSBlcXVpdmFsZW50IG9mIHRoZSB0cmFuc2l0aW9uLlxuICAgICAqL1xuICAgIF9nZXREZXNjcmlwdGlvbkZvclRyYW5zaXRpb24odCwgdXNlckNvdW50LCByZXBlYXRzKSB7XG4gICAgICAgIC8vIFRoZSBlbXB0eSBpbnRlcnBvbGF0aW9ucyAnc2V2ZXJhbFVzZXJzJyBhbmQgJ29uZVVzZXInXG4gICAgICAgIC8vIGFyZSB0aGVyZSBvbmx5IHRvIHNob3cgdHJhbnNsYXRvcnMgdG8gbm9uLUVuZ2xpc2ggbGFuZ3VhZ2VzXG4gICAgICAgIC8vIHRoYXQgdGhlIHZlcmIgaXMgY29uanVnYXRlZCB0byBwbHVyYWwgb3Igc2luZ3VsYXIgU3ViamVjdC5cbiAgICAgICAgbGV0IHJlcyA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAodCkge1xuICAgICAgICAgICAgY2FzZSBcImpvaW5lZFwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwiJShzZXZlcmFsVXNlcnMpc2pvaW5lZCAlKGNvdW50KXMgdGltZXNcIiwgeyBzZXZlcmFsVXNlcnM6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCIlKG9uZVVzZXIpc2pvaW5lZCAlKGNvdW50KXMgdGltZXNcIiwgeyBvbmVVc2VyOiBcIlwiLCBjb3VudDogcmVwZWF0cyB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICAgICAgICAgICAgcmVzID0gKHVzZXJDb3VudCA+IDEpXG4gICAgICAgICAgICAgICAgICAgID8gX3QoXCIlKHNldmVyYWxVc2VycylzbGVmdCAlKGNvdW50KXMgdGltZXNcIiwgeyBzZXZlcmFsVXNlcnM6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCIlKG9uZVVzZXIpc2xlZnQgJShjb3VudClzIHRpbWVzXCIsIHsgb25lVXNlcjogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiam9pbmVkX2FuZF9sZWZ0XCI6XG4gICAgICAgICAgICAgICAgcmVzID0gKHVzZXJDb3VudCA+IDEpXG4gICAgICAgICAgICAgICAgICAgID8gX3QoXCIlKHNldmVyYWxVc2Vycylzam9pbmVkIGFuZCBsZWZ0ICUoY291bnQpcyB0aW1lc1wiLCB7IHNldmVyYWxVc2VyczogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSlcbiAgICAgICAgICAgICAgICAgICAgOiBfdChcIiUob25lVXNlcilzam9pbmVkIGFuZCBsZWZ0ICUoY291bnQpcyB0aW1lc1wiLCB7IG9uZVVzZXI6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImxlZnRfYW5kX2pvaW5lZFwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwiJShzZXZlcmFsVXNlcnMpc2xlZnQgYW5kIHJlam9pbmVkICUoY291bnQpcyB0aW1lc1wiLCB7IHNldmVyYWxVc2VyczogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSlcbiAgICAgICAgICAgICAgICAgICAgOiBfdChcIiUob25lVXNlcilzbGVmdCBhbmQgcmVqb2luZWQgJShjb3VudClzIHRpbWVzXCIsIHsgb25lVXNlcjogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW52aXRlX3JlamVjdFwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwiJShzZXZlcmFsVXNlcnMpc3JlamVjdGVkIHRoZWlyIGludml0YXRpb25zICUoY291bnQpcyB0aW1lc1wiLCB7IHNldmVyYWxVc2VyczogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSlcbiAgICAgICAgICAgICAgICAgICAgOiBfdChcIiUob25lVXNlcilzcmVqZWN0ZWQgdGhlaXIgaW52aXRhdGlvbiAlKGNvdW50KXMgdGltZXNcIiwgeyBvbmVVc2VyOiBcIlwiLCBjb3VudDogcmVwZWF0cyB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpbnZpdGVfd2l0aGRyYXdhbFwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwiJShzZXZlcmFsVXNlcnMpc2hhZCB0aGVpciBpbnZpdGF0aW9ucyB3aXRoZHJhd24gJShjb3VudClzIHRpbWVzXCIsIHsgc2V2ZXJhbFVzZXJzOiBcIlwiLCBjb3VudDogcmVwZWF0cyB9KVxuICAgICAgICAgICAgICAgICAgICA6IF90KFwiJShvbmVVc2VyKXNoYWQgdGhlaXIgaW52aXRhdGlvbiB3aXRoZHJhd24gJShjb3VudClzIHRpbWVzXCIsIHsgb25lVXNlcjogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW52aXRlZFwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwid2VyZSBpbnZpdGVkICUoY291bnQpcyB0aW1lc1wiLCB7IGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCJ3YXMgaW52aXRlZCAlKGNvdW50KXMgdGltZXNcIiwgeyBjb3VudDogcmVwZWF0cyB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJiYW5uZWRcIjpcbiAgICAgICAgICAgICAgICByZXMgPSAodXNlckNvdW50ID4gMSlcbiAgICAgICAgICAgICAgICAgICAgPyBfdChcIndlcmUgYmFubmVkICUoY291bnQpcyB0aW1lc1wiLCB7IGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCJ3YXMgYmFubmVkICUoY291bnQpcyB0aW1lc1wiLCB7IGNvdW50OiByZXBlYXRzIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVuYmFubmVkXCI6XG4gICAgICAgICAgICAgICAgcmVzID0gKHVzZXJDb3VudCA+IDEpXG4gICAgICAgICAgICAgICAgICAgID8gX3QoXCJ3ZXJlIHVuYmFubmVkICUoY291bnQpcyB0aW1lc1wiLCB7IGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCJ3YXMgdW5iYW5uZWQgJShjb3VudClzIHRpbWVzXCIsIHsgY291bnQ6IHJlcGVhdHMgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwia2lja2VkXCI6XG4gICAgICAgICAgICAgICAgcmVzID0gKHVzZXJDb3VudCA+IDEpXG4gICAgICAgICAgICAgICAgICAgID8gX3QoXCJ3ZXJlIGtpY2tlZCAlKGNvdW50KXMgdGltZXNcIiwgeyBjb3VudDogcmVwZWF0cyB9KVxuICAgICAgICAgICAgICAgICAgICA6IF90KFwid2FzIGtpY2tlZCAlKGNvdW50KXMgdGltZXNcIiwgeyBjb3VudDogcmVwZWF0cyB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VkX25hbWVcIjpcbiAgICAgICAgICAgICAgICByZXMgPSAodXNlckNvdW50ID4gMSlcbiAgICAgICAgICAgICAgICAgICAgPyBfdChcIiUoc2V2ZXJhbFVzZXJzKXNjaGFuZ2VkIHRoZWlyIG5hbWUgJShjb3VudClzIHRpbWVzXCIsIHsgc2V2ZXJhbFVzZXJzOiBcIlwiLCBjb3VudDogcmVwZWF0cyB9KVxuICAgICAgICAgICAgICAgICAgICA6IF90KFwiJShvbmVVc2VyKXNjaGFuZ2VkIHRoZWlyIG5hbWUgJShjb3VudClzIHRpbWVzXCIsIHsgb25lVXNlcjogXCJcIiwgY291bnQ6IHJlcGVhdHMgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY2hhbmdlZF9hdmF0YXJcIjpcbiAgICAgICAgICAgICAgICByZXMgPSAodXNlckNvdW50ID4gMSlcbiAgICAgICAgICAgICAgICAgICAgPyBfdChcIiUoc2V2ZXJhbFVzZXJzKXNjaGFuZ2VkIHRoZWlyIGF2YXRhciAlKGNvdW50KXMgdGltZXNcIiwgeyBzZXZlcmFsVXNlcnM6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCIlKG9uZVVzZXIpc2NoYW5nZWQgdGhlaXIgYXZhdGFyICUoY291bnQpcyB0aW1lc1wiLCB7IG9uZVVzZXI6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm5vX2NoYW5nZVwiOlxuICAgICAgICAgICAgICAgIHJlcyA9ICh1c2VyQ291bnQgPiAxKVxuICAgICAgICAgICAgICAgICAgICA/IF90KFwiJShzZXZlcmFsVXNlcnMpc21hZGUgbm8gY2hhbmdlcyAlKGNvdW50KXMgdGltZXNcIiwgeyBzZXZlcmFsVXNlcnM6IFwiXCIsIGNvdW50OiByZXBlYXRzIH0pXG4gICAgICAgICAgICAgICAgICAgIDogX3QoXCIlKG9uZVVzZXIpc21hZGUgbm8gY2hhbmdlcyAlKGNvdW50KXMgdGltZXNcIiwgeyBvbmVVc2VyOiBcIlwiLCBjb3VudDogcmVwZWF0cyB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIF9nZXRUcmFuc2l0aW9uU2VxdWVuY2U6IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgICAgICByZXR1cm4gZXZlbnRzLm1hcCh0aGlzLl9nZXRUcmFuc2l0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTGFiZWwgYSBnaXZlbiBtZW1iZXJzaGlwIGV2ZW50LCBgZWAsIHdoZXJlIGBnZXRDb250ZW50KCkubWVtYmVyc2hpcGAgaGFzXG4gICAgICogY2hhbmdlZCBmb3IgZWFjaCB0cmFuc2l0aW9uIGFsbG93ZWQgYnkgdGhlIE1hdHJpeCBwcm90b2NvbC4gVGhpcyBhdHRlbXB0cyB0b1xuICAgICAqIGxhYmVsIHRoZSBtZW1iZXJzaGlwIGNoYW5nZXMgdGhhdCBvY2N1ciBpbiBgLi4vLi4vLi4vVGV4dEZvckV2ZW50LmpzYC5cbiAgICAgKiBAcGFyYW0ge01hdHJpeEV2ZW50fSBlIHRoZSBtZW1iZXJzaGlwIGNoYW5nZSBldmVudCB0byBsYWJlbC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nP30gdGhlIHRyYW5zaXRpb24gdHlwZSBnaXZlbiB0byB0aGlzIGV2ZW50LiBUaGlzIGRlZmF1bHRzIHRvIGBudWxsYFxuICAgICAqIGlmIGEgdHJhbnNpdGlvbiBpcyBub3QgcmVjb2duaXNlZC5cbiAgICAgKi9cbiAgICBfZ2V0VHJhbnNpdGlvbjogZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS5teEV2ZW50LmdldFR5cGUoKSA9PT0gJ20ucm9vbS50aGlyZF9wYXJ0eV9pbnZpdGUnKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGUgM3BpZCBpbnZpdGVzIHRoZSBzYW1lIGFzIGludml0ZXMgc28gdGhleSBnZXQgYnVuZGxlZCB0b2dldGhlclxuICAgICAgICAgICAgcmV0dXJuICdpbnZpdGVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoZS5teEV2ZW50LmdldENvbnRlbnQoKS5tZW1iZXJzaGlwKSB7XG4gICAgICAgICAgICBjYXNlICdpbnZpdGUnOiByZXR1cm4gJ2ludml0ZWQnO1xuICAgICAgICAgICAgY2FzZSAnYmFuJzogcmV0dXJuICdiYW5uZWQnO1xuICAgICAgICAgICAgY2FzZSAnam9pbic6XG4gICAgICAgICAgICAgICAgaWYgKGUubXhFdmVudC5nZXRQcmV2Q29udGVudCgpLm1lbWJlcnNoaXAgPT09ICdqb2luJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5teEV2ZW50LmdldENvbnRlbnQoKS5kaXNwbGF5bmFtZSAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGUubXhFdmVudC5nZXRQcmV2Q29udGVudCgpLmRpc3BsYXluYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2NoYW5nZWRfbmFtZSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZS5teEV2ZW50LmdldENvbnRlbnQoKS5hdmF0YXJfdXJsICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgZS5teEV2ZW50LmdldFByZXZDb250ZW50KCkuYXZhdGFyX3VybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdjaGFuZ2VkX2F2YXRhcic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJNRUxTIGlnbm9yaW5nIGR1cGxpY2F0ZSBtZW1iZXJzaGlwIGpvaW4gZXZlbnRcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbm9fY2hhbmdlJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2pvaW5lZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnbGVhdmUnOlxuICAgICAgICAgICAgICAgIGlmIChlLm14RXZlbnQuZ2V0U2VuZGVyKCkgPT09IGUubXhFdmVudC5nZXRTdGF0ZUtleSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZS5teEV2ZW50LmdldFByZXZDb250ZW50KCkubWVtYmVyc2hpcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW52aXRlJzogcmV0dXJuICdpbnZpdGVfcmVqZWN0JztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiAnbGVmdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoIChlLm14RXZlbnQuZ2V0UHJldkNvbnRlbnQoKS5tZW1iZXJzaGlwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ludml0ZSc6IHJldHVybiAnaW52aXRlX3dpdGhkcmF3YWwnO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdiYW4nOiByZXR1cm4gJ3VuYmFubmVkJztcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VuZGVyIGlzIG5vdCB0YXJnZXQgYW5kIG1hZGUgdGhlIHRhcmdldCBsZWF2ZSwgaWYgbm90IGZyb20gaW52aXRlL2JhbiB0aGVuIHRoaXMgaXMgYSBraWNrXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiAna2lja2VkJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZ2V0QWdncmVnYXRlOiBmdW5jdGlvbih1c2VyRXZlbnRzKSB7XG4gICAgICAgIC8vIEEgbWFwIG9mIGFnZ3JlZ2F0ZSB0eXBlIHRvIGFycmF5cyBvZiBkaXNwbGF5IG5hbWVzLiBFYWNoIGFnZ3JlZ2F0ZSB0eXBlXG4gICAgICAgIC8vIGlzIGEgY29tbWEtZGVsaW1pdGVkIHN0cmluZyBvZiB0cmFuc2l0aW9ucywgZS5nLiBcImpvaW5lZCxsZWZ0LGtpY2tlZFwiLlxuICAgICAgICAvLyBUaGUgYXJyYXkgb2YgZGlzcGxheSBuYW1lcyBpcyB0aGUgYXJyYXkgb2YgdXNlcnMgd2hvIHdlbnQgdGhyb3VnaCB0aGF0XG4gICAgICAgIC8vIHNlcXVlbmNlIGR1cmluZyBldmVudHNUb1JlbmRlci5cbiAgICAgICAgY29uc3QgYWdncmVnYXRlID0ge1xuICAgICAgICAgICAgLy8gJGFnZ3JlZ2F0ZVR5cGUgOiBbXTpzdHJpbmdcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQSBtYXAgb2YgYWdncmVnYXRlIHR5cGVzIHRvIHRoZSBpbmRpY2VzIHRoYXQgb3JkZXIgdGhlbSAodGhlIGluZGV4IG9mXG4gICAgICAgIC8vIHRoZSBmaXJzdCBldmVudCBmb3IgYSBnaXZlbiB0cmFuc2l0aW9uIHNlcXVlbmNlKVxuICAgICAgICBjb25zdCBhZ2dyZWdhdGVJbmRpY2VzID0ge1xuICAgICAgICAgICAgLy8gJGFnZ3JlZ2F0ZVR5cGUgOiBpbnRcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB1c2VycyA9IE9iamVjdC5rZXlzKHVzZXJFdmVudHMpO1xuICAgICAgICB1c2Vycy5mb3JFYWNoKFxuICAgICAgICAgICAgKHVzZXJJZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0RXZlbnQgPSB1c2VyRXZlbnRzW3VzZXJJZF1bMF07XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWUgPSBmaXJzdEV2ZW50LmRpc3BsYXlOYW1lO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VxID0gdGhpcy5fZ2V0VHJhbnNpdGlvblNlcXVlbmNlKHVzZXJFdmVudHNbdXNlcklkXSk7XG4gICAgICAgICAgICAgICAgaWYgKCFhZ2dyZWdhdGVbc2VxXSkge1xuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVbc2VxXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVJbmRpY2VzW3NlcV0gPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhZ2dyZWdhdGVbc2VxXS5wdXNoKGRpc3BsYXlOYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmIChhZ2dyZWdhdGVJbmRpY2VzW3NlcV0gPT09IC0xIHx8XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0RXZlbnQuaW5kZXggPCBhZ2dyZWdhdGVJbmRpY2VzW3NlcV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUluZGljZXNbc2VxXSA9IGZpcnN0RXZlbnQuaW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZXM6IGFnZ3JlZ2F0ZSxcbiAgICAgICAgICAgIGluZGljZXM6IGFnZ3JlZ2F0ZUluZGljZXMsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50c1RvUmVuZGVyID0gdGhpcy5wcm9wcy5ldmVudHM7XG5cbiAgICAgICAgLy8gTWFwIHVzZXIgSURzIHRvIGFuIGFycmF5IG9mIG9iamVjdHM6XG4gICAgICAgIGNvbnN0IHVzZXJFdmVudHMgPSB7XG4gICAgICAgICAgICAvLyAkdXNlcklkIDogW3tcbiAgICAgICAgICAgIC8vICAgICAvLyBUaGUgb3JpZ2luYWwgZXZlbnRcbiAgICAgICAgICAgIC8vICAgICBteEV2ZW50OiBlLFxuICAgICAgICAgICAgLy8gICAgIC8vIFRoZSBkaXNwbGF5IG5hbWUgb2YgdGhlIHVzZXIgKGlmIG5vdCwgdGhlbiB1c2VyIElEKVxuICAgICAgICAgICAgLy8gICAgIGRpc3BsYXlOYW1lOiBlLnRhcmdldC5uYW1lIHx8IHVzZXJJZCxcbiAgICAgICAgICAgIC8vICAgICAvLyBUaGUgb3JpZ2luYWwgaW5kZXggb2YgdGhlIGV2ZW50IGluIHRoaXMucHJvcHMuZXZlbnRzXG4gICAgICAgICAgICAvLyAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgLy8gfV1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBhdmF0YXJNZW1iZXJzID0gW107XG4gICAgICAgIGV2ZW50c1RvUmVuZGVyLmZvckVhY2goKGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1c2VySWQgPSBlLmdldFN0YXRlS2V5KCk7XG4gICAgICAgICAgICAvLyBJbml0aWFsaXNlIGEgdXNlcidzIGV2ZW50c1xuICAgICAgICAgICAgaWYgKCF1c2VyRXZlbnRzW3VzZXJJZF0pIHtcbiAgICAgICAgICAgICAgICB1c2VyRXZlbnRzW3VzZXJJZF0gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQpIGF2YXRhck1lbWJlcnMucHVzaChlLnRhcmdldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBkaXNwbGF5TmFtZSA9IHVzZXJJZDtcbiAgICAgICAgICAgIGlmIChlLmdldFR5cGUoKSA9PT0gJ20ucm9vbS50aGlyZF9wYXJ0eV9pbnZpdGUnKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBlLmdldENvbnRlbnQoKS5kaXNwbGF5X25hbWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBlLnRhcmdldC5uYW1lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB1c2VyRXZlbnRzW3VzZXJJZF0ucHVzaCh7XG4gICAgICAgICAgICAgICAgbXhFdmVudDogZSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgYWdncmVnYXRlID0gdGhpcy5fZ2V0QWdncmVnYXRlKHVzZXJFdmVudHMpO1xuXG4gICAgICAgIC8vIFNvcnQgdHlwZXMgYnkgb3JkZXIgb2YgbG93ZXN0IGV2ZW50IGluZGV4IHdpdGhpbiBzZXF1ZW5jZVxuICAgICAgICBjb25zdCBvcmRlcmVkVHJhbnNpdGlvblNlcXVlbmNlcyA9IE9iamVjdC5rZXlzKGFnZ3JlZ2F0ZS5uYW1lcykuc29ydChcbiAgICAgICAgICAgIChzZXExLCBzZXEyKSA9PiBhZ2dyZWdhdGUuaW5kaWNlc1tzZXExXSA+IGFnZ3JlZ2F0ZS5pbmRpY2VzW3NlcTJdLFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IEV2ZW50TGlzdFN1bW1hcnkgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZWxlbWVudHMuRXZlbnRMaXN0U3VtbWFyeVwiKTtcbiAgICAgICAgcmV0dXJuIDxFdmVudExpc3RTdW1tYXJ5XG4gICAgICAgICAgICBldmVudHM9e3RoaXMucHJvcHMuZXZlbnRzfVxuICAgICAgICAgICAgdGhyZXNob2xkPXt0aGlzLnByb3BzLnRocmVzaG9sZH1cbiAgICAgICAgICAgIG9uVG9nZ2xlPXt0aGlzLnByb3BzLm9uVG9nZ2xlfVxuICAgICAgICAgICAgc3RhcnRFeHBhbmRlZD17dGhpcy5wcm9wcy5zdGFydEV4cGFuZGVkfVxuICAgICAgICAgICAgY2hpbGRyZW49e3RoaXMucHJvcHMuY2hpbGRyZW59XG4gICAgICAgICAgICBzdW1tYXJ5TWVtYmVycz17YXZhdGFyTWVtYmVyc31cbiAgICAgICAgICAgIHN1bW1hcnlUZXh0PXt0aGlzLl9nZW5lcmF0ZVN1bW1hcnkoYWdncmVnYXRlLm5hbWVzLCBvcmRlcmVkVHJhbnNpdGlvblNlcXVlbmNlcyl9IC8+O1xuICAgIH0sXG59KTtcbiJdfQ==