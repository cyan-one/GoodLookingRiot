"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _SyntaxHighlight = _interopRequireDefault(require("../elements/SyntaxHighlight"));

var _languageHandler = require("../../../languageHandler");

var _matrixJsSdk = require("matrix-js-sdk");

var _Field = _interopRequireDefault(require("../elements/Field"));

var _MatrixClientContext = _interopRequireDefault(require("../../../contexts/MatrixClientContext"));

var _useEventEmitter = require("../../../hooks/useEventEmitter");

var _VerificationRequest = require("matrix-js-sdk/src/crypto/verification/request/VerificationRequest");

/*
Copyright 2017 Michael Telatynski <7t3chguy@gmail.com>

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
class GenericEditor extends _react.default.PureComponent {
  // static propTypes = {onBack: PropTypes.func.isRequired};
  constructor(props) {
    super(props);
    this._onChange = this._onChange.bind(this);
    this.onBack = this.onBack.bind(this);
  }

  onBack() {
    if (this.state.message) {
      this.setState({
        message: null
      });
    } else {
      this.props.onBack();
    }
  }

  _onChange(e) {
    this.setState({
      [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  }

  _buttons() {
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onBack
    }, (0, _languageHandler._t)('Back')), !this.state.message && /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._send
    }, (0, _languageHandler._t)('Send')));
  }

  textInput(id, label) {
    return /*#__PURE__*/_react.default.createElement(_Field.default, {
      id: id,
      label: label,
      size: "42",
      autoFocus: true,
      type: "text",
      autoComplete: "on",
      value: this.state[id],
      onChange: this._onChange
    });
  }

}

class SendCustomEvent extends GenericEditor {
  static getLabel() {
    return (0, _languageHandler._t)('Send Custom Event');
  }

  constructor(props) {
    super(props);
    this._send = this._send.bind(this);
    const {
      eventType,
      stateKey,
      evContent
    } = Object.assign({
      eventType: '',
      stateKey: '',
      evContent: '{\n\n}'
    }, this.props.inputs);
    this.state = {
      isStateEvent: Boolean(this.props.forceStateEvent),
      eventType,
      stateKey,
      evContent
    };
  }

  send(content) {
    const cli = this.context;

    if (this.state.isStateEvent) {
      return cli.sendStateEvent(this.props.room.roomId, this.state.eventType, content, this.state.stateKey);
    } else {
      return cli.sendEvent(this.props.room.roomId, this.state.eventType, content);
    }
  }

  async _send() {
    if (this.state.eventType === '') {
      this.setState({
        message: (0, _languageHandler._t)('You must specify an event type!')
      });
      return;
    }

    let message;

    try {
      const content = JSON.parse(this.state.evContent);
      await this.send(content);
      message = (0, _languageHandler._t)('Event sent!');
    } catch (e) {
      message = (0, _languageHandler._t)('Failed to send custom event.') + ' (' + e.toString() + ')';
    }

    this.setState({
      message
    });
  }

  render() {
    if (this.state.message) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_content"
      }, this.state.message), this._buttons());
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevTools_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevTools_eventTypeStateKeyGroup"
    }, this.textInput('eventType', (0, _languageHandler._t)('Event Type')), this.state.isStateEvent && this.textInput('stateKey', (0, _languageHandler._t)('State Key'))), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement(_Field.default, {
      id: "evContent",
      label: (0, _languageHandler._t)("Event Content"),
      type: "text",
      className: "mx_DevTools_textarea",
      autoComplete: "off",
      value: this.state.evContent,
      onChange: this._onChange,
      element: "textarea"
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onBack
    }, (0, _languageHandler._t)('Back')), !this.state.message && /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._send
    }, (0, _languageHandler._t)('Send')), !this.state.message && !this.props.forceStateEvent && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        float: "right"
      }
    }, /*#__PURE__*/_react.default.createElement("input", {
      id: "isStateEvent",
      className: "mx_DevTools_tgl mx_DevTools_tgl-flip",
      type: "checkbox",
      onChange: this._onChange,
      checked: this.state.isStateEvent
    }), /*#__PURE__*/_react.default.createElement("label", {
      className: "mx_DevTools_tgl-btn",
      "data-tg-off": "Event",
      "data-tg-on": "State Event",
      htmlFor: "isStateEvent"
    }))));
  }

}

(0, _defineProperty2.default)(SendCustomEvent, "propTypes", {
  onBack: _propTypes.default.func.isRequired,
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired,
  forceStateEvent: _propTypes.default.bool,
  inputs: _propTypes.default.object
});
(0, _defineProperty2.default)(SendCustomEvent, "contextType", _MatrixClientContext.default);

class SendAccountData extends GenericEditor {
  static getLabel() {
    return (0, _languageHandler._t)('Send Account Data');
  }

  constructor(props) {
    super(props);
    this._send = this._send.bind(this);
    const {
      eventType,
      evContent
    } = Object.assign({
      eventType: '',
      evContent: '{\n\n}'
    }, this.props.inputs);
    this.state = {
      isRoomAccountData: Boolean(this.props.isRoomAccountData),
      eventType,
      evContent
    };
  }

  send(content) {
    const cli = this.context;

    if (this.state.isRoomAccountData) {
      return cli.setRoomAccountData(this.props.room.roomId, this.state.eventType, content);
    }

    return cli.setAccountData(this.state.eventType, content);
  }

  async _send() {
    if (this.state.eventType === '') {
      this.setState({
        message: (0, _languageHandler._t)('You must specify an event type!')
      });
      return;
    }

    let message;

    try {
      const content = JSON.parse(this.state.evContent);
      await this.send(content);
      message = (0, _languageHandler._t)('Event sent!');
    } catch (e) {
      message = (0, _languageHandler._t)('Failed to send custom event.') + ' (' + e.toString() + ')';
    }

    this.setState({
      message
    });
  }

  render() {
    if (this.state.message) {
      return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_content"
      }, this.state.message), this._buttons());
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_DevTools_content"
    }, this.textInput('eventType', (0, _languageHandler._t)('Event Type')), /*#__PURE__*/_react.default.createElement("br", null), /*#__PURE__*/_react.default.createElement(_Field.default, {
      id: "evContent",
      label: (0, _languageHandler._t)("Event Content"),
      type: "text",
      className: "mx_DevTools_textarea",
      autoComplete: "off",
      value: this.state.evContent,
      onChange: this._onChange,
      element: "textarea"
    })), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onBack
    }, (0, _languageHandler._t)('Back')), !this.state.message && /*#__PURE__*/_react.default.createElement("button", {
      onClick: this._send
    }, (0, _languageHandler._t)('Send')), !this.state.message && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        float: "right"
      }
    }, /*#__PURE__*/_react.default.createElement("input", {
      id: "isRoomAccountData",
      className: "mx_DevTools_tgl mx_DevTools_tgl-flip",
      type: "checkbox",
      onChange: this._onChange,
      checked: this.state.isRoomAccountData,
      disabled: this.props.forceMode
    }), /*#__PURE__*/_react.default.createElement("label", {
      className: "mx_DevTools_tgl-btn",
      "data-tg-off": "Account Data",
      "data-tg-on": "Room Data",
      htmlFor: "isRoomAccountData"
    }))));
  }

}

(0, _defineProperty2.default)(SendAccountData, "propTypes", {
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired,
  isRoomAccountData: _propTypes.default.bool,
  forceMode: _propTypes.default.bool,
  inputs: _propTypes.default.object
});
(0, _defineProperty2.default)(SendAccountData, "contextType", _MatrixClientContext.default);
const INITIAL_LOAD_TILES = 20;
const LOAD_TILES_STEP_SIZE = 50;

class FilteredList extends _react.default.PureComponent {
  static filterChildren(children, query) {
    if (!query) return children;
    const lcQuery = query.toLowerCase();
    return children.filter(child => child.key.toLowerCase().includes(lcQuery));
  }

  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "showAll", () => {
      this.setState({
        truncateAt: this.state.truncateAt + LOAD_TILES_STEP_SIZE
      });
    });
    (0, _defineProperty2.default)(this, "createOverflowElement", (overflowCount
    /*: number*/
    , totalCount
    /*: number*/
    ) => {
      return /*#__PURE__*/_react.default.createElement("button", {
        className: "mx_DevTools_RoomStateExplorer_button",
        onClick: this.showAll
      }, (0, _languageHandler._t)("and %(count)s others...", {
        count: overflowCount
      }));
    });
    (0, _defineProperty2.default)(this, "onQuery", ev => {
      if (this.props.onChange) this.props.onChange(ev.target.value);
    });
    (0, _defineProperty2.default)(this, "getChildren", (start
    /*: number*/
    , end
    /*: number*/
    ) => {
      return this.state.filteredChildren.slice(start, end);
    });
    (0, _defineProperty2.default)(this, "getChildCount", () =>
    /*: number*/
    {
      return this.state.filteredChildren.length;
    });
    this.state = {
      filteredChildren: FilteredList.filterChildren(this.props.children, this.props.query),
      truncateAt: INITIAL_LOAD_TILES
    };
  } // TODO: [REACT-WARNING] Replace with appropriate lifecycle event


  UNSAFE_componentWillReceiveProps(nextProps) {
    // eslint-disable-line camelcase
    if (this.props.children === nextProps.children && this.props.query === nextProps.query) return;
    this.setState({
      filteredChildren: FilteredList.filterChildren(nextProps.children, nextProps.query),
      truncateAt: INITIAL_LOAD_TILES
    });
  }

  render() {
    const TruncatedList = sdk.getComponent("elements.TruncatedList");
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_Field.default, {
      label: (0, _languageHandler._t)('Filter results'),
      autoFocus: true,
      size: 64,
      type: "text",
      autoComplete: "off",
      value: this.props.query,
      onChange: this.onQuery,
      className: "mx_TextInputDialog_input mx_DevTools_RoomStateExplorer_query" // force re-render so that autoFocus is applied when this component is re-used
      ,
      key: this.props.children[0] ? this.props.children[0].key : ''
    }), /*#__PURE__*/_react.default.createElement(TruncatedList, {
      getChildren: this.getChildren,
      getChildCount: this.getChildCount,
      truncateAt: this.state.truncateAt,
      createOverflowElement: this.createOverflowElement
    }));
  }

}

(0, _defineProperty2.default)(FilteredList, "propTypes", {
  children: _propTypes.default.any,
  query: _propTypes.default.string,
  onChange: _propTypes.default.func
});

class RoomStateExplorer extends _react.default.PureComponent {
  static getLabel() {
    return (0, _languageHandler._t)('Explore Room State');
  }

  constructor(props) {
    super(props);
    this.roomStateEvents = this.props.room.currentState.events;
    this.onBack = this.onBack.bind(this);
    this.editEv = this.editEv.bind(this);
    this.onQueryEventType = this.onQueryEventType.bind(this);
    this.onQueryStateKey = this.onQueryStateKey.bind(this);
    this.state = {
      eventType: null,
      event: null,
      editing: false,
      queryEventType: '',
      queryStateKey: ''
    };
  }

  browseEventType(eventType) {
    return () => {
      this.setState({
        eventType
      });
    };
  }

  onViewSourceClick(event) {
    return () => {
      this.setState({
        event
      });
    };
  }

  onBack() {
    if (this.state.editing) {
      this.setState({
        editing: false
      });
    } else if (this.state.event) {
      this.setState({
        event: null
      });
    } else if (this.state.eventType) {
      this.setState({
        eventType: null
      });
    } else {
      this.props.onBack();
    }
  }

  editEv() {
    this.setState({
      editing: true
    });
  }

  onQueryEventType(filterEventType) {
    this.setState({
      queryEventType: filterEventType
    });
  }

  onQueryStateKey(filterStateKey) {
    this.setState({
      queryStateKey: filterStateKey
    });
  }

  render() {
    if (this.state.event) {
      if (this.state.editing) {
        return /*#__PURE__*/_react.default.createElement(SendCustomEvent, {
          room: this.props.room,
          forceStateEvent: true,
          onBack: this.onBack,
          inputs: {
            eventType: this.state.event.getType(),
            evContent: JSON.stringify(this.state.event.getContent(), null, '\t'),
            stateKey: this.state.event.getStateKey()
          }
        });
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ViewSource"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_content"
      }, /*#__PURE__*/_react.default.createElement(_SyntaxHighlight.default, {
        className: "json"
      }, JSON.stringify(this.state.event.event, null, 2))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_buttons"
      }, /*#__PURE__*/_react.default.createElement("button", {
        onClick: this.onBack
      }, (0, _languageHandler._t)('Back')), /*#__PURE__*/_react.default.createElement("button", {
        onClick: this.editEv
      }, (0, _languageHandler._t)('Edit'))));
    }

    let list = null;
    const classes = 'mx_DevTools_RoomStateExplorer_button';

    if (this.state.eventType === null) {
      list = /*#__PURE__*/_react.default.createElement(FilteredList, {
        query: this.state.queryEventType,
        onChange: this.onQueryEventType
      }, Object.keys(this.roomStateEvents).map(evType => {
        const stateGroup = this.roomStateEvents[evType];
        const stateKeys = Object.keys(stateGroup);
        let onClickFn;

        if (stateKeys.length === 1 && stateKeys[0] === '') {
          onClickFn = this.onViewSourceClick(stateGroup[stateKeys[0]]);
        } else {
          onClickFn = this.browseEventType(evType);
        }

        return /*#__PURE__*/_react.default.createElement("button", {
          className: classes,
          key: evType,
          onClick: onClickFn
        }, evType);
      }));
    } else {
      const stateGroup = this.roomStateEvents[this.state.eventType];
      list = /*#__PURE__*/_react.default.createElement(FilteredList, {
        query: this.state.queryStateKey,
        onChange: this.onQueryStateKey
      }, Object.keys(stateGroup).map(stateKey => {
        const ev = stateGroup[stateKey];
        return /*#__PURE__*/_react.default.createElement("button", {
          className: classes,
          key: stateKey,
          onClick: this.onViewSourceClick(ev)
        }, stateKey);
      }));
    }

    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, list), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onBack
    }, (0, _languageHandler._t)('Back'))));
  }

}

(0, _defineProperty2.default)(RoomStateExplorer, "propTypes", {
  onBack: _propTypes.default.func.isRequired,
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired
});
(0, _defineProperty2.default)(RoomStateExplorer, "contextType", _MatrixClientContext.default);

class AccountDataExplorer extends _react.default.PureComponent {
  static getLabel() {
    return (0, _languageHandler._t)('Explore Account Data');
  }

  constructor(props) {
    super(props);
    this.onBack = this.onBack.bind(this);
    this.editEv = this.editEv.bind(this);
    this._onChange = this._onChange.bind(this);
    this.onQueryEventType = this.onQueryEventType.bind(this);
    this.state = {
      isRoomAccountData: false,
      event: null,
      editing: false,
      queryEventType: ''
    };
  }

  getData() {
    if (this.state.isRoomAccountData) {
      return this.props.room.accountData;
    }

    return this.context.store.accountData;
  }

  onViewSourceClick(event) {
    return () => {
      this.setState({
        event
      });
    };
  }

  onBack() {
    if (this.state.editing) {
      this.setState({
        editing: false
      });
    } else if (this.state.event) {
      this.setState({
        event: null
      });
    } else {
      this.props.onBack();
    }
  }

  _onChange(e) {
    this.setState({
      [e.target.id]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  }

  editEv() {
    this.setState({
      editing: true
    });
  }

  onQueryEventType(queryEventType) {
    this.setState({
      queryEventType
    });
  }

  render() {
    if (this.state.event) {
      if (this.state.editing) {
        return /*#__PURE__*/_react.default.createElement(SendAccountData, {
          room: this.props.room,
          isRoomAccountData: this.state.isRoomAccountData,
          onBack: this.onBack,
          inputs: {
            eventType: this.state.event.getType(),
            evContent: JSON.stringify(this.state.event.getContent(), null, '\t')
          },
          forceMode: true
        });
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_ViewSource"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_content"
      }, /*#__PURE__*/_react.default.createElement(_SyntaxHighlight.default, {
        className: "json"
      }, JSON.stringify(this.state.event.event, null, 2))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_buttons"
      }, /*#__PURE__*/_react.default.createElement("button", {
        onClick: this.onBack
      }, (0, _languageHandler._t)('Back')), /*#__PURE__*/_react.default.createElement("button", {
        onClick: this.editEv
      }, (0, _languageHandler._t)('Edit'))));
    }

    const rows = [];
    const classes = 'mx_DevTools_RoomStateExplorer_button';
    const data = this.getData();
    Object.keys(data).forEach(evType => {
      const ev = data[evType];
      rows.push( /*#__PURE__*/_react.default.createElement("button", {
        className: classes,
        key: evType,
        onClick: this.onViewSourceClick(ev)
      }, evType));
    });
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement(FilteredList, {
      query: this.state.queryEventType,
      onChange: this.onQueryEventType
    }, rows)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.onBack
    }, (0, _languageHandler._t)('Back')), !this.state.message && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        float: "right"
      }
    }, /*#__PURE__*/_react.default.createElement("input", {
      id: "isRoomAccountData",
      className: "mx_DevTools_tgl mx_DevTools_tgl-flip",
      type: "checkbox",
      onChange: this._onChange,
      checked: this.state.isRoomAccountData
    }), /*#__PURE__*/_react.default.createElement("label", {
      className: "mx_DevTools_tgl-btn",
      "data-tg-off": "Account Data",
      "data-tg-on": "Room Data",
      htmlFor: "isRoomAccountData"
    }))));
  }

}

(0, _defineProperty2.default)(AccountDataExplorer, "propTypes", {
  onBack: _propTypes.default.func.isRequired,
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired
});
(0, _defineProperty2.default)(AccountDataExplorer, "contextType", _MatrixClientContext.default);

class ServersInRoomList extends _react.default.PureComponent {
  static getLabel() {
    return (0, _languageHandler._t)('View Servers in Room');
  }

  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onQuery", query => {
      this.setState({
        query
      });
    });
    const room = this.props.room;
    const servers = new Set();
    room.currentState.getStateEvents("m.room.member").forEach(ev => servers.add(ev.getSender().split(":")[1]));
    this.servers = Array.from(servers).map(s => /*#__PURE__*/_react.default.createElement("button", {
      key: s,
      className: "mx_DevTools_ServersInRoomList_button"
    }, s));
    this.state = {
      query: ''
    };
  }

  render() {
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement(FilteredList, {
      query: this.state.query,
      onChange: this.onQuery
    }, this.servers)), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.props.onBack
    }, (0, _languageHandler._t)('Back'))));
  }

}

(0, _defineProperty2.default)(ServersInRoomList, "propTypes", {
  onBack: _propTypes.default.func.isRequired,
  room: _propTypes.default.instanceOf(_matrixJsSdk.Room).isRequired
});
(0, _defineProperty2.default)(ServersInRoomList, "contextType", _MatrixClientContext.default);
const PHASE_MAP = {
  [_VerificationRequest.PHASE_UNSENT]: "unsent",
  [_VerificationRequest.PHASE_REQUESTED]: "requested",
  [_VerificationRequest.PHASE_READY]: "ready",
  [_VerificationRequest.PHASE_DONE]: "done",
  [_VerificationRequest.PHASE_STARTED]: "started",
  [_VerificationRequest.PHASE_CANCELLED]: "cancelled"
};

function VerificationRequest({
  txnId,
  request
}) {
  const [, updateState] = (0, _react.useState)();
  const [timeout, setRequestTimeout] = (0, _react.useState)(request.timeout);
  /* Re-render if something changes state */

  (0, _useEventEmitter.useEventEmitter)(request, "change", updateState);
  /* Keep re-rendering if there's a timeout */

  (0, _react.useEffect)(() => {
    if (request.timeout == 0) return;
    /* Note that request.timeout is a getter, so its value changes */

    const id = setInterval(() => {
      setRequestTimeout(request.timeout);
    }, 500);
    return () => {
      clearInterval(id);
    };
  }, [request]);
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "mx_DevTools_VerificationRequest"
  }, /*#__PURE__*/_react.default.createElement("dl", null, /*#__PURE__*/_react.default.createElement("dt", null, "Transaction"), /*#__PURE__*/_react.default.createElement("dd", null, txnId), /*#__PURE__*/_react.default.createElement("dt", null, "Phase"), /*#__PURE__*/_react.default.createElement("dd", null, PHASE_MAP[request.phase] || request.phase), /*#__PURE__*/_react.default.createElement("dt", null, "Timeout"), /*#__PURE__*/_react.default.createElement("dd", null, Math.floor(timeout / 1000)), /*#__PURE__*/_react.default.createElement("dt", null, "Methods"), /*#__PURE__*/_react.default.createElement("dd", null, request.methods && request.methods.join(", ")), /*#__PURE__*/_react.default.createElement("dt", null, "requestingUserId"), /*#__PURE__*/_react.default.createElement("dd", null, request.requestingUserId), /*#__PURE__*/_react.default.createElement("dt", null, "observeOnly"), /*#__PURE__*/_react.default.createElement("dd", null, JSON.stringify(request.observeOnly))));
}

class VerificationExplorer extends _react.default.Component {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "onNewRequest", () => {
      this.forceUpdate();
    });
  }

  static getLabel() {
    return (0, _languageHandler._t)("Verification Requests");
  }
  /* Ensure this.context is the cli */


  componentDidMount() {
    const cli = this.context;
    cli.on("crypto.verification.request", this.onNewRequest);
  }

  componentWillUnmount() {
    const cli = this.context;
    cli.off("crypto.verification.request", this.onNewRequest);
  }

  render() {
    const cli = this.context;
    const room = this.props.room;
    const inRoomChannel = cli._crypto._inRoomVerificationRequests;
    const inRoomRequests = (inRoomChannel._requestsByRoomId || new Map()).get(room.roomId) || new Map();
    return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, Array.from(inRoomRequests.entries()).reverse().map(([txnId, request]) => /*#__PURE__*/_react.default.createElement(VerificationRequest, {
      txnId: txnId,
      request: request,
      key: txnId
    }))), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_buttons"
    }, /*#__PURE__*/_react.default.createElement("button", {
      onClick: this.props.onBack
    }, (0, _languageHandler._t)("Back"))));
  }

}

(0, _defineProperty2.default)(VerificationExplorer, "contextType", _MatrixClientContext.default);
const Entries = [SendCustomEvent, RoomStateExplorer, SendAccountData, AccountDataExplorer, ServersInRoomList, VerificationExplorer];

class DevtoolsDialog extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    this.onBack = this.onBack.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.state = {
      mode: null
    };
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  _setMode(mode) {
    return () => {
      this.setState({
        mode
      });
    };
  }

  onBack() {
    if (this.prevMode) {
      this.setState({
        mode: this.prevMode
      });
      this.prevMode = null;
    } else {
      this.setState({
        mode: null
      });
    }
  }

  onCancel() {
    this.props.onFinished(false);
  }

  render() {
    let body;

    if (this.state.mode) {
      body = /*#__PURE__*/_react.default.createElement(_MatrixClientContext.default.Consumer, null, cli => /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_left"
      }, this.state.mode.getLabel()), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_right"
      }, "Room ID: ", this.props.roomId), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_bottom"
      }), /*#__PURE__*/_react.default.createElement(this.state.mode, {
        onBack: this.onBack,
        room: cli.getRoom(this.props.roomId)
      })));
    } else {
      const classes = "mx_DevTools_RoomStateExplorer_button";
      body = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_left"
      }, (0, _languageHandler._t)('Toolbox')), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_right"
      }, "Room ID: ", this.props.roomId), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_DevTools_label_bottom"
      }), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_content"
      }, Entries.map(Entry => {
        const label = Entry.getLabel();

        const onClick = this._setMode(Entry);

        return /*#__PURE__*/_react.default.createElement("button", {
          className: classes,
          key: label,
          onClick: onClick
        }, label);
      }))), /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_Dialog_buttons"
      }, /*#__PURE__*/_react.default.createElement("button", {
        onClick: this.onCancel
      }, (0, _languageHandler._t)('Cancel'))));
    }

    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_QuestionDialog",
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)('Developer Tools')
    }, body);
  }

}

exports.default = DevtoolsDialog;
(0, _defineProperty2.default)(DevtoolsDialog, "propTypes", {
  roomId: _propTypes.default.string.isRequired,
  onFinished: _propTypes.default.func.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvRGV2dG9vbHNEaWFsb2cuanMiXSwibmFtZXMiOlsiR2VuZXJpY0VkaXRvciIsIlJlYWN0IiwiUHVyZUNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfb25DaGFuZ2UiLCJiaW5kIiwib25CYWNrIiwic3RhdGUiLCJtZXNzYWdlIiwic2V0U3RhdGUiLCJlIiwidGFyZ2V0IiwiaWQiLCJ0eXBlIiwiY2hlY2tlZCIsInZhbHVlIiwiX2J1dHRvbnMiLCJfc2VuZCIsInRleHRJbnB1dCIsImxhYmVsIiwiU2VuZEN1c3RvbUV2ZW50IiwiZ2V0TGFiZWwiLCJldmVudFR5cGUiLCJzdGF0ZUtleSIsImV2Q29udGVudCIsIk9iamVjdCIsImFzc2lnbiIsImlucHV0cyIsImlzU3RhdGVFdmVudCIsIkJvb2xlYW4iLCJmb3JjZVN0YXRlRXZlbnQiLCJzZW5kIiwiY29udGVudCIsImNsaSIsImNvbnRleHQiLCJzZW5kU3RhdGVFdmVudCIsInJvb20iLCJyb29tSWQiLCJzZW5kRXZlbnQiLCJKU09OIiwicGFyc2UiLCJ0b1N0cmluZyIsInJlbmRlciIsImZsb2F0IiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJpbnN0YW5jZU9mIiwiUm9vbSIsImJvb2wiLCJvYmplY3QiLCJNYXRyaXhDbGllbnRDb250ZXh0IiwiU2VuZEFjY291bnREYXRhIiwiaXNSb29tQWNjb3VudERhdGEiLCJzZXRSb29tQWNjb3VudERhdGEiLCJzZXRBY2NvdW50RGF0YSIsImZvcmNlTW9kZSIsIklOSVRJQUxfTE9BRF9USUxFUyIsIkxPQURfVElMRVNfU1RFUF9TSVpFIiwiRmlsdGVyZWRMaXN0IiwiZmlsdGVyQ2hpbGRyZW4iLCJjaGlsZHJlbiIsInF1ZXJ5IiwibGNRdWVyeSIsInRvTG93ZXJDYXNlIiwiZmlsdGVyIiwiY2hpbGQiLCJrZXkiLCJpbmNsdWRlcyIsInRydW5jYXRlQXQiLCJvdmVyZmxvd0NvdW50IiwidG90YWxDb3VudCIsInNob3dBbGwiLCJjb3VudCIsImV2Iiwib25DaGFuZ2UiLCJzdGFydCIsImVuZCIsImZpbHRlcmVkQ2hpbGRyZW4iLCJzbGljZSIsImxlbmd0aCIsIlVOU0FGRV9jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwibmV4dFByb3BzIiwiVHJ1bmNhdGVkTGlzdCIsInNkayIsImdldENvbXBvbmVudCIsIm9uUXVlcnkiLCJnZXRDaGlsZHJlbiIsImdldENoaWxkQ291bnQiLCJjcmVhdGVPdmVyZmxvd0VsZW1lbnQiLCJhbnkiLCJzdHJpbmciLCJSb29tU3RhdGVFeHBsb3JlciIsInJvb21TdGF0ZUV2ZW50cyIsImN1cnJlbnRTdGF0ZSIsImV2ZW50cyIsImVkaXRFdiIsIm9uUXVlcnlFdmVudFR5cGUiLCJvblF1ZXJ5U3RhdGVLZXkiLCJldmVudCIsImVkaXRpbmciLCJxdWVyeUV2ZW50VHlwZSIsInF1ZXJ5U3RhdGVLZXkiLCJicm93c2VFdmVudFR5cGUiLCJvblZpZXdTb3VyY2VDbGljayIsImZpbHRlckV2ZW50VHlwZSIsImZpbHRlclN0YXRlS2V5IiwiZ2V0VHlwZSIsInN0cmluZ2lmeSIsImdldENvbnRlbnQiLCJnZXRTdGF0ZUtleSIsImxpc3QiLCJjbGFzc2VzIiwia2V5cyIsIm1hcCIsImV2VHlwZSIsInN0YXRlR3JvdXAiLCJzdGF0ZUtleXMiLCJvbkNsaWNrRm4iLCJBY2NvdW50RGF0YUV4cGxvcmVyIiwiZ2V0RGF0YSIsImFjY291bnREYXRhIiwic3RvcmUiLCJyb3dzIiwiZGF0YSIsImZvckVhY2giLCJwdXNoIiwiU2VydmVyc0luUm9vbUxpc3QiLCJzZXJ2ZXJzIiwiU2V0IiwiZ2V0U3RhdGVFdmVudHMiLCJhZGQiLCJnZXRTZW5kZXIiLCJzcGxpdCIsIkFycmF5IiwiZnJvbSIsInMiLCJQSEFTRV9NQVAiLCJQSEFTRV9VTlNFTlQiLCJQSEFTRV9SRVFVRVNURUQiLCJQSEFTRV9SRUFEWSIsIlBIQVNFX0RPTkUiLCJQSEFTRV9TVEFSVEVEIiwiUEhBU0VfQ0FOQ0VMTEVEIiwiVmVyaWZpY2F0aW9uUmVxdWVzdCIsInR4bklkIiwicmVxdWVzdCIsInVwZGF0ZVN0YXRlIiwidGltZW91dCIsInNldFJlcXVlc3RUaW1lb3V0Iiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwicGhhc2UiLCJNYXRoIiwiZmxvb3IiLCJtZXRob2RzIiwiam9pbiIsInJlcXVlc3RpbmdVc2VySWQiLCJvYnNlcnZlT25seSIsIlZlcmlmaWNhdGlvbkV4cGxvcmVyIiwiQ29tcG9uZW50IiwiZm9yY2VVcGRhdGUiLCJjb21wb25lbnREaWRNb3VudCIsIm9uIiwib25OZXdSZXF1ZXN0IiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJvZmYiLCJpblJvb21DaGFubmVsIiwiX2NyeXB0byIsIl9pblJvb21WZXJpZmljYXRpb25SZXF1ZXN0cyIsImluUm9vbVJlcXVlc3RzIiwiX3JlcXVlc3RzQnlSb29tSWQiLCJNYXAiLCJnZXQiLCJlbnRyaWVzIiwicmV2ZXJzZSIsIkVudHJpZXMiLCJEZXZ0b29sc0RpYWxvZyIsIm9uQ2FuY2VsIiwibW9kZSIsIl91bm1vdW50ZWQiLCJfc2V0TW9kZSIsInByZXZNb2RlIiwib25GaW5pc2hlZCIsImJvZHkiLCJnZXRSb29tIiwiRW50cnkiLCJvbkNsaWNrIiwiQmFzZURpYWxvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUExQkE7Ozs7Ozs7Ozs7Ozs7OztBQW1DQSxNQUFNQSxhQUFOLFNBQTRCQyxlQUFNQyxhQUFsQyxDQUFnRDtBQUM1QztBQUVBQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBUTtBQUNmLFVBQU1BLEtBQU47QUFDQSxTQUFLQyxTQUFMLEdBQWlCLEtBQUtBLFNBQUwsQ0FBZUMsSUFBZixDQUFvQixJQUFwQixDQUFqQjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxLQUFLQSxNQUFMLENBQVlELElBQVosQ0FB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Ozs7OEJBQTNDUCxjLGVBQ0U7QUFDZjVJLEVBQUFBLE1BQU0sRUFBRU8sbUJBQVUrQyxNQUFWLENBQWlCN0MsVUFEVjtBQUVmeUksRUFBQUEsVUFBVSxFQUFFM0ksbUJBQVVDLElBQVYsQ0FBZUM7QUFGWixDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE3IE1pY2hhZWwgVGVsYXR5bnNraSA8N3QzY2hndXlAZ21haWwuY29tPlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBSZWFjdCwge3VzZVN0YXRlLCB1c2VFZmZlY3R9IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IFN5bnRheEhpZ2hsaWdodCBmcm9tICcuLi9lbGVtZW50cy9TeW50YXhIaWdobGlnaHQnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgUm9vbSB9IGZyb20gXCJtYXRyaXgtanMtc2RrXCI7XG5pbXBvcnQgRmllbGQgZnJvbSBcIi4uL2VsZW1lbnRzL0ZpZWxkXCI7XG5pbXBvcnQgTWF0cml4Q2xpZW50Q29udGV4dCBmcm9tIFwiLi4vLi4vLi4vY29udGV4dHMvTWF0cml4Q2xpZW50Q29udGV4dFwiO1xuaW1wb3J0IHt1c2VFdmVudEVtaXR0ZXJ9IGZyb20gXCIuLi8uLi8uLi9ob29rcy91c2VFdmVudEVtaXR0ZXJcIjtcblxuaW1wb3J0IHtcbiAgICBQSEFTRV9VTlNFTlQsXG4gICAgUEhBU0VfUkVRVUVTVEVELFxuICAgIFBIQVNFX1JFQURZLFxuICAgIFBIQVNFX0RPTkUsXG4gICAgUEhBU0VfU1RBUlRFRCxcbiAgICBQSEFTRV9DQU5DRUxMRUQsXG59IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9jcnlwdG8vdmVyaWZpY2F0aW9uL3JlcXVlc3QvVmVyaWZpY2F0aW9uUmVxdWVzdFwiO1xuXG5jbGFzcyBHZW5lcmljRWRpdG9yIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgLy8gc3RhdGljIHByb3BUeXBlcyA9IHtvbkJhY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWR9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLl9vbkNoYW5nZSA9IHRoaXMuX29uQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25CYWNrID0gdGhpcy5vbkJhY2suYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkJhY2soKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBtZXNzYWdlOiBudWxsIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vbkNoYW5nZShlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1tlLnRhcmdldC5pZF06IGUudGFyZ2V0LnR5cGUgPT09ICdjaGVja2JveCcgPyBlLnRhcmdldC5jaGVja2VkIDogZS50YXJnZXQudmFsdWV9KTtcbiAgICB9XG5cbiAgICBfYnV0dG9ucygpIHtcbiAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5vbkJhY2t9PnsgX3QoJ0JhY2snKSB9PC9idXR0b24+XG4gICAgICAgICAgICB7ICF0aGlzLnN0YXRlLm1lc3NhZ2UgJiYgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9zZW5kfT57IF90KCdTZW5kJykgfTwvYnV0dG9uPiB9XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG5cbiAgICB0ZXh0SW5wdXQoaWQsIGxhYmVsKSB7XG4gICAgICAgIHJldHVybiA8RmllbGQgaWQ9e2lkfSBsYWJlbD17bGFiZWx9IHNpemU9XCI0MlwiIGF1dG9Gb2N1cz17dHJ1ZX0gdHlwZT1cInRleHRcIiBhdXRvQ29tcGxldGU9XCJvblwiXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RoaXMuc3RhdGVbaWRdfSBvbkNoYW5nZT17dGhpcy5fb25DaGFuZ2V9IC8+O1xuICAgIH1cbn1cblxuY2xhc3MgU2VuZEN1c3RvbUV2ZW50IGV4dGVuZHMgR2VuZXJpY0VkaXRvciB7XG4gICAgc3RhdGljIGdldExhYmVsKCkgeyByZXR1cm4gX3QoJ1NlbmQgQ3VzdG9tIEV2ZW50Jyk7IH1cblxuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIG9uQmFjazogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgcm9vbTogUHJvcFR5cGVzLmluc3RhbmNlT2YoUm9vbSkuaXNSZXF1aXJlZCxcbiAgICAgICAgZm9yY2VTdGF0ZUV2ZW50OiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgaW5wdXRzOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIH07XG5cbiAgICBzdGF0aWMgY29udGV4dFR5cGUgPSBNYXRyaXhDbGllbnRDb250ZXh0O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLl9zZW5kID0gdGhpcy5fc2VuZC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0IHtldmVudFR5cGUsIHN0YXRlS2V5LCBldkNvbnRlbnR9ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBldmVudFR5cGU6ICcnLFxuICAgICAgICAgICAgc3RhdGVLZXk6ICcnLFxuICAgICAgICAgICAgZXZDb250ZW50OiAne1xcblxcbn0nLFxuICAgICAgICB9LCB0aGlzLnByb3BzLmlucHV0cyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGlzU3RhdGVFdmVudDogQm9vbGVhbih0aGlzLnByb3BzLmZvcmNlU3RhdGVFdmVudCksXG5cbiAgICAgICAgICAgIGV2ZW50VHlwZSxcbiAgICAgICAgICAgIHN0YXRlS2V5LFxuICAgICAgICAgICAgZXZDb250ZW50LFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHNlbmQoY29udGVudCkge1xuICAgICAgICBjb25zdCBjbGkgPSB0aGlzLmNvbnRleHQ7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmlzU3RhdGVFdmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGNsaS5zZW5kU3RhdGVFdmVudCh0aGlzLnByb3BzLnJvb20ucm9vbUlkLCB0aGlzLnN0YXRlLmV2ZW50VHlwZSwgY29udGVudCwgdGhpcy5zdGF0ZS5zdGF0ZUtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY2xpLnNlbmRFdmVudCh0aGlzLnByb3BzLnJvb20ucm9vbUlkLCB0aGlzLnN0YXRlLmV2ZW50VHlwZSwgY29udGVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBfc2VuZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXZlbnRUeXBlID09PSAnJykge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1lc3NhZ2U6IF90KCdZb3UgbXVzdCBzcGVjaWZ5IGFuIGV2ZW50IHR5cGUhJykgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbWVzc2FnZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKHRoaXMuc3RhdGUuZXZDb250ZW50KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZChjb250ZW50KTtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBfdCgnRXZlbnQgc2VudCEnKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbWVzc2FnZSA9IF90KCdGYWlsZWQgdG8gc2VuZCBjdXN0b20gZXZlbnQuJykgKyAnICgnICsgZS50b1N0cmluZygpICsgJyknO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBtZXNzYWdlIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUubWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUubWVzc2FnZSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgeyB0aGlzLl9idXR0b25zKCkgfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX2V2ZW50VHlwZVN0YXRlS2V5R3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnRleHRJbnB1dCgnZXZlbnRUeXBlJywgX3QoJ0V2ZW50IFR5cGUnKSkgfVxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUuaXNTdGF0ZUV2ZW50ICYmIHRoaXMudGV4dElucHV0KCdzdGF0ZUtleScsIF90KCdTdGF0ZSBLZXknKSkgfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGJyIC8+XG5cbiAgICAgICAgICAgICAgICA8RmllbGQgaWQ9XCJldkNvbnRlbnRcIiBsYWJlbD17X3QoXCJFdmVudCBDb250ZW50XCIpfSB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX3RleHRhcmVhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCIgdmFsdWU9e3RoaXMuc3RhdGUuZXZDb250ZW50fSBvbkNoYW5nZT17dGhpcy5fb25DaGFuZ2V9IGVsZW1lbnQ9XCJ0ZXh0YXJlYVwiIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMub25CYWNrfT57IF90KCdCYWNrJykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsgIXRoaXMuc3RhdGUubWVzc2FnZSAmJiA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuX3NlbmR9PnsgX3QoJ1NlbmQnKSB9PC9idXR0b24+IH1cbiAgICAgICAgICAgICAgICB7ICF0aGlzLnN0YXRlLm1lc3NhZ2UgJiYgIXRoaXMucHJvcHMuZm9yY2VTdGF0ZUV2ZW50ICYmIDxkaXYgc3R5bGU9e3tmbG9hdDogXCJyaWdodFwifX0+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImlzU3RhdGVFdmVudFwiIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX3RnbCBteF9EZXZUb29sc190Z2wtZmxpcFwiIHR5cGU9XCJjaGVja2JveFwiIG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZX0gY2hlY2tlZD17dGhpcy5zdGF0ZS5pc1N0YXRlRXZlbnR9IC8+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJteF9EZXZUb29sc190Z2wtYnRuXCIgZGF0YS10Zy1vZmY9XCJFdmVudFwiIGRhdGEtdGctb249XCJTdGF0ZSBFdmVudFwiIGh0bWxGb3I9XCJpc1N0YXRlRXZlbnRcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PiB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cblxuY2xhc3MgU2VuZEFjY291bnREYXRhIGV4dGVuZHMgR2VuZXJpY0VkaXRvciB7XG4gICAgc3RhdGljIGdldExhYmVsKCkgeyByZXR1cm4gX3QoJ1NlbmQgQWNjb3VudCBEYXRhJyk7IH1cblxuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHJvb206IFByb3BUeXBlcy5pbnN0YW5jZU9mKFJvb20pLmlzUmVxdWlyZWQsXG4gICAgICAgIGlzUm9vbUFjY291bnREYXRhOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgZm9yY2VNb2RlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgaW5wdXRzOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIH07XG5cbiAgICBzdGF0aWMgY29udGV4dFR5cGUgPSBNYXRyaXhDbGllbnRDb250ZXh0O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLl9zZW5kID0gdGhpcy5fc2VuZC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0IHtldmVudFR5cGUsIGV2Q29udGVudH0gPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGV2ZW50VHlwZTogJycsXG4gICAgICAgICAgICBldkNvbnRlbnQ6ICd7XFxuXFxufScsXG4gICAgICAgIH0sIHRoaXMucHJvcHMuaW5wdXRzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgaXNSb29tQWNjb3VudERhdGE6IEJvb2xlYW4odGhpcy5wcm9wcy5pc1Jvb21BY2NvdW50RGF0YSksXG5cbiAgICAgICAgICAgIGV2ZW50VHlwZSxcbiAgICAgICAgICAgIGV2Q29udGVudCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzZW5kKGNvbnRlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5pc1Jvb21BY2NvdW50RGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGNsaS5zZXRSb29tQWNjb3VudERhdGEodGhpcy5wcm9wcy5yb29tLnJvb21JZCwgdGhpcy5zdGF0ZS5ldmVudFR5cGUsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbGkuc2V0QWNjb3VudERhdGEodGhpcy5zdGF0ZS5ldmVudFR5cGUsIGNvbnRlbnQpO1xuICAgIH1cblxuICAgIGFzeW5jIF9zZW5kKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ldmVudFR5cGUgPT09ICcnKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgbWVzc2FnZTogX3QoJ1lvdSBtdXN0IHNwZWNpZnkgYW4gZXZlbnQgdHlwZSEnKSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtZXNzYWdlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IEpTT04ucGFyc2UodGhpcy5zdGF0ZS5ldkNvbnRlbnQpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgbWVzc2FnZSA9IF90KCdFdmVudCBzZW50IScpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gX3QoJ0ZhaWxlZCB0byBzZW5kIGN1c3RvbSBldmVudC4nKSArICcgKCcgKyBlLnRvU3RyaW5nKCkgKyAnKSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1lc3NhZ2UgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5tZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS5tZXNzYWdlIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICB7IHRoaXMuX2J1dHRvbnMoKSB9XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gPGRpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHsgdGhpcy50ZXh0SW5wdXQoJ2V2ZW50VHlwZScsIF90KCdFdmVudCBUeXBlJykpIH1cbiAgICAgICAgICAgICAgICA8YnIgLz5cblxuICAgICAgICAgICAgICAgIDxGaWVsZCBpZD1cImV2Q29udGVudFwiIGxhYmVsPXtfdChcIkV2ZW50IENvbnRlbnRcIil9IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfdGV4dGFyZWFcIlxuICAgICAgICAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIiB2YWx1ZT17dGhpcy5zdGF0ZS5ldkNvbnRlbnR9IG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZX0gZWxlbWVudD1cInRleHRhcmVhXCIgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5vbkJhY2t9PnsgX3QoJ0JhY2snKSB9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgeyAhdGhpcy5zdGF0ZS5tZXNzYWdlICYmIDxidXR0b24gb25DbGljaz17dGhpcy5fc2VuZH0+eyBfdCgnU2VuZCcpIH08L2J1dHRvbj4gfVxuICAgICAgICAgICAgICAgIHsgIXRoaXMuc3RhdGUubWVzc2FnZSAmJiA8ZGl2IHN0eWxlPXt7ZmxvYXQ6IFwicmlnaHRcIn19PlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJpc1Jvb21BY2NvdW50RGF0YVwiIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX3RnbCBteF9EZXZUb29sc190Z2wtZmxpcFwiIHR5cGU9XCJjaGVja2JveFwiIG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZX0gY2hlY2tlZD17dGhpcy5zdGF0ZS5pc1Jvb21BY2NvdW50RGF0YX0gZGlzYWJsZWQ9e3RoaXMucHJvcHMuZm9yY2VNb2RlfSAvPlxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfdGdsLWJ0blwiIGRhdGEtdGctb2ZmPVwiQWNjb3VudCBEYXRhXCIgZGF0YS10Zy1vbj1cIlJvb20gRGF0YVwiIGh0bWxGb3I9XCJpc1Jvb21BY2NvdW50RGF0YVwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+IH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj47XG4gICAgfVxufVxuXG5jb25zdCBJTklUSUFMX0xPQURfVElMRVMgPSAyMDtcbmNvbnN0IExPQURfVElMRVNfU1RFUF9TSVpFID0gNTA7XG5cbmNsYXNzIEZpbHRlcmVkTGlzdCBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIGNoaWxkcmVuOiBQcm9wVHlwZXMuYW55LFxuICAgICAgICBxdWVyeTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICAgIH07XG5cbiAgICBzdGF0aWMgZmlsdGVyQ2hpbGRyZW4oY2hpbGRyZW4sIHF1ZXJ5KSB7XG4gICAgICAgIGlmICghcXVlcnkpIHJldHVybiBjaGlsZHJlbjtcbiAgICAgICAgY29uc3QgbGNRdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbi5maWx0ZXIoKGNoaWxkKSA9PiBjaGlsZC5rZXkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsY1F1ZXJ5KSk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgICAgICBmaWx0ZXJlZENoaWxkcmVuOiBGaWx0ZXJlZExpc3QuZmlsdGVyQ2hpbGRyZW4odGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5wcm9wcy5xdWVyeSksXG4gICAgICAgICAgICB0cnVuY2F0ZUF0OiBJTklUSUFMX0xPQURfVElMRVMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVE9ETzogW1JFQUNULVdBUk5JTkddIFJlcGxhY2Ugd2l0aCBhcHByb3ByaWF0ZSBsaWZlY3ljbGUgZXZlbnRcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYW1lbGNhc2VcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuY2hpbGRyZW4gPT09IG5leHRQcm9wcy5jaGlsZHJlbiAmJiB0aGlzLnByb3BzLnF1ZXJ5ID09PSBuZXh0UHJvcHMucXVlcnkpIHJldHVybjtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBmaWx0ZXJlZENoaWxkcmVuOiBGaWx0ZXJlZExpc3QuZmlsdGVyQ2hpbGRyZW4obmV4dFByb3BzLmNoaWxkcmVuLCBuZXh0UHJvcHMucXVlcnkpLFxuICAgICAgICAgICAgdHJ1bmNhdGVBdDogSU5JVElBTF9MT0FEX1RJTEVTLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzaG93QWxsID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHRydW5jYXRlQXQ6IHRoaXMuc3RhdGUudHJ1bmNhdGVBdCArIExPQURfVElMRVNfU1RFUF9TSVpFLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY3JlYXRlT3ZlcmZsb3dFbGVtZW50ID0gKG92ZXJmbG93Q291bnQ6IG51bWJlciwgdG90YWxDb3VudDogbnVtYmVyKSA9PiB7XG4gICAgICAgIHJldHVybiA8YnV0dG9uIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX1Jvb21TdGF0ZUV4cGxvcmVyX2J1dHRvblwiIG9uQ2xpY2s9e3RoaXMuc2hvd0FsbH0+XG4gICAgICAgICAgICB7IF90KFwiYW5kICUoY291bnQpcyBvdGhlcnMuLi5cIiwgeyBjb3VudDogb3ZlcmZsb3dDb3VudCB9KSB9XG4gICAgICAgIDwvYnV0dG9uPjtcbiAgICB9O1xuXG4gICAgb25RdWVyeSA9IChldikgPT4ge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5vbkNoYW5nZSkgdGhpcy5wcm9wcy5vbkNoYW5nZShldi50YXJnZXQudmFsdWUpO1xuICAgIH07XG5cbiAgICBnZXRDaGlsZHJlbiA9IChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5maWx0ZXJlZENoaWxkcmVuLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIH07XG5cbiAgICBnZXRDaGlsZENvdW50ID0gKCk6IG51bWJlciA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmZpbHRlcmVkQ2hpbGRyZW4ubGVuZ3RoO1xuICAgIH07XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IFRydW5jYXRlZExpc3QgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuVHJ1bmNhdGVkTGlzdFwiKTtcbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8RmllbGQgbGFiZWw9e190KCdGaWx0ZXIgcmVzdWx0cycpfSBhdXRvRm9jdXM9e3RydWV9IHNpemU9ezY0fVxuICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgYXV0b0NvbXBsZXRlPVwib2ZmXCIgdmFsdWU9e3RoaXMucHJvcHMucXVlcnl9IG9uQ2hhbmdlPXt0aGlzLm9uUXVlcnl9XG4gICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfVGV4dElucHV0RGlhbG9nX2lucHV0IG14X0RldlRvb2xzX1Jvb21TdGF0ZUV4cGxvcmVyX3F1ZXJ5XCJcbiAgICAgICAgICAgICAgICAgICAvLyBmb3JjZSByZS1yZW5kZXIgc28gdGhhdCBhdXRvRm9jdXMgaXMgYXBwbGllZCB3aGVuIHRoaXMgY29tcG9uZW50IGlzIHJlLXVzZWRcbiAgICAgICAgICAgICAgICAgICBrZXk9e3RoaXMucHJvcHMuY2hpbGRyZW5bMF0gPyB0aGlzLnByb3BzLmNoaWxkcmVuWzBdLmtleSA6ICcnfSAvPlxuXG4gICAgICAgICAgICA8VHJ1bmNhdGVkTGlzdCBnZXRDaGlsZHJlbj17dGhpcy5nZXRDaGlsZHJlbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldENoaWxkQ291bnQ9e3RoaXMuZ2V0Q2hpbGRDb3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRydW5jYXRlQXQ9e3RoaXMuc3RhdGUudHJ1bmNhdGVBdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU92ZXJmbG93RWxlbWVudD17dGhpcy5jcmVhdGVPdmVyZmxvd0VsZW1lbnR9IC8+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG5cbmNsYXNzIFJvb21TdGF0ZUV4cGxvcmVyIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudCB7XG4gICAgc3RhdGljIGdldExhYmVsKCkgeyByZXR1cm4gX3QoJ0V4cGxvcmUgUm9vbSBTdGF0ZScpOyB9XG5cbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkJhY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHJvb206IFByb3BUeXBlcy5pbnN0YW5jZU9mKFJvb20pLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5yb29tU3RhdGVFdmVudHMgPSB0aGlzLnByb3BzLnJvb20uY3VycmVudFN0YXRlLmV2ZW50cztcblxuICAgICAgICB0aGlzLm9uQmFjayA9IHRoaXMub25CYWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuZWRpdEV2ID0gdGhpcy5lZGl0RXYuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vblF1ZXJ5RXZlbnRUeXBlID0gdGhpcy5vblF1ZXJ5RXZlbnRUeXBlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25RdWVyeVN0YXRlS2V5ID0gdGhpcy5vblF1ZXJ5U3RhdGVLZXkuYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICAgICAgZXZlbnRUeXBlOiBudWxsLFxuICAgICAgICAgICAgZXZlbnQ6IG51bGwsXG4gICAgICAgICAgICBlZGl0aW5nOiBmYWxzZSxcblxuICAgICAgICAgICAgcXVlcnlFdmVudFR5cGU6ICcnLFxuICAgICAgICAgICAgcXVlcnlTdGF0ZUtleTogJycsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYnJvd3NlRXZlbnRUeXBlKGV2ZW50VHlwZSkge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGV2ZW50VHlwZSB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvblZpZXdTb3VyY2VDbGljayhldmVudCkge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGV2ZW50IH0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIG9uQmFjaygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGluZykge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGVkaXRpbmc6IGZhbHNlIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBldmVudDogbnVsbCB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmV2ZW50VHlwZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGV2ZW50VHlwZTogbnVsbCB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25CYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlZGl0RXYoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBlZGl0aW5nOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIG9uUXVlcnlFdmVudFR5cGUoZmlsdGVyRXZlbnRUeXBlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBxdWVyeUV2ZW50VHlwZTogZmlsdGVyRXZlbnRUeXBlIH0pO1xuICAgIH1cblxuICAgIG9uUXVlcnlTdGF0ZUtleShmaWx0ZXJTdGF0ZUtleSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgcXVlcnlTdGF0ZUtleTogZmlsdGVyU3RhdGVLZXkgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ldmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiA8U2VuZEN1c3RvbUV2ZW50IHJvb209e3RoaXMucHJvcHMucm9vbX0gZm9yY2VTdGF0ZUV2ZW50PXt0cnVlfSBvbkJhY2s9e3RoaXMub25CYWNrfSBpbnB1dHM9e3tcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlOiB0aGlzLnN0YXRlLmV2ZW50LmdldFR5cGUoKSxcbiAgICAgICAgICAgICAgICAgICAgZXZDb250ZW50OiBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRlLmV2ZW50LmdldENvbnRlbnQoKSwgbnVsbCwgJ1xcdCcpLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZUtleTogdGhpcy5zdGF0ZS5ldmVudC5nZXRTdGF0ZUtleSgpLFxuICAgICAgICAgICAgICAgIH19IC8+O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJteF9WaWV3U291cmNlXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICA8U3ludGF4SGlnaGxpZ2h0IGNsYXNzTmFtZT1cImpzb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgSlNPTi5zdHJpbmdpZnkodGhpcy5zdGF0ZS5ldmVudC5ldmVudCwgbnVsbCwgMikgfVxuICAgICAgICAgICAgICAgICAgICA8L1N5bnRheEhpZ2hsaWdodD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5vbkJhY2t9PnsgX3QoJ0JhY2snKSB9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5lZGl0RXZ9PnsgX3QoJ0VkaXQnKSB9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbGlzdCA9IG51bGw7XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9ICdteF9EZXZUb29sc19Sb29tU3RhdGVFeHBsb3Jlcl9idXR0b24nO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5ldmVudFR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGxpc3QgPSA8RmlsdGVyZWRMaXN0IHF1ZXJ5PXt0aGlzLnN0YXRlLnF1ZXJ5RXZlbnRUeXBlfSBvbkNoYW5nZT17dGhpcy5vblF1ZXJ5RXZlbnRUeXBlfT5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMucm9vbVN0YXRlRXZlbnRzKS5tYXAoKGV2VHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdGVHcm91cCA9IHRoaXMucm9vbVN0YXRlRXZlbnRzW2V2VHlwZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZUtleXMgPSBPYmplY3Qua2V5cyhzdGF0ZUdyb3VwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9uQ2xpY2tGbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZUtleXMubGVuZ3RoID09PSAxICYmIHN0YXRlS2V5c1swXSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrRm4gPSB0aGlzLm9uVmlld1NvdXJjZUNsaWNrKHN0YXRlR3JvdXBbc3RhdGVLZXlzWzBdXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2tGbiA9IHRoaXMuYnJvd3NlRXZlbnRUeXBlKGV2VHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8YnV0dG9uIGNsYXNzTmFtZT17Y2xhc3Nlc30ga2V5PXtldlR5cGV9IG9uQ2xpY2s9e29uQ2xpY2tGbn0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBldlR5cGUgfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+O1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDwvRmlsdGVyZWRMaXN0PjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlR3JvdXAgPSB0aGlzLnJvb21TdGF0ZUV2ZW50c1t0aGlzLnN0YXRlLmV2ZW50VHlwZV07XG5cbiAgICAgICAgICAgIGxpc3QgPSA8RmlsdGVyZWRMaXN0IHF1ZXJ5PXt0aGlzLnN0YXRlLnF1ZXJ5U3RhdGVLZXl9IG9uQ2hhbmdlPXt0aGlzLm9uUXVlcnlTdGF0ZUtleX0+XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzdGF0ZUdyb3VwKS5tYXAoKHN0YXRlS2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBldiA9IHN0YXRlR3JvdXBbc3RhdGVLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxidXR0b24gY2xhc3NOYW1lPXtjbGFzc2VzfSBrZXk9e3N0YXRlS2V5fSBvbkNsaWNrPXt0aGlzLm9uVmlld1NvdXJjZUNsaWNrKGV2KX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBzdGF0ZUtleSB9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj47XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC9GaWx0ZXJlZExpc3Q+O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgeyBsaXN0IH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5vbkJhY2t9PnsgX3QoJ0JhY2snKSB9PC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cblxuY2xhc3MgQWNjb3VudERhdGFFeHBsb3JlciBleHRlbmRzIFJlYWN0LlB1cmVDb21wb25lbnQge1xuICAgIHN0YXRpYyBnZXRMYWJlbCgpIHsgcmV0dXJuIF90KCdFeHBsb3JlIEFjY291bnQgRGF0YScpOyB9XG5cbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBvbkJhY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHJvb206IFByb3BUeXBlcy5pbnN0YW5jZU9mKFJvb20pLmlzUmVxdWlyZWQsXG4gICAgfTtcblxuICAgIHN0YXRpYyBjb250ZXh0VHlwZSA9IE1hdHJpeENsaWVudENvbnRleHQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5vbkJhY2sgPSB0aGlzLm9uQmFjay5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmVkaXRFdiA9IHRoaXMuZWRpdEV2LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX29uQ2hhbmdlID0gdGhpcy5fb25DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5vblF1ZXJ5RXZlbnRUeXBlID0gdGhpcy5vblF1ZXJ5RXZlbnRUeXBlLmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIGlzUm9vbUFjY291bnREYXRhOiBmYWxzZSxcbiAgICAgICAgICAgIGV2ZW50OiBudWxsLFxuICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG5cbiAgICAgICAgICAgIHF1ZXJ5RXZlbnRUeXBlOiAnJyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXREYXRhKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5pc1Jvb21BY2NvdW50RGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcHMucm9vbS5hY2NvdW50RGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0LnN0b3JlLmFjY291bnREYXRhO1xuICAgIH1cblxuICAgIG9uVmlld1NvdXJjZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgZXZlbnQgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25CYWNrKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lZGl0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgZWRpdGluZzogZmFsc2UgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5ldmVudCkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGV2ZW50OiBudWxsIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9vbkNoYW5nZShlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1tlLnRhcmdldC5pZF06IGUudGFyZ2V0LnR5cGUgPT09ICdjaGVja2JveCcgPyBlLnRhcmdldC5jaGVja2VkIDogZS50YXJnZXQudmFsdWV9KTtcbiAgICB9XG5cbiAgICBlZGl0RXYoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBlZGl0aW5nOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIG9uUXVlcnlFdmVudFR5cGUocXVlcnlFdmVudFR5cGUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHF1ZXJ5RXZlbnRUeXBlIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmVkaXRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPFNlbmRBY2NvdW50RGF0YVxuICAgICAgICAgICAgICAgICAgICByb29tPXt0aGlzLnByb3BzLnJvb219XG4gICAgICAgICAgICAgICAgICAgIGlzUm9vbUFjY291bnREYXRhPXt0aGlzLnN0YXRlLmlzUm9vbUFjY291bnREYXRhfVxuICAgICAgICAgICAgICAgICAgICBvbkJhY2s9e3RoaXMub25CYWNrfVxuICAgICAgICAgICAgICAgICAgICBpbnB1dHM9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZTogdGhpcy5zdGF0ZS5ldmVudC5nZXRUeXBlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBldkNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuZXZlbnQuZ2V0Q29udGVudCgpLCBudWxsLCAnXFx0JyksXG4gICAgICAgICAgICAgICAgICAgIH19IGZvcmNlTW9kZT17dHJ1ZX0gLz47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cIm14X1ZpZXdTb3VyY2VcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPFN5bnRheEhpZ2hsaWdodCBjbGFzc05hbWU9XCJqc29uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuZXZlbnQuZXZlbnQsIG51bGwsIDIpIH1cbiAgICAgICAgICAgICAgICAgICAgPC9TeW50YXhIaWdobGlnaHQ+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMub25CYWNrfT57IF90KCdCYWNrJykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMuZWRpdEV2fT57IF90KCdFZGl0JykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm93cyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSAnbXhfRGV2VG9vbHNfUm9vbVN0YXRlRXhwbG9yZXJfYnV0dG9uJztcblxuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5nZXREYXRhKCk7XG4gICAgICAgIE9iamVjdC5rZXlzKGRhdGEpLmZvckVhY2goKGV2VHlwZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXYgPSBkYXRhW2V2VHlwZV07XG4gICAgICAgICAgICByb3dzLnB1c2goPGJ1dHRvbiBjbGFzc05hbWU9e2NsYXNzZXN9IGtleT17ZXZUeXBlfSBvbkNsaWNrPXt0aGlzLm9uVmlld1NvdXJjZUNsaWNrKGV2KX0+XG4gICAgICAgICAgICAgICAgeyBldlR5cGUgfVxuICAgICAgICAgICAgPC9idXR0b24+KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDxkaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPEZpbHRlcmVkTGlzdCBxdWVyeT17dGhpcy5zdGF0ZS5xdWVyeUV2ZW50VHlwZX0gb25DaGFuZ2U9e3RoaXMub25RdWVyeUV2ZW50VHlwZX0+XG4gICAgICAgICAgICAgICAgICAgIHsgcm93cyB9XG4gICAgICAgICAgICAgICAgPC9GaWx0ZXJlZExpc3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMub25CYWNrfT57IF90KCdCYWNrJykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIHsgIXRoaXMuc3RhdGUubWVzc2FnZSAmJiA8ZGl2IHN0eWxlPXt7ZmxvYXQ6IFwicmlnaHRcIn19PlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJpc1Jvb21BY2NvdW50RGF0YVwiIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX3RnbCBteF9EZXZUb29sc190Z2wtZmxpcFwiIHR5cGU9XCJjaGVja2JveFwiIG9uQ2hhbmdlPXt0aGlzLl9vbkNoYW5nZX0gY2hlY2tlZD17dGhpcy5zdGF0ZS5pc1Jvb21BY2NvdW50RGF0YX0gLz5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX3RnbC1idG5cIiBkYXRhLXRnLW9mZj1cIkFjY291bnQgRGF0YVwiIGRhdGEtdGctb249XCJSb29tIERhdGFcIiBodG1sRm9yPVwiaXNSb29tQWNjb3VudERhdGFcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PiB9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+O1xuICAgIH1cbn1cblxuY2xhc3MgU2VydmVyc0luUm9vbUxpc3QgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgZ2V0TGFiZWwoKSB7IHJldHVybiBfdCgnVmlldyBTZXJ2ZXJzIGluIFJvb20nKTsgfVxuXG4gICAgc3RhdGljIHByb3BUeXBlcyA9IHtcbiAgICAgICAgb25CYWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICByb29tOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihSb29tKS5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBzdGF0aWMgY29udGV4dFR5cGUgPSBNYXRyaXhDbGllbnRDb250ZXh0O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IHJvb20gPSB0aGlzLnByb3BzLnJvb207XG4gICAgICAgIGNvbnN0IHNlcnZlcnMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKFwibS5yb29tLm1lbWJlclwiKS5mb3JFYWNoKGV2ID0+IHNlcnZlcnMuYWRkKGV2LmdldFNlbmRlcigpLnNwbGl0KFwiOlwiKVsxXSkpO1xuICAgICAgICB0aGlzLnNlcnZlcnMgPSBBcnJheS5mcm9tKHNlcnZlcnMpLm1hcChzID0+XG4gICAgICAgICAgICA8YnV0dG9uIGtleT17c30gY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfU2VydmVyc0luUm9vbUxpc3RfYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgeyBzIH1cbiAgICAgICAgICAgIDwvYnV0dG9uPik7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIHF1ZXJ5OiAnJyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvblF1ZXJ5ID0gKHF1ZXJ5KSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBxdWVyeSB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiA8ZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxGaWx0ZXJlZExpc3QgcXVlcnk9e3RoaXMuc3RhdGUucXVlcnl9IG9uQ2hhbmdlPXt0aGlzLm9uUXVlcnl9PlxuICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc2VydmVycyB9XG4gICAgICAgICAgICAgICAgPC9GaWx0ZXJlZExpc3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2J1dHRvbnNcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RoaXMucHJvcHMub25CYWNrfT57IF90KCdCYWNrJykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PjtcbiAgICB9XG59XG5cbmNvbnN0IFBIQVNFX01BUCA9IHtcbiAgICBbUEhBU0VfVU5TRU5UXTogXCJ1bnNlbnRcIixcbiAgICBbUEhBU0VfUkVRVUVTVEVEXTogXCJyZXF1ZXN0ZWRcIixcbiAgICBbUEhBU0VfUkVBRFldOiBcInJlYWR5XCIsXG4gICAgW1BIQVNFX0RPTkVdOiBcImRvbmVcIixcbiAgICBbUEhBU0VfU1RBUlRFRF06IFwic3RhcnRlZFwiLFxuICAgIFtQSEFTRV9DQU5DRUxMRURdOiBcImNhbmNlbGxlZFwiLFxufTtcblxuZnVuY3Rpb24gVmVyaWZpY2F0aW9uUmVxdWVzdCh7dHhuSWQsIHJlcXVlc3R9KSB7XG4gICAgY29uc3QgWywgdXBkYXRlU3RhdGVdID0gdXNlU3RhdGUoKTtcbiAgICBjb25zdCBbdGltZW91dCwgc2V0UmVxdWVzdFRpbWVvdXRdID0gdXNlU3RhdGUocmVxdWVzdC50aW1lb3V0KTtcblxuICAgIC8qIFJlLXJlbmRlciBpZiBzb21ldGhpbmcgY2hhbmdlcyBzdGF0ZSAqL1xuICAgIHVzZUV2ZW50RW1pdHRlcihyZXF1ZXN0LCBcImNoYW5nZVwiLCB1cGRhdGVTdGF0ZSk7XG5cbiAgICAvKiBLZWVwIHJlLXJlbmRlcmluZyBpZiB0aGVyZSdzIGEgdGltZW91dCAqL1xuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmIChyZXF1ZXN0LnRpbWVvdXQgPT0gMCkgcmV0dXJuO1xuXG4gICAgICAgIC8qIE5vdGUgdGhhdCByZXF1ZXN0LnRpbWVvdXQgaXMgYSBnZXR0ZXIsIHNvIGl0cyB2YWx1ZSBjaGFuZ2VzICovXG4gICAgICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICBzZXRSZXF1ZXN0VGltZW91dChyZXF1ZXN0LnRpbWVvdXQpO1xuICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7IGNsZWFySW50ZXJ2YWwoaWQpOyB9O1xuICAgIH0sIFtyZXF1ZXN0XSk7XG5cbiAgICByZXR1cm4gKDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfVmVyaWZpY2F0aW9uUmVxdWVzdFwiPlxuICAgICAgICA8ZGw+XG4gICAgICAgICAgICA8ZHQ+VHJhbnNhY3Rpb248L2R0PlxuICAgICAgICAgICAgPGRkPnt0eG5JZH08L2RkPlxuICAgICAgICAgICAgPGR0PlBoYXNlPC9kdD5cbiAgICAgICAgICAgIDxkZD57UEhBU0VfTUFQW3JlcXVlc3QucGhhc2VdIHx8IHJlcXVlc3QucGhhc2V9PC9kZD5cbiAgICAgICAgICAgIDxkdD5UaW1lb3V0PC9kdD5cbiAgICAgICAgICAgIDxkZD57TWF0aC5mbG9vcih0aW1lb3V0IC8gMTAwMCl9PC9kZD5cbiAgICAgICAgICAgIDxkdD5NZXRob2RzPC9kdD5cbiAgICAgICAgICAgIDxkZD57cmVxdWVzdC5tZXRob2RzICYmIHJlcXVlc3QubWV0aG9kcy5qb2luKFwiLCBcIil9PC9kZD5cbiAgICAgICAgICAgIDxkdD5yZXF1ZXN0aW5nVXNlcklkPC9kdD5cbiAgICAgICAgICAgIDxkZD57cmVxdWVzdC5yZXF1ZXN0aW5nVXNlcklkfTwvZGQ+XG4gICAgICAgICAgICA8ZHQ+b2JzZXJ2ZU9ubHk8L2R0PlxuICAgICAgICAgICAgPGRkPntKU09OLnN0cmluZ2lmeShyZXF1ZXN0Lm9ic2VydmVPbmx5KX08L2RkPlxuICAgICAgICA8L2RsPlxuICAgIDwvZGl2Pik7XG59XG5cbmNsYXNzIFZlcmlmaWNhdGlvbkV4cGxvcmVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgZ2V0TGFiZWwoKSB7XG4gICAgICAgIHJldHVybiBfdChcIlZlcmlmaWNhdGlvbiBSZXF1ZXN0c1wiKTtcbiAgICB9XG5cbiAgICAvKiBFbnN1cmUgdGhpcy5jb250ZXh0IGlzIHRoZSBjbGkgKi9cbiAgICBzdGF0aWMgY29udGV4dFR5cGUgPSBNYXRyaXhDbGllbnRDb250ZXh0O1xuXG4gICAgb25OZXdSZXF1ZXN0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IHRoaXMuY29udGV4dDtcbiAgICAgICAgY2xpLm9uKFwiY3J5cHRvLnZlcmlmaWNhdGlvbi5yZXF1ZXN0XCIsIHRoaXMub25OZXdSZXF1ZXN0KTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgY29uc3QgY2xpID0gdGhpcy5jb250ZXh0O1xuICAgICAgICBjbGkub2ZmKFwiY3J5cHRvLnZlcmlmaWNhdGlvbi5yZXF1ZXN0XCIsIHRoaXMub25OZXdSZXF1ZXN0KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IGNsaSA9IHRoaXMuY29udGV4dDtcbiAgICAgICAgY29uc3Qgcm9vbSA9IHRoaXMucHJvcHMucm9vbTtcbiAgICAgICAgY29uc3QgaW5Sb29tQ2hhbm5lbCA9IGNsaS5fY3J5cHRvLl9pblJvb21WZXJpZmljYXRpb25SZXF1ZXN0cztcbiAgICAgICAgY29uc3QgaW5Sb29tUmVxdWVzdHMgPSAoaW5Sb29tQ2hhbm5lbC5fcmVxdWVzdHNCeVJvb21JZCB8fCBuZXcgTWFwKCkpLmdldChyb29tLnJvb21JZCkgfHwgbmV3IE1hcCgpO1xuXG4gICAgICAgIHJldHVybiAoPGRpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICB7QXJyYXkuZnJvbShpblJvb21SZXF1ZXN0cy5lbnRyaWVzKCkpLnJldmVyc2UoKS5tYXAoKFt0eG5JZCwgcmVxdWVzdF0pID0+XG4gICAgICAgICAgICAgICAgICAgIDxWZXJpZmljYXRpb25SZXF1ZXN0IHR4bklkPXt0eG5JZH0gcmVxdWVzdD17cmVxdWVzdH0ga2V5PXt0eG5JZH0gLz4sXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfYnV0dG9uc1wiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5wcm9wcy5vbkJhY2t9PntfdChcIkJhY2tcIil9PC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+KTtcbiAgICB9XG59XG5cbmNvbnN0IEVudHJpZXMgPSBbXG4gICAgU2VuZEN1c3RvbUV2ZW50LFxuICAgIFJvb21TdGF0ZUV4cGxvcmVyLFxuICAgIFNlbmRBY2NvdW50RGF0YSxcbiAgICBBY2NvdW50RGF0YUV4cGxvcmVyLFxuICAgIFNlcnZlcnNJblJvb21MaXN0LFxuICAgIFZlcmlmaWNhdGlvbkV4cGxvcmVyLFxuXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2dG9vbHNEaWFsb2cgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICByb29tSWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLm9uQmFjayA9IHRoaXMub25CYWNrLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub25DYW5jZWwgPSB0aGlzLm9uQ2FuY2VsLmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgICAgIG1vZGU6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgX3NldE1vZGUobW9kZSkge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1vZGUgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgb25CYWNrKCkge1xuICAgICAgICBpZiAodGhpcy5wcmV2TW9kZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IG1vZGU6IHRoaXMucHJldk1vZGUgfSk7XG4gICAgICAgICAgICB0aGlzLnByZXZNb2RlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBtb2RlOiBudWxsIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25DYW5jZWwoKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25GaW5pc2hlZChmYWxzZSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgYm9keTtcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZS5tb2RlKSB7XG4gICAgICAgICAgICBib2R5ID0gPE1hdHJpeENsaWVudENvbnRleHQuQ29uc3VtZXI+XG4gICAgICAgICAgICAgICAgeyhjbGkpID0+IDxSZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZUb29sc19sYWJlbF9sZWZ0XCI+eyB0aGlzLnN0YXRlLm1vZGUuZ2V0TGFiZWwoKSB9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGV2VG9vbHNfbGFiZWxfcmlnaHRcIj5Sb29tIElEOiB7IHRoaXMucHJvcHMucm9vbUlkIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZUb29sc19sYWJlbF9ib3R0b21cIiAvPlxuICAgICAgICAgICAgICAgICAgICA8dGhpcy5zdGF0ZS5tb2RlIG9uQmFjaz17dGhpcy5vbkJhY2t9IHJvb209e2NsaS5nZXRSb29tKHRoaXMucHJvcHMucm9vbUlkKX0gLz5cbiAgICAgICAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50Pn1cbiAgICAgICAgICAgIDwvTWF0cml4Q2xpZW50Q29udGV4dC5Db25zdW1lcj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gXCJteF9EZXZUb29sc19Sb29tU3RhdGVFeHBsb3Jlcl9idXR0b25cIjtcbiAgICAgICAgICAgIGJvZHkgPSA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZUb29sc19sYWJlbF9sZWZ0XCI+eyBfdCgnVG9vbGJveCcpIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EZXZUb29sc19sYWJlbF9yaWdodFwiPlJvb20gSUQ6IHsgdGhpcy5wcm9wcy5yb29tSWQgfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RldlRvb2xzX2xhYmVsX2JvdHRvbVwiIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9EaWFsb2dfY29udGVudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgeyBFbnRyaWVzLm1hcCgoRW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbCA9IEVudHJ5LmdldExhYmVsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb25DbGljayA9IHRoaXMuX3NldE1vZGUoRW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8YnV0dG9uIGNsYXNzTmFtZT17Y2xhc3Nlc30ga2V5PXtsYWJlbH0gb25DbGljaz17b25DbGlja30+eyBsYWJlbCB9PC9idXR0b24+O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkgfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0RpYWxvZ19idXR0b25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGhpcy5vbkNhbmNlbH0+eyBfdCgnQ2FuY2VsJykgfTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9SZWFjdC5GcmFnbWVudD47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBCYXNlRGlhbG9nID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZGlhbG9ncy5CYXNlRGlhbG9nJyk7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZyBjbGFzc05hbWU9XCJteF9RdWVzdGlvbkRpYWxvZ1wiIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH0gdGl0bGU9e190KCdEZXZlbG9wZXIgVG9vbHMnKX0+XG4gICAgICAgICAgICAgICAgeyBib2R5IH1cbiAgICAgICAgICAgIDwvQmFzZURpYWxvZz5cbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=