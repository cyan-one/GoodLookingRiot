"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _languageHandler = require("../../../languageHandler");

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _dispatcher = _interopRequireDefault(require("../../../dispatcher/dispatcher"));

var _UserAddress = require("../../../UserAddress.js");

var _GroupStore = _interopRequireDefault(require("../../../stores/GroupStore"));

var Email = _interopRequireWildcard(require("../../../email"));

var _IdentityAuthClient = _interopRequireDefault(require("../../../IdentityAuthClient"));

var _IdentityServerUtils = require("../../../utils/IdentityServerUtils");

var _UrlUtils = require("../../../utils/UrlUtils");

var _promise = require("../../../utils/promise");

var _Keyboard = require("../../../Keyboard");

var _actions = require("../../../dispatcher/actions");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018, 2019 New Vector Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
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
const TRUNCATE_QUERY_LIST = 40;
const QUERY_USER_DIRECTORY_DEBOUNCE_MS = 200;
const addressTypeName = {
  'mx-user-id': (0, _languageHandler._td)("Matrix ID"),
  'mx-room-id': (0, _languageHandler._td)("Matrix Room ID"),
  'email': (0, _languageHandler._td)("email address")
};

var _default = (0, _createReactClass.default)({
  displayName: "AddressPickerDialog",
  propTypes: {
    title: _propTypes.default.string.isRequired,
    description: _propTypes.default.node,
    // Extra node inserted after picker input, dropdown and errors
    extraNode: _propTypes.default.node,
    value: _propTypes.default.string,
    placeholder: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.func]),
    roomId: _propTypes.default.string,
    button: _propTypes.default.string,
    focus: _propTypes.default.bool,
    validAddressTypes: _propTypes.default.arrayOf(_propTypes.default.oneOf(_UserAddress.addressTypes)),
    onFinished: _propTypes.default.func.isRequired,
    groupId: _propTypes.default.string,
    // The type of entity to search for. Default: 'user'.
    pickerType: _propTypes.default.oneOf(['user', 'room']),
    // Whether the current user should be included in the addresses returned. Only
    // applicable when pickerType is `user`. Default: false.
    includeSelf: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      value: "",
      focus: true,
      validAddressTypes: _UserAddress.addressTypes,
      pickerType: 'user',
      includeSelf: false
    };
  },
  getInitialState: function () {
    let validAddressTypes = this.props.validAddressTypes; // Remove email from validAddressTypes if no IS is configured. It may be added at a later stage by the user

    if (!_MatrixClientPeg.MatrixClientPeg.get().getIdentityServerUrl() && validAddressTypes.includes("email")) {
      validAddressTypes = validAddressTypes.filter(type => type !== "email");
    }

    return {
      // Whether to show an error message because of an invalid address
      invalidAddressError: false,
      // List of UserAddressType objects representing
      // the list of addresses we're going to invite
      selectedList: [],
      // Whether a search is ongoing
      busy: false,
      // An error message generated during the user directory search
      searchError: null,
      // Whether the server supports the user_directory API
      serverSupportsUserDirectory: true,
      // The query being searched for
      query: "",
      // List of UserAddressType objects representing the set of
      // auto-completion results for the current search query.
      suggestedList: [],
      // List of address types initialised from props, but may change while the
      // dialog is open and represents the supported list of address types at this time.
      validAddressTypes
    };
  },
  // TODO: [REACT-WARNING] Replace component with real class, use constructor for refs
  UNSAFE_componentWillMount: function () {
    this._textinput = (0, _react.createRef)();
  },
  componentDidMount: function () {
    if (this.props.focus) {
      // Set the cursor at the end of the text input
      this._textinput.current.value = this.props.value;
    }
  },

  getPlaceholder() {
    const {
      placeholder
    } = this.props;

    if (typeof placeholder === "string") {
      return placeholder;
    } // Otherwise it's a function, as checked by prop types.


    return placeholder(this.state.validAddressTypes);
  },

  onButtonClick: function () {
    let selectedList = this.state.selectedList.slice(); // Check the text input field to see if user has an unconverted address
    // If there is and it's valid add it to the local selectedList

    if (this._textinput.current.value !== '') {
      selectedList = this._addAddressesToList([this._textinput.current.value]);
      if (selectedList === null) return;
    }

    this.props.onFinished(true, selectedList);
  },
  onCancel: function () {
    this.props.onFinished(false);
  },
  onKeyDown: function (e) {
    const textInput = this._textinput.current ? this._textinput.current.value : undefined;

    if (e.key === _Keyboard.Key.ESCAPE) {
      e.stopPropagation();
      e.preventDefault();
      this.props.onFinished(false);
    } else if (e.key === _Keyboard.Key.ARROW_UP) {
      e.stopPropagation();
      e.preventDefault();
      if (this.addressSelector) this.addressSelector.moveSelectionUp();
    } else if (e.key === _Keyboard.Key.ARROW_DOWN) {
      e.stopPropagation();
      e.preventDefault();
      if (this.addressSelector) this.addressSelector.moveSelectionDown();
    } else if (this.state.suggestedList.length > 0 && [_Keyboard.Key.COMMA, _Keyboard.Key.ENTER, _Keyboard.Key.TAB].includes(e.key)) {
      e.stopPropagation();
      e.preventDefault();
      if (this.addressSelector) this.addressSelector.chooseSelection();
    } else if (textInput.length === 0 && this.state.selectedList.length && e.key === _Keyboard.Key.BACKSPACE) {
      e.stopPropagation();
      e.preventDefault();
      this.onDismissed(this.state.selectedList.length - 1)();
    } else if (e.key === _Keyboard.Key.ENTER) {
      e.stopPropagation();
      e.preventDefault();

      if (textInput === '') {
        // if there's nothing in the input box, submit the form
        this.onButtonClick();
      } else {
        this._addAddressesToList([textInput]);
      }
    } else if (textInput && (e.key === _Keyboard.Key.COMMA || e.key === _Keyboard.Key.TAB)) {
      e.stopPropagation();
      e.preventDefault();

      this._addAddressesToList([textInput]);
    }
  },
  onQueryChanged: function (ev) {
    const query = ev.target.value;

    if (this.queryChangedDebouncer) {
      clearTimeout(this.queryChangedDebouncer);
    } // Only do search if there is something to search


    if (query.length > 0 && query !== '@' && query.length >= 2) {
      this.queryChangedDebouncer = setTimeout(() => {
        if (this.props.pickerType === 'user') {
          if (this.props.groupId) {
            this._doNaiveGroupSearch(query);
          } else if (this.state.serverSupportsUserDirectory) {
            this._doUserDirectorySearch(query);
          } else {
            this._doLocalSearch(query);
          }
        } else if (this.props.pickerType === 'room') {
          if (this.props.groupId) {
            this._doNaiveGroupRoomSearch(query);
          } else {
            this._doRoomSearch(query);
          }
        } else {
          console.error('Unknown pickerType', this.props.pickerType);
        }
      }, QUERY_USER_DIRECTORY_DEBOUNCE_MS);
    } else {
      this.setState({
        suggestedList: [],
        query: "",
        searchError: null
      });
    }
  },
  onDismissed: function (index) {
    return () => {
      const selectedList = this.state.selectedList.slice();
      selectedList.splice(index, 1);
      this.setState({
        selectedList,
        suggestedList: [],
        query: ""
      });
      if (this._cancelThreepidLookup) this._cancelThreepidLookup();
    };
  },
  onClick: function (index) {
    return () => {
      this.onSelected(index);
    };
  },
  onSelected: function (index) {
    const selectedList = this.state.selectedList.slice();
    selectedList.push(this._getFilteredSuggestions()[index]);
    this.setState({
      selectedList,
      suggestedList: [],
      query: ""
    });
    if (this._cancelThreepidLookup) this._cancelThreepidLookup();
  },
  _doNaiveGroupSearch: function (query) {
    const lowerCaseQuery = query.toLowerCase();
    this.setState({
      busy: true,
      query,
      searchError: null
    });

    _MatrixClientPeg.MatrixClientPeg.get().getGroupUsers(this.props.groupId).then(resp => {
      const results = [];
      resp.chunk.forEach(u => {
        const userIdMatch = u.user_id.toLowerCase().includes(lowerCaseQuery);
        const displayNameMatch = (u.displayname || '').toLowerCase().includes(lowerCaseQuery);

        if (!(userIdMatch || displayNameMatch)) {
          return;
        }

        results.push({
          user_id: u.user_id,
          avatar_url: u.avatar_url,
          display_name: u.displayname
        });
      });

      this._processResults(results, query);
    }).catch(err => {
      console.error('Error whilst searching group rooms: ', err);
      this.setState({
        searchError: err.errcode ? err.message : (0, _languageHandler._t)('Something went wrong!')
      });
    }).then(() => {
      this.setState({
        busy: false
      });
    });
  },
  _doNaiveGroupRoomSearch: function (query) {
    const lowerCaseQuery = query.toLowerCase();
    const results = [];

    _GroupStore.default.getGroupRooms(this.props.groupId).forEach(r => {
      const nameMatch = (r.name || '').toLowerCase().includes(lowerCaseQuery);
      const topicMatch = (r.topic || '').toLowerCase().includes(lowerCaseQuery);
      const aliasMatch = (r.canonical_alias || '').toLowerCase().includes(lowerCaseQuery);

      if (!(nameMatch || topicMatch || aliasMatch)) {
        return;
      }

      results.push({
        room_id: r.room_id,
        avatar_url: r.avatar_url,
        name: r.name || r.canonical_alias
      });
    });

    this._processResults(results, query);

    this.setState({
      busy: false
    });
  },
  _doRoomSearch: function (query) {
    const lowerCaseQuery = query.toLowerCase();

    const rooms = _MatrixClientPeg.MatrixClientPeg.get().getRooms();

    const results = [];
    rooms.forEach(room => {
      let rank = Infinity;
      const nameEvent = room.currentState.getStateEvents('m.room.name', '');
      const name = nameEvent ? nameEvent.getContent().name : '';
      const canonicalAlias = room.getCanonicalAlias();
      const aliasEvents = room.currentState.getStateEvents('m.room.aliases');
      const aliases = aliasEvents.map(ev => ev.getContent().aliases).reduce((a, b) => {
        return a.concat(b);
      }, []);
      const nameMatch = (name || '').toLowerCase().includes(lowerCaseQuery);
      let aliasMatch = false;
      let shortestMatchingAliasLength = Infinity;
      aliases.forEach(alias => {
        if ((alias || '').toLowerCase().includes(lowerCaseQuery)) {
          aliasMatch = true;

          if (shortestMatchingAliasLength > alias.length) {
            shortestMatchingAliasLength = alias.length;
          }
        }
      });

      if (!(nameMatch || aliasMatch)) {
        return;
      }

      if (aliasMatch) {
        // A shorter matching alias will give a better rank
        rank = shortestMatchingAliasLength;
      }

      const avatarEvent = room.currentState.getStateEvents('m.room.avatar', '');
      const avatarUrl = avatarEvent ? avatarEvent.getContent().url : undefined;
      results.push({
        rank,
        room_id: room.roomId,
        avatar_url: avatarUrl,
        name: name || canonicalAlias || aliases[0] || (0, _languageHandler._t)('Unnamed Room')
      });
    }); // Sort by rank ascending (a high rank being less relevant)

    const sortedResults = results.sort((a, b) => {
      return a.rank - b.rank;
    });

    this._processResults(sortedResults, query);

    this.setState({
      busy: false
    });
  },
  _doUserDirectorySearch: function (query) {
    this.setState({
      busy: true,
      query,
      searchError: null
    });

    _MatrixClientPeg.MatrixClientPeg.get().searchUserDirectory({
      term: query
    }).then(resp => {
      // The query might have changed since we sent the request, so ignore
      // responses for anything other than the latest query.
      if (this.state.query !== query) {
        return;
      }

      this._processResults(resp.results, query);
    }).catch(err => {
      console.error('Error whilst searching user directory: ', err);
      this.setState({
        searchError: err.errcode ? err.message : (0, _languageHandler._t)('Something went wrong!')
      });

      if (err.errcode === 'M_UNRECOGNIZED') {
        this.setState({
          serverSupportsUserDirectory: false
        }); // Do a local search immediately

        this._doLocalSearch(query);
      }
    }).then(() => {
      this.setState({
        busy: false
      });
    });
  },
  _doLocalSearch: function (query) {
    this.setState({
      query,
      searchError: null
    });
    const queryLowercase = query.toLowerCase();
    const results = [];

    _MatrixClientPeg.MatrixClientPeg.get().getUsers().forEach(user => {
      if (user.userId.toLowerCase().indexOf(queryLowercase) === -1 && user.displayName.toLowerCase().indexOf(queryLowercase) === -1) {
        return;
      } // Put results in the format of the new API


      results.push({
        user_id: user.userId,
        display_name: user.displayName,
        avatar_url: user.avatarUrl
      });
    });

    this._processResults(results, query);
  },
  _processResults: function (results, query) {
    const suggestedList = [];
    results.forEach(result => {
      if (result.room_id) {
        const client = _MatrixClientPeg.MatrixClientPeg.get();

        const room = client.getRoom(result.room_id);

        if (room) {
          const tombstone = room.currentState.getStateEvents('m.room.tombstone', '');

          if (tombstone && tombstone.getContent() && tombstone.getContent()["replacement_room"]) {
            const replacementRoom = client.getRoom(tombstone.getContent()["replacement_room"]); // Skip rooms with tombstones where we are also aware of the replacement room.

            if (replacementRoom) return;
          }
        }

        suggestedList.push({
          addressType: 'mx-room-id',
          address: result.room_id,
          displayName: result.name,
          avatarMxc: result.avatar_url,
          isKnown: true
        });
        return;
      }

      if (!this.props.includeSelf && result.user_id === _MatrixClientPeg.MatrixClientPeg.get().credentials.userId) {
        return;
      } // Return objects, structure of which is defined
      // by UserAddressType


      suggestedList.push({
        addressType: 'mx-user-id',
        address: result.user_id,
        displayName: result.display_name,
        avatarMxc: result.avatar_url,
        isKnown: true
      });
    }); // If the query is a valid address, add an entry for that
    // This is important, otherwise there's no way to invite
    // a perfectly valid address if there are close matches.

    const addrType = (0, _UserAddress.getAddressType)(query);

    if (this.state.validAddressTypes.includes(addrType)) {
      if (addrType === 'email' && !Email.looksValid(query)) {
        this.setState({
          searchError: (0, _languageHandler._t)("That doesn't look like a valid email address")
        });
        return;
      }

      suggestedList.unshift({
        addressType: addrType,
        address: query,
        isKnown: false
      });
      if (this._cancelThreepidLookup) this._cancelThreepidLookup();

      if (addrType === 'email') {
        this._lookupThreepid(addrType, query);
      }
    }

    this.setState({
      suggestedList,
      invalidAddressError: false
    }, () => {
      if (this.addressSelector) this.addressSelector.moveSelectionTop();
    });
  },
  _addAddressesToList: function (addressTexts) {
    const selectedList = this.state.selectedList.slice();
    let hasError = false;
    addressTexts.forEach(addressText => {
      addressText = addressText.trim();
      const addrType = (0, _UserAddress.getAddressType)(addressText);
      const addrObj = {
        addressType: addrType,
        address: addressText,
        isKnown: false
      };

      if (!this.state.validAddressTypes.includes(addrType)) {
        hasError = true;
      } else if (addrType === 'mx-user-id') {
        const user = _MatrixClientPeg.MatrixClientPeg.get().getUser(addrObj.address);

        if (user) {
          addrObj.displayName = user.displayName;
          addrObj.avatarMxc = user.avatarUrl;
          addrObj.isKnown = true;
        }
      } else if (addrType === 'mx-room-id') {
        const room = _MatrixClientPeg.MatrixClientPeg.get().getRoom(addrObj.address);

        if (room) {
          addrObj.displayName = room.name;
          addrObj.avatarMxc = room.avatarUrl;
          addrObj.isKnown = true;
        }
      }

      selectedList.push(addrObj);
    });
    this.setState({
      selectedList,
      suggestedList: [],
      query: "",
      invalidAddressError: hasError ? true : this.state.invalidAddressError
    });
    if (this._cancelThreepidLookup) this._cancelThreepidLookup();
    return hasError ? null : selectedList;
  },
  _lookupThreepid: async function (medium, address) {
    let cancelled = false; // Note that we can't safely remove this after we're done
    // because we don't know that it's the same one, so we just
    // leave it: it's replacing the old one each time so it's
    // not like they leak.

    this._cancelThreepidLookup = function () {
      cancelled = true;
    }; // wait a bit to let the user finish typing


    await (0, _promise.sleep)(500);
    if (cancelled) return null;

    try {
      const authClient = new _IdentityAuthClient.default();
      const identityAccessToken = await authClient.getAccessToken();
      if (cancelled) return null;
      const lookup = await _MatrixClientPeg.MatrixClientPeg.get().lookupThreePid(medium, address, undefined
      /* callback */
      , identityAccessToken);
      if (cancelled || lookup === null || !lookup.mxid) return null;
      const profile = await _MatrixClientPeg.MatrixClientPeg.get().getProfileInfo(lookup.mxid);
      if (cancelled || profile === null) return null;
      this.setState({
        suggestedList: [{
          // a UserAddressType
          addressType: medium,
          address: address,
          displayName: profile.displayname,
          avatarMxc: profile.avatar_url,
          isKnown: true
        }]
      });
    } catch (e) {
      console.error(e);
      this.setState({
        searchError: (0, _languageHandler._t)('Something went wrong!')
      });
    }
  },
  _getFilteredSuggestions: function () {
    // map addressType => set of addresses to avoid O(n*m) operation
    const selectedAddresses = {};
    this.state.selectedList.forEach(({
      address,
      addressType
    }) => {
      if (!selectedAddresses[addressType]) selectedAddresses[addressType] = new Set();
      selectedAddresses[addressType].add(address);
    }); // Filter out any addresses in the above already selected addresses (matching both type and address)

    return this.state.suggestedList.filter(({
      address,
      addressType
    }) => {
      return !(selectedAddresses[addressType] && selectedAddresses[addressType].has(address));
    });
  },
  _onPaste: function (e) {
    // Prevent the text being pasted into the textarea
    e.preventDefault();
    const text = e.clipboardData.getData("text"); // Process it as a list of addresses to add instead

    this._addAddressesToList(text.split(/[\s,]+/));
  },

  onUseDefaultIdentityServerClick(e) {
    e.preventDefault(); // Update the IS in account data. Actually using it may trigger terms.
    // eslint-disable-next-line react-hooks/rules-of-hooks

    (0, _IdentityServerUtils.useDefaultIdentityServer)(); // Add email as a valid address type.

    const {
      validAddressTypes
    } = this.state;
    validAddressTypes.push('email');
    this.setState({
      validAddressTypes
    });
  },

  onManageSettingsClick(e) {
    e.preventDefault();

    _dispatcher.default.fire(_actions.Action.ViewUserSettings);

    this.onCancel();
  },

  render: function () {
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const DialogButtons = sdk.getComponent('views.elements.DialogButtons');
    const AddressSelector = sdk.getComponent("elements.AddressSelector");
    this.scrollElement = null;
    let inputLabel;

    if (this.props.description) {
      inputLabel = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_label"
      }, /*#__PURE__*/_react.default.createElement("label", {
        htmlFor: "textinput"
      }, this.props.description));
    }

    const query = []; // create the invite list

    if (this.state.selectedList.length > 0) {
      const AddressTile = sdk.getComponent("elements.AddressTile");

      for (let i = 0; i < this.state.selectedList.length; i++) {
        query.push( /*#__PURE__*/_react.default.createElement(AddressTile, {
          key: i,
          address: this.state.selectedList[i],
          canDismiss: true,
          onDismissed: this.onDismissed(i),
          showAddress: this.props.pickerType === 'user'
        }));
      }
    } // Add the query at the end


    query.push( /*#__PURE__*/_react.default.createElement("textarea", {
      key: this.state.selectedList.length,
      onPaste: this._onPaste,
      rows: "1",
      id: "textinput",
      ref: this._textinput,
      className: "mx_AddressPickerDialog_input",
      onChange: this.onQueryChanged,
      placeholder: this.getPlaceholder(),
      defaultValue: this.props.value,
      autoFocus: this.props.focus
    }));

    const filteredSuggestedList = this._getFilteredSuggestions();

    let error;
    let addressSelector;

    if (this.state.invalidAddressError) {
      const validTypeDescriptions = this.state.validAddressTypes.map(t => (0, _languageHandler._t)(addressTypeName[t]));
      error = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_error"
      }, (0, _languageHandler._t)("You have entered an invalid address."), /*#__PURE__*/_react.default.createElement("br", null), (0, _languageHandler._t)("Try using one of the following valid address types: %(validTypesList)s.", {
        validTypesList: validTypeDescriptions.join(", ")
      }));
    } else if (this.state.searchError) {
      error = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_error"
      }, this.state.searchError);
    } else if (this.state.query.length > 0 && filteredSuggestedList.length === 0 && !this.state.busy) {
      error = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressPickerDialog_error"
      }, (0, _languageHandler._t)("No results"));
    } else {
      addressSelector = /*#__PURE__*/_react.default.createElement(AddressSelector, {
        ref: ref => {
          this.addressSelector = ref;
        },
        addressList: filteredSuggestedList,
        showAddress: this.props.pickerType === 'user',
        onSelected: this.onSelected,
        truncateAt: TRUNCATE_QUERY_LIST
      });
    }

    let identityServer; // If picker cannot currently accept e-mail but should be able to

    if (this.props.pickerType === 'user' && !this.state.validAddressTypes.includes('email') && this.props.validAddressTypes.includes('email')) {
      const defaultIdentityServerUrl = (0, _IdentityServerUtils.getDefaultIdentityServerUrl)();

      if (defaultIdentityServerUrl) {
        identityServer = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AddressPickerDialog_identityServer"
        }, (0, _languageHandler._t)("Use an identity server to invite by email. " + "<default>Use the default (%(defaultIdentityServerName)s)</default> " + "or manage in <settings>Settings</settings>.", {
          defaultIdentityServerName: (0, _UrlUtils.abbreviateUrl)(defaultIdentityServerUrl)
        }, {
          default: sub => /*#__PURE__*/_react.default.createElement("a", {
            href: "#",
            onClick: this.onUseDefaultIdentityServerClick
          }, sub),
          settings: sub => /*#__PURE__*/_react.default.createElement("a", {
            href: "#",
            onClick: this.onManageSettingsClick
          }, sub)
        }));
      } else {
        identityServer = /*#__PURE__*/_react.default.createElement("div", {
          className: "mx_AddressPickerDialog_identityServer"
        }, (0, _languageHandler._t)("Use an identity server to invite by email. " + "Manage in <settings>Settings</settings>.", {}, {
          settings: sub => /*#__PURE__*/_react.default.createElement("a", {
            href: "#",
            onClick: this.onManageSettingsClick
          }, sub)
        }));
      }
    }

    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: "mx_AddressPickerDialog",
      onKeyDown: this.onKeyDown,
      onFinished: this.props.onFinished,
      title: this.props.title
    }, inputLabel, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_Dialog_content"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AddressPickerDialog_inputContainer"
    }, query), error, addressSelector, this.props.extraNode, identityServer), /*#__PURE__*/_react.default.createElement(DialogButtons, {
      primaryButton: this.props.button,
      onPrimaryButtonClick: this.onButtonClick,
      onCancel: this.onCancel
    }));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQWRkcmVzc1BpY2tlckRpYWxvZy5qcyJdLCJuYW1lcyI6WyJUUlVOQ0FURV9RVUVSWV9MSVNUIiwiUVVFUllfVVNFUl9ESVJFQ1RPUllfREVCT1VOQ0VfTVMiLCJhZGRyZXNzVHlwZU5hbWUiLCJkaXNwbGF5TmFtZSIsInByb3BUeXBlcyIsInRpdGxlIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsImRlc2NyaXB0aW9uIiwibm9kZSIsImV4dHJhTm9kZSIsInZhbHVlIiwicGxhY2Vob2xkZXIiLCJvbmVPZlR5cGUiLCJmdW5jIiwicm9vbUlkIiwiYnV0dG9uIiwiZm9jdXMiLCJib29sIiwidmFsaWRBZGRyZXNzVHlwZXMiLCJhcnJheU9mIiwib25lT2YiLCJhZGRyZXNzVHlwZXMiLCJvbkZpbmlzaGVkIiwiZ3JvdXBJZCIsInBpY2tlclR5cGUiLCJpbmNsdWRlU2VsZiIsImdldERlZmF1bHRQcm9wcyIsImdldEluaXRpYWxTdGF0ZSIsInByb3BzIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0SWRlbnRpdHlTZXJ2ZXJVcmwiLCJpbmNsdWRlcyIsImZpbHRlciIsInR5cGUiLCJpbnZhbGlkQWRkcmVzc0Vycm9yIiwic2VsZWN0ZWRMaXN0IiwiYnVzeSIsInNlYXJjaEVycm9yIiwic2VydmVyU3VwcG9ydHNVc2VyRGlyZWN0b3J5IiwicXVlcnkiLCJzdWdnZXN0ZWRMaXN0IiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl90ZXh0aW5wdXQiLCJjb21wb25lbnREaWRNb3VudCIsImN1cnJlbnQiLCJnZXRQbGFjZWhvbGRlciIsInN0YXRlIiwib25CdXR0b25DbGljayIsInNsaWNlIiwiX2FkZEFkZHJlc3Nlc1RvTGlzdCIsIm9uQ2FuY2VsIiwib25LZXlEb3duIiwiZSIsInRleHRJbnB1dCIsInVuZGVmaW5lZCIsImtleSIsIktleSIsIkVTQ0FQRSIsInN0b3BQcm9wYWdhdGlvbiIsInByZXZlbnREZWZhdWx0IiwiQVJST1dfVVAiLCJhZGRyZXNzU2VsZWN0b3IiLCJtb3ZlU2VsZWN0aW9uVXAiLCJBUlJPV19ET1dOIiwibW92ZVNlbGVjdGlvbkRvd24iLCJsZW5ndGgiLCJDT01NQSIsIkVOVEVSIiwiVEFCIiwiY2hvb3NlU2VsZWN0aW9uIiwiQkFDS1NQQUNFIiwib25EaXNtaXNzZWQiLCJvblF1ZXJ5Q2hhbmdlZCIsImV2IiwidGFyZ2V0IiwicXVlcnlDaGFuZ2VkRGVib3VuY2VyIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsIl9kb05haXZlR3JvdXBTZWFyY2giLCJfZG9Vc2VyRGlyZWN0b3J5U2VhcmNoIiwiX2RvTG9jYWxTZWFyY2giLCJfZG9OYWl2ZUdyb3VwUm9vbVNlYXJjaCIsIl9kb1Jvb21TZWFyY2giLCJjb25zb2xlIiwiZXJyb3IiLCJzZXRTdGF0ZSIsImluZGV4Iiwic3BsaWNlIiwiX2NhbmNlbFRocmVlcGlkTG9va3VwIiwib25DbGljayIsIm9uU2VsZWN0ZWQiLCJwdXNoIiwiX2dldEZpbHRlcmVkU3VnZ2VzdGlvbnMiLCJsb3dlckNhc2VRdWVyeSIsInRvTG93ZXJDYXNlIiwiZ2V0R3JvdXBVc2VycyIsInRoZW4iLCJyZXNwIiwicmVzdWx0cyIsImNodW5rIiwiZm9yRWFjaCIsInUiLCJ1c2VySWRNYXRjaCIsInVzZXJfaWQiLCJkaXNwbGF5TmFtZU1hdGNoIiwiZGlzcGxheW5hbWUiLCJhdmF0YXJfdXJsIiwiZGlzcGxheV9uYW1lIiwiX3Byb2Nlc3NSZXN1bHRzIiwiY2F0Y2giLCJlcnIiLCJlcnJjb2RlIiwibWVzc2FnZSIsIkdyb3VwU3RvcmUiLCJnZXRHcm91cFJvb21zIiwiciIsIm5hbWVNYXRjaCIsIm5hbWUiLCJ0b3BpY01hdGNoIiwidG9waWMiLCJhbGlhc01hdGNoIiwiY2Fub25pY2FsX2FsaWFzIiwicm9vbV9pZCIsInJvb21zIiwiZ2V0Um9vbXMiLCJyb29tIiwicmFuayIsIkluZmluaXR5IiwibmFtZUV2ZW50IiwiY3VycmVudFN0YXRlIiwiZ2V0U3RhdGVFdmVudHMiLCJnZXRDb250ZW50IiwiY2Fub25pY2FsQWxpYXMiLCJnZXRDYW5vbmljYWxBbGlhcyIsImFsaWFzRXZlbnRzIiwiYWxpYXNlcyIsIm1hcCIsInJlZHVjZSIsImEiLCJiIiwiY29uY2F0Iiwic2hvcnRlc3RNYXRjaGluZ0FsaWFzTGVuZ3RoIiwiYWxpYXMiLCJhdmF0YXJFdmVudCIsImF2YXRhclVybCIsInVybCIsInNvcnRlZFJlc3VsdHMiLCJzb3J0Iiwic2VhcmNoVXNlckRpcmVjdG9yeSIsInRlcm0iLCJxdWVyeUxvd2VyY2FzZSIsImdldFVzZXJzIiwidXNlciIsInVzZXJJZCIsImluZGV4T2YiLCJyZXN1bHQiLCJjbGllbnQiLCJnZXRSb29tIiwidG9tYnN0b25lIiwicmVwbGFjZW1lbnRSb29tIiwiYWRkcmVzc1R5cGUiLCJhZGRyZXNzIiwiYXZhdGFyTXhjIiwiaXNLbm93biIsImNyZWRlbnRpYWxzIiwiYWRkclR5cGUiLCJFbWFpbCIsImxvb2tzVmFsaWQiLCJ1bnNoaWZ0IiwiX2xvb2t1cFRocmVlcGlkIiwibW92ZVNlbGVjdGlvblRvcCIsImFkZHJlc3NUZXh0cyIsImhhc0Vycm9yIiwiYWRkcmVzc1RleHQiLCJ0cmltIiwiYWRkck9iaiIsImdldFVzZXIiLCJtZWRpdW0iLCJjYW5jZWxsZWQiLCJhdXRoQ2xpZW50IiwiSWRlbnRpdHlBdXRoQ2xpZW50IiwiaWRlbnRpdHlBY2Nlc3NUb2tlbiIsImdldEFjY2Vzc1Rva2VuIiwibG9va3VwIiwibG9va3VwVGhyZWVQaWQiLCJteGlkIiwicHJvZmlsZSIsImdldFByb2ZpbGVJbmZvIiwic2VsZWN0ZWRBZGRyZXNzZXMiLCJTZXQiLCJhZGQiLCJoYXMiLCJfb25QYXN0ZSIsInRleHQiLCJjbGlwYm9hcmREYXRhIiwiZ2V0RGF0YSIsInNwbGl0Iiwib25Vc2VEZWZhdWx0SWRlbnRpdHlTZXJ2ZXJDbGljayIsIm9uTWFuYWdlU2V0dGluZ3NDbGljayIsImRpcyIsImZpcmUiLCJBY3Rpb24iLCJWaWV3VXNlclNldHRpbmdzIiwicmVuZGVyIiwiQmFzZURpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIkRpYWxvZ0J1dHRvbnMiLCJBZGRyZXNzU2VsZWN0b3IiLCJzY3JvbGxFbGVtZW50IiwiaW5wdXRMYWJlbCIsIkFkZHJlc3NUaWxlIiwiaSIsImZpbHRlcmVkU3VnZ2VzdGVkTGlzdCIsInZhbGlkVHlwZURlc2NyaXB0aW9ucyIsInQiLCJ2YWxpZFR5cGVzTGlzdCIsImpvaW4iLCJyZWYiLCJpZGVudGl0eVNlcnZlciIsImRlZmF1bHRJZGVudGl0eVNlcnZlclVybCIsImRlZmF1bHRJZGVudGl0eVNlcnZlck5hbWUiLCJkZWZhdWx0Iiwic3ViIiwic2V0dGluZ3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBbUJBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQW5DQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUNBLE1BQU1BLG1CQUFtQixHQUFHLEVBQTVCO0FBQ0EsTUFBTUMsZ0NBQWdDLEdBQUcsR0FBekM7QUFFQSxNQUFNQyxlQUFlLEdBQUc7QUFDcEIsZ0JBQWMsMEJBQUksV0FBSixDQURNO0FBRXBCLGdCQUFjLDBCQUFJLGdCQUFKLENBRk07QUFHcEIsV0FBUywwQkFBSSxlQUFKO0FBSFcsQ0FBeEI7O2VBT2UsK0JBQWlCO0FBQzVCQyxFQUFBQSxXQUFXLEVBQUUscUJBRGU7QUFHNUJDLEVBQUFBLFNBQVMsRUFBRTtBQUNQQyxJQUFBQSxLQUFLLEVBQUVDLG1CQUFVQyxNQUFWLENBQWlCQyxVQURqQjtBQUVQQyxJQUFBQSxXQUFXLEVBQUVILG1CQUFVSSxJQUZoQjtBQUdQO0FBQ0FDLElBQUFBLFNBQVMsRUFBRUwsbUJBQVVJLElBSmQ7QUFLUEUsSUFBQUEsS0FBSyxFQUFFTixtQkFBVUMsTUFMVjtBQU1QTSxJQUFBQSxXQUFXLEVBQUVQLG1CQUFVUSxTQUFW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Q29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3LCAyMDE4LCAyMDE5IE5ldyBWZWN0b3IgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcblxuaW1wb3J0IHsgX3QsIF90ZCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSAnLi4vLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gJy4uLy4uLy4uL01hdHJpeENsaWVudFBlZyc7XG5pbXBvcnQgZGlzIGZyb20gJy4uLy4uLy4uL2Rpc3BhdGNoZXIvZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBhZGRyZXNzVHlwZXMsIGdldEFkZHJlc3NUeXBlIH0gZnJvbSAnLi4vLi4vLi4vVXNlckFkZHJlc3MuanMnO1xuaW1wb3J0IEdyb3VwU3RvcmUgZnJvbSAnLi4vLi4vLi4vc3RvcmVzL0dyb3VwU3RvcmUnO1xuaW1wb3J0ICogYXMgRW1haWwgZnJvbSAnLi4vLi4vLi4vZW1haWwnO1xuaW1wb3J0IElkZW50aXR5QXV0aENsaWVudCBmcm9tICcuLi8uLi8uLi9JZGVudGl0eUF1dGhDbGllbnQnO1xuaW1wb3J0IHsgZ2V0RGVmYXVsdElkZW50aXR5U2VydmVyVXJsLCB1c2VEZWZhdWx0SWRlbnRpdHlTZXJ2ZXIgfSBmcm9tICcuLi8uLi8uLi91dGlscy9JZGVudGl0eVNlcnZlclV0aWxzJztcbmltcG9ydCB7IGFiYnJldmlhdGVVcmwgfSBmcm9tICcuLi8uLi8uLi91dGlscy9VcmxVdGlscyc7XG5pbXBvcnQge3NsZWVwfSBmcm9tIFwiLi4vLi4vLi4vdXRpbHMvcHJvbWlzZVwiO1xuaW1wb3J0IHtLZXl9IGZyb20gXCIuLi8uLi8uLi9LZXlib2FyZFwiO1xuaW1wb3J0IHtBY3Rpb259IGZyb20gXCIuLi8uLi8uLi9kaXNwYXRjaGVyL2FjdGlvbnNcIjtcblxuY29uc3QgVFJVTkNBVEVfUVVFUllfTElTVCA9IDQwO1xuY29uc3QgUVVFUllfVVNFUl9ESVJFQ1RPUllfREVCT1VOQ0VfTVMgPSAyMDA7XG5cbmNvbnN0IGFkZHJlc3NUeXBlTmFtZSA9IHtcbiAgICAnbXgtdXNlci1pZCc6IF90ZChcIk1hdHJpeCBJRFwiKSxcbiAgICAnbXgtcm9vbS1pZCc6IF90ZChcIk1hdHJpeCBSb29tIElEXCIpLFxuICAgICdlbWFpbCc6IF90ZChcImVtYWlsIGFkZHJlc3NcIiksXG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiBcIkFkZHJlc3NQaWNrZXJEaWFsb2dcIixcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICB0aXRsZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBkZXNjcmlwdGlvbjogUHJvcFR5cGVzLm5vZGUsXG4gICAgICAgIC8vIEV4dHJhIG5vZGUgaW5zZXJ0ZWQgYWZ0ZXIgcGlja2VyIGlucHV0LCBkcm9wZG93biBhbmQgZXJyb3JzXG4gICAgICAgIGV4dHJhTm9kZTogUHJvcFR5cGVzLm5vZGUsXG4gICAgICAgIHZhbHVlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBwbGFjZWhvbGRlcjogUHJvcFR5cGVzLm9uZU9mVHlwZShbUHJvcFR5cGVzLnN0cmluZywgUHJvcFR5cGVzLmZ1bmNdKSxcbiAgICAgICAgcm9vbUlkOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICBidXR0b246IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgIGZvY3VzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgdmFsaWRBZGRyZXNzVHlwZXM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5vbmVPZihhZGRyZXNzVHlwZXMpKSxcbiAgICAgICAgb25GaW5pc2hlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgZ3JvdXBJZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgICAgLy8gVGhlIHR5cGUgb2YgZW50aXR5IHRvIHNlYXJjaCBmb3IuIERlZmF1bHQ6ICd1c2VyJy5cbiAgICAgICAgcGlja2VyVHlwZTogUHJvcFR5cGVzLm9uZU9mKFsndXNlcicsICdyb29tJ10pLFxuICAgICAgICAvLyBXaGV0aGVyIHRoZSBjdXJyZW50IHVzZXIgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBhZGRyZXNzZXMgcmV0dXJuZWQuIE9ubHlcbiAgICAgICAgLy8gYXBwbGljYWJsZSB3aGVuIHBpY2tlclR5cGUgaXMgYHVzZXJgLiBEZWZhdWx0OiBmYWxzZS5cbiAgICAgICAgaW5jbHVkZVNlbGY6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IFwiXCIsXG4gICAgICAgICAgICBmb2N1czogdHJ1ZSxcbiAgICAgICAgICAgIHZhbGlkQWRkcmVzc1R5cGVzOiBhZGRyZXNzVHlwZXMsXG4gICAgICAgICAgICBwaWNrZXJUeXBlOiAndXNlcicsXG4gICAgICAgICAgICBpbmNsdWRlU2VsZjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCB2YWxpZEFkZHJlc3NUeXBlcyA9IHRoaXMucHJvcHMudmFsaWRBZGRyZXNzVHlwZXM7XG4gICAgICAgIC8vIFJlbW92ZSBlbWFpbCBmcm9tIHZhbGlkQWRkcmVzc1R5cGVzIGlmIG5vIElTIGlzIGNvbmZpZ3VyZWQuIEl0IG1heSBiZSBhZGRlZCBhdCBhIGxhdGVyIHN0YWdlIGJ5IHRoZSB1c2VyXG4gICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldElkZW50aXR5U2VydmVyVXJsKCkgJiYgdmFsaWRBZGRyZXNzVHlwZXMuaW5jbHVkZXMoXCJlbWFpbFwiKSkge1xuICAgICAgICAgICAgdmFsaWRBZGRyZXNzVHlwZXMgPSB2YWxpZEFkZHJlc3NUeXBlcy5maWx0ZXIodHlwZSA9PiB0eXBlICE9PSBcImVtYWlsXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdG8gc2hvdyBhbiBlcnJvciBtZXNzYWdlIGJlY2F1c2Ugb2YgYW4gaW52YWxpZCBhZGRyZXNzXG4gICAgICAgICAgICBpbnZhbGlkQWRkcmVzc0Vycm9yOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIExpc3Qgb2YgVXNlckFkZHJlc3NUeXBlIG9iamVjdHMgcmVwcmVzZW50aW5nXG4gICAgICAgICAgICAvLyB0aGUgbGlzdCBvZiBhZGRyZXNzZXMgd2UncmUgZ29pbmcgdG8gaW52aXRlXG4gICAgICAgICAgICBzZWxlY3RlZExpc3Q6IFtdLFxuICAgICAgICAgICAgLy8gV2hldGhlciBhIHNlYXJjaCBpcyBvbmdvaW5nXG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIC8vIEFuIGVycm9yIG1lc3NhZ2UgZ2VuZXJhdGVkIGR1cmluZyB0aGUgdXNlciBkaXJlY3Rvcnkgc2VhcmNoXG4gICAgICAgICAgICBzZWFyY2hFcnJvcjogbnVsbCxcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdGhlIHNlcnZlciBzdXBwb3J0cyB0aGUgdXNlcl9kaXJlY3RvcnkgQVBJXG4gICAgICAgICAgICBzZXJ2ZXJTdXBwb3J0c1VzZXJEaXJlY3Rvcnk6IHRydWUsXG4gICAgICAgICAgICAvLyBUaGUgcXVlcnkgYmVpbmcgc2VhcmNoZWQgZm9yXG4gICAgICAgICAgICBxdWVyeTogXCJcIixcbiAgICAgICAgICAgIC8vIExpc3Qgb2YgVXNlckFkZHJlc3NUeXBlIG9iamVjdHMgcmVwcmVzZW50aW5nIHRoZSBzZXQgb2ZcbiAgICAgICAgICAgIC8vIGF1dG8tY29tcGxldGlvbiByZXN1bHRzIGZvciB0aGUgY3VycmVudCBzZWFyY2ggcXVlcnkuXG4gICAgICAgICAgICBzdWdnZXN0ZWRMaXN0OiBbXSxcbiAgICAgICAgICAgIC8vIExpc3Qgb2YgYWRkcmVzcyB0eXBlcyBpbml0aWFsaXNlZCBmcm9tIHByb3BzLCBidXQgbWF5IGNoYW5nZSB3aGlsZSB0aGVcbiAgICAgICAgICAgIC8vIGRpYWxvZyBpcyBvcGVuIGFuZCByZXByZXNlbnRzIHRoZSBzdXBwb3J0ZWQgbGlzdCBvZiBhZGRyZXNzIHR5cGVzIGF0IHRoaXMgdGltZS5cbiAgICAgICAgICAgIHZhbGlkQWRkcmVzc1R5cGVzLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gUmVwbGFjZSBjb21wb25lbnQgd2l0aCByZWFsIGNsYXNzLCB1c2UgY29uc3RydWN0b3IgZm9yIHJlZnNcbiAgICBVTlNBRkVfY29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdGV4dGlucHV0ID0gY3JlYXRlUmVmKCk7XG4gICAgfSxcblxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZm9jdXMpIHtcbiAgICAgICAgICAgIC8vIFNldCB0aGUgY3Vyc29yIGF0IHRoZSBlbmQgb2YgdGhlIHRleHQgaW5wdXRcbiAgICAgICAgICAgIHRoaXMuX3RleHRpbnB1dC5jdXJyZW50LnZhbHVlID0gdGhpcy5wcm9wcy52YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRQbGFjZWhvbGRlcigpIHtcbiAgICAgICAgY29uc3QgeyBwbGFjZWhvbGRlciB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgaWYgKHR5cGVvZiBwbGFjZWhvbGRlciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyd2lzZSBpdCdzIGEgZnVuY3Rpb24sIGFzIGNoZWNrZWQgYnkgcHJvcCB0eXBlcy5cbiAgICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyKHRoaXMuc3RhdGUudmFsaWRBZGRyZXNzVHlwZXMpO1xuICAgIH0sXG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHNlbGVjdGVkTGlzdCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRMaXN0LnNsaWNlKCk7XG4gICAgICAgIC8vIENoZWNrIHRoZSB0ZXh0IGlucHV0IGZpZWxkIHRvIHNlZSBpZiB1c2VyIGhhcyBhbiB1bmNvbnZlcnRlZCBhZGRyZXNzXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuZCBpdCdzIHZhbGlkIGFkZCBpdCB0byB0aGUgbG9jYWwgc2VsZWN0ZWRMaXN0XG4gICAgICAgIGlmICh0aGlzLl90ZXh0aW5wdXQuY3VycmVudC52YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGlzdCA9IHRoaXMuX2FkZEFkZHJlc3Nlc1RvTGlzdChbdGhpcy5fdGV4dGlucHV0LmN1cnJlbnQudmFsdWVdKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZExpc3QgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQodHJ1ZSwgc2VsZWN0ZWRMaXN0KTtcbiAgICB9LFxuXG4gICAgb25DYW5jZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgIH0sXG5cbiAgICBvbktleURvd246IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc3QgdGV4dElucHV0ID0gdGhpcy5fdGV4dGlucHV0LmN1cnJlbnQgPyB0aGlzLl90ZXh0aW5wdXQuY3VycmVudC52YWx1ZSA6IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoZS5rZXkgPT09IEtleS5FU0NBUEUpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoZmFsc2UpO1xuICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSBLZXkuQVJST1dfVVApIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAodGhpcy5hZGRyZXNzU2VsZWN0b3IpIHRoaXMuYWRkcmVzc1NlbGVjdG9yLm1vdmVTZWxlY3Rpb25VcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSBLZXkuQVJST1dfRE9XTikge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmFkZHJlc3NTZWxlY3RvcikgdGhpcy5hZGRyZXNzU2VsZWN0b3IubW92ZVNlbGVjdGlvbkRvd24oKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnN1Z2dlc3RlZExpc3QubGVuZ3RoID4gMCAmJiBbS2V5LkNPTU1BLCBLZXkuRU5URVIsIEtleS5UQUJdLmluY2x1ZGVzKGUua2V5KSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmFkZHJlc3NTZWxlY3RvcikgdGhpcy5hZGRyZXNzU2VsZWN0b3IuY2hvb3NlU2VsZWN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGV4dElucHV0Lmxlbmd0aCA9PT0gMCAmJiB0aGlzLnN0YXRlLnNlbGVjdGVkTGlzdC5sZW5ndGggJiYgZS5rZXkgPT09IEtleS5CQUNLU1BBQ0UpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLm9uRGlzbWlzc2VkKHRoaXMuc3RhdGUuc2VsZWN0ZWRMaXN0Lmxlbmd0aCAtIDEpKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09IEtleS5FTlRFUikge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmICh0ZXh0SW5wdXQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBub3RoaW5nIGluIHRoZSBpbnB1dCBib3gsIHN1Ym1pdCB0aGUgZm9ybVxuICAgICAgICAgICAgICAgIHRoaXMub25CdXR0b25DbGljaygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGRBZGRyZXNzZXNUb0xpc3QoW3RleHRJbnB1dF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRleHRJbnB1dCAmJiAoZS5rZXkgPT09IEtleS5DT01NQSB8fCBlLmtleSA9PT0gS2V5LlRBQikpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLl9hZGRBZGRyZXNzZXNUb0xpc3QoW3RleHRJbnB1dF0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUXVlcnlDaGFuZ2VkOiBmdW5jdGlvbihldikge1xuICAgICAgICBjb25zdCBxdWVyeSA9IGV2LnRhcmdldC52YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMucXVlcnlDaGFuZ2VkRGVib3VuY2VyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5xdWVyeUNoYW5nZWREZWJvdW5jZXIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE9ubHkgZG8gc2VhcmNoIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzZWFyY2hcbiAgICAgICAgaWYgKHF1ZXJ5Lmxlbmd0aCA+IDAgJiYgcXVlcnkgIT09ICdAJyAmJiBxdWVyeS5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdGhpcy5xdWVyeUNoYW5nZWREZWJvdW5jZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5waWNrZXJUeXBlID09PSAndXNlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMuZ3JvdXBJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9OYWl2ZUdyb3VwU2VhcmNoKHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLnNlcnZlclN1cHBvcnRzVXNlckRpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9Vc2VyRGlyZWN0b3J5U2VhcmNoKHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvTG9jYWxTZWFyY2gocXVlcnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnBpY2tlclR5cGUgPT09ICdyb29tJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5ncm91cElkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb05haXZlR3JvdXBSb29tU2VhcmNoKHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvUm9vbVNlYXJjaChxdWVyeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVbmtub3duIHBpY2tlclR5cGUnLCB0aGlzLnByb3BzLnBpY2tlclR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIFFVRVJZX1VTRVJfRElSRUNUT1JZX0RFQk9VTkNFX01TKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHN1Z2dlc3RlZExpc3Q6IFtdLFxuICAgICAgICAgICAgICAgIHF1ZXJ5OiBcIlwiLFxuICAgICAgICAgICAgICAgIHNlYXJjaEVycm9yOiBudWxsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25EaXNtaXNzZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZExpc3QgPSB0aGlzLnN0YXRlLnNlbGVjdGVkTGlzdC5zbGljZSgpO1xuICAgICAgICAgICAgc2VsZWN0ZWRMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZExpc3QsXG4gICAgICAgICAgICAgICAgc3VnZ2VzdGVkTGlzdDogW10sXG4gICAgICAgICAgICAgICAgcXVlcnk6IFwiXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jYW5jZWxUaHJlZXBpZExvb2t1cCkgdGhpcy5fY2FuY2VsVGhyZWVwaWRMb29rdXAoKTtcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgb25DbGljazogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25TZWxlY3RlZChpbmRleCk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uU2VsZWN0ZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkTGlzdCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRMaXN0LnNsaWNlKCk7XG4gICAgICAgIHNlbGVjdGVkTGlzdC5wdXNoKHRoaXMuX2dldEZpbHRlcmVkU3VnZ2VzdGlvbnMoKVtpbmRleF0pO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGlzdCxcbiAgICAgICAgICAgIHN1Z2dlc3RlZExpc3Q6IFtdLFxuICAgICAgICAgICAgcXVlcnk6IFwiXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fY2FuY2VsVGhyZWVwaWRMb29rdXApIHRoaXMuX2NhbmNlbFRocmVlcGlkTG9va3VwKCk7XG4gICAgfSxcblxuICAgIF9kb05haXZlR3JvdXBTZWFyY2g6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IGxvd2VyQ2FzZVF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiB0cnVlLFxuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBzZWFyY2hFcnJvcjogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRHcm91cFVzZXJzKHRoaXMucHJvcHMuZ3JvdXBJZCkudGhlbigocmVzcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgcmVzcC5jaHVuay5mb3JFYWNoKCh1KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcklkTWF0Y2ggPSB1LnVzZXJfaWQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb3dlckNhc2VRdWVyeSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU5hbWVNYXRjaCA9ICh1LmRpc3BsYXluYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyQ2FzZVF1ZXJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoISh1c2VySWRNYXRjaCB8fCBkaXNwbGF5TmFtZU1hdGNoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6IHUudXNlcl9pZCxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyX3VybDogdS5hdmF0YXJfdXJsLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X25hbWU6IHUuZGlzcGxheW5hbWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NSZXN1bHRzKHJlc3VsdHMsIHF1ZXJ5KTtcbiAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igd2hpbHN0IHNlYXJjaGluZyBncm91cCByb29tczogJywgZXJyKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHNlYXJjaEVycm9yOiBlcnIuZXJyY29kZSA/IGVyci5tZXNzYWdlIDogX3QoJ1NvbWV0aGluZyB3ZW50IHdyb25nIScpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgYnVzeTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9kb05haXZlR3JvdXBSb29tU2VhcmNoOiBmdW5jdGlvbihxdWVyeSkge1xuICAgICAgICBjb25zdCBsb3dlckNhc2VRdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICAgICAgR3JvdXBTdG9yZS5nZXRHcm91cFJvb21zKHRoaXMucHJvcHMuZ3JvdXBJZCkuZm9yRWFjaCgocikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZU1hdGNoID0gKHIubmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb3dlckNhc2VRdWVyeSk7XG4gICAgICAgICAgICBjb25zdCB0b3BpY01hdGNoID0gKHIudG9waWMgfHwgJycpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXJDYXNlUXVlcnkpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXNNYXRjaCA9IChyLmNhbm9uaWNhbF9hbGlhcyB8fCAnJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb3dlckNhc2VRdWVyeSk7XG4gICAgICAgICAgICBpZiAoIShuYW1lTWF0Y2ggfHwgdG9waWNNYXRjaCB8fCBhbGlhc01hdGNoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgcm9vbV9pZDogci5yb29tX2lkLFxuICAgICAgICAgICAgICAgIGF2YXRhcl91cmw6IHIuYXZhdGFyX3VybCxcbiAgICAgICAgICAgICAgICBuYW1lOiByLm5hbWUgfHwgci5jYW5vbmljYWxfYWxpYXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3Byb2Nlc3NSZXN1bHRzKHJlc3VsdHMsIHF1ZXJ5KTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9kb1Jvb21TZWFyY2g6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IGxvd2VyQ2FzZVF1ZXJ5ID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3Qgcm9vbXMgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0Um9vbXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICByb29tcy5mb3JFYWNoKChyb29tKSA9PiB7XG4gICAgICAgICAgICBsZXQgcmFuayA9IEluZmluaXR5O1xuICAgICAgICAgICAgY29uc3QgbmFtZUV2ZW50ID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS5uYW1lJywgJycpO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVFdmVudCA/IG5hbWVFdmVudC5nZXRDb250ZW50KCkubmFtZSA6ICcnO1xuICAgICAgICAgICAgY29uc3QgY2Fub25pY2FsQWxpYXMgPSByb29tLmdldENhbm9uaWNhbEFsaWFzKCk7XG4gICAgICAgICAgICBjb25zdCBhbGlhc0V2ZW50cyA9IHJvb20uY3VycmVudFN0YXRlLmdldFN0YXRlRXZlbnRzKCdtLnJvb20uYWxpYXNlcycpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXNlcyA9IGFsaWFzRXZlbnRzLm1hcCgoZXYpID0+IGV2LmdldENvbnRlbnQoKS5hbGlhc2VzKS5yZWR1Y2UoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5jb25jYXQoYik7XG4gICAgICAgICAgICB9LCBbXSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaCA9IChuYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyQ2FzZVF1ZXJ5KTtcbiAgICAgICAgICAgIGxldCBhbGlhc01hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgc2hvcnRlc3RNYXRjaGluZ0FsaWFzTGVuZ3RoID0gSW5maW5pdHk7XG4gICAgICAgICAgICBhbGlhc2VzLmZvckVhY2goKGFsaWFzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKChhbGlhcyB8fCAnJykudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb3dlckNhc2VRdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxpYXNNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG9ydGVzdE1hdGNoaW5nQWxpYXNMZW5ndGggPiBhbGlhcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNob3J0ZXN0TWF0Y2hpbmdBbGlhc0xlbmd0aCA9IGFsaWFzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIShuYW1lTWF0Y2ggfHwgYWxpYXNNYXRjaCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhbGlhc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgLy8gQSBzaG9ydGVyIG1hdGNoaW5nIGFsaWFzIHdpbGwgZ2l2ZSBhIGJldHRlciByYW5rXG4gICAgICAgICAgICAgICAgcmFuayA9IHNob3J0ZXN0TWF0Y2hpbmdBbGlhc0xlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXZhdGFyRXZlbnQgPSByb29tLmN1cnJlbnRTdGF0ZS5nZXRTdGF0ZUV2ZW50cygnbS5yb29tLmF2YXRhcicsICcnKTtcbiAgICAgICAgICAgIGNvbnN0IGF2YXRhclVybCA9IGF2YXRhckV2ZW50ID8gYXZhdGFyRXZlbnQuZ2V0Q29udGVudCgpLnVybCA6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICByYW5rLFxuICAgICAgICAgICAgICAgIHJvb21faWQ6IHJvb20ucm9vbUlkLFxuICAgICAgICAgICAgICAgIGF2YXRhcl91cmw6IGF2YXRhclVybCxcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGNhbm9uaWNhbEFsaWFzIHx8IGFsaWFzZXNbMF0gfHwgX3QoJ1VubmFtZWQgUm9vbScpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNvcnQgYnkgcmFuayBhc2NlbmRpbmcgKGEgaGlnaCByYW5rIGJlaW5nIGxlc3MgcmVsZXZhbnQpXG4gICAgICAgIGNvbnN0IHNvcnRlZFJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLnJhbmsgLSBiLnJhbms7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NSZXN1bHRzKHNvcnRlZFJlc3VsdHMsIHF1ZXJ5KTtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9kb1VzZXJEaXJlY3RvcnlTZWFyY2g6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgYnVzeTogdHJ1ZSxcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgc2VhcmNoRXJyb3I6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VhcmNoVXNlckRpcmVjdG9yeSh7XG4gICAgICAgICAgICB0ZXJtOiBxdWVyeSxcbiAgICAgICAgfSkudGhlbigocmVzcCkgPT4ge1xuICAgICAgICAgICAgLy8gVGhlIHF1ZXJ5IG1pZ2h0IGhhdmUgY2hhbmdlZCBzaW5jZSB3ZSBzZW50IHRoZSByZXF1ZXN0LCBzbyBpZ25vcmVcbiAgICAgICAgICAgIC8vIHJlc3BvbnNlcyBmb3IgYW55dGhpbmcgb3RoZXIgdGhhbiB0aGUgbGF0ZXN0IHF1ZXJ5LlxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUucXVlcnkgIT09IHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jlc3VsdHMocmVzcC5yZXN1bHRzLCBxdWVyeSk7XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHdoaWxzdCBzZWFyY2hpbmcgdXNlciBkaXJlY3Rvcnk6ICcsIGVycik7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBzZWFyY2hFcnJvcjogZXJyLmVycmNvZGUgPyBlcnIubWVzc2FnZSA6IF90KCdTb21ldGhpbmcgd2VudCB3cm9uZyEnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVyci5lcnJjb2RlID09PSAnTV9VTlJFQ09HTklaRUQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHNlcnZlclN1cHBvcnRzVXNlckRpcmVjdG9yeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gRG8gYSBsb2NhbCBzZWFyY2ggaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICB0aGlzLl9kb0xvY2FsU2VhcmNoKHF1ZXJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBidXN5OiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX2RvTG9jYWxTZWFyY2g6IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBzZWFyY2hFcnJvcjogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHF1ZXJ5TG93ZXJjYXNlID0gcXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VXNlcnMoKS5mb3JFYWNoKCh1c2VyKSA9PiB7XG4gICAgICAgICAgICBpZiAodXNlci51c2VySWQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHF1ZXJ5TG93ZXJjYXNlKSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgICB1c2VyLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihxdWVyeUxvd2VyY2FzZSkgPT09IC0xXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFB1dCByZXN1bHRzIGluIHRoZSBmb3JtYXQgb2YgdGhlIG5ldyBBUElcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdXNlcl9pZDogdXNlci51c2VySWQsXG4gICAgICAgICAgICAgICAgZGlzcGxheV9uYW1lOiB1c2VyLmRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgIGF2YXRhcl91cmw6IHVzZXIuYXZhdGFyVXJsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9wcm9jZXNzUmVzdWx0cyhyZXN1bHRzLCBxdWVyeSk7XG4gICAgfSxcblxuICAgIF9wcm9jZXNzUmVzdWx0czogZnVuY3Rpb24ocmVzdWx0cywgcXVlcnkpIHtcbiAgICAgICAgY29uc3Qgc3VnZ2VzdGVkTGlzdCA9IFtdO1xuICAgICAgICByZXN1bHRzLmZvckVhY2goKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5yb29tX2lkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb20gPSBjbGllbnQuZ2V0Um9vbShyZXN1bHQucm9vbV9pZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9tYnN0b25lID0gcm9vbS5jdXJyZW50U3RhdGUuZ2V0U3RhdGVFdmVudHMoJ20ucm9vbS50b21ic3RvbmUnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b21ic3RvbmUgJiYgdG9tYnN0b25lLmdldENvbnRlbnQoKSAmJiB0b21ic3RvbmUuZ2V0Q29udGVudCgpW1wicmVwbGFjZW1lbnRfcm9vbVwiXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRSb29tID0gY2xpZW50LmdldFJvb20odG9tYnN0b25lLmdldENvbnRlbnQoKVtcInJlcGxhY2VtZW50X3Jvb21cIl0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHJvb21zIHdpdGggdG9tYnN0b25lcyB3aGVyZSB3ZSBhcmUgYWxzbyBhd2FyZSBvZiB0aGUgcmVwbGFjZW1lbnQgcm9vbS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudFJvb20pIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdWdnZXN0ZWRMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzVHlwZTogJ214LXJvb20taWQnLFxuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOiByZXN1bHQucm9vbV9pZCxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHJlc3VsdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdmF0YXJNeGM6IHJlc3VsdC5hdmF0YXJfdXJsLFxuICAgICAgICAgICAgICAgICAgICBpc0tub3duOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5wcm9wcy5pbmNsdWRlU2VsZiAmJlxuICAgICAgICAgICAgICAgIHJlc3VsdC51c2VyX2lkID09PSBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlZGVudGlhbHMudXNlcklkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJldHVybiBvYmplY3RzLCBzdHJ1Y3R1cmUgb2Ygd2hpY2ggaXMgZGVmaW5lZFxuICAgICAgICAgICAgLy8gYnkgVXNlckFkZHJlc3NUeXBlXG4gICAgICAgICAgICBzdWdnZXN0ZWRMaXN0LnB1c2goe1xuICAgICAgICAgICAgICAgIGFkZHJlc3NUeXBlOiAnbXgtdXNlci1pZCcsXG4gICAgICAgICAgICAgICAgYWRkcmVzczogcmVzdWx0LnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IHJlc3VsdC5kaXNwbGF5X25hbWUsXG4gICAgICAgICAgICAgICAgYXZhdGFyTXhjOiByZXN1bHQuYXZhdGFyX3VybCxcbiAgICAgICAgICAgICAgICBpc0tub3duOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIElmIHRoZSBxdWVyeSBpcyBhIHZhbGlkIGFkZHJlc3MsIGFkZCBhbiBlbnRyeSBmb3IgdGhhdFxuICAgICAgICAvLyBUaGlzIGlzIGltcG9ydGFudCwgb3RoZXJ3aXNlIHRoZXJlJ3Mgbm8gd2F5IHRvIGludml0ZVxuICAgICAgICAvLyBhIHBlcmZlY3RseSB2YWxpZCBhZGRyZXNzIGlmIHRoZXJlIGFyZSBjbG9zZSBtYXRjaGVzLlxuICAgICAgICBjb25zdCBhZGRyVHlwZSA9IGdldEFkZHJlc3NUeXBlKHF1ZXJ5KTtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudmFsaWRBZGRyZXNzVHlwZXMuaW5jbHVkZXMoYWRkclR5cGUpKSB7XG4gICAgICAgICAgICBpZiAoYWRkclR5cGUgPT09ICdlbWFpbCcgJiYgIUVtYWlsLmxvb2tzVmFsaWQocXVlcnkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VhcmNoRXJyb3I6IF90KFwiVGhhdCBkb2Vzbid0IGxvb2sgbGlrZSBhIHZhbGlkIGVtYWlsIGFkZHJlc3NcIil9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWdnZXN0ZWRMaXN0LnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgIGFkZHJlc3NUeXBlOiBhZGRyVHlwZSxcbiAgICAgICAgICAgICAgICBhZGRyZXNzOiBxdWVyeSxcbiAgICAgICAgICAgICAgICBpc0tub3duOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbmNlbFRocmVlcGlkTG9va3VwKSB0aGlzLl9jYW5jZWxUaHJlZXBpZExvb2t1cCgpO1xuICAgICAgICAgICAgaWYgKGFkZHJUeXBlID09PSAnZW1haWwnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9va3VwVGhyZWVwaWQoYWRkclR5cGUsIHF1ZXJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN1Z2dlc3RlZExpc3QsXG4gICAgICAgICAgICBpbnZhbGlkQWRkcmVzc0Vycm9yOiBmYWxzZSxcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuYWRkcmVzc1NlbGVjdG9yKSB0aGlzLmFkZHJlc3NTZWxlY3Rvci5tb3ZlU2VsZWN0aW9uVG9wKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfYWRkQWRkcmVzc2VzVG9MaXN0OiBmdW5jdGlvbihhZGRyZXNzVGV4dHMpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRMaXN0ID0gdGhpcy5zdGF0ZS5zZWxlY3RlZExpc3Quc2xpY2UoKTtcblxuICAgICAgICBsZXQgaGFzRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgYWRkcmVzc1RleHRzLmZvckVhY2goKGFkZHJlc3NUZXh0KSA9PiB7XG4gICAgICAgICAgICBhZGRyZXNzVGV4dCA9IGFkZHJlc3NUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IGFkZHJUeXBlID0gZ2V0QWRkcmVzc1R5cGUoYWRkcmVzc1RleHQpO1xuICAgICAgICAgICAgY29uc3QgYWRkck9iaiA9IHtcbiAgICAgICAgICAgICAgICBhZGRyZXNzVHlwZTogYWRkclR5cGUsXG4gICAgICAgICAgICAgICAgYWRkcmVzczogYWRkcmVzc1RleHQsXG4gICAgICAgICAgICAgICAgaXNLbm93bjogZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUudmFsaWRBZGRyZXNzVHlwZXMuaW5jbHVkZXMoYWRkclR5cGUpKSB7XG4gICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhZGRyVHlwZSA9PT0gJ214LXVzZXItaWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlciA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRVc2VyKGFkZHJPYmouYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkck9iai5kaXNwbGF5TmFtZSA9IHVzZXIuZGlzcGxheU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGFkZHJPYmouYXZhdGFyTXhjID0gdXNlci5hdmF0YXJVcmw7XG4gICAgICAgICAgICAgICAgICAgIGFkZHJPYmouaXNLbm93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhZGRyVHlwZSA9PT0gJ214LXJvb20taWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vbSA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRSb29tKGFkZHJPYmouYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgaWYgKHJvb20pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkck9iai5kaXNwbGF5TmFtZSA9IHJvb20ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgYWRkck9iai5hdmF0YXJNeGMgPSByb29tLmF2YXRhclVybDtcbiAgICAgICAgICAgICAgICAgICAgYWRkck9iai5pc0tub3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGVjdGVkTGlzdC5wdXNoKGFkZHJPYmopO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHNlbGVjdGVkTGlzdCxcbiAgICAgICAgICAgIHN1Z2dlc3RlZExpc3Q6IFtdLFxuICAgICAgICAgICAgcXVlcnk6IFwiXCIsXG4gICAgICAgICAgICBpbnZhbGlkQWRkcmVzc0Vycm9yOiBoYXNFcnJvciA/IHRydWUgOiB0aGlzLnN0YXRlLmludmFsaWRBZGRyZXNzRXJyb3IsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fY2FuY2VsVGhyZWVwaWRMb29rdXApIHRoaXMuX2NhbmNlbFRocmVlcGlkTG9va3VwKCk7XG4gICAgICAgIHJldHVybiBoYXNFcnJvciA/IG51bGwgOiBzZWxlY3RlZExpc3Q7XG4gICAgfSxcblxuICAgIF9sb29rdXBUaHJlZXBpZDogYXN5bmMgZnVuY3Rpb24obWVkaXVtLCBhZGRyZXNzKSB7XG4gICAgICAgIGxldCBjYW5jZWxsZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGNhbid0IHNhZmVseSByZW1vdmUgdGhpcyBhZnRlciB3ZSdyZSBkb25lXG4gICAgICAgIC8vIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyB0aGF0IGl0J3MgdGhlIHNhbWUgb25lLCBzbyB3ZSBqdXN0XG4gICAgICAgIC8vIGxlYXZlIGl0OiBpdCdzIHJlcGxhY2luZyB0aGUgb2xkIG9uZSBlYWNoIHRpbWUgc28gaXQnc1xuICAgICAgICAvLyBub3QgbGlrZSB0aGV5IGxlYWsuXG4gICAgICAgIHRoaXMuX2NhbmNlbFRocmVlcGlkTG9va3VwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHdhaXQgYSBiaXQgdG8gbGV0IHRoZSB1c2VyIGZpbmlzaCB0eXBpbmdcbiAgICAgICAgYXdhaXQgc2xlZXAoNTAwKTtcbiAgICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhDbGllbnQgPSBuZXcgSWRlbnRpdHlBdXRoQ2xpZW50KCk7XG4gICAgICAgICAgICBjb25zdCBpZGVudGl0eUFjY2Vzc1Rva2VuID0gYXdhaXQgYXV0aENsaWVudC5nZXRBY2Nlc3NUb2tlbigpO1xuICAgICAgICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIGNvbnN0IGxvb2t1cCA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5sb29rdXBUaHJlZVBpZChcbiAgICAgICAgICAgICAgICBtZWRpdW0sXG4gICAgICAgICAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQgLyogY2FsbGJhY2sgKi8sXG4gICAgICAgICAgICAgICAgaWRlbnRpdHlBY2Nlc3NUb2tlbixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY2FuY2VsbGVkIHx8IGxvb2t1cCA9PT0gbnVsbCB8fCAhbG9va3VwLm14aWQpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICBjb25zdCBwcm9maWxlID0gYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFByb2ZpbGVJbmZvKGxvb2t1cC5teGlkKTtcbiAgICAgICAgICAgIGlmIChjYW5jZWxsZWQgfHwgcHJvZmlsZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIHN1Z2dlc3RlZExpc3Q6IFt7XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgVXNlckFkZHJlc3NUeXBlXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3NUeXBlOiBtZWRpdW0sXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBwcm9maWxlLmRpc3BsYXluYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdmF0YXJNeGM6IHByb2ZpbGUuYXZhdGFyX3VybCxcbiAgICAgICAgICAgICAgICAgICAgaXNLbm93bjogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgc2VhcmNoRXJyb3I6IF90KCdTb21ldGhpbmcgd2VudCB3cm9uZyEnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRGaWx0ZXJlZFN1Z2dlc3Rpb25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gbWFwIGFkZHJlc3NUeXBlID0+IHNldCBvZiBhZGRyZXNzZXMgdG8gYXZvaWQgTyhuKm0pIG9wZXJhdGlvblxuICAgICAgICBjb25zdCBzZWxlY3RlZEFkZHJlc3NlcyA9IHt9O1xuICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkTGlzdC5mb3JFYWNoKCh7YWRkcmVzcywgYWRkcmVzc1R5cGV9KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXNlbGVjdGVkQWRkcmVzc2VzW2FkZHJlc3NUeXBlXSkgc2VsZWN0ZWRBZGRyZXNzZXNbYWRkcmVzc1R5cGVdID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgc2VsZWN0ZWRBZGRyZXNzZXNbYWRkcmVzc1R5cGVdLmFkZChhZGRyZXNzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRmlsdGVyIG91dCBhbnkgYWRkcmVzc2VzIGluIHRoZSBhYm92ZSBhbHJlYWR5IHNlbGVjdGVkIGFkZHJlc3NlcyAobWF0Y2hpbmcgYm90aCB0eXBlIGFuZCBhZGRyZXNzKVxuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdWdnZXN0ZWRMaXN0LmZpbHRlcigoe2FkZHJlc3MsIGFkZHJlc3NUeXBlfSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEoc2VsZWN0ZWRBZGRyZXNzZXNbYWRkcmVzc1R5cGVdICYmIHNlbGVjdGVkQWRkcmVzc2VzW2FkZHJlc3NUeXBlXS5oYXMoYWRkcmVzcykpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX29uUGFzdGU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gUHJldmVudCB0aGUgdGV4dCBiZWluZyBwYXN0ZWQgaW50byB0aGUgdGV4dGFyZWFcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJ0ZXh0XCIpO1xuICAgICAgICAvLyBQcm9jZXNzIGl0IGFzIGEgbGlzdCBvZiBhZGRyZXNzZXMgdG8gYWRkIGluc3RlYWRcbiAgICAgICAgdGhpcy5fYWRkQWRkcmVzc2VzVG9MaXN0KHRleHQuc3BsaXQoL1tcXHMsXSsvKSk7XG4gICAgfSxcblxuICAgIG9uVXNlRGVmYXVsdElkZW50aXR5U2VydmVyQ2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBJUyBpbiBhY2NvdW50IGRhdGEuIEFjdHVhbGx5IHVzaW5nIGl0IG1heSB0cmlnZ2VyIHRlcm1zLlxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3NcbiAgICAgICAgdXNlRGVmYXVsdElkZW50aXR5U2VydmVyKCk7XG5cbiAgICAgICAgLy8gQWRkIGVtYWlsIGFzIGEgdmFsaWQgYWRkcmVzcyB0eXBlLlxuICAgICAgICBjb25zdCB7IHZhbGlkQWRkcmVzc1R5cGVzIH0gPSB0aGlzLnN0YXRlO1xuICAgICAgICB2YWxpZEFkZHJlc3NUeXBlcy5wdXNoKCdlbWFpbCcpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHsgdmFsaWRBZGRyZXNzVHlwZXMgfSk7XG4gICAgfSxcblxuICAgIG9uTWFuYWdlU2V0dGluZ3NDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZGlzLmZpcmUoQWN0aW9uLlZpZXdVc2VyU2V0dGluZ3MpO1xuICAgICAgICB0aGlzLm9uQ2FuY2VsKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IEJhc2VEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5kaWFsb2dzLkJhc2VEaWFsb2cnKTtcbiAgICAgICAgY29uc3QgRGlhbG9nQnV0dG9ucyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmVsZW1lbnRzLkRpYWxvZ0J1dHRvbnMnKTtcbiAgICAgICAgY29uc3QgQWRkcmVzc1NlbGVjdG9yID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLkFkZHJlc3NTZWxlY3RvclwiKTtcbiAgICAgICAgdGhpcy5zY3JvbGxFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICBsZXQgaW5wdXRMYWJlbDtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGlucHV0TGFiZWwgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NQaWNrZXJEaWFsb2dfbGFiZWxcIj5cbiAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInRleHRpbnB1dFwiPnt0aGlzLnByb3BzLmRlc2NyaXB0aW9ufTwvbGFiZWw+XG4gICAgICAgICAgICA8L2Rpdj47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBxdWVyeSA9IFtdO1xuICAgICAgICAvLyBjcmVhdGUgdGhlIGludml0ZSBsaXN0XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBBZGRyZXNzVGlsZSA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5BZGRyZXNzVGlsZVwiKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdGF0ZS5zZWxlY3RlZExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBxdWVyeS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICA8QWRkcmVzc1RpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3M9e3RoaXMuc3RhdGUuc2VsZWN0ZWRMaXN0W2ldfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuRGlzbWlzcz17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlzbWlzc2VkPXt0aGlzLm9uRGlzbWlzc2VkKGkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2hvd0FkZHJlc3M9e3RoaXMucHJvcHMucGlja2VyVHlwZSA9PT0gJ3VzZXInfSAvPixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoZSBxdWVyeSBhdCB0aGUgZW5kXG4gICAgICAgIHF1ZXJ5LnB1c2goXG4gICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICBrZXk9e3RoaXMuc3RhdGUuc2VsZWN0ZWRMaXN0Lmxlbmd0aH1cbiAgICAgICAgICAgICAgICBvblBhc3RlPXt0aGlzLl9vblBhc3RlfVxuICAgICAgICAgICAgICAgIHJvd3M9XCIxXCJcbiAgICAgICAgICAgICAgICBpZD1cInRleHRpbnB1dFwiXG4gICAgICAgICAgICAgICAgcmVmPXt0aGlzLl90ZXh0aW5wdXR9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfQWRkcmVzc1BpY2tlckRpYWxvZ19pbnB1dFwiXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25RdWVyeUNoYW5nZWR9XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3RoaXMuZ2V0UGxhY2Vob2xkZXIoKX1cbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3RoaXMucHJvcHMudmFsdWV9XG4gICAgICAgICAgICAgICAgYXV0b0ZvY3VzPXt0aGlzLnByb3BzLmZvY3VzfT5cbiAgICAgICAgICAgIDwvdGV4dGFyZWE+LFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGZpbHRlcmVkU3VnZ2VzdGVkTGlzdCA9IHRoaXMuX2dldEZpbHRlcmVkU3VnZ2VzdGlvbnMoKTtcblxuICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgIGxldCBhZGRyZXNzU2VsZWN0b3I7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmludmFsaWRBZGRyZXNzRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVHlwZURlc2NyaXB0aW9ucyA9IHRoaXMuc3RhdGUudmFsaWRBZGRyZXNzVHlwZXMubWFwKCh0KSA9PiBfdChhZGRyZXNzVHlwZU5hbWVbdF0pKTtcbiAgICAgICAgICAgIGVycm9yID0gPGRpdiBjbGFzc05hbWU9XCJteF9BZGRyZXNzUGlja2VyRGlhbG9nX2Vycm9yXCI+XG4gICAgICAgICAgICAgICAgeyBfdChcIllvdSBoYXZlIGVudGVyZWQgYW4gaW52YWxpZCBhZGRyZXNzLlwiKSB9XG4gICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgeyBfdChcIlRyeSB1c2luZyBvbmUgb2YgdGhlIGZvbGxvd2luZyB2YWxpZCBhZGRyZXNzIHR5cGVzOiAlKHZhbGlkVHlwZXNMaXN0KXMuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRUeXBlc0xpc3Q6IHZhbGlkVHlwZURlc2NyaXB0aW9ucy5qb2luKFwiLCBcIiksXG4gICAgICAgICAgICAgICAgfSkgfVxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUuc2VhcmNoRXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gPGRpdiBjbGFzc05hbWU9XCJteF9BZGRyZXNzUGlja2VyRGlhbG9nX2Vycm9yXCI+eyB0aGlzLnN0YXRlLnNlYXJjaEVycm9yIH08L2Rpdj47XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5xdWVyeS5sZW5ndGggPiAwICYmIGZpbHRlcmVkU3VnZ2VzdGVkTGlzdC5sZW5ndGggPT09IDAgJiYgIXRoaXMuc3RhdGUuYnVzeSkge1xuICAgICAgICAgICAgZXJyb3IgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NQaWNrZXJEaWFsb2dfZXJyb3JcIj57IF90KFwiTm8gcmVzdWx0c1wiKSB9PC9kaXY+O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkcmVzc1NlbGVjdG9yID0gKFxuICAgICAgICAgICAgICAgIDxBZGRyZXNzU2VsZWN0b3IgcmVmPXsocmVmKSA9PiB7dGhpcy5hZGRyZXNzU2VsZWN0b3IgPSByZWY7fX1cbiAgICAgICAgICAgICAgICAgICAgYWRkcmVzc0xpc3Q9e2ZpbHRlcmVkU3VnZ2VzdGVkTGlzdH1cbiAgICAgICAgICAgICAgICAgICAgc2hvd0FkZHJlc3M9e3RoaXMucHJvcHMucGlja2VyVHlwZSA9PT0gJ3VzZXInfVxuICAgICAgICAgICAgICAgICAgICBvblNlbGVjdGVkPXt0aGlzLm9uU2VsZWN0ZWR9XG4gICAgICAgICAgICAgICAgICAgIHRydW5jYXRlQXQ9e1RSVU5DQVRFX1FVRVJZX0xJU1R9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaWRlbnRpdHlTZXJ2ZXI7XG4gICAgICAgIC8vIElmIHBpY2tlciBjYW5ub3QgY3VycmVudGx5IGFjY2VwdCBlLW1haWwgYnV0IHNob3VsZCBiZSBhYmxlIHRvXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBpY2tlclR5cGUgPT09ICd1c2VyJyAmJiAhdGhpcy5zdGF0ZS52YWxpZEFkZHJlc3NUeXBlcy5pbmNsdWRlcygnZW1haWwnKVxuICAgICAgICAgICAgJiYgdGhpcy5wcm9wcy52YWxpZEFkZHJlc3NUeXBlcy5pbmNsdWRlcygnZW1haWwnKSkge1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdElkZW50aXR5U2VydmVyVXJsID0gZ2V0RGVmYXVsdElkZW50aXR5U2VydmVyVXJsKCk7XG4gICAgICAgICAgICBpZiAoZGVmYXVsdElkZW50aXR5U2VydmVyVXJsKSB7XG4gICAgICAgICAgICAgICAgaWRlbnRpdHlTZXJ2ZXIgPSA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NQaWNrZXJEaWFsb2dfaWRlbnRpdHlTZXJ2ZXJcIj57X3QoXG4gICAgICAgICAgICAgICAgICAgIFwiVXNlIGFuIGlkZW50aXR5IHNlcnZlciB0byBpbnZpdGUgYnkgZW1haWwuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGVmYXVsdD5Vc2UgdGhlIGRlZmF1bHQgKCUoZGVmYXVsdElkZW50aXR5U2VydmVyTmFtZSlzKTwvZGVmYXVsdD4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIm9yIG1hbmFnZSBpbiA8c2V0dGluZ3M+U2V0dGluZ3M8L3NldHRpbmdzPi5cIixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdElkZW50aXR5U2VydmVyTmFtZTogYWJicmV2aWF0ZVVybChkZWZhdWx0SWRlbnRpdHlTZXJ2ZXJVcmwpLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBzdWIgPT4gPGEgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLm9uVXNlRGVmYXVsdElkZW50aXR5U2VydmVyQ2xpY2t9PntzdWJ9PC9hPixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiBzdWIgPT4gPGEgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLm9uTWFuYWdlU2V0dGluZ3NDbGlja30+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICl9PC9kaXY+O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZGVudGl0eVNlcnZlciA9IDxkaXYgY2xhc3NOYW1lPVwibXhfQWRkcmVzc1BpY2tlckRpYWxvZ19pZGVudGl0eVNlcnZlclwiPntfdChcbiAgICAgICAgICAgICAgICAgICAgXCJVc2UgYW4gaWRlbnRpdHkgc2VydmVyIHRvIGludml0ZSBieSBlbWFpbC4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIk1hbmFnZSBpbiA8c2V0dGluZ3M+U2V0dGluZ3M8L3NldHRpbmdzPi5cIixcbiAgICAgICAgICAgICAgICAgICAge30sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiBzdWIgPT4gPGEgaHJlZj1cIiNcIiBvbkNsaWNrPXt0aGlzLm9uTWFuYWdlU2V0dGluZ3NDbGlja30+e3N1Yn08L2E+LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICl9PC9kaXY+O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCYXNlRGlhbG9nIGNsYXNzTmFtZT1cIm14X0FkZHJlc3NQaWNrZXJEaWFsb2dcIiBvbktleURvd249e3RoaXMub25LZXlEb3dufVxuICAgICAgICAgICAgICAgIG9uRmluaXNoZWQ9e3RoaXMucHJvcHMub25GaW5pc2hlZH0gdGl0bGU9e3RoaXMucHJvcHMudGl0bGV9PlxuICAgICAgICAgICAgICAgIHtpbnB1dExhYmVsfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfRGlhbG9nX2NvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BZGRyZXNzUGlja2VyRGlhbG9nX2lucHV0Q29udGFpbmVyXCI+eyBxdWVyeSB9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIHsgZXJyb3IgfVxuICAgICAgICAgICAgICAgICAgICB7IGFkZHJlc3NTZWxlY3RvciB9XG4gICAgICAgICAgICAgICAgICAgIHsgdGhpcy5wcm9wcy5leHRyYU5vZGUgfVxuICAgICAgICAgICAgICAgICAgICB7IGlkZW50aXR5U2VydmVyIH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8RGlhbG9nQnV0dG9ucyBwcmltYXJ5QnV0dG9uPXt0aGlzLnByb3BzLmJ1dHRvbn1cbiAgICAgICAgICAgICAgICAgICAgb25QcmltYXJ5QnV0dG9uQ2xpY2s9e3RoaXMub25CdXR0b25DbGlja31cbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw9e3RoaXMub25DYW5jZWx9IC8+XG4gICAgICAgICAgICA8L0Jhc2VEaWFsb2c+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19