"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _MatrixClientPeg = require("../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../index"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _Modal = _interopRequireDefault(require("../../Modal"));

var _HtmlUtils = require("../../HtmlUtils");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _languageHandler = require("../../languageHandler");

var _DirectoryUtils = require("../../utils/DirectoryUtils");

var _Analytics = _interopRequireDefault(require("../../Analytics"));

var _contentRepo = require("matrix-js-sdk/src/content-repo");

var _NetworkDropdown = require("../views/directory/NetworkDropdown");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
const MAX_NAME_LENGTH = 80;
const MAX_TOPIC_LENGTH = 160;

function track(action) {
  _Analytics.default.trackEvent('RoomDirectory', action);
}

var _default = (0, _createReactClass.default)({
  displayName: 'RoomDirectory',
  propTypes: {
    onFinished: _propTypes.default.func.isRequired
  },
  getInitialState: function () {
    return {
      publicRooms: [],
      loading: true,
      protocolsLoading: true,
      error: null,
      instanceId: undefined,
      roomServer: _MatrixClientPeg.MatrixClientPeg.getHomeserverName(),
      filterString: null
    };
  },
  // TODO: [REACT-WARNING] Move this to constructor
  UNSAFE_componentWillMount: function () {
    this._unmounted = false;
    this.nextBatch = null;
    this.filterTimeout = null;
    this.scrollPanel = null;
    this.protocols = null;
    this.setState({
      protocolsLoading: true
    });

    if (!_MatrixClientPeg.MatrixClientPeg.get()) {
      // We may not have a client yet when invoked from welcome page
      this.setState({
        protocolsLoading: false
      });
      return;
    }

    _MatrixClientPeg.MatrixClientPeg.get().getThirdpartyProtocols().then(response => {
      this.protocols = response;
      this.setState({
        protocolsLoading: false
      });
    }, err => {
      console.warn("error loading thirdparty protocols: ".concat(err));
      this.setState({
        protocolsLoading: false
      });

      if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
        // Guests currently aren't allowed to use this API, so
        // ignore this as otherwise this error is literally the
        // thing you see when loading the client!
        return;
      }

      track('Failed to get protocol list from homeserver');
      this.setState({
        error: (0, _languageHandler._t)('Riot failed to get the protocol list from the homeserver. ' + 'The homeserver may be too old to support third party networks.')
      });
    });

    this.refreshRoomList();
  },
  componentWillUnmount: function () {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    this._unmounted = true;
  },
  refreshRoomList: function () {
    this.nextBatch = null;
    this.setState({
      publicRooms: [],
      loading: true
    });
    this.getMoreRooms();
  },
  getMoreRooms: function () {
    if (!_MatrixClientPeg.MatrixClientPeg.get()) return Promise.resolve();
    this.setState({
      loading: true
    });
    const my_filter_string = this.state.filterString;
    const my_server = this.state.roomServer; // remember the next batch token when we sent the request
    // too. If it's changed, appending to the list will corrupt it.

    const my_next_batch = this.nextBatch;
    const opts = {
      limit: 20
    };

    if (my_server != _MatrixClientPeg.MatrixClientPeg.getHomeserverName()) {
      opts.server = my_server;
    }

    if (this.state.instanceId === _NetworkDropdown.ALL_ROOMS) {
      opts.include_all_networks = true;
    } else if (this.state.instanceId) {
      opts.third_party_instance_id = this.state.instanceId;
    }

    if (this.nextBatch) opts.since = this.nextBatch;
    if (my_filter_string) opts.filter = {
      generic_search_term: my_filter_string
    };
    return _MatrixClientPeg.MatrixClientPeg.get().publicRooms(opts).then(data => {
      if (my_filter_string != this.state.filterString || my_server != this.state.roomServer || my_next_batch != this.nextBatch) {
        // if the filter or server has changed since this request was sent,
        // throw away the result (don't even clear the busy flag
        // since we must still have a request in flight)
        return;
      }

      if (this._unmounted) {
        // if we've been unmounted, we don't care either.
        return;
      }

      this.nextBatch = data.next_batch;
      this.setState(s => {
        s.publicRooms.push(...(data.chunk || []));
        s.loading = false;
        return s;
      });
      return Boolean(data.next_batch);
    }, err => {
      if (my_filter_string != this.state.filterString || my_server != this.state.roomServer || my_next_batch != this.nextBatch) {
        // as above: we don't care about errors for old
        // requests either
        return;
      }

      if (this._unmounted) {
        // if we've been unmounted, we don't care either.
        return;
      }

      console.error("Failed to get publicRooms: %s", JSON.stringify(err));
      track('Failed to get public room list');
      this.setState({
        loading: false,
        error: "".concat((0, _languageHandler._t)('Riot failed to get the public room list.'), " ") + "".concat(err && err.message ? err.message : (0, _languageHandler._t)('The homeserver may be unavailable or overloaded.'))
      });
    });
  },

  /**
   * A limited interface for removing rooms from the directory.
   * Will set the room to not be publicly visible and delete the
   * default alias. In the long term, it would be better to allow
   * HS admins to do this through the RoomSettings interface, but
   * this needs SPEC-417.
   */
  removeFromDirectory: function (room) {
    const alias = get_display_alias_for_room(room);
    const name = room.name || alias || (0, _languageHandler._t)('Unnamed room');
    const QuestionDialog = sdk.getComponent("dialogs.QuestionDialog");
    const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");
    let desc;

    if (alias) {
      desc = (0, _languageHandler._t)('Delete the room alias %(alias)s and remove %(name)s from the directory?', {
        alias: alias,
        name: name
      });
    } else {
      desc = (0, _languageHandler._t)('Remove %(name)s from the directory?', {
        name: name
      });
    }

    _Modal.default.createTrackedDialog('Remove from Directory', '', QuestionDialog, {
      title: (0, _languageHandler._t)('Remove from Directory'),
      description: desc,
      onFinished: should_delete => {
        if (!should_delete) return;
        const Loader = sdk.getComponent("elements.Spinner");

        const modal = _Modal.default.createDialog(Loader);

        let step = (0, _languageHandler._t)('remove %(name)s from the directory.', {
          name: name
        });

        _MatrixClientPeg.MatrixClientPeg.get().setRoomDirectoryVisibility(room.room_id, 'private').then(() => {
          if (!alias) return;
          step = (0, _languageHandler._t)('delete the alias.');
          return _MatrixClientPeg.MatrixClientPeg.get().deleteAlias(alias);
        }).then(() => {
          modal.close();
          this.refreshRoomList();
        }, err => {
          modal.close();
          this.refreshRoomList();
          console.error("Failed to " + step + ": " + err);

          _Modal.default.createTrackedDialog('Remove from Directory Error', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Error'),
            description: err && err.message ? err.message : (0, _languageHandler._t)('The server may be unavailable or overloaded')
          });
        });
      }
    });
  },
  onRoomClicked: function (room, ev) {
    if (ev.shiftKey) {
      ev.preventDefault();
      this.removeFromDirectory(room);
    } else {
      this.showRoom(room);
    }
  },
  onOptionChange: function (server, instanceId) {
    // clear next batch so we don't try to load more rooms
    this.nextBatch = null;
    this.setState({
      // Clear the public rooms out here otherwise we needlessly
      // spend time filtering lots of rooms when we're about to
      // to clear the list anyway.
      publicRooms: [],
      roomServer: server,
      instanceId: instanceId,
      error: null
    }, this.refreshRoomList); // We also refresh the room list each time even though this
    // filtering is client-side. It hopefully won't be client side
    // for very long, and we may have fetched a thousand rooms to
    // find the five gitter ones, at which point we do not want
    // to render all those rooms when switching back to 'all networks'.
    // Easiest to just blow away the state & re-fetch.
  },
  onFillRequest: function (backwards) {
    if (backwards || !this.nextBatch) return Promise.resolve(false);
    return this.getMoreRooms();
  },
  onFilterChange: function (alias) {
    this.setState({
      filterString: alias || null
    }); // don't send the request for a little bit,
    // no point hammering the server with a
    // request for every keystroke, let the
    // user finish typing.

    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    this.filterTimeout = setTimeout(() => {
      this.filterTimeout = null;
      this.refreshRoomList();
    }, 700);
  },
  onFilterClear: function () {
    // update immediately
    this.setState({
      filterString: null
    }, this.refreshRoomList);

    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
  },
  onJoinFromSearchClick: function (alias) {
    // If we don't have a particular instance id selected, just show that rooms alias
    if (!this.state.instanceId || this.state.instanceId === _NetworkDropdown.ALL_ROOMS) {
      // If the user specified an alias without a domain, add on whichever server is selected
      // in the dropdown
      if (alias.indexOf(':') == -1) {
        alias = alias + ':' + this.state.roomServer;
      }

      this.showRoomAlias(alias, true);
    } else {
      // This is a 3rd party protocol. Let's see if we can join it
      const protocolName = (0, _DirectoryUtils.protocolNameForInstanceId)(this.protocols, this.state.instanceId);
      const instance = (0, _DirectoryUtils.instanceForInstanceId)(this.protocols, this.state.instanceId);
      const fields = protocolName ? this._getFieldsForThirdPartyLocation(alias, this.protocols[protocolName], instance) : null;

      if (!fields) {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Unable to join network', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Unable to join network'),
          description: (0, _languageHandler._t)('Riot does not know how to join a room on this network')
        });

        return;
      }

      _MatrixClientPeg.MatrixClientPeg.get().getThirdpartyLocation(protocolName, fields).then(resp => {
        if (resp.length > 0 && resp[0].alias) {
          this.showRoomAlias(resp[0].alias, true);
        } else {
          const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

          _Modal.default.createTrackedDialog('Room not found', '', ErrorDialog, {
            title: (0, _languageHandler._t)('Room not found'),
            description: (0, _languageHandler._t)('Couldn\'t find a matching Matrix room')
          });
        }
      }, e => {
        const ErrorDialog = sdk.getComponent("dialogs.ErrorDialog");

        _Modal.default.createTrackedDialog('Fetching third party location failed', '', ErrorDialog, {
          title: (0, _languageHandler._t)('Fetching third party location failed'),
          description: (0, _languageHandler._t)('Unable to look up room ID from server')
        });
      });
    }
  },
  onPreviewClick: function (ev, room) {
    this.props.onFinished();

    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: room.room_id,
      should_peek: true
    });

    ev.stopPropagation();
  },
  onViewClick: function (ev, room) {
    this.props.onFinished();

    _dispatcher.default.dispatch({
      action: 'view_room',
      room_id: room.room_id,
      should_peek: false
    });

    ev.stopPropagation();
  },
  onJoinClick: function (ev, room) {
    this.showRoom(room, null, true);
    ev.stopPropagation();
  },
  onCreateRoomClick: function (room) {
    this.props.onFinished();

    _dispatcher.default.dispatch({
      action: 'view_create_room',
      public: true
    });
  },
  showRoomAlias: function (alias, autoJoin = false) {
    this.showRoom(null, alias, autoJoin);
  },
  showRoom: function (room, room_alias, autoJoin = false) {
    this.props.onFinished();
    const payload = {
      action: 'view_room',
      auto_join: autoJoin
    };

    if (room) {
      // Don't let the user view a room they won't be able to either
      // peek or join: fail earlier so they don't have to click back
      // to the directory.
      if (_MatrixClientPeg.MatrixClientPeg.get().isGuest()) {
        if (!room.world_readable && !room.guest_can_join) {
          _dispatcher.default.dispatch({
            action: 'require_registration'
          });

          return;
        }
      }

      if (!room_alias) {
        room_alias = get_display_alias_for_room(room);
      }

      payload.oob_data = {
        avatarUrl: room.avatar_url,
        // XXX: This logic is duplicated from the JS SDK which
        // would normally decide what the name is.
        name: room.name || room_alias || (0, _languageHandler._t)('Unnamed room')
      };

      if (this.state.roomServer) {
        payload.opts = {
          viaServers: [this.state.roomServer]
        };
      }
    } // It's not really possible to join Matrix rooms by ID because the HS has no way to know
    // which servers to start querying. However, there's no other way to join rooms in
    // this list without aliases at present, so if roomAlias isn't set here we have no
    // choice but to supply the ID.


    if (room_alias) {
      payload.room_alias = room_alias;
    } else {
      payload.room_id = room.room_id;
    }

    _dispatcher.default.dispatch(payload);
  },

  getRow(room) {
    const client = _MatrixClientPeg.MatrixClientPeg.get();

    const clientRoom = client.getRoom(room.room_id);
    const hasJoinedRoom = clientRoom && clientRoom.getMyMembership() === "join";
    const isGuest = client.isGuest();
    const BaseAvatar = sdk.getComponent('avatars.BaseAvatar');
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let previewButton;
    let joinOrViewButton;

    if (room.world_readable && !hasJoinedRoom) {
      previewButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "secondary",
        onClick: ev => this.onPreviewClick(ev, room)
      }, (0, _languageHandler._t)("Preview"));
    }

    if (hasJoinedRoom) {
      joinOrViewButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "secondary",
        onClick: ev => this.onViewClick(ev, room)
      }, (0, _languageHandler._t)("View"));
    } else if (!isGuest || room.guest_can_join) {
      joinOrViewButton = /*#__PURE__*/_react.default.createElement(AccessibleButton, {
        kind: "primary",
        onClick: ev => this.onJoinClick(ev, room)
      }, (0, _languageHandler._t)("Join"));
    }

    let name = room.name || get_display_alias_for_room(room) || (0, _languageHandler._t)('Unnamed room');

    if (name.length > MAX_NAME_LENGTH) {
      name = "".concat(name.substring(0, MAX_NAME_LENGTH), "...");
    }

    let topic = room.topic || '';

    if (topic.length > MAX_TOPIC_LENGTH) {
      topic = "".concat(topic.substring(0, MAX_TOPIC_LENGTH), "...");
    }

    topic = (0, _HtmlUtils.linkifyAndSanitizeHtml)(topic);
    const avatarUrl = (0, _contentRepo.getHttpUriForMxc)(_MatrixClientPeg.MatrixClientPeg.get().getHomeserverUrl(), room.avatar_url, 32, 32, "crop");
    return /*#__PURE__*/_react.default.createElement("tr", {
      key: room.room_id,
      onClick: ev => this.onRoomClicked(room, ev) // cancel onMouseDown otherwise shift-clicking highlights text
      ,
      onMouseDown: ev => {
        ev.preventDefault();
      }
    }, /*#__PURE__*/_react.default.createElement("td", {
      className: "mx_RoomDirectory_roomAvatar"
    }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      width: 32,
      height: 32,
      resizeMethod: "crop",
      name: name,
      idName: name,
      url: avatarUrl
    })), /*#__PURE__*/_react.default.createElement("td", {
      className: "mx_RoomDirectory_roomDescription"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomDirectory_name"
    }, name), "\xA0", /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomDirectory_topic",
      onClick: ev => {
        ev.stopPropagation();
      },
      dangerouslySetInnerHTML: {
        __html: topic
      }
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomDirectory_alias"
    }, get_display_alias_for_room(room))), /*#__PURE__*/_react.default.createElement("td", {
      className: "mx_RoomDirectory_roomMemberCount"
    }, room.num_joined_members), /*#__PURE__*/_react.default.createElement("td", {
      className: "mx_RoomDirectory_preview"
    }, previewButton), /*#__PURE__*/_react.default.createElement("td", {
      className: "mx_RoomDirectory_join"
    }, joinOrViewButton));
  },

  collectScrollPanel: function (element) {
    this.scrollPanel = element;
  },
  _stringLooksLikeId: function (s, field_type) {
    let pat = /^#[^\s]+:[^\s]/;

    if (field_type && field_type.regexp) {
      pat = new RegExp(field_type.regexp);
    }

    return pat.test(s);
  },
  _getFieldsForThirdPartyLocation: function (userInput, protocol, instance) {
    // make an object with the fields specified by that protocol. We
    // require that the values of all but the last field come from the
    // instance. The last is the user input.
    const requiredFields = protocol.location_fields;
    if (!requiredFields) return null;
    const fields = {};

    for (let i = 0; i < requiredFields.length - 1; ++i) {
      const thisField = requiredFields[i];
      if (instance.fields[thisField] === undefined) return null;
      fields[thisField] = instance.fields[thisField];
    }

    fields[requiredFields[requiredFields.length - 1]] = userInput;
    return fields;
  },

  /**
   * called by the parent component when PageUp/Down/etc is pressed.
   *
   * We pass it down to the scroll panel.
   */
  handleScrollKey: function (ev) {
    if (this.scrollPanel) {
      this.scrollPanel.handleScrollKey(ev);
    }
  },
  render: function () {
    const Loader = sdk.getComponent("elements.Spinner");
    const BaseDialog = sdk.getComponent('views.dialogs.BaseDialog');
    const AccessibleButton = sdk.getComponent('elements.AccessibleButton');
    let content;

    if (this.state.error) {
      content = this.state.error;
    } else if (this.state.protocolsLoading) {
      content = /*#__PURE__*/_react.default.createElement(Loader, null);
    } else {
      const rows = (this.state.publicRooms || []).map(room => this.getRow(room)); // we still show the scrollpanel, at least for now, because
      // otherwise we don't fetch more because we don't get a fill
      // request from the scrollpanel because there isn't one

      let spinner;

      if (this.state.loading) {
        spinner = /*#__PURE__*/_react.default.createElement(Loader, null);
      }

      let scrollpanel_content;

      if (rows.length === 0 && !this.state.loading) {
        scrollpanel_content = /*#__PURE__*/_react.default.createElement("i", null, (0, _languageHandler._t)('No rooms to show'));
      } else {
        scrollpanel_content = /*#__PURE__*/_react.default.createElement("table", {
          className: "mx_RoomDirectory_table"
        }, /*#__PURE__*/_react.default.createElement("tbody", null, rows));
      }

      const ScrollPanel = sdk.getComponent("structures.ScrollPanel");
      content = /*#__PURE__*/_react.default.createElement(ScrollPanel, {
        ref: this.collectScrollPanel,
        className: "mx_RoomDirectory_tableWrapper",
        onFillRequest: this.onFillRequest,
        stickyBottom: false,
        startAtBottom: false
      }, scrollpanel_content, spinner);
    }

    let listHeader;

    if (!this.state.protocolsLoading) {
      const NetworkDropdown = sdk.getComponent('directory.NetworkDropdown');
      const DirectorySearchBox = sdk.getComponent('elements.DirectorySearchBox');
      const protocolName = (0, _DirectoryUtils.protocolNameForInstanceId)(this.protocols, this.state.instanceId);
      let instance_expected_field_type;

      if (protocolName && this.protocols && this.protocols[protocolName] && this.protocols[protocolName].location_fields.length > 0 && this.protocols[protocolName].field_types) {
        const last_field = this.protocols[protocolName].location_fields.slice(-1)[0];
        instance_expected_field_type = this.protocols[protocolName].field_types[last_field];
      }

      let placeholder = (0, _languageHandler._t)('Find a room…');

      if (!this.state.instanceId || this.state.instanceId === _NetworkDropdown.ALL_ROOMS) {
        placeholder = (0, _languageHandler._t)("Find a room… (e.g. %(exampleRoom)s)", {
          exampleRoom: "#example:" + this.state.roomServer
        });
      } else if (instance_expected_field_type) {
        placeholder = instance_expected_field_type.placeholder;
      }

      let showJoinButton = this._stringLooksLikeId(this.state.filterString, instance_expected_field_type);

      if (protocolName) {
        const instance = (0, _DirectoryUtils.instanceForInstanceId)(this.protocols, this.state.instanceId);

        if (this._getFieldsForThirdPartyLocation(this.state.filterString, this.protocols[protocolName], instance) === null) {
          showJoinButton = false;
        }
      }

      listHeader = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_RoomDirectory_listheader"
      }, /*#__PURE__*/_react.default.createElement(DirectorySearchBox, {
        className: "mx_RoomDirectory_searchbox",
        onChange: this.onFilterChange,
        onClear: this.onFilterClear,
        onJoinClick: this.onJoinFromSearchClick,
        placeholder: placeholder,
        showJoinButton: showJoinButton
      }), /*#__PURE__*/_react.default.createElement(NetworkDropdown, {
        protocols: this.protocols,
        onOptionChange: this.onOptionChange,
        selectedServerName: this.state.roomServer,
        selectedInstanceId: this.state.instanceId
      }));
    }

    const explanation = (0, _languageHandler._t)("If you can't find the room you're looking for, ask for an invite or <a>Create a new room</a>.", null, {
      a: sub => {
        return /*#__PURE__*/_react.default.createElement(AccessibleButton, {
          kind: "secondary",
          onClick: this.onCreateRoomClick
        }, sub);
      }
    });
    return /*#__PURE__*/_react.default.createElement(BaseDialog, {
      className: 'mx_RoomDirectory_dialog',
      hasCancel: true,
      onFinished: this.props.onFinished,
      title: (0, _languageHandler._t)("Explore rooms")
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomDirectory"
    }, explanation, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_RoomDirectory_list"
    }, listHeader, content)));
  }
}); // Similar to matrix-react-sdk's MatrixTools.getDisplayAliasForRoom
// but works with the objects we get from the public room list


exports.default = _default;

function get_display_alias_for_room(room) {
  return room.canonical_alias || (room.aliases ? room.aliases[0] : "");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvUm9vbURpcmVjdG9yeS5qcyJdLCJuYW1lcyI6WyJNQVhfTkFNRV9MRU5HVEgiLCJNQVhfVE9QSUNfTEVOR1RIIiwidHJhY2siLCJhY3Rpb24iLCJBbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiZGlzcGxheU5hbWUiLCJwcm9wVHlwZXMiLCJvbkZpbmlzaGVkIiwiUHJvcFR5cGVzIiwiZnVuYyIsImlzUmVxdWlyZWQiLCJnZXRJbml0aWFsU3RhdGUiLCJwdWJsaWNSb29tcyIsImxvYWRpbmciLCJwcm90b2NvbHNMb2FkaW5nIiwiZXJyb3IiLCJpbnN0YW5jZUlkIiwidW5kZWZpbmVkIiwicm9vbVNlcnZlciIsIk1hdHJpeENsaWVudFBlZyIsImdldEhvbWVzZXJ2ZXJOYW1lIiwiZmlsdGVyU3RyaW5nIiwiVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudCIsIl91bm1vdW50ZWQiLCJuZXh0QmF0Y2giLCJmaWx0ZXJUaW1lb3V0Iiwic2Nyb2xsUGFuZWwiLCJwcm90b2NvbHMiLCJzZXRTdGF0ZSIsImdldCIsImdldFRoaXJkcGFydHlQcm90b2NvbHMiLCJ0aGVuIiwicmVzcG9uc2UiLCJlcnIiLCJjb25zb2xlIiwid2FybiIsImlzR3Vlc3QiLCJyZWZyZXNoUm9vbUxpc3QiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImNsZWFyVGltZW91dCIsImdldE1vcmVSb29tcyIsIlByb21pc2UiLCJyZXNvbHZlIiwibXlfZmlsdGVyX3N0cmluZyIsInN0YXRlIiwibXlfc2VydmVyIiwibXlfbmV4dF9iYXRjaCIsIm9wdHMiLCJsaW1pdCIsInNlcnZlciIsIkFMTF9ST09NUyIsImluY2x1ZGVfYWxsX25ldHdvcmtzIiwidGhpcmRfcGFydHlfaW5zdGFuY2VfaWQiLCJzaW5jZSIsImZpbHRlciIsImdlbmVyaWNfc2VhcmNoX3Rlcm0iLCJkYXRhIiwibmV4dF9iYXRjaCIsInMiLCJwdXNoIiwiY2h1bmsiLCJCb29sZWFuIiwiSlNPTiIsInN0cmluZ2lmeSIsIm1lc3NhZ2UiLCJyZW1vdmVGcm9tRGlyZWN0b3J5Iiwicm9vbSIsImFsaWFzIiwiZ2V0X2Rpc3BsYXlfYWxpYXNfZm9yX3Jvb20iLCJuYW1lIiwiUXVlc3Rpb25EaWFsb2ciLCJzZGsiLCJnZXRDb21wb25lbnQiLCJFcnJvckRpYWxvZyIsImRlc2MiLCJNb2RhbCIsImNyZWF0ZVRyYWNrZWREaWFsb2ciLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwic2hvdWxkX2RlbGV0ZSIsIkxvYWRlciIsIm1vZGFsIiwiY3JlYXRlRGlhbG9nIiwic3RlcCIsInNldFJvb21EaXJlY3RvcnlWaXNpYmlsaXR5Iiwicm9vbV9pZCIsImRlbGV0ZUFsaWFzIiwiY2xvc2UiLCJvblJvb21DbGlja2VkIiwiZXYiLCJzaGlmdEtleSIsInByZXZlbnREZWZhdWx0Iiwic2hvd1Jvb20iLCJvbk9wdGlvbkNoYW5nZSIsIm9uRmlsbFJlcXVlc3QiLCJiYWNrd2FyZHMiLCJvbkZpbHRlckNoYW5nZSIsInNldFRpbWVvdXQiLCJvbkZpbHRlckNsZWFyIiwib25Kb2luRnJvbVNlYXJjaENsaWNrIiwiaW5kZXhPZiIsInNob3dSb29tQWxpYXMiLCJwcm90b2NvbE5hbWUiLCJpbnN0YW5jZSIsImZpZWxkcyIsIl9nZXRGaWVsZHNGb3JUaGlyZFBhcnR5TG9jYXRpb24iLCJnZXRUaGlyZHBhcnR5TG9jYXRpb24iLCJyZXNwIiwibGVuZ3RoIiwiZSIsIm9uUHJldmlld0NsaWNrIiwicHJvcHMiLCJkaXMiLCJkaXNwYXRjaCIsInNob3VsZF9wZWVrIiwic3RvcFByb3BhZ2F0aW9uIiwib25WaWV3Q2xpY2siLCJvbkpvaW5DbGljayIsIm9uQ3JlYXRlUm9vbUNsaWNrIiwicHVibGljIiwiYXV0b0pvaW4iLCJyb29tX2FsaWFzIiwicGF5bG9hZCIsImF1dG9fam9pbiIsIndvcmxkX3JlYWRhYmxlIiwiZ3Vlc3RfY2FuX2pvaW4iLCJvb2JfZGF0YSIsImF2YXRhclVybCIsImF2YXRhcl91cmwiLCJ2aWFTZXJ2ZXJzIiwiZ2V0Um93IiwiY2xpZW50IiwiY2xpZW50Um9vbSIsImdldFJvb20iLCJoYXNKb2luZWRSb29tIiwiZ2V0TXlNZW1iZXJzaGlwIiwiQmFzZUF2YXRhciIsIkFjY2Vzc2libGVCdXR0b24iLCJwcmV2aWV3QnV0dG9uIiwiam9pbk9yVmlld0J1dHRvbiIsInN1YnN0cmluZyIsInRvcGljIiwiZ2V0SG9tZXNlcnZlclVybCIsIl9faHRtbCIsIm51bV9qb2luZWRfbWVtYmVycyIsImNvbGxlY3RTY3JvbGxQYW5lbCIsImVsZW1lbnQiLCJfc3RyaW5nTG9va3NMaWtlSWQiLCJmaWVsZF90eXBlIiwicGF0IiwicmVnZXhwIiwiUmVnRXhwIiwidGVzdCIsInVzZXJJbnB1dCIsInByb3RvY29sIiwicmVxdWlyZWRGaWVsZHMiLCJsb2NhdGlvbl9maWVsZHMiLCJpIiwidGhpc0ZpZWxkIiwiaGFuZGxlU2Nyb2xsS2V5IiwicmVuZGVyIiwiQmFzZURpYWxvZyIsImNvbnRlbnQiLCJyb3dzIiwibWFwIiwic3Bpbm5lciIsInNjcm9sbHBhbmVsX2NvbnRlbnQiLCJTY3JvbGxQYW5lbCIsImxpc3RIZWFkZXIiLCJOZXR3b3JrRHJvcGRvd24iLCJEaXJlY3RvcnlTZWFyY2hCb3giLCJpbnN0YW5jZV9leHBlY3RlZF9maWVsZF90eXBlIiwiZmllbGRfdHlwZXMiLCJsYXN0X2ZpZWxkIiwic2xpY2UiLCJwbGFjZWhvbGRlciIsImV4YW1wbGVSb29tIiwic2hvd0pvaW5CdXR0b24iLCJleHBsYW5hdGlvbiIsImEiLCJzdWIiLCJjYW5vbmljYWxfYWxpYXMiLCJhbGlhc2VzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUE5QkE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0NBLE1BQU1BLGVBQWUsR0FBRyxFQUF4QjtBQUNBLE1BQU1DLGdCQUFnQixHQUFHLEdBQXpCOztBQUVB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ZixPQUNLVixVQURMLEVBRUtOLE9BRkwsQ0FGSixDQU5KLENBREo7QUFnQkg7QUFubUIyQixDQUFqQixDLEVBc21CZjtBQUNBOzs7OztBQUNBLFNBQVM5RiwwQkFBVCxDQUFvQ0YsSUFBcEMsRUFBMEM7QUFDdEMsU0FBT0EsSUFBSSxDQUFDbUgsZUFBTCxLQUF5Qm5ILElBQUksQ0FBQ29ILE9BQUwsR0FBZXBILElBQUksQ0FBQ29ILE9BQUwsQ0FBYSxDQUFiLENBQWYsR0FBaUMsRUFBMUQsQ0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbkNvcHlyaWdodCAyMDE1LCAyMDE2IE9wZW5NYXJrZXQgTHRkXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cbkNvcHlyaWdodCAyMDE5IFRoZSBNYXRyaXgub3JnIEZvdW5kYXRpb24gQy5JLkMuXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjcmVhdGVSZWFjdENsYXNzIGZyb20gJ2NyZWF0ZS1yZWFjdC1jbGFzcyc7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gXCIuLi8uLi9pbmRleFwiO1xuaW1wb3J0IGRpcyBmcm9tIFwiLi4vLi4vZGlzcGF0Y2hlci9kaXNwYXRjaGVyXCI7XG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4uLy4uL01vZGFsXCI7XG5pbXBvcnQgeyBsaW5raWZ5QW5kU2FuaXRpemVIdG1sIH0gZnJvbSAnLi4vLi4vSHRtbFV0aWxzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgeyBpbnN0YW5jZUZvckluc3RhbmNlSWQsIHByb3RvY29sTmFtZUZvckluc3RhbmNlSWQgfSBmcm9tICcuLi8uLi91dGlscy9EaXJlY3RvcnlVdGlscyc7XG5pbXBvcnQgQW5hbHl0aWNzIGZyb20gJy4uLy4uL0FuYWx5dGljcyc7XG5pbXBvcnQge2dldEh0dHBVcmlGb3JNeGN9IGZyb20gXCJtYXRyaXgtanMtc2RrL3NyYy9jb250ZW50LXJlcG9cIjtcbmltcG9ydCB7QUxMX1JPT01TfSBmcm9tIFwiLi4vdmlld3MvZGlyZWN0b3J5L05ldHdvcmtEcm9wZG93blwiO1xuXG5jb25zdCBNQVhfTkFNRV9MRU5HVEggPSA4MDtcbmNvbnN0IE1BWF9UT1BJQ19MRU5HVEggPSAxNjA7XG5cbmZ1bmN0aW9uIHRyYWNrKGFjdGlvbikge1xuICAgIEFuYWx5dGljcy50cmFja0V2ZW50KCdSb29tRGlyZWN0b3J5JywgYWN0aW9uKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdSb29tRGlyZWN0b3J5JyxcblxuICAgIHByb3BUeXBlczoge1xuICAgICAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIH0sXG5cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHVibGljUm9vbXM6IFtdLFxuICAgICAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgICAgIHByb3RvY29sc0xvYWRpbmc6IHRydWUsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgIGluc3RhbmNlSWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJvb21TZXJ2ZXI6IE1hdHJpeENsaWVudFBlZy5nZXRIb21lc2VydmVyTmFtZSgpLFxuICAgICAgICAgICAgZmlsdGVyU3RyaW5nOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvLyBUT0RPOiBbUkVBQ1QtV0FSTklOR10gTW92ZSB0aGlzIHRvIGNvbnN0cnVjdG9yXG4gICAgVU5TQUZFX2NvbXBvbmVudFdpbGxNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm5leHRCYXRjaCA9IG51bGw7XG4gICAgICAgIHRoaXMuZmlsdGVyVGltZW91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGFuZWwgPSBudWxsO1xuICAgICAgICB0aGlzLnByb3RvY29scyA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cHJvdG9jb2xzTG9hZGluZzogdHJ1ZX0pO1xuICAgICAgICBpZiAoIU1hdHJpeENsaWVudFBlZy5nZXQoKSkge1xuICAgICAgICAgICAgLy8gV2UgbWF5IG5vdCBoYXZlIGEgY2xpZW50IHlldCB3aGVuIGludm9rZWQgZnJvbSB3ZWxjb21lIHBhZ2VcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb3RvY29sc0xvYWRpbmc6IGZhbHNlfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFRoaXJkcGFydHlQcm90b2NvbHMoKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcm90b2NvbHMgPSByZXNwb25zZTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb3RvY29sc0xvYWRpbmc6IGZhbHNlfSk7XG4gICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgZXJyb3IgbG9hZGluZyB0aGlyZHBhcnR5IHByb3RvY29sczogJHtlcnJ9YCk7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcm90b2NvbHNMb2FkaW5nOiBmYWxzZX0pO1xuICAgICAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHtcbiAgICAgICAgICAgICAgICAvLyBHdWVzdHMgY3VycmVudGx5IGFyZW4ndCBhbGxvd2VkIHRvIHVzZSB0aGlzIEFQSSwgc29cbiAgICAgICAgICAgICAgICAvLyBpZ25vcmUgdGhpcyBhcyBvdGhlcndpc2UgdGhpcyBlcnJvciBpcyBsaXRlcmFsbHkgdGhlXG4gICAgICAgICAgICAgICAgLy8gdGhpbmcgeW91IHNlZSB3aGVuIGxvYWRpbmcgdGhlIGNsaWVudCFcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmFjaygnRmFpbGVkIHRvIGdldCBwcm90b2NvbCBsaXN0IGZyb20gaG9tZXNlcnZlcicpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgZXJyb3I6IF90KFxuICAgICAgICAgICAgICAgICAgICAnUmlvdCBmYWlsZWQgdG8gZ2V0IHRoZSBwcm90b2NvbCBsaXN0IGZyb20gdGhlIGhvbWVzZXJ2ZXIuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVGhlIGhvbWVzZXJ2ZXIgbWF5IGJlIHRvbyBvbGQgdG8gc3VwcG9ydCB0aGlyZCBwYXJ0eSBuZXR3b3Jrcy4nLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoUm9vbUxpc3QoKTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5maWx0ZXJUaW1lb3V0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5maWx0ZXJUaW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91bm1vdW50ZWQgPSB0cnVlO1xuICAgIH0sXG5cbiAgICByZWZyZXNoUm9vbUxpc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm5leHRCYXRjaCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgcHVibGljUm9vbXM6IFtdLFxuICAgICAgICAgICAgbG9hZGluZzogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZ2V0TW9yZVJvb21zKCk7XG4gICAgfSxcblxuICAgIGdldE1vcmVSb29tczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghTWF0cml4Q2xpZW50UGVnLmdldCgpKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBsb2FkaW5nOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBteV9maWx0ZXJfc3RyaW5nID0gdGhpcy5zdGF0ZS5maWx0ZXJTdHJpbmc7XG4gICAgICAgIGNvbnN0IG15X3NlcnZlciA9IHRoaXMuc3RhdGUucm9vbVNlcnZlcjtcbiAgICAgICAgLy8gcmVtZW1iZXIgdGhlIG5leHQgYmF0Y2ggdG9rZW4gd2hlbiB3ZSBzZW50IHRoZSByZXF1ZXN0XG4gICAgICAgIC8vIHRvby4gSWYgaXQncyBjaGFuZ2VkLCBhcHBlbmRpbmcgdG8gdGhlIGxpc3Qgd2lsbCBjb3JydXB0IGl0LlxuICAgICAgICBjb25zdCBteV9uZXh0X2JhdGNoID0gdGhpcy5uZXh0QmF0Y2g7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7bGltaXQ6IDIwfTtcbiAgICAgICAgaWYgKG15X3NlcnZlciAhPSBNYXRyaXhDbGllbnRQZWcuZ2V0SG9tZXNlcnZlck5hbWUoKSkge1xuICAgICAgICAgICAgb3B0cy5zZXJ2ZXIgPSBteV9zZXJ2ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuaW5zdGFuY2VJZCA9PT0gQUxMX1JPT01TKSB7XG4gICAgICAgICAgICBvcHRzLmluY2x1ZGVfYWxsX25ldHdvcmtzID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlLmluc3RhbmNlSWQpIHtcbiAgICAgICAgICAgIG9wdHMudGhpcmRfcGFydHlfaW5zdGFuY2VfaWQgPSB0aGlzLnN0YXRlLmluc3RhbmNlSWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubmV4dEJhdGNoKSBvcHRzLnNpbmNlID0gdGhpcy5uZXh0QmF0Y2g7XG4gICAgICAgIGlmIChteV9maWx0ZXJfc3RyaW5nKSBvcHRzLmZpbHRlciA9IHsgZ2VuZXJpY19zZWFyY2hfdGVybTogbXlfZmlsdGVyX3N0cmluZyB9O1xuICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLnB1YmxpY1Jvb21zKG9wdHMpLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBteV9maWx0ZXJfc3RyaW5nICE9IHRoaXMuc3RhdGUuZmlsdGVyU3RyaW5nIHx8XG4gICAgICAgICAgICAgICAgbXlfc2VydmVyICE9IHRoaXMuc3RhdGUucm9vbVNlcnZlciB8fFxuICAgICAgICAgICAgICAgIG15X25leHRfYmF0Y2ggIT0gdGhpcy5uZXh0QmF0Y2gpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgZmlsdGVyIG9yIHNlcnZlciBoYXMgY2hhbmdlZCBzaW5jZSB0aGlzIHJlcXVlc3Qgd2FzIHNlbnQsXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYXdheSB0aGUgcmVzdWx0IChkb24ndCBldmVuIGNsZWFyIHRoZSBidXN5IGZsYWdcbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB3ZSBtdXN0IHN0aWxsIGhhdmUgYSByZXF1ZXN0IGluIGZsaWdodClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl91bm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSd2ZSBiZWVuIHVubW91bnRlZCwgd2UgZG9uJ3QgY2FyZSBlaXRoZXIuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLm5leHRCYXRjaCA9IGRhdGEubmV4dF9iYXRjaDtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoKHMpID0+IHtcbiAgICAgICAgICAgICAgICBzLnB1YmxpY1Jvb21zLnB1c2goLi4uKGRhdGEuY2h1bmsgfHwgW10pKTtcbiAgICAgICAgICAgICAgICBzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4oZGF0YS5uZXh0X2JhdGNoKTtcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG15X2ZpbHRlcl9zdHJpbmcgIT0gdGhpcy5zdGF0ZS5maWx0ZXJTdHJpbmcgfHxcbiAgICAgICAgICAgICAgICBteV9zZXJ2ZXIgIT0gdGhpcy5zdGF0ZS5yb29tU2VydmVyIHx8XG4gICAgICAgICAgICAgICAgbXlfbmV4dF9iYXRjaCAhPSB0aGlzLm5leHRCYXRjaCkge1xuICAgICAgICAgICAgICAgIC8vIGFzIGFib3ZlOiB3ZSBkb24ndCBjYXJlIGFib3V0IGVycm9ycyBmb3Igb2xkXG4gICAgICAgICAgICAgICAgLy8gcmVxdWVzdHMgZWl0aGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5fdW5tb3VudGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgd2UndmUgYmVlbiB1bm1vdW50ZWQsIHdlIGRvbid0IGNhcmUgZWl0aGVyLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBnZXQgcHVibGljUm9vbXM6ICVzXCIsIEpTT04uc3RyaW5naWZ5KGVycikpO1xuICAgICAgICAgICAgdHJhY2soJ0ZhaWxlZCB0byBnZXQgcHVibGljIHJvb20gbGlzdCcpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6XG4gICAgICAgICAgICAgICAgICAgIGAke190KCdSaW90IGZhaWxlZCB0byBnZXQgdGhlIHB1YmxpYyByb29tIGxpc3QuJyl9IGAgK1xuICAgICAgICAgICAgICAgICAgICBgJHsoZXJyICYmIGVyci5tZXNzYWdlKSA/IGVyci5tZXNzYWdlIDogX3QoJ1RoZSBob21lc2VydmVyIG1heSBiZSB1bmF2YWlsYWJsZSBvciBvdmVybG9hZGVkLicpfWBcbiAgICAgICAgICAgICAgICAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEEgbGltaXRlZCBpbnRlcmZhY2UgZm9yIHJlbW92aW5nIHJvb21zIGZyb20gdGhlIGRpcmVjdG9yeS5cbiAgICAgKiBXaWxsIHNldCB0aGUgcm9vbSB0byBub3QgYmUgcHVibGljbHkgdmlzaWJsZSBhbmQgZGVsZXRlIHRoZVxuICAgICAqIGRlZmF1bHQgYWxpYXMuIEluIHRoZSBsb25nIHRlcm0sIGl0IHdvdWxkIGJlIGJldHRlciB0byBhbGxvd1xuICAgICAqIEhTIGFkbWlucyB0byBkbyB0aGlzIHRocm91Z2ggdGhlIFJvb21TZXR0aW5ncyBpbnRlcmZhY2UsIGJ1dFxuICAgICAqIHRoaXMgbmVlZHMgU1BFQy00MTcuXG4gICAgICovXG4gICAgcmVtb3ZlRnJvbURpcmVjdG9yeTogZnVuY3Rpb24ocm9vbSkge1xuICAgICAgICBjb25zdCBhbGlhcyA9IGdldF9kaXNwbGF5X2FsaWFzX2Zvcl9yb29tKHJvb20pO1xuICAgICAgICBjb25zdCBuYW1lID0gcm9vbS5uYW1lIHx8IGFsaWFzIHx8IF90KCdVbm5hbWVkIHJvb20nKTtcblxuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLlF1ZXN0aW9uRGlhbG9nXCIpO1xuICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuXG4gICAgICAgIGxldCBkZXNjO1xuICAgICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgICAgIGRlc2MgPSBfdCgnRGVsZXRlIHRoZSByb29tIGFsaWFzICUoYWxpYXMpcyBhbmQgcmVtb3ZlICUobmFtZSlzIGZyb20gdGhlIGRpcmVjdG9yeT8nLCB7YWxpYXM6IGFsaWFzLCBuYW1lOiBuYW1lfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNjID0gX3QoJ1JlbW92ZSAlKG5hbWUpcyBmcm9tIHRoZSBkaXJlY3Rvcnk/Jywge25hbWU6IG5hbWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ1JlbW92ZSBmcm9tIERpcmVjdG9yeScsICcnLCBRdWVzdGlvbkRpYWxvZywge1xuICAgICAgICAgICAgdGl0bGU6IF90KCdSZW1vdmUgZnJvbSBEaXJlY3RvcnknKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjLFxuICAgICAgICAgICAgb25GaW5pc2hlZDogKHNob3VsZF9kZWxldGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXNob3VsZF9kZWxldGUpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IExvYWRlciA9IHNkay5nZXRDb21wb25lbnQoXCJlbGVtZW50cy5TcGlubmVyXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGFsID0gTW9kYWwuY3JlYXRlRGlhbG9nKExvYWRlcik7XG4gICAgICAgICAgICAgICAgbGV0IHN0ZXAgPSBfdCgncmVtb3ZlICUobmFtZSlzIGZyb20gdGhlIGRpcmVjdG9yeS4nLCB7bmFtZTogbmFtZX0pO1xuXG4gICAgICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldFJvb21EaXJlY3RvcnlWaXNpYmlsaXR5KHJvb20ucm9vbV9pZCwgJ3ByaXZhdGUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbGlhcykgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBzdGVwID0gX3QoJ2RlbGV0ZSB0aGUgYWxpYXMuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZGVsZXRlQWxpYXMoYWxpYXMpO1xuICAgICAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hSb29tTGlzdCgpO1xuICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kYWwuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoUm9vbUxpc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBcIiArIHN0ZXAgKyBcIjogXCIgKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdSZW1vdmUgZnJvbSBEaXJlY3RvcnkgRXJyb3InLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnRXJyb3InKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAoKGVyciAmJiBlcnIubWVzc2FnZSkgPyBlcnIubWVzc2FnZSA6IF90KCdUaGUgc2VydmVyIG1heSBiZSB1bmF2YWlsYWJsZSBvciBvdmVybG9hZGVkJykpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvblJvb21DbGlja2VkOiBmdW5jdGlvbihyb29tLCBldikge1xuICAgICAgICBpZiAoZXYuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUZyb21EaXJlY3Rvcnkocm9vbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNob3dSb29tKHJvb20pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uT3B0aW9uQ2hhbmdlOiBmdW5jdGlvbihzZXJ2ZXIsIGluc3RhbmNlSWQpIHtcbiAgICAgICAgLy8gY2xlYXIgbmV4dCBiYXRjaCBzbyB3ZSBkb24ndCB0cnkgdG8gbG9hZCBtb3JlIHJvb21zXG4gICAgICAgIHRoaXMubmV4dEJhdGNoID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAvLyBDbGVhciB0aGUgcHVibGljIHJvb21zIG91dCBoZXJlIG90aGVyd2lzZSB3ZSBuZWVkbGVzc2x5XG4gICAgICAgICAgICAvLyBzcGVuZCB0aW1lIGZpbHRlcmluZyBsb3RzIG9mIHJvb21zIHdoZW4gd2UncmUgYWJvdXQgdG9cbiAgICAgICAgICAgIC8vIHRvIGNsZWFyIHRoZSBsaXN0IGFueXdheS5cbiAgICAgICAgICAgIHB1YmxpY1Jvb21zOiBbXSxcbiAgICAgICAgICAgIHJvb21TZXJ2ZXI6IHNlcnZlcixcbiAgICAgICAgICAgIGluc3RhbmNlSWQ6IGluc3RhbmNlSWQsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgfSwgdGhpcy5yZWZyZXNoUm9vbUxpc3QpO1xuICAgICAgICAvLyBXZSBhbHNvIHJlZnJlc2ggdGhlIHJvb20gbGlzdCBlYWNoIHRpbWUgZXZlbiB0aG91Z2ggdGhpc1xuICAgICAgICAvLyBmaWx0ZXJpbmcgaXMgY2xpZW50LXNpZGUuIEl0IGhvcGVmdWxseSB3b24ndCBiZSBjbGllbnQgc2lkZVxuICAgICAgICAvLyBmb3IgdmVyeSBsb25nLCBhbmQgd2UgbWF5IGhhdmUgZmV0Y2hlZCBhIHRob3VzYW5kIHJvb21zIHRvXG4gICAgICAgIC8vIGZpbmQgdGhlIGZpdmUgZ2l0dGVyIG9uZXMsIGF0IHdoaWNoIHBvaW50IHdlIGRvIG5vdCB3YW50XG4gICAgICAgIC8vIHRvIHJlbmRlciBhbGwgdGhvc2Ugcm9vbXMgd2hlbiBzd2l0Y2hpbmcgYmFjayB0byAnYWxsIG5ldHdvcmtzJy5cbiAgICAgICAgLy8gRWFzaWVzdCB0byBqdXN0IGJsb3cgYXdheSB0aGUgc3RhdGUgJiByZS1mZXRjaC5cbiAgICB9LFxuXG4gICAgb25GaWxsUmVxdWVzdDogZnVuY3Rpb24oYmFja3dhcmRzKSB7XG4gICAgICAgIGlmIChiYWNrd2FyZHMgfHwgIXRoaXMubmV4dEJhdGNoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRNb3JlUm9vbXMoKTtcbiAgICB9LFxuXG4gICAgb25GaWx0ZXJDaGFuZ2U6IGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZmlsdGVyU3RyaW5nOiBhbGlhcyB8fCBudWxsLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBkb24ndCBzZW5kIHRoZSByZXF1ZXN0IGZvciBhIGxpdHRsZSBiaXQsXG4gICAgICAgIC8vIG5vIHBvaW50IGhhbW1lcmluZyB0aGUgc2VydmVyIHdpdGggYVxuICAgICAgICAvLyByZXF1ZXN0IGZvciBldmVyeSBrZXlzdHJva2UsIGxldCB0aGVcbiAgICAgICAgLy8gdXNlciBmaW5pc2ggdHlwaW5nLlxuICAgICAgICBpZiAodGhpcy5maWx0ZXJUaW1lb3V0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5maWx0ZXJUaW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbHRlclRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hSb29tTGlzdCgpO1xuICAgICAgICB9LCA3MDApO1xuICAgIH0sXG5cbiAgICBvbkZpbHRlckNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdXBkYXRlIGltbWVkaWF0ZWx5XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZmlsdGVyU3RyaW5nOiBudWxsLFxuICAgICAgICB9LCB0aGlzLnJlZnJlc2hSb29tTGlzdCk7XG5cbiAgICAgICAgaWYgKHRoaXMuZmlsdGVyVGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZmlsdGVyVGltZW91dCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Kb2luRnJvbVNlYXJjaENsaWNrOiBmdW5jdGlvbihhbGlhcykge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgcGFydGljdWxhciBpbnN0YW5jZSBpZCBzZWxlY3RlZCwganVzdCBzaG93IHRoYXQgcm9vbXMgYWxpYXNcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmluc3RhbmNlSWQgfHwgdGhpcy5zdGF0ZS5pbnN0YW5jZUlkID09PSBBTExfUk9PTVMpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB1c2VyIHNwZWNpZmllZCBhbiBhbGlhcyB3aXRob3V0IGEgZG9tYWluLCBhZGQgb24gd2hpY2hldmVyIHNlcnZlciBpcyBzZWxlY3RlZFxuICAgICAgICAgICAgLy8gaW4gdGhlIGRyb3Bkb3duXG4gICAgICAgICAgICBpZiAoYWxpYXMuaW5kZXhPZignOicpID09IC0xKSB7XG4gICAgICAgICAgICAgICAgYWxpYXMgPSBhbGlhcyArICc6JyArIHRoaXMuc3RhdGUucm9vbVNlcnZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2hvd1Jvb21BbGlhcyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgM3JkIHBhcnR5IHByb3RvY29sLiBMZXQncyBzZWUgaWYgd2UgY2FuIGpvaW4gaXRcbiAgICAgICAgICAgIGNvbnN0IHByb3RvY29sTmFtZSA9IHByb3RvY29sTmFtZUZvckluc3RhbmNlSWQodGhpcy5wcm90b2NvbHMsIHRoaXMuc3RhdGUuaW5zdGFuY2VJZCk7XG4gICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGluc3RhbmNlRm9ySW5zdGFuY2VJZCh0aGlzLnByb3RvY29scywgdGhpcy5zdGF0ZS5pbnN0YW5jZUlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IHByb3RvY29sTmFtZSA/IHRoaXMuX2dldEZpZWxkc0ZvclRoaXJkUGFydHlMb2NhdGlvbihhbGlhcywgdGhpcy5wcm90b2NvbHNbcHJvdG9jb2xOYW1lXSwgaW5zdGFuY2UpIDogbnVsbDtcbiAgICAgICAgICAgIGlmICghZmllbGRzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdVbmFibGUgdG8gam9pbiBuZXR3b3JrJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnVW5hYmxlIHRvIGpvaW4gbmV0d29yaycpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1Jpb3QgZG9lcyBub3Qga25vdyBob3cgdG8gam9pbiBhIHJvb20gb24gdGhpcyBuZXR3b3JrJyksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmdldFRoaXJkcGFydHlMb2NhdGlvbihwcm90b2NvbE5hbWUsIGZpZWxkcykudGhlbigocmVzcCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwLmxlbmd0aCA+IDAgJiYgcmVzcFswXS5hbGlhcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dSb29tQWxpYXMocmVzcFswXS5hbGlhcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRXJyb3JEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZGlhbG9ncy5FcnJvckRpYWxvZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnUm9vbSBub3QgZm91bmQnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBfdCgnUm9vbSBub3QgZm91bmQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBfdCgnQ291bGRuXFwndCBmaW5kIGEgbWF0Y2hpbmcgTWF0cml4IHJvb20nKSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBFcnJvckRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoXCJkaWFsb2dzLkVycm9yRGlhbG9nXCIpO1xuICAgICAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0ZldGNoaW5nIHRoaXJkIHBhcnR5IGxvY2F0aW9uIGZhaWxlZCcsICcnLCBFcnJvckRpYWxvZywge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogX3QoJ0ZldGNoaW5nIHRoaXJkIHBhcnR5IGxvY2F0aW9uIGZhaWxlZCcpLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogX3QoJ1VuYWJsZSB0byBsb29rIHVwIHJvb20gSUQgZnJvbSBzZXJ2ZXInKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uUHJldmlld0NsaWNrOiBmdW5jdGlvbihldiwgcm9vbSkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgZGlzLmRpc3BhdGNoKHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICByb29tX2lkOiByb29tLnJvb21faWQsXG4gICAgICAgICAgICBzaG91bGRfcGVlazogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG5cbiAgICBvblZpZXdDbGljazogZnVuY3Rpb24oZXYsIHJvb20pIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X3Jvb20nLFxuICAgICAgICAgICAgcm9vbV9pZDogcm9vbS5yb29tX2lkLFxuICAgICAgICAgICAgc2hvdWxkX3BlZWs6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcblxuICAgIG9uSm9pbkNsaWNrOiBmdW5jdGlvbihldiwgcm9vbSkge1xuICAgICAgICB0aGlzLnNob3dSb29tKHJvb20sIG51bGwsIHRydWUpO1xuICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuXG4gICAgb25DcmVhdGVSb29tQ2xpY2s6IGZ1bmN0aW9uKHJvb20pIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkZpbmlzaGVkKCk7XG4gICAgICAgIGRpcy5kaXNwYXRjaCh7XG4gICAgICAgICAgICBhY3Rpb246ICd2aWV3X2NyZWF0ZV9yb29tJyxcbiAgICAgICAgICAgIHB1YmxpYzogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNob3dSb29tQWxpYXM6IGZ1bmN0aW9uKGFsaWFzLCBhdXRvSm9pbj1mYWxzZSkge1xuICAgICAgICB0aGlzLnNob3dSb29tKG51bGwsIGFsaWFzLCBhdXRvSm9pbik7XG4gICAgfSxcblxuICAgIHNob3dSb29tOiBmdW5jdGlvbihyb29tLCByb29tX2FsaWFzLCBhdXRvSm9pbj1mYWxzZSkge1xuICAgICAgICB0aGlzLnByb3BzLm9uRmluaXNoZWQoKTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3ZpZXdfcm9vbScsXG4gICAgICAgICAgICBhdXRvX2pvaW46IGF1dG9Kb2luLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocm9vbSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgbGV0IHRoZSB1c2VyIHZpZXcgYSByb29tIHRoZXkgd29uJ3QgYmUgYWJsZSB0byBlaXRoZXJcbiAgICAgICAgICAgIC8vIHBlZWsgb3Igam9pbjogZmFpbCBlYXJsaWVyIHNvIHRoZXkgZG9uJ3QgaGF2ZSB0byBjbGljayBiYWNrXG4gICAgICAgICAgICAvLyB0byB0aGUgZGlyZWN0b3J5LlxuICAgICAgICAgICAgaWYgKE1hdHJpeENsaWVudFBlZy5nZXQoKS5pc0d1ZXN0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJvb20ud29ybGRfcmVhZGFibGUgJiYgIXJvb20uZ3Vlc3RfY2FuX2pvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzLmRpc3BhdGNoKHthY3Rpb246ICdyZXF1aXJlX3JlZ2lzdHJhdGlvbid9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFyb29tX2FsaWFzKSB7XG4gICAgICAgICAgICAgICAgcm9vbV9hbGlhcyA9IGdldF9kaXNwbGF5X2FsaWFzX2Zvcl9yb29tKHJvb20pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXlsb2FkLm9vYl9kYXRhID0ge1xuICAgICAgICAgICAgICAgIGF2YXRhclVybDogcm9vbS5hdmF0YXJfdXJsLFxuICAgICAgICAgICAgICAgIC8vIFhYWDogVGhpcyBsb2dpYyBpcyBkdXBsaWNhdGVkIGZyb20gdGhlIEpTIFNESyB3aGljaFxuICAgICAgICAgICAgICAgIC8vIHdvdWxkIG5vcm1hbGx5IGRlY2lkZSB3aGF0IHRoZSBuYW1lIGlzLlxuICAgICAgICAgICAgICAgIG5hbWU6IHJvb20ubmFtZSB8fCByb29tX2FsaWFzIHx8IF90KCdVbm5hbWVkIHJvb20nKSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnJvb21TZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICBwYXlsb2FkLm9wdHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHZpYVNlcnZlcnM6IFt0aGlzLnN0YXRlLnJvb21TZXJ2ZXJdLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGpvaW4gTWF0cml4IHJvb21zIGJ5IElEIGJlY2F1c2UgdGhlIEhTIGhhcyBubyB3YXkgdG8ga25vd1xuICAgICAgICAvLyB3aGljaCBzZXJ2ZXJzIHRvIHN0YXJ0IHF1ZXJ5aW5nLiBIb3dldmVyLCB0aGVyZSdzIG5vIG90aGVyIHdheSB0byBqb2luIHJvb21zIGluXG4gICAgICAgIC8vIHRoaXMgbGlzdCB3aXRob3V0IGFsaWFzZXMgYXQgcHJlc2VudCwgc28gaWYgcm9vbUFsaWFzIGlzbid0IHNldCBoZXJlIHdlIGhhdmUgbm9cbiAgICAgICAgLy8gY2hvaWNlIGJ1dCB0byBzdXBwbHkgdGhlIElELlxuICAgICAgICBpZiAocm9vbV9hbGlhcykge1xuICAgICAgICAgICAgcGF5bG9hZC5yb29tX2FsaWFzID0gcm9vbV9hbGlhcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBheWxvYWQucm9vbV9pZCA9IHJvb20ucm9vbV9pZDtcbiAgICAgICAgfVxuICAgICAgICBkaXMuZGlzcGF0Y2gocGF5bG9hZCk7XG4gICAgfSxcblxuICAgIGdldFJvdyhyb29tKSB7XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IE1hdHJpeENsaWVudFBlZy5nZXQoKTtcbiAgICAgICAgY29uc3QgY2xpZW50Um9vbSA9IGNsaWVudC5nZXRSb29tKHJvb20ucm9vbV9pZCk7XG4gICAgICAgIGNvbnN0IGhhc0pvaW5lZFJvb20gPSBjbGllbnRSb29tICYmIGNsaWVudFJvb20uZ2V0TXlNZW1iZXJzaGlwKCkgPT09IFwiam9pblwiO1xuICAgICAgICBjb25zdCBpc0d1ZXN0ID0gY2xpZW50LmlzR3Vlc3QoKTtcbiAgICAgICAgY29uc3QgQmFzZUF2YXRhciA9IHNkay5nZXRDb21wb25lbnQoJ2F2YXRhcnMuQmFzZUF2YXRhcicpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuICAgICAgICBsZXQgcHJldmlld0J1dHRvbjtcbiAgICAgICAgbGV0IGpvaW5PclZpZXdCdXR0b247XG5cbiAgICAgICAgaWYgKHJvb20ud29ybGRfcmVhZGFibGUgJiYgIWhhc0pvaW5lZFJvb20pIHtcbiAgICAgICAgICAgIHByZXZpZXdCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD1cInNlY29uZGFyeVwiIG9uQ2xpY2s9eyhldikgPT4gdGhpcy5vblByZXZpZXdDbGljayhldiwgcm9vbSl9PntfdChcIlByZXZpZXdcIil9PC9BY2Nlc3NpYmxlQnV0dG9uPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFzSm9pbmVkUm9vbSkge1xuICAgICAgICAgICAgam9pbk9yVmlld0J1dHRvbiA9IChcbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBraW5kPVwic2Vjb25kYXJ5XCIgb25DbGljaz17KGV2KSA9PiB0aGlzLm9uVmlld0NsaWNrKGV2LCByb29tKX0+e190KFwiVmlld1wiKX08L0FjY2Vzc2libGVCdXR0b24+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKCFpc0d1ZXN0IHx8IHJvb20uZ3Vlc3RfY2FuX2pvaW4pIHtcbiAgICAgICAgICAgIGpvaW5PclZpZXdCdXR0b24gPSAoXG4gICAgICAgICAgICAgICAgPEFjY2Vzc2libGVCdXR0b24ga2luZD1cInByaW1hcnlcIiBvbkNsaWNrPXsoZXYpID0+IHRoaXMub25Kb2luQ2xpY2soZXYsIHJvb20pfT57X3QoXCJKb2luXCIpfTwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmFtZSA9IHJvb20ubmFtZSB8fCBnZXRfZGlzcGxheV9hbGlhc19mb3Jfcm9vbShyb29tKSB8fCBfdCgnVW5uYW1lZCByb29tJyk7XG4gICAgICAgIGlmIChuYW1lLmxlbmd0aCA+IE1BWF9OQU1FX0xFTkdUSCkge1xuICAgICAgICAgICAgbmFtZSA9IGAke25hbWUuc3Vic3RyaW5nKDAsIE1BWF9OQU1FX0xFTkdUSCl9Li4uYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0b3BpYyA9IHJvb20udG9waWMgfHwgJyc7XG4gICAgICAgIGlmICh0b3BpYy5sZW5ndGggPiBNQVhfVE9QSUNfTEVOR1RIKSB7XG4gICAgICAgICAgICB0b3BpYyA9IGAke3RvcGljLnN1YnN0cmluZygwLCBNQVhfVE9QSUNfTEVOR1RIKX0uLi5gO1xuICAgICAgICB9XG4gICAgICAgIHRvcGljID0gbGlua2lmeUFuZFNhbml0aXplSHRtbCh0b3BpYyk7XG4gICAgICAgIGNvbnN0IGF2YXRhclVybCA9IGdldEh0dHBVcmlGb3JNeGMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRIb21lc2VydmVyVXJsKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb20uYXZhdGFyX3VybCwgMzIsIDMyLCBcImNyb3BcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRyIGtleT17IHJvb20ucm9vbV9pZCB9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2KSA9PiB0aGlzLm9uUm9vbUNsaWNrZWQocm9vbSwgZXYpfVxuICAgICAgICAgICAgICAgIC8vIGNhbmNlbCBvbk1vdXNlRG93biBvdGhlcndpc2Ugc2hpZnQtY2xpY2tpbmcgaGlnaGxpZ2h0cyB0ZXh0XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249eyhldikgPT4ge2V2LnByZXZlbnREZWZhdWx0KCk7fX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwibXhfUm9vbURpcmVjdG9yeV9yb29tQXZhdGFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxCYXNlQXZhdGFyIHdpZHRoPXszMn0gaGVpZ2h0PXszMn0gcmVzaXplTWV0aG9kPSdjcm9wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZT17IG5hbWUgfSBpZE5hbWU9eyBuYW1lIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybD17IGF2YXRhclVybCB9IC8+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwibXhfUm9vbURpcmVjdG9yeV9yb29tRGVzY3JpcHRpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tRGlyZWN0b3J5X25hbWVcIj57IG5hbWUgfTwvZGl2PiZuYnNwO1xuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1Jvb21EaXJlY3RvcnlfdG9waWNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17IChldikgPT4geyBldi5zdG9wUHJvcGFnYXRpb24oKTsgfSB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTD17eyBfX2h0bWw6IHRvcGljIH19IC8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfUm9vbURpcmVjdG9yeV9hbGlhc1wiPnsgZ2V0X2Rpc3BsYXlfYWxpYXNfZm9yX3Jvb20ocm9vbSkgfTwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cIm14X1Jvb21EaXJlY3Rvcnlfcm9vbU1lbWJlckNvdW50XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgcm9vbS5udW1fam9pbmVkX21lbWJlcnMgfVxuICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cIm14X1Jvb21EaXJlY3RvcnlfcHJldmlld1wiPntwcmV2aWV3QnV0dG9ufTwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cIm14X1Jvb21EaXJlY3Rvcnlfam9pblwiPntqb2luT3JWaWV3QnV0dG9ufTwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0U2Nyb2xsUGFuZWw6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYW5lbCA9IGVsZW1lbnQ7XG4gICAgfSxcblxuICAgIF9zdHJpbmdMb29rc0xpa2VJZDogZnVuY3Rpb24ocywgZmllbGRfdHlwZSkge1xuICAgICAgICBsZXQgcGF0ID0gL14jW15cXHNdKzpbXlxcc10vO1xuICAgICAgICBpZiAoZmllbGRfdHlwZSAmJiBmaWVsZF90eXBlLnJlZ2V4cCkge1xuICAgICAgICAgICAgcGF0ID0gbmV3IFJlZ0V4cChmaWVsZF90eXBlLnJlZ2V4cCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGF0LnRlc3Qocyk7XG4gICAgfSxcblxuICAgIF9nZXRGaWVsZHNGb3JUaGlyZFBhcnR5TG9jYXRpb246IGZ1bmN0aW9uKHVzZXJJbnB1dCwgcHJvdG9jb2wsIGluc3RhbmNlKSB7XG4gICAgICAgIC8vIG1ha2UgYW4gb2JqZWN0IHdpdGggdGhlIGZpZWxkcyBzcGVjaWZpZWQgYnkgdGhhdCBwcm90b2NvbC4gV2VcbiAgICAgICAgLy8gcmVxdWlyZSB0aGF0IHRoZSB2YWx1ZXMgb2YgYWxsIGJ1dCB0aGUgbGFzdCBmaWVsZCBjb21lIGZyb20gdGhlXG4gICAgICAgIC8vIGluc3RhbmNlLiBUaGUgbGFzdCBpcyB0aGUgdXNlciBpbnB1dC5cbiAgICAgICAgY29uc3QgcmVxdWlyZWRGaWVsZHMgPSBwcm90b2NvbC5sb2NhdGlvbl9maWVsZHM7XG4gICAgICAgIGlmICghcmVxdWlyZWRGaWVsZHMpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBmaWVsZHMgPSB7fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXF1aXJlZEZpZWxkcy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IHRoaXNGaWVsZCA9IHJlcXVpcmVkRmllbGRzW2ldO1xuICAgICAgICAgICAgaWYgKGluc3RhbmNlLmZpZWxkc1t0aGlzRmllbGRdID09PSB1bmRlZmluZWQpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgZmllbGRzW3RoaXNGaWVsZF0gPSBpbnN0YW5jZS5maWVsZHNbdGhpc0ZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBmaWVsZHNbcmVxdWlyZWRGaWVsZHNbcmVxdWlyZWRGaWVsZHMubGVuZ3RoIC0gMV1dID0gdXNlcklucHV0O1xuICAgICAgICByZXR1cm4gZmllbGRzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxsZWQgYnkgdGhlIHBhcmVudCBjb21wb25lbnQgd2hlbiBQYWdlVXAvRG93bi9ldGMgaXMgcHJlc3NlZC5cbiAgICAgKlxuICAgICAqIFdlIHBhc3MgaXQgZG93biB0byB0aGUgc2Nyb2xsIHBhbmVsLlxuICAgICAqL1xuICAgIGhhbmRsZVNjcm9sbEtleTogZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsUGFuZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsUGFuZWwuaGFuZGxlU2Nyb2xsS2V5KGV2KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBMb2FkZXIgPSBzZGsuZ2V0Q29tcG9uZW50KFwiZWxlbWVudHMuU3Bpbm5lclwiKTtcbiAgICAgICAgY29uc3QgQmFzZURpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ3ZpZXdzLmRpYWxvZ3MuQmFzZURpYWxvZycpO1xuICAgICAgICBjb25zdCBBY2Nlc3NpYmxlQnV0dG9uID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuQWNjZXNzaWJsZUJ1dHRvbicpO1xuXG4gICAgICAgIGxldCBjb250ZW50O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lcnJvcikge1xuICAgICAgICAgICAgY29udGVudCA9IHRoaXMuc3RhdGUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5wcm90b2NvbHNMb2FkaW5nKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gPExvYWRlciAvPjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJvd3MgPSAodGhpcy5zdGF0ZS5wdWJsaWNSb29tcyB8fCBbXSkubWFwKHJvb20gPT4gdGhpcy5nZXRSb3cocm9vbSkpO1xuICAgICAgICAgICAgLy8gd2Ugc3RpbGwgc2hvdyB0aGUgc2Nyb2xscGFuZWwsIGF0IGxlYXN0IGZvciBub3csIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSB3ZSBkb24ndCBmZXRjaCBtb3JlIGJlY2F1c2Ugd2UgZG9uJ3QgZ2V0IGEgZmlsbFxuICAgICAgICAgICAgLy8gcmVxdWVzdCBmcm9tIHRoZSBzY3JvbGxwYW5lbCBiZWNhdXNlIHRoZXJlIGlzbid0IG9uZVxuXG4gICAgICAgICAgICBsZXQgc3Bpbm5lcjtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBzcGlubmVyID0gPExvYWRlciAvPjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNjcm9sbHBhbmVsX2NvbnRlbnQ7XG4gICAgICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDAgJiYgIXRoaXMuc3RhdGUubG9hZGluZykge1xuICAgICAgICAgICAgICAgIHNjcm9sbHBhbmVsX2NvbnRlbnQgPSA8aT57IF90KCdObyByb29tcyB0byBzaG93JykgfTwvaT47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjcm9sbHBhbmVsX2NvbnRlbnQgPSA8dGFibGUgY2xhc3NOYW1lPVwibXhfUm9vbURpcmVjdG9yeV90YWJsZVwiPlxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHJvd3MgfVxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgIDwvdGFibGU+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgU2Nyb2xsUGFuZWwgPSBzZGsuZ2V0Q29tcG9uZW50KFwic3RydWN0dXJlcy5TY3JvbGxQYW5lbFwiKTtcbiAgICAgICAgICAgIGNvbnRlbnQgPSA8U2Nyb2xsUGFuZWwgcmVmPXt0aGlzLmNvbGxlY3RTY3JvbGxQYW5lbH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJteF9Sb29tRGlyZWN0b3J5X3RhYmxlV3JhcHBlclwiXG4gICAgICAgICAgICAgICAgb25GaWxsUmVxdWVzdD17IHRoaXMub25GaWxsUmVxdWVzdCB9XG4gICAgICAgICAgICAgICAgc3RpY2t5Qm90dG9tPXtmYWxzZX1cbiAgICAgICAgICAgICAgICBzdGFydEF0Qm90dG9tPXtmYWxzZX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7IHNjcm9sbHBhbmVsX2NvbnRlbnQgfVxuICAgICAgICAgICAgICAgIHsgc3Bpbm5lciB9XG4gICAgICAgICAgICA8L1Njcm9sbFBhbmVsPjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsaXN0SGVhZGVyO1xuICAgICAgICBpZiAoIXRoaXMuc3RhdGUucHJvdG9jb2xzTG9hZGluZykge1xuICAgICAgICAgICAgY29uc3QgTmV0d29ya0Ryb3Bkb3duID0gc2RrLmdldENvbXBvbmVudCgnZGlyZWN0b3J5Lk5ldHdvcmtEcm9wZG93bicpO1xuICAgICAgICAgICAgY29uc3QgRGlyZWN0b3J5U2VhcmNoQm94ID0gc2RrLmdldENvbXBvbmVudCgnZWxlbWVudHMuRGlyZWN0b3J5U2VhcmNoQm94Jyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHByb3RvY29sTmFtZSA9IHByb3RvY29sTmFtZUZvckluc3RhbmNlSWQodGhpcy5wcm90b2NvbHMsIHRoaXMuc3RhdGUuaW5zdGFuY2VJZCk7XG4gICAgICAgICAgICBsZXQgaW5zdGFuY2VfZXhwZWN0ZWRfZmllbGRfdHlwZTtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBwcm90b2NvbE5hbWUgJiZcbiAgICAgICAgICAgICAgICB0aGlzLnByb3RvY29scyAmJlxuICAgICAgICAgICAgICAgIHRoaXMucHJvdG9jb2xzW3Byb3RvY29sTmFtZV0gJiZcbiAgICAgICAgICAgICAgICB0aGlzLnByb3RvY29sc1twcm90b2NvbE5hbWVdLmxvY2F0aW9uX2ZpZWxkcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgdGhpcy5wcm90b2NvbHNbcHJvdG9jb2xOYW1lXS5maWVsZF90eXBlc1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdF9maWVsZCA9IHRoaXMucHJvdG9jb2xzW3Byb3RvY29sTmFtZV0ubG9jYXRpb25fZmllbGRzLnNsaWNlKC0xKVswXTtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZV9leHBlY3RlZF9maWVsZF90eXBlID0gdGhpcy5wcm90b2NvbHNbcHJvdG9jb2xOYW1lXS5maWVsZF90eXBlc1tsYXN0X2ZpZWxkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHBsYWNlaG9sZGVyID0gX3QoJ0ZpbmQgYSByb29t4oCmJyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaW5zdGFuY2VJZCB8fCB0aGlzLnN0YXRlLmluc3RhbmNlSWQgPT09IEFMTF9ST09NUykge1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gX3QoXCJGaW5kIGEgcm9vbeKApiAoZS5nLiAlKGV4YW1wbGVSb29tKXMpXCIsIHtleGFtcGxlUm9vbTogXCIjZXhhbXBsZTpcIiArIHRoaXMuc3RhdGUucm9vbVNlcnZlcn0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbnN0YW5jZV9leHBlY3RlZF9maWVsZF90eXBlKSB7XG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSBpbnN0YW5jZV9leHBlY3RlZF9maWVsZF90eXBlLnBsYWNlaG9sZGVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgc2hvd0pvaW5CdXR0b24gPSB0aGlzLl9zdHJpbmdMb29rc0xpa2VJZCh0aGlzLnN0YXRlLmZpbHRlclN0cmluZywgaW5zdGFuY2VfZXhwZWN0ZWRfZmllbGRfdHlwZSk7XG4gICAgICAgICAgICBpZiAocHJvdG9jb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBpbnN0YW5jZUZvckluc3RhbmNlSWQodGhpcy5wcm90b2NvbHMsIHRoaXMuc3RhdGUuaW5zdGFuY2VJZCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2dldEZpZWxkc0ZvclRoaXJkUGFydHlMb2NhdGlvbih0aGlzLnN0YXRlLmZpbHRlclN0cmluZywgdGhpcy5wcm90b2NvbHNbcHJvdG9jb2xOYW1lXSwgaW5zdGFuY2UpID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dKb2luQnV0dG9uID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsaXN0SGVhZGVyID0gPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tRGlyZWN0b3J5X2xpc3RoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8RGlyZWN0b3J5U2VhcmNoQm94XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21EaXJlY3Rvcnlfc2VhcmNoYm94XCJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMub25GaWx0ZXJDaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xlYXI9e3RoaXMub25GaWx0ZXJDbGVhcn1cbiAgICAgICAgICAgICAgICAgICAgb25Kb2luQ2xpY2s9e3RoaXMub25Kb2luRnJvbVNlYXJjaENsaWNrfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17cGxhY2Vob2xkZXJ9XG4gICAgICAgICAgICAgICAgICAgIHNob3dKb2luQnV0dG9uPXtzaG93Sm9pbkJ1dHRvbn1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxOZXR3b3JrRHJvcGRvd25cbiAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2xzPXt0aGlzLnByb3RvY29sc31cbiAgICAgICAgICAgICAgICAgICAgb25PcHRpb25DaGFuZ2U9e3RoaXMub25PcHRpb25DaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmVyTmFtZT17dGhpcy5zdGF0ZS5yb29tU2VydmVyfVxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEluc3RhbmNlSWQ9e3RoaXMuc3RhdGUuaW5zdGFuY2VJZH1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4cGxhbmF0aW9uID1cbiAgICAgICAgICAgIF90KFwiSWYgeW91IGNhbid0IGZpbmQgdGhlIHJvb20geW91J3JlIGxvb2tpbmcgZm9yLCBhc2sgZm9yIGFuIGludml0ZSBvciA8YT5DcmVhdGUgYSBuZXcgcm9vbTwvYT4uXCIsIG51bGwsXG4gICAgICAgICAgICAgICAge2E6IHN1YiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoPEFjY2Vzc2libGVCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ9XCJzZWNvbmRhcnlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkNyZWF0ZVJvb21DbGlja31cbiAgICAgICAgICAgICAgICAgICAgPntzdWJ9PC9BY2Nlc3NpYmxlQnV0dG9uPik7XG4gICAgICAgICAgICAgICAgfX0sXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8QmFzZURpYWxvZ1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17J214X1Jvb21EaXJlY3RvcnlfZGlhbG9nJ31cbiAgICAgICAgICAgICAgICBoYXNDYW5jZWw9e3RydWV9XG4gICAgICAgICAgICAgICAgb25GaW5pc2hlZD17dGhpcy5wcm9wcy5vbkZpbmlzaGVkfVxuICAgICAgICAgICAgICAgIHRpdGxlPXtfdChcIkV4cGxvcmUgcm9vbXNcIil9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tRGlyZWN0b3J5XCI+XG4gICAgICAgICAgICAgICAgICAgIHtleHBsYW5hdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9Sb29tRGlyZWN0b3J5X2xpc3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtsaXN0SGVhZGVyfVxuICAgICAgICAgICAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9CYXNlRGlhbG9nPlxuICAgICAgICApO1xuICAgIH0sXG59KTtcblxuLy8gU2ltaWxhciB0byBtYXRyaXgtcmVhY3Qtc2RrJ3MgTWF0cml4VG9vbHMuZ2V0RGlzcGxheUFsaWFzRm9yUm9vbVxuLy8gYnV0IHdvcmtzIHdpdGggdGhlIG9iamVjdHMgd2UgZ2V0IGZyb20gdGhlIHB1YmxpYyByb29tIGxpc3RcbmZ1bmN0aW9uIGdldF9kaXNwbGF5X2FsaWFzX2Zvcl9yb29tKHJvb20pIHtcbiAgICByZXR1cm4gcm9vbS5jYW5vbmljYWxfYWxpYXMgfHwgKHJvb20uYWxpYXNlcyA/IHJvb20uYWxpYXNlc1swXSA6IFwiXCIpO1xufVxuIl19