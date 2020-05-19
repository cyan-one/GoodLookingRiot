"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _EditableItemList = _interopRequireDefault(require("../elements/EditableItemList"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var sdk = _interopRequireWildcard(require("../../../index"));

var _languageHandler = require("../../../languageHandler");

var _Field = _interopRequireDefault(require("../elements/Field"));

var _ErrorDialog = _interopRequireDefault(require("../dialogs/ErrorDialog"));

var _AccessibleButton = _interopRequireDefault(require("../elements/AccessibleButton"));

var _Modal = _interopRequireDefault(require("../../../Modal"));

var _RoomPublishSetting = _interopRequireDefault(require("./RoomPublishSetting"));

/*
Copyright 2016 OpenMarket Ltd
Copyright 2018, 2019 New Vector Ltd

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
class EditableAliasesList extends _EditableItemList.default {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onAliasAdded", async () => {
      await this._aliasField.current.validate({
        allowEmpty: false
      });

      if (this._aliasField.current.isValid) {
        if (this.props.onItemAdded) this.props.onItemAdded(this.props.newItem);
        return;
      }

      this._aliasField.current.focus();

      this._aliasField.current.validate({
        allowEmpty: false,
        focused: true
      });
    });
    this._aliasField = (0, _react.createRef)();
  }

  _renderNewItemField() {
    // if we don't need the RoomAliasField,
    // we don't need to overriden version of _renderNewItemField
    if (!this.props.domain) {
      return super._renderNewItemField();
    }

    const RoomAliasField = sdk.getComponent('views.elements.RoomAliasField');

    const onChange = alias => this._onNewItemChanged({
      target: {
        value: alias
      }
    });

    return /*#__PURE__*/_react.default.createElement("form", {
      onSubmit: this._onAliasAdded,
      autoComplete: "off",
      noValidate: true,
      className: "mx_EditableItemList_newItem"
    }, /*#__PURE__*/_react.default.createElement(RoomAliasField, {
      ref: this._aliasField,
      onChange: onChange,
      value: this.props.newItem || "",
      domain: this.props.domain
    }), /*#__PURE__*/_react.default.createElement(_AccessibleButton.default, {
      onClick: this._onAliasAdded,
      kind: "primary"
    }, (0, _languageHandler._t)("Add")));
  }

}

class AliasSettings extends _react.default.Component {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "onNewAliasChanged", value => {
      this.setState({
        newAlias: value
      });
    });
    (0, _defineProperty2.default)(this, "onLocalAliasAdded", alias => {
      if (!alias || alias.length === 0) return; // ignore attempts to create blank aliases

      const localDomain = _MatrixClientPeg.MatrixClientPeg.get().getDomain();

      if (!alias.includes(':')) alias += ':' + localDomain;

      _MatrixClientPeg.MatrixClientPeg.get().createAlias(alias, this.props.roomId).then(() => {
        this.setState({
          localAliases: this.state.localAliases.concat(alias),
          newAlias: null
        });

        if (!this.state.canonicalAlias) {
          this.changeCanonicalAlias(alias);
        }
      }).catch(err => {
        console.error(err);

        _Modal.default.createTrackedDialog('Error creating alias', '', _ErrorDialog.default, {
          title: (0, _languageHandler._t)("Error creating alias"),
          description: (0, _languageHandler._t)("There was an error creating that alias. It may not be allowed by the server " + "or a temporary failure occurred.")
        });
      });
    });
    (0, _defineProperty2.default)(this, "onLocalAliasDeleted", index => {
      const alias = this.state.localAliases[index]; // TODO: In future, we should probably be making sure that the alias actually belongs
      // to this room. See https://github.com/vector-im/riot-web/issues/7353

      _MatrixClientPeg.MatrixClientPeg.get().deleteAlias(alias).then(() => {
        const localAliases = this.state.localAliases.filter(a => a !== alias);
        this.setState({
          localAliases
        });

        if (this.state.canonicalAlias === alias) {
          this.changeCanonicalAlias(null);
        }
      }).catch(err => {
        console.error(err);
        let description;

        if (err.errcode === "M_FORBIDDEN") {
          description = (0, _languageHandler._t)("You don't have permission to delete the alias.");
        } else {
          description = (0, _languageHandler._t)("There was an error removing that alias. It may no longer exist or a temporary " + "error occurred.");
        }

        _Modal.default.createTrackedDialog('Error removing alias', '', _ErrorDialog.default, {
          title: (0, _languageHandler._t)("Error removing alias"),
          description
        });
      });
    });
    (0, _defineProperty2.default)(this, "onLocalAliasesToggled", event => {
      // expanded
      if (event.target.open) {
        // if local aliases haven't been preloaded yet at component mount
        if (!this.props.canSetCanonicalAlias && this.state.localAliases.length === 0) {
          this.loadLocalAliases();
        }
      }

      this.setState({
        detailsOpen: event.target.open
      });
    });
    (0, _defineProperty2.default)(this, "onCanonicalAliasChange", event => {
      this.changeCanonicalAlias(event.target.value);
    });
    (0, _defineProperty2.default)(this, "onNewAltAliasChanged", value => {
      this.setState({
        newAltAlias: value
      });
    });
    (0, _defineProperty2.default)(this, "onAltAliasAdded", alias => {
      const altAliases = this.state.altAliases.slice();

      if (!altAliases.some(a => a.trim() === alias.trim())) {
        altAliases.push(alias.trim());
        this.changeAltAliases(altAliases);
        this.setState({
          newAltAlias: ""
        });
      }
    });
    (0, _defineProperty2.default)(this, "onAltAliasDeleted", index => {
      const altAliases = this.state.altAliases.slice();
      altAliases.splice(index, 1);
      this.changeAltAliases(altAliases);
    });
    const state = {
      altAliases: [],
      // [ #alias:domain.tld, ... ]
      localAliases: [],
      // [ #alias:my-hs.tld, ... ]
      canonicalAlias: null,
      // #canonical:domain.tld
      updatingCanonicalAlias: false,
      localAliasesLoading: false,
      detailsOpen: false
    };

    if (props.canonicalAliasEvent) {
      const content = props.canonicalAliasEvent.getContent();
      const altAliases = content.alt_aliases;

      if (Array.isArray(altAliases)) {
        state.altAliases = altAliases.slice();
      }

      state.canonicalAlias = content.alias;
    }

    this.state = state;
  }

  componentDidMount() {
    if (this.props.canSetCanonicalAlias) {
      // load local aliases for providing recommendations
      // for the canonical alias and alt_aliases
      this.loadLocalAliases();
    }
  }

  async loadLocalAliases() {
    this.setState({
      localAliasesLoading: true
    });

    try {
      const cli = _MatrixClientPeg.MatrixClientPeg.get();

      let localAliases = [];

      if (await cli.doesServerSupportUnstableFeature("org.matrix.msc2432")) {
        const response = await cli.unstableGetLocalAliases(this.props.roomId);

        if (Array.isArray(response.aliases)) {
          localAliases = response.aliases;
        }
      }

      this.setState({
        localAliases
      });
    } finally {
      this.setState({
        localAliasesLoading: false
      });
    }
  }

  changeCanonicalAlias(alias) {
    if (!this.props.canSetCanonicalAlias) return;
    const oldAlias = this.state.canonicalAlias;
    this.setState({
      canonicalAlias: alias,
      updatingCanonicalAlias: true
    });
    const eventContent = {
      alt_aliases: this.state.altAliases
    };
    if (alias) eventContent["alias"] = alias;

    _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(this.props.roomId, "m.room.canonical_alias", eventContent, "").catch(err => {
      console.error(err);

      _Modal.default.createTrackedDialog('Error updating main address', '', _ErrorDialog.default, {
        title: (0, _languageHandler._t)("Error updating main address"),
        description: (0, _languageHandler._t)("There was an error updating the room's main address. It may not be allowed by the server " + "or a temporary failure occurred.")
      });

      this.setState({
        canonicalAlias: oldAlias
      });
    }).finally(() => {
      this.setState({
        updatingCanonicalAlias: false
      });
    });
  }

  changeAltAliases(altAliases) {
    if (!this.props.canSetCanonicalAlias) return;
    this.setState({
      updatingCanonicalAlias: true,
      altAliases
    });
    const eventContent = {};

    if (this.state.canonicalAlias) {
      eventContent.alias = this.state.canonicalAlias;
    }

    if (altAliases) {
      eventContent["alt_aliases"] = altAliases;
    }

    _MatrixClientPeg.MatrixClientPeg.get().sendStateEvent(this.props.roomId, "m.room.canonical_alias", eventContent, "").catch(err => {
      console.error(err);

      _Modal.default.createTrackedDialog('Error updating alternative addresses', '', _ErrorDialog.default, {
        title: (0, _languageHandler._t)("Error updating main address"),
        description: (0, _languageHandler._t)("There was an error updating the room's alternative addresses. " + "It may not be allowed by the server or a temporary failure occurred.")
      });
    }).finally(() => {
      this.setState({
        updatingCanonicalAlias: false
      });
    });
  }

  _getAliases() {
    return this.state.altAliases.concat(this._getLocalNonAltAliases());
  }

  _getLocalNonAltAliases() {
    const {
      altAliases
    } = this.state;
    return this.state.localAliases.filter(alias => !altAliases.includes(alias));
  }

  render() {
    const localDomain = _MatrixClientPeg.MatrixClientPeg.get().getDomain();

    let found = false;
    const canonicalValue = this.state.canonicalAlias || "";

    const canonicalAliasSection = /*#__PURE__*/_react.default.createElement(_Field.default, {
      onChange: this.onCanonicalAliasChange,
      value: canonicalValue,
      disabled: this.state.updatingCanonicalAlias || !this.props.canSetCanonicalAlias,
      element: "select",
      id: "canonicalAlias",
      label: (0, _languageHandler._t)('Main address')
    }, /*#__PURE__*/_react.default.createElement("option", {
      value: "",
      key: "unset"
    }, (0, _languageHandler._t)('not specified')), this._getAliases().map((alias, i) => {
      if (alias === this.state.canonicalAlias) found = true;
      return /*#__PURE__*/_react.default.createElement("option", {
        value: alias,
        key: i
      }, alias);
    }), found || !this.state.canonicalAlias ? '' : /*#__PURE__*/_react.default.createElement("option", {
      value: this.state.canonicalAlias,
      key: "arbitrary"
    }, this.state.canonicalAlias));

    let localAliasesList;

    if (this.state.localAliasesLoading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      localAliasesList = /*#__PURE__*/_react.default.createElement(Spinner, null);
    } else {
      localAliasesList = /*#__PURE__*/_react.default.createElement(EditableAliasesList, {
        id: "roomAliases",
        className: "mx_RoomSettings_localAliases",
        items: this.state.localAliases,
        newItem: this.state.newAlias,
        onNewItemChanged: this.onNewAliasChanged,
        canRemove: this.props.canSetAliases,
        canEdit: this.props.canSetAliases,
        onItemAdded: this.onLocalAliasAdded,
        onItemRemoved: this.onLocalAliasDeleted,
        noItemsLabel: (0, _languageHandler._t)('This room has no local addresses'),
        placeholder: (0, _languageHandler._t)('Local address'),
        domain: localDomain
      });
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AliasSettings"
    }, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading"
    }, (0, _languageHandler._t)("Published Addresses")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Published addresses can be used by anyone on any server to join your room. " + "To publish an address, it needs to be set as a local address first.")), canonicalAliasSection, /*#__PURE__*/_react.default.createElement(_RoomPublishSetting.default, {
      roomId: this.props.roomId,
      canSetCanonicalAlias: this.props.canSetCanonicalAlias
    }), /*#__PURE__*/_react.default.createElement("datalist", {
      id: "mx_AliasSettings_altRecommendations"
    }, this._getLocalNonAltAliases().map(alias => {
      return /*#__PURE__*/_react.default.createElement("option", {
        value: alias,
        key: alias
      });
    }), ";"), /*#__PURE__*/_react.default.createElement(EditableAliasesList, {
      id: "roomAltAliases",
      className: "mx_RoomSettings_altAliases",
      items: this.state.altAliases,
      newItem: this.state.newAltAlias,
      onNewItemChanged: this.onNewAltAliasChanged,
      canRemove: this.props.canSetCanonicalAlias,
      canEdit: this.props.canSetCanonicalAlias,
      onItemAdded: this.onAltAliasAdded,
      onItemRemoved: this.onAltAliasDeleted,
      suggestionsListId: "mx_AliasSettings_altRecommendations",
      itemsLabel: (0, _languageHandler._t)('Other published addresses:'),
      noItemsLabel: (0, _languageHandler._t)('No other published addresses yet, add one below'),
      placeholder: (0, _languageHandler._t)('New published address (e.g. #alias:server)')
    }), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_SettingsTab_subheading mx_AliasSettings_localAliasHeader"
    }, (0, _languageHandler._t)("Local Addresses")), /*#__PURE__*/_react.default.createElement("p", null, (0, _languageHandler._t)("Set addresses for this room so users can find this room through your homeserver (%(localDomain)s)", {
      localDomain
    })), /*#__PURE__*/_react.default.createElement("details", {
      onToggle: this.onLocalAliasesToggled
    }, /*#__PURE__*/_react.default.createElement("summary", null, this.state.detailsOpen ? (0, _languageHandler._t)('Show less') : (0, _languageHandler._t)("Show more")), localAliasesList));
  }

}

exports.default = AliasSettings;
(0, _defineProperty2.default)(AliasSettings, "propTypes", {
  roomId: _propTypes.default.string.isRequired,
  canSetCanonicalAlias: _propTypes.default.bool.isRequired,
  canSetAliases: _propTypes.default.bool.isRequired,
  canonicalAliasEvent: _propTypes.default.object // MatrixEvent

});
(0, _defineProperty2.default)(AliasSettings, "defaultProps", {
  canSetAliases: false,
  canSetCanonicalAlias: false,
  aliasEvents: []
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL3Jvb21fc2V0dGluZ3MvQWxpYXNTZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJFZGl0YWJsZUFsaWFzZXNMaXN0IiwiRWRpdGFibGVJdGVtTGlzdCIsImNvbnN0cnVjdG9yIiwicHJvcHMiLCJfYWxpYXNGaWVsZCIsImN1cnJlbnQiLCJ2YWxpZGF0ZSIsImFsbG93RW1wdHkiLCJpc1ZhbGlkIiwib25JdGVtQWRkZWQiLCJuZXdJdGVtIiwiZm9jdXMiLCJmb2N1c2VkIiwiX3JlbmRlck5ld0l0ZW1GaWVsZCIsImRvbWFpbiIsIlJvb21BbGlhc0ZpZWxkIiwic2RrIiwiZ2V0Q29tcG9uZW50Iiwib25DaGFuZ2UiLCJhbGlhcyIsIl9vbk5ld0l0ZW1DaGFuZ2VkIiwidGFyZ2V0IiwidmFsdWUiLCJfb25BbGlhc0FkZGVkIiwiQWxpYXNTZXR0aW5ncyIsIlJlYWN0IiwiQ29tcG9uZW50Iiwic2V0U3RhdGUiLCJuZXdBbGlhcyIsImxlbmd0aCIsImxvY2FsRG9tYWluIiwiTWF0cml4Q2xpZW50UGVnIiwiZ2V0IiwiZ2V0RG9tYWluIiwiaW5jbHVkZXMiLCJjcmVhdGVBbGlhcyIsInJvb21JZCIsInRoZW4iLCJsb2NhbEFsaWFzZXMiLCJzdGF0ZSIsImNvbmNhdCIsImNhbm9uaWNhbEFsaWFzIiwiY2hhbmdlQ2Fub25pY2FsQWxpYXMiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsIkVycm9yRGlhbG9nIiwidGl0bGUiLCJkZXNjcmlwdGlvbiIsImluZGV4IiwiZGVsZXRlQWxpYXMiLCJmaWx0ZXIiLCJhIiwiZXJyY29kZSIsImV2ZW50Iiwib3BlbiIsImNhblNldENhbm9uaWNhbEFsaWFzIiwibG9hZExvY2FsQWxpYXNlcyIsImRldGFpbHNPcGVuIiwibmV3QWx0QWxpYXMiLCJhbHRBbGlhc2VzIiwic2xpY2UiLCJzb21lIiwidHJpbSIsInB1c2giLCJjaGFuZ2VBbHRBbGlhc2VzIiwic3BsaWNlIiwidXBkYXRpbmdDYW5vbmljYWxBbGlhcyIsImxvY2FsQWxpYXNlc0xvYWRpbmciLCJjYW5vbmljYWxBbGlhc0V2ZW50IiwiY29udGVudCIsImdldENvbnRlbnQiLCJhbHRfYWxpYXNlcyIsIkFycmF5IiwiaXNBcnJheSIsImNvbXBvbmVudERpZE1vdW50IiwiY2xpIiwiZG9lc1NlcnZlclN1cHBvcnRVbnN0YWJsZUZlYXR1cmUiLCJyZXNwb25zZSIsInVuc3RhYmxlR2V0TG9jYWxBbGlhc2VzIiwiYWxpYXNlcyIsIm9sZEFsaWFzIiwiZXZlbnRDb250ZW50Iiwic2VuZFN0YXRlRXZlbnQiLCJmaW5hbGx5IiwiX2dldEFsaWFzZXMiLCJfZ2V0TG9jYWxOb25BbHRBbGlhc2VzIiwicmVuZGVyIiwiZm91bmQiLCJjYW5vbmljYWxWYWx1ZSIsImNhbm9uaWNhbEFsaWFzU2VjdGlvbiIsIm9uQ2Fub25pY2FsQWxpYXNDaGFuZ2UiLCJtYXAiLCJpIiwibG9jYWxBbGlhc2VzTGlzdCIsIlNwaW5uZXIiLCJvbk5ld0FsaWFzQ2hhbmdlZCIsImNhblNldEFsaWFzZXMiLCJvbkxvY2FsQWxpYXNBZGRlZCIsIm9uTG9jYWxBbGlhc0RlbGV0ZWQiLCJvbk5ld0FsdEFsaWFzQ2hhbmdlZCIsIm9uQWx0QWxpYXNBZGRlZCIsIm9uQWx0QWxpYXNEZWxldGVkIiwib25Mb2NhbEFsaWFzZXNUb2dnbGVkIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsImJvb2wiLCJvYmplY3QiLCJhbGlhc0V2ZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2QkEsTUFBTUEsbUJBQU4sU0FBa0NDLHlCQUFsQyxDQUFtRDtBQUMvQ0MsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFN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V0FBWCxHQUF5Qix5QkFBRyxXQUFILENBQXpCLEdBQTJDLHlCQUFHLFdBQUgsQ0FBdEQsQ0FESixFQUVLb0MsZ0JBRkwsQ0E1QkosQ0FESjtBQW1DSDs7QUF6VHNEOzs7OEJBQXRDekUsYSxlQUNFO0FBQ2ZZLEVBQUFBLE1BQU0sRUFBRXVFLG1CQUFVQyxNQUFWLENBQWlCQyxVQURWO0FBRWZsRCxFQUFBQSxvQkFBb0IsRUFBRWdELG1CQUFVRyxJQUFWLENBQWVELFVBRnRCO0FBR2ZULEVBQUFBLGFBQWEsRUFBRU8sbUJBQVVHLElBQVYsQ0FBZUQsVUFIZjtBQUlmckMsRUFBQUEsbUJBQW1CLEVBQUVtQyxtQkFBVUksTUFKaEIsQ0FJd0I7O0FBSnhCLEM7OEJBREZ2RixhLGtCQVFLO0FBQ2xCNEUsRUFBQUEsYUFBYSxFQUFFLEtBREc7QUFFbEJ6QyxFQUFBQSxvQkFBb0IsRUFBRSxLQUZKO0FBR2xCcUQsRUFBQUEsV0FBVyxFQUFFO0FBSEssQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTgsIDIwMTkgTmV3IFZlY3RvciBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgRWRpdGFibGVJdGVtTGlzdCBmcm9tIFwiLi4vZWxlbWVudHMvRWRpdGFibGVJdGVtTGlzdFwiO1xuaW1wb3J0IFJlYWN0LCB7Y3JlYXRlUmVmfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHtNYXRyaXhDbGllbnRQZWd9IGZyb20gXCIuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWdcIjtcbmltcG9ydCAqIGFzIHNkayBmcm9tIFwiLi4vLi4vLi4vaW5kZXhcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcbmltcG9ydCBGaWVsZCBmcm9tIFwiLi4vZWxlbWVudHMvRmllbGRcIjtcbmltcG9ydCBFcnJvckRpYWxvZyBmcm9tIFwiLi4vZGlhbG9ncy9FcnJvckRpYWxvZ1wiO1xuaW1wb3J0IEFjY2Vzc2libGVCdXR0b24gZnJvbSBcIi4uL2VsZW1lbnRzL0FjY2Vzc2libGVCdXR0b25cIjtcbmltcG9ydCBNb2RhbCBmcm9tIFwiLi4vLi4vLi4vTW9kYWxcIjtcbmltcG9ydCBSb29tUHVibGlzaFNldHRpbmcgZnJvbSBcIi4vUm9vbVB1Ymxpc2hTZXR0aW5nXCI7XG5cbmNsYXNzIEVkaXRhYmxlQWxpYXNlc0xpc3QgZXh0ZW5kcyBFZGl0YWJsZUl0ZW1MaXN0IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5fYWxpYXNGaWVsZCA9IGNyZWF0ZVJlZigpO1xuICAgIH1cblxuICAgIF9vbkFsaWFzQWRkZWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2FsaWFzRmllbGQuY3VycmVudC52YWxpZGF0ZSh7IGFsbG93RW1wdHk6IGZhbHNlIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLl9hbGlhc0ZpZWxkLmN1cnJlbnQuaXNWYWxpZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25JdGVtQWRkZWQpIHRoaXMucHJvcHMub25JdGVtQWRkZWQodGhpcy5wcm9wcy5uZXdJdGVtKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FsaWFzRmllbGQuY3VycmVudC5mb2N1cygpO1xuICAgICAgICB0aGlzLl9hbGlhc0ZpZWxkLmN1cnJlbnQudmFsaWRhdGUoeyBhbGxvd0VtcHR5OiBmYWxzZSwgZm9jdXNlZDogdHJ1ZSB9KTtcbiAgICB9O1xuXG4gICAgX3JlbmRlck5ld0l0ZW1GaWVsZCgpIHtcbiAgICAgICAgLy8gaWYgd2UgZG9uJ3QgbmVlZCB0aGUgUm9vbUFsaWFzRmllbGQsXG4gICAgICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gb3ZlcnJpZGVuIHZlcnNpb24gb2YgX3JlbmRlck5ld0l0ZW1GaWVsZFxuICAgICAgICBpZiAoIXRoaXMucHJvcHMuZG9tYWluKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuX3JlbmRlck5ld0l0ZW1GaWVsZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IFJvb21BbGlhc0ZpZWxkID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuUm9vbUFsaWFzRmllbGQnKTtcbiAgICAgICAgY29uc3Qgb25DaGFuZ2UgPSAoYWxpYXMpID0+IHRoaXMuX29uTmV3SXRlbUNoYW5nZWQoe3RhcmdldDoge3ZhbHVlOiBhbGlhc319KTtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxmb3JtXG4gICAgICAgICAgICAgICAgb25TdWJtaXQ9e3RoaXMuX29uQWxpYXNBZGRlZH1cbiAgICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICAgIG5vVmFsaWRhdGU9e3RydWV9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXhfRWRpdGFibGVJdGVtTGlzdF9uZXdJdGVtXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8Um9vbUFsaWFzRmllbGRcbiAgICAgICAgICAgICAgICAgICAgcmVmPXt0aGlzLl9hbGlhc0ZpZWxkfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17b25DaGFuZ2V9XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXt0aGlzLnByb3BzLm5ld0l0ZW0gfHwgXCJcIn1cbiAgICAgICAgICAgICAgICAgICAgZG9tYWluPXt0aGlzLnByb3BzLmRvbWFpbn0gLz5cbiAgICAgICAgICAgICAgICA8QWNjZXNzaWJsZUJ1dHRvbiBvbkNsaWNrPXt0aGlzLl9vbkFsaWFzQWRkZWR9IGtpbmQ9XCJwcmltYXJ5XCI+XG4gICAgICAgICAgICAgICAgICAgIHsgX3QoXCJBZGRcIikgfVxuICAgICAgICAgICAgICAgIDwvQWNjZXNzaWJsZUJ1dHRvbj5cbiAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFsaWFzU2V0dGluZ3MgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHN0YXRpYyBwcm9wVHlwZXMgPSB7XG4gICAgICAgIHJvb21JZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgICAgICBjYW5TZXRDYW5vbmljYWxBbGlhczogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgY2FuU2V0QWxpYXNlczogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcbiAgICAgICAgY2Fub25pY2FsQWxpYXNFdmVudDogUHJvcFR5cGVzLm9iamVjdCwgLy8gTWF0cml4RXZlbnRcbiAgICB9O1xuXG4gICAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICAgICAgY2FuU2V0QWxpYXNlczogZmFsc2UsXG4gICAgICAgIGNhblNldENhbm9uaWNhbEFsaWFzOiBmYWxzZSxcbiAgICAgICAgYWxpYXNFdmVudHM6IFtdLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSB7XG4gICAgICAgICAgICBhbHRBbGlhc2VzOiBbXSwgLy8gWyAjYWxpYXM6ZG9tYWluLnRsZCwgLi4uIF1cbiAgICAgICAgICAgIGxvY2FsQWxpYXNlczogW10sIC8vIFsgI2FsaWFzOm15LWhzLnRsZCwgLi4uIF1cbiAgICAgICAgICAgIGNhbm9uaWNhbEFsaWFzOiBudWxsLCAvLyAjY2Fub25pY2FsOmRvbWFpbi50bGRcbiAgICAgICAgICAgIHVwZGF0aW5nQ2Fub25pY2FsQWxpYXM6IGZhbHNlLFxuICAgICAgICAgICAgbG9jYWxBbGlhc2VzTG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgICBkZXRhaWxzT3BlbjogZmFsc2UsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHByb3BzLmNhbm9uaWNhbEFsaWFzRXZlbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBwcm9wcy5jYW5vbmljYWxBbGlhc0V2ZW50LmdldENvbnRlbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IGFsdEFsaWFzZXMgPSBjb250ZW50LmFsdF9hbGlhc2VzO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYWx0QWxpYXNlcykpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hbHRBbGlhc2VzID0gYWx0QWxpYXNlcy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGUuY2Fub25pY2FsQWxpYXMgPSBjb250ZW50LmFsaWFzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhcykge1xuICAgICAgICAgICAgLy8gbG9hZCBsb2NhbCBhbGlhc2VzIGZvciBwcm92aWRpbmcgcmVjb21tZW5kYXRpb25zXG4gICAgICAgICAgICAvLyBmb3IgdGhlIGNhbm9uaWNhbCBhbGlhcyBhbmQgYWx0X2FsaWFzZXNcbiAgICAgICAgICAgIHRoaXMubG9hZExvY2FsQWxpYXNlcygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZExvY2FsQWxpYXNlcygpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvY2FsQWxpYXNlc0xvYWRpbmc6IHRydWUgfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBjbGkgPSBNYXRyaXhDbGllbnRQZWcuZ2V0KCk7XG4gICAgICAgICAgICBsZXQgbG9jYWxBbGlhc2VzID0gW107XG4gICAgICAgICAgICBpZiAoYXdhaXQgY2xpLmRvZXNTZXJ2ZXJTdXBwb3J0VW5zdGFibGVGZWF0dXJlKFwib3JnLm1hdHJpeC5tc2MyNDMyXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGkudW5zdGFibGVHZXRMb2NhbEFsaWFzZXModGhpcy5wcm9wcy5yb29tSWQpO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmFsaWFzZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQWxpYXNlcyA9IHJlc3BvbnNlLmFsaWFzZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvY2FsQWxpYXNlcyB9KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBsb2NhbEFsaWFzZXNMb2FkaW5nOiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoYW5nZUNhbm9uaWNhbEFsaWFzKGFsaWFzKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhcykgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IG9sZEFsaWFzID0gdGhpcy5zdGF0ZS5jYW5vbmljYWxBbGlhcztcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBjYW5vbmljYWxBbGlhczogYWxpYXMsXG4gICAgICAgICAgICB1cGRhdGluZ0Nhbm9uaWNhbEFsaWFzOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBldmVudENvbnRlbnQgPSB7XG4gICAgICAgICAgICBhbHRfYWxpYXNlczogdGhpcy5zdGF0ZS5hbHRBbGlhc2VzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChhbGlhcykgZXZlbnRDb250ZW50W1wiYWxpYXNcIl0gPSBhbGlhcztcblxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VuZFN0YXRlRXZlbnQodGhpcy5wcm9wcy5yb29tSWQsIFwibS5yb29tLmNhbm9uaWNhbF9hbGlhc1wiLFxuICAgICAgICAgICAgZXZlbnRDb250ZW50LCBcIlwiKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdFcnJvciB1cGRhdGluZyBtYWluIGFkZHJlc3MnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvciB1cGRhdGluZyBtYWluIGFkZHJlc3NcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciB1cGRhdGluZyB0aGUgcm9vbSdzIG1haW4gYWRkcmVzcy4gSXQgbWF5IG5vdCBiZSBhbGxvd2VkIGJ5IHRoZSBzZXJ2ZXIgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIm9yIGEgdGVtcG9yYXJ5IGZhaWx1cmUgb2NjdXJyZWQuXCIsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7Y2Fub25pY2FsQWxpYXM6IG9sZEFsaWFzfSk7XG4gICAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7dXBkYXRpbmdDYW5vbmljYWxBbGlhczogZmFsc2V9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2hhbmdlQWx0QWxpYXNlcyhhbHRBbGlhc2VzKSB7XG4gICAgICAgIGlmICghdGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhcykgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgdXBkYXRpbmdDYW5vbmljYWxBbGlhczogdHJ1ZSxcbiAgICAgICAgICAgIGFsdEFsaWFzZXMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGV2ZW50Q29udGVudCA9IHt9O1xuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmNhbm9uaWNhbEFsaWFzKSB7XG4gICAgICAgICAgICBldmVudENvbnRlbnQuYWxpYXMgPSB0aGlzLnN0YXRlLmNhbm9uaWNhbEFsaWFzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbHRBbGlhc2VzKSB7XG4gICAgICAgICAgICBldmVudENvbnRlbnRbXCJhbHRfYWxpYXNlc1wiXSA9IGFsdEFsaWFzZXM7XG4gICAgICAgIH1cblxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuc2VuZFN0YXRlRXZlbnQodGhpcy5wcm9wcy5yb29tSWQsIFwibS5yb29tLmNhbm9uaWNhbF9hbGlhc1wiLFxuICAgICAgICAgICAgZXZlbnRDb250ZW50LCBcIlwiKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdFcnJvciB1cGRhdGluZyBhbHRlcm5hdGl2ZSBhZGRyZXNzZXMnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvciB1cGRhdGluZyBtYWluIGFkZHJlc3NcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciB1cGRhdGluZyB0aGUgcm9vbSdzIGFsdGVybmF0aXZlIGFkZHJlc3Nlcy4gXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIkl0IG1heSBub3QgYmUgYWxsb3dlZCBieSB0aGUgc2VydmVyIG9yIGEgdGVtcG9yYXJ5IGZhaWx1cmUgb2NjdXJyZWQuXCIsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3VwZGF0aW5nQ2Fub25pY2FsQWxpYXM6IGZhbHNlfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uTmV3QWxpYXNDaGFuZ2VkID0gKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe25ld0FsaWFzOiB2YWx1ZX0pO1xuICAgIH07XG5cbiAgICBvbkxvY2FsQWxpYXNBZGRlZCA9IChhbGlhcykgPT4ge1xuICAgICAgICBpZiAoIWFsaWFzIHx8IGFsaWFzLmxlbmd0aCA9PT0gMCkgcmV0dXJuOyAvLyBpZ25vcmUgYXR0ZW1wdHMgdG8gY3JlYXRlIGJsYW5rIGFsaWFzZXNcblxuICAgICAgICBjb25zdCBsb2NhbERvbWFpbiA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXREb21haW4oKTtcbiAgICAgICAgaWYgKCFhbGlhcy5pbmNsdWRlcygnOicpKSBhbGlhcyArPSAnOicgKyBsb2NhbERvbWFpbjtcblxuICAgICAgICBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuY3JlYXRlQWxpYXMoYWxpYXMsIHRoaXMucHJvcHMucm9vbUlkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGxvY2FsQWxpYXNlczogdGhpcy5zdGF0ZS5sb2NhbEFsaWFzZXMuY29uY2F0KGFsaWFzKSxcbiAgICAgICAgICAgICAgICBuZXdBbGlhczogbnVsbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmNhbm9uaWNhbEFsaWFzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VDYW5vbmljYWxBbGlhcyhhbGlhcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIE1vZGFsLmNyZWF0ZVRyYWNrZWREaWFsb2coJ0Vycm9yIGNyZWF0aW5nIGFsaWFzJywgJycsIEVycm9yRGlhbG9nLCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IF90KFwiRXJyb3IgY3JlYXRpbmcgYWxpYXNcIiksXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciBjcmVhdGluZyB0aGF0IGFsaWFzLiBJdCBtYXkgbm90IGJlIGFsbG93ZWQgYnkgdGhlIHNlcnZlciBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwib3IgYSB0ZW1wb3JhcnkgZmFpbHVyZSBvY2N1cnJlZC5cIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBvbkxvY2FsQWxpYXNEZWxldGVkID0gKGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGFsaWFzID0gdGhpcy5zdGF0ZS5sb2NhbEFsaWFzZXNbaW5kZXhdO1xuICAgICAgICAvLyBUT0RPOiBJbiBmdXR1cmUsIHdlIHNob3VsZCBwcm9iYWJseSBiZSBtYWtpbmcgc3VyZSB0aGF0IHRoZSBhbGlhcyBhY3R1YWxseSBiZWxvbmdzXG4gICAgICAgIC8vIHRvIHRoaXMgcm9vbS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92ZWN0b3ItaW0vcmlvdC13ZWIvaXNzdWVzLzczNTNcbiAgICAgICAgTWF0cml4Q2xpZW50UGVnLmdldCgpLmRlbGV0ZUFsaWFzKGFsaWFzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsQWxpYXNlcyA9IHRoaXMuc3RhdGUubG9jYWxBbGlhc2VzLmZpbHRlcihhID0+IGEgIT09IGFsaWFzKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2xvY2FsQWxpYXNlc30pO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5jYW5vbmljYWxBbGlhcyA9PT0gYWxpYXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUNhbm9uaWNhbEFsaWFzKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICBsZXQgZGVzY3JpcHRpb247XG4gICAgICAgICAgICBpZiAoZXJyLmVycmNvZGUgPT09IFwiTV9GT1JCSURERU5cIikge1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gX3QoXCJZb3UgZG9uJ3QgaGF2ZSBwZXJtaXNzaW9uIHRvIGRlbGV0ZSB0aGUgYWxpYXMuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbiA9IF90KFxuICAgICAgICAgICAgICAgICAgICBcIlRoZXJlIHdhcyBhbiBlcnJvciByZW1vdmluZyB0aGF0IGFsaWFzLiBJdCBtYXkgbm8gbG9uZ2VyIGV4aXN0IG9yIGEgdGVtcG9yYXJ5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJlcnJvciBvY2N1cnJlZC5cIixcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTW9kYWwuY3JlYXRlVHJhY2tlZERpYWxvZygnRXJyb3IgcmVtb3ZpbmcgYWxpYXMnLCAnJywgRXJyb3JEaWFsb2csIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogX3QoXCJFcnJvciByZW1vdmluZyBhbGlhc1wiKSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgb25Mb2NhbEFsaWFzZXNUb2dnbGVkID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIC8vIGV4cGFuZGVkXG4gICAgICAgIGlmIChldmVudC50YXJnZXQub3Blbikge1xuICAgICAgICAgICAgLy8gaWYgbG9jYWwgYWxpYXNlcyBoYXZlbid0IGJlZW4gcHJlbG9hZGVkIHlldCBhdCBjb21wb25lbnQgbW91bnRcbiAgICAgICAgICAgIGlmICghdGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhcyAmJiB0aGlzLnN0YXRlLmxvY2FsQWxpYXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRMb2NhbEFsaWFzZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtkZXRhaWxzT3BlbjogZXZlbnQudGFyZ2V0Lm9wZW59KTtcbiAgICB9O1xuXG4gICAgb25DYW5vbmljYWxBbGlhc0NoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLmNoYW5nZUNhbm9uaWNhbEFsaWFzKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgfTtcblxuICAgIG9uTmV3QWx0QWxpYXNDaGFuZ2VkID0gKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe25ld0FsdEFsaWFzOiB2YWx1ZX0pO1xuICAgIH1cblxuICAgIG9uQWx0QWxpYXNBZGRlZCA9IChhbGlhcykgPT4ge1xuICAgICAgICBjb25zdCBhbHRBbGlhc2VzID0gdGhpcy5zdGF0ZS5hbHRBbGlhc2VzLnNsaWNlKCk7XG4gICAgICAgIGlmICghYWx0QWxpYXNlcy5zb21lKGEgPT4gYS50cmltKCkgPT09IGFsaWFzLnRyaW0oKSkpIHtcbiAgICAgICAgICAgIGFsdEFsaWFzZXMucHVzaChhbGlhcy50cmltKCkpO1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VBbHRBbGlhc2VzKGFsdEFsaWFzZXMpO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7bmV3QWx0QWxpYXM6IFwiXCJ9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uQWx0QWxpYXNEZWxldGVkID0gKGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGFsdEFsaWFzZXMgPSB0aGlzLnN0YXRlLmFsdEFsaWFzZXMuc2xpY2UoKTtcbiAgICAgICAgYWx0QWxpYXNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmNoYW5nZUFsdEFsaWFzZXMoYWx0QWxpYXNlcyk7XG4gICAgfVxuXG4gICAgX2dldEFsaWFzZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmFsdEFsaWFzZXMuY29uY2F0KHRoaXMuX2dldExvY2FsTm9uQWx0QWxpYXNlcygpKTtcbiAgICB9XG5cbiAgICBfZ2V0TG9jYWxOb25BbHRBbGlhc2VzKCkge1xuICAgICAgICBjb25zdCB7YWx0QWxpYXNlc30gPSB0aGlzLnN0YXRlO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5sb2NhbEFsaWFzZXMuZmlsdGVyKGFsaWFzID0+ICFhbHRBbGlhc2VzLmluY2x1ZGVzKGFsaWFzKSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBsb2NhbERvbWFpbiA9IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXREb21haW4oKTtcblxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgY2Fub25pY2FsVmFsdWUgPSB0aGlzLnN0YXRlLmNhbm9uaWNhbEFsaWFzIHx8IFwiXCI7XG4gICAgICAgIGNvbnN0IGNhbm9uaWNhbEFsaWFzU2VjdGlvbiA9IChcbiAgICAgICAgICAgIDxGaWVsZCBvbkNoYW5nZT17dGhpcy5vbkNhbm9uaWNhbEFsaWFzQ2hhbmdlfSB2YWx1ZT17Y2Fub25pY2FsVmFsdWV9XG4gICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3RoaXMuc3RhdGUudXBkYXRpbmdDYW5vbmljYWxBbGlhcyB8fCAhdGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhc31cbiAgICAgICAgICAgICAgICAgICBlbGVtZW50PSdzZWxlY3QnIGlkPSdjYW5vbmljYWxBbGlhcycgbGFiZWw9e190KCdNYWluIGFkZHJlc3MnKX0+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiIGtleT1cInVuc2V0XCI+eyBfdCgnbm90IHNwZWNpZmllZCcpIH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dldEFsaWFzZXMoKS5tYXAoKGFsaWFzLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxpYXMgPT09IHRoaXMuc3RhdGUuY2Fub25pY2FsQWxpYXMpIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT17YWxpYXN9IGtleT17aX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYWxpYXMgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCB8fCAhdGhpcy5zdGF0ZS5jYW5vbmljYWxBbGlhcyA/ICcnIDpcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT17IHRoaXMuc3RhdGUuY2Fub25pY2FsQWxpYXMgfSBrZXk9J2FyYml0cmFyeSc+XG4gICAgICAgICAgICAgICAgICAgICAgICB7IHRoaXMuc3RhdGUuY2Fub25pY2FsQWxpYXMgfVxuICAgICAgICAgICAgICAgICAgICA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICA8L0ZpZWxkPlxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBsb2NhbEFsaWFzZXNMaXN0O1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5sb2NhbEFsaWFzZXNMb2FkaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlNwaW5uZXJcIik7XG4gICAgICAgICAgICBsb2NhbEFsaWFzZXNMaXN0ID0gPFNwaW5uZXIgLz47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2NhbEFsaWFzZXNMaXN0ID0gKDxFZGl0YWJsZUFsaWFzZXNMaXN0XG4gICAgICAgICAgICAgICAgaWQ9XCJyb29tQWxpYXNlc1wiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcIm14X1Jvb21TZXR0aW5nc19sb2NhbEFsaWFzZXNcIn1cbiAgICAgICAgICAgICAgICBpdGVtcz17dGhpcy5zdGF0ZS5sb2NhbEFsaWFzZXN9XG4gICAgICAgICAgICAgICAgbmV3SXRlbT17dGhpcy5zdGF0ZS5uZXdBbGlhc31cbiAgICAgICAgICAgICAgICBvbk5ld0l0ZW1DaGFuZ2VkPXt0aGlzLm9uTmV3QWxpYXNDaGFuZ2VkfVxuICAgICAgICAgICAgICAgIGNhblJlbW92ZT17dGhpcy5wcm9wcy5jYW5TZXRBbGlhc2VzfVxuICAgICAgICAgICAgICAgIGNhbkVkaXQ9e3RoaXMucHJvcHMuY2FuU2V0QWxpYXNlc31cbiAgICAgICAgICAgICAgICBvbkl0ZW1BZGRlZD17dGhpcy5vbkxvY2FsQWxpYXNBZGRlZH1cbiAgICAgICAgICAgICAgICBvbkl0ZW1SZW1vdmVkPXt0aGlzLm9uTG9jYWxBbGlhc0RlbGV0ZWR9XG4gICAgICAgICAgICAgICAgbm9JdGVtc0xhYmVsPXtfdCgnVGhpcyByb29tIGhhcyBubyBsb2NhbCBhZGRyZXNzZXMnKX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17X3QoJ0xvY2FsIGFkZHJlc3MnKX1cbiAgICAgICAgICAgICAgICBkb21haW49e2xvY2FsRG9tYWlufVxuICAgICAgICAgICAgLz4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdteF9BbGlhc1NldHRpbmdzJz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcnPntfdChcIlB1Ymxpc2hlZCBBZGRyZXNzZXNcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxwPntfdChcIlB1Ymxpc2hlZCBhZGRyZXNzZXMgY2FuIGJlIHVzZWQgYnkgYW55b25lIG9uIGFueSBzZXJ2ZXIgdG8gam9pbiB5b3VyIHJvb20uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJUbyBwdWJsaXNoIGFuIGFkZHJlc3MsIGl0IG5lZWRzIHRvIGJlIHNldCBhcyBhIGxvY2FsIGFkZHJlc3MgZmlyc3QuXCIpfTwvcD5cbiAgICAgICAgICAgICAgICB7Y2Fub25pY2FsQWxpYXNTZWN0aW9ufVxuICAgICAgICAgICAgICAgIDxSb29tUHVibGlzaFNldHRpbmcgcm9vbUlkPXt0aGlzLnByb3BzLnJvb21JZH0gY2FuU2V0Q2Fub25pY2FsQWxpYXM9e3RoaXMucHJvcHMuY2FuU2V0Q2Fub25pY2FsQWxpYXN9IC8+XG4gICAgICAgICAgICAgICAgPGRhdGFsaXN0IGlkPVwibXhfQWxpYXNTZXR0aW5nc19hbHRSZWNvbW1lbmRhdGlvbnNcIj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuX2dldExvY2FsTm9uQWx0QWxpYXNlcygpLm1hcChhbGlhcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiB2YWx1ZT17YWxpYXN9IGtleT17YWxpYXN9IC8+O1xuICAgICAgICAgICAgICAgICAgICB9KX07XG4gICAgICAgICAgICAgICAgPC9kYXRhbGlzdD5cbiAgICAgICAgICAgICAgICA8RWRpdGFibGVBbGlhc2VzTGlzdFxuICAgICAgICAgICAgICAgICAgICBpZD1cInJvb21BbHRBbGlhc2VzXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtcIm14X1Jvb21TZXR0aW5nc19hbHRBbGlhc2VzXCJ9XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zPXt0aGlzLnN0YXRlLmFsdEFsaWFzZXN9XG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW09e3RoaXMuc3RhdGUubmV3QWx0QWxpYXN9XG4gICAgICAgICAgICAgICAgICAgIG9uTmV3SXRlbUNoYW5nZWQ9e3RoaXMub25OZXdBbHRBbGlhc0NoYW5nZWR9XG4gICAgICAgICAgICAgICAgICAgIGNhblJlbW92ZT17dGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhc31cbiAgICAgICAgICAgICAgICAgICAgY2FuRWRpdD17dGhpcy5wcm9wcy5jYW5TZXRDYW5vbmljYWxBbGlhc31cbiAgICAgICAgICAgICAgICAgICAgb25JdGVtQWRkZWQ9e3RoaXMub25BbHRBbGlhc0FkZGVkfVxuICAgICAgICAgICAgICAgICAgICBvbkl0ZW1SZW1vdmVkPXt0aGlzLm9uQWx0QWxpYXNEZWxldGVkfVxuICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uc0xpc3RJZD1cIm14X0FsaWFzU2V0dGluZ3NfYWx0UmVjb21tZW5kYXRpb25zXCJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXNMYWJlbD17X3QoJ090aGVyIHB1Ymxpc2hlZCBhZGRyZXNzZXM6Jyl9XG4gICAgICAgICAgICAgICAgICAgIG5vSXRlbXNMYWJlbD17X3QoJ05vIG90aGVyIHB1Ymxpc2hlZCBhZGRyZXNzZXMgeWV0LCBhZGQgb25lIGJlbG93Jyl9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdCgnTmV3IHB1Ymxpc2hlZCBhZGRyZXNzIChlLmcuICNhbGlhczpzZXJ2ZXIpJyl9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J214X1NldHRpbmdzVGFiX3N1YmhlYWRpbmcgbXhfQWxpYXNTZXR0aW5nc19sb2NhbEFsaWFzSGVhZGVyJz57X3QoXCJMb2NhbCBBZGRyZXNzZXNcIil9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxwPntfdChcIlNldCBhZGRyZXNzZXMgZm9yIHRoaXMgcm9vbSBzbyB1c2VycyBjYW4gZmluZCB0aGlzIHJvb20gdGhyb3VnaCB5b3VyIGhvbWVzZXJ2ZXIgKCUobG9jYWxEb21haW4pcylcIiwge2xvY2FsRG9tYWlufSl9PC9wPlxuICAgICAgICAgICAgICAgIDxkZXRhaWxzIG9uVG9nZ2xlPXt0aGlzLm9uTG9jYWxBbGlhc2VzVG9nZ2xlZH0+XG4gICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5PnsgdGhpcy5zdGF0ZS5kZXRhaWxzT3BlbiA/IF90KCdTaG93IGxlc3MnKSA6IF90KFwiU2hvdyBtb3JlXCIpfTwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgICAgICAge2xvY2FsQWxpYXNlc0xpc3R9XG4gICAgICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuIl19