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

var _classnames = _interopRequireDefault(require("classnames"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

var _languageHandler = require("../../../languageHandler");

var _UserAddress = require("../../../UserAddress.js");

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd

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
  displayName: 'AddressTile',
  propTypes: {
    address: _UserAddress.UserAddressType.isRequired,
    canDismiss: _propTypes.default.bool,
    onDismissed: _propTypes.default.func,
    justified: _propTypes.default.bool
  },
  getDefaultProps: function () {
    return {
      canDismiss: false,
      onDismissed: function () {},
      // NOP
      justified: false
    };
  },
  render: function () {
    const address = this.props.address;
    const name = address.displayName || address.address;
    const imgUrls = [];
    const isMatrixAddress = ['mx-user-id', 'mx-room-id'].includes(address.addressType);

    if (isMatrixAddress && address.avatarMxc) {
      imgUrls.push(_MatrixClientPeg.MatrixClientPeg.get().mxcUrlToHttp(address.avatarMxc, 25, 25, 'crop'));
    } else if (address.addressType === 'email') {
      imgUrls.push(require("../../../../res/img/icon-email-user.svg"));
    } // Removing networks for now as they're not really supported

    /*
    var network;
    if (this.props.networkUrl !== "") {
        network = (
            <div className="mx_AddressTile_network">
                <BaseAvatar width={25} height={25} name={this.props.networkName} title="Riot" url={this.props.networkUrl} />
            </div>
        );
    }
    */


    const BaseAvatar = sdk.getComponent('avatars.BaseAvatar');
    const TintableSvg = sdk.getComponent("elements.TintableSvg");
    const nameClasses = (0, _classnames.default)({
      "mx_AddressTile_name": true,
      "mx_AddressTile_justified": this.props.justified
    });
    let info;
    let error = false;

    if (isMatrixAddress && address.isKnown) {
      const idClasses = (0, _classnames.default)({
        "mx_AddressTile_id": true,
        "mx_AddressTile_justified": this.props.justified
      });
      info = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressTile_mx"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: nameClasses
      }, name), this.props.showAddress ? /*#__PURE__*/_react.default.createElement("div", {
        className: idClasses
      }, address.address) : /*#__PURE__*/_react.default.createElement("div", null));
    } else if (isMatrixAddress) {
      const unknownMxClasses = (0, _classnames.default)({
        "mx_AddressTile_unknownMx": true,
        "mx_AddressTile_justified": this.props.justified
      });
      info = /*#__PURE__*/_react.default.createElement("div", {
        className: unknownMxClasses
      }, this.props.address.address);
    } else if (address.addressType === "email") {
      const emailClasses = (0, _classnames.default)({
        "mx_AddressTile_email": true,
        "mx_AddressTile_justified": this.props.justified
      });
      let nameNode = null;

      if (address.displayName) {
        nameNode = /*#__PURE__*/_react.default.createElement("div", {
          className: nameClasses
        }, address.displayName);
      }

      info = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressTile_mx"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: emailClasses
      }, address.address), nameNode);
    } else {
      error = true;
      const unknownClasses = (0, _classnames.default)({
        "mx_AddressTile_unknown": true,
        "mx_AddressTile_justified": this.props.justified
      });
      info = /*#__PURE__*/_react.default.createElement("div", {
        className: unknownClasses
      }, (0, _languageHandler._t)("Unknown Address"));
    }

    const classes = (0, _classnames.default)({
      "mx_AddressTile": true,
      "mx_AddressTile_error": error
    });
    let dismiss;

    if (this.props.canDismiss) {
      dismiss = /*#__PURE__*/_react.default.createElement("div", {
        className: "mx_AddressTile_dismiss",
        onClick: this.props.onDismissed
      }, /*#__PURE__*/_react.default.createElement(TintableSvg, {
        src: require("../../../../res/img/icon-address-delete.svg"),
        width: "9",
        height: "9"
      }));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      className: classes
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_AddressTile_avatar"
    }, /*#__PURE__*/_react.default.createElement(BaseAvatar, {
      defaultToInitialLetter: true,
      width: 25,
      height: 25,
      name: name,
      title: name,
      urls: imgUrls
    })), info, dismiss);
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL0FkZHJlc3NUaWxlLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwiYWRkcmVzcyIsIlVzZXJBZGRyZXNzVHlwZSIsImlzUmVxdWlyZWQiLCJjYW5EaXNtaXNzIiwiUHJvcFR5cGVzIiwiYm9vbCIsIm9uRGlzbWlzc2VkIiwiZnVuYyIsImp1c3RpZmllZCIsImdldERlZmF1bHRQcm9wcyIsInJlbmRlciIsInByb3BzIiwibmFtZSIsImltZ1VybHMiLCJpc01hdHJpeEFkZHJlc3MiLCJpbmNsdWRlcyIsImFkZHJlc3NUeXBlIiwiYXZhdGFyTXhjIiwicHVzaCIsIk1hdHJpeENsaWVudFBlZyIsImdldCIsIm14Y1VybFRvSHR0cCIsInJlcXVpcmUiLCJCYXNlQXZhdGFyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiVGludGFibGVTdmciLCJuYW1lQ2xhc3NlcyIsImluZm8iLCJlcnJvciIsImlzS25vd24iLCJpZENsYXNzZXMiLCJzaG93QWRkcmVzcyIsInVua25vd25NeENsYXNzZXMiLCJlbWFpbENsYXNzZXMiLCJuYW1lTm9kZSIsInVua25vd25DbGFzc2VzIiwiY2xhc3NlcyIsImRpc21pc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7OztlQTJCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxhQURlO0FBRzVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsT0FBTyxFQUFFQyw2QkFBZ0JDLFVBRGxCO0FBRVBDLElBQUFBLFVBQVUsRUFBRUMsbUJBQVVDLElBRmY7QUFHUEMsSUFBQUEsV0FBVyxFQUFFRixtQkFBVUcsSUFIaEI7QUFJUEMsSUFBQUEsU0FBUyxFQUFFSixtQkFBVUM7QUFKZCxHQUhpQjtBQVU1QkksRUFB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RSxFQUE3RDtBQUFpRSxNQUFBLElBQUksRUFBRXpCLElBQXZFO0FBQTZFLE1BQUEsS0FBSyxFQUFFQSxJQUFwRjtBQUEwRixNQUFBLElBQUksRUFBRUM7QUFBaEcsTUFESixDQURKLEVBSU1lLElBSk4sRUFLTVUsT0FMTixDQURKO0FBU0g7QUFuSTJCLENBQWpCLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcbkNvcHlyaWdodCAyMDE3IE5ldyBWZWN0b3IgTHRkXG5cbkxpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG55b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG5Zb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcblxuICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5Vbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG5kaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG5XSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cblNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbmxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgY3JlYXRlUmVhY3RDbGFzcyBmcm9tICdjcmVhdGUtcmVhY3QtY2xhc3MnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5pbXBvcnQgKiBhcyBzZGsgZnJvbSBcIi4uLy4uLy4uL2luZGV4XCI7XG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSBcIi4uLy4uLy4uL01hdHJpeENsaWVudFBlZ1wiO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuaW1wb3J0IHsgVXNlckFkZHJlc3NUeXBlIH0gZnJvbSAnLi4vLi4vLi4vVXNlckFkZHJlc3MuanMnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVJlYWN0Q2xhc3Moe1xuICAgIGRpc3BsYXlOYW1lOiAnQWRkcmVzc1RpbGUnLFxuXG4gICAgcHJvcFR5cGVzOiB7XG4gICAgICAgIGFkZHJlc3M6IFVzZXJBZGRyZXNzVHlwZS5pc1JlcXVpcmVkLFxuICAgICAgICBjYW5EaXNtaXNzOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgb25EaXNtaXNzZWQ6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICBqdXN0aWZpZWQ6IFByb3BUeXBlcy5ib29sLFxuICAgIH0sXG5cbiAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY2FuRGlzbWlzczogZmFsc2UsXG4gICAgICAgICAgICBvbkRpc21pc3NlZDogZnVuY3Rpb24oKSB7fSwgLy8gTk9QXG4gICAgICAgICAgICBqdXN0aWZpZWQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zdCBhZGRyZXNzID0gdGhpcy5wcm9wcy5hZGRyZXNzO1xuICAgICAgICBjb25zdCBuYW1lID0gYWRkcmVzcy5kaXNwbGF5TmFtZSB8fCBhZGRyZXNzLmFkZHJlc3M7XG5cbiAgICAgICAgY29uc3QgaW1nVXJscyA9IFtdO1xuICAgICAgICBjb25zdCBpc01hdHJpeEFkZHJlc3MgPSBbJ214LXVzZXItaWQnLCAnbXgtcm9vbS1pZCddLmluY2x1ZGVzKGFkZHJlc3MuYWRkcmVzc1R5cGUpO1xuXG4gICAgICAgIGlmIChpc01hdHJpeEFkZHJlc3MgJiYgYWRkcmVzcy5hdmF0YXJNeGMpIHtcbiAgICAgICAgICAgIGltZ1VybHMucHVzaChNYXRyaXhDbGllbnRQZWcuZ2V0KCkubXhjVXJsVG9IdHRwKFxuICAgICAgICAgICAgICAgIGFkZHJlc3MuYXZhdGFyTXhjLCAyNSwgMjUsICdjcm9wJyxcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9IGVsc2UgaWYgKGFkZHJlc3MuYWRkcmVzc1R5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgICAgICAgIGltZ1VybHMucHVzaChyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uLWVtYWlsLXVzZXIuc3ZnXCIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92aW5nIG5ldHdvcmtzIGZvciBub3cgYXMgdGhleSdyZSBub3QgcmVhbGx5IHN1cHBvcnRlZFxuICAgICAgICAvKlxuICAgICAgICB2YXIgbmV0d29yaztcbiAgICAgICAgaWYgKHRoaXMucHJvcHMubmV0d29ya1VybCAhPT0gXCJcIikge1xuICAgICAgICAgICAgbmV0d29yayA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NUaWxlX25ldHdvcmtcIj5cbiAgICAgICAgICAgICAgICAgICAgPEJhc2VBdmF0YXIgd2lkdGg9ezI1fSBoZWlnaHQ9ezI1fSBuYW1lPXt0aGlzLnByb3BzLm5ldHdvcmtOYW1lfSB0aXRsZT1cIlJpb3RcIiB1cmw9e3RoaXMucHJvcHMubmV0d29ya1VybH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cblxuICAgICAgICBjb25zdCBCYXNlQXZhdGFyID0gc2RrLmdldENvbXBvbmVudCgnYXZhdGFycy5CYXNlQXZhdGFyJyk7XG4gICAgICAgIGNvbnN0IFRpbnRhYmxlU3ZnID0gc2RrLmdldENvbXBvbmVudChcImVsZW1lbnRzLlRpbnRhYmxlU3ZnXCIpO1xuXG4gICAgICAgIGNvbnN0IG5hbWVDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICBcIm14X0FkZHJlc3NUaWxlX25hbWVcIjogdHJ1ZSxcbiAgICAgICAgICAgIFwibXhfQWRkcmVzc1RpbGVfanVzdGlmaWVkXCI6IHRoaXMucHJvcHMuanVzdGlmaWVkLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgaW5mbztcbiAgICAgICAgbGV0IGVycm9yID0gZmFsc2U7XG4gICAgICAgIGlmIChpc01hdHJpeEFkZHJlc3MgJiYgYWRkcmVzcy5pc0tub3duKSB7XG4gICAgICAgICAgICBjb25zdCBpZENsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICBcIm14X0FkZHJlc3NUaWxlX2lkXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9BZGRyZXNzVGlsZV9qdXN0aWZpZWRcIjogdGhpcy5wcm9wcy5qdXN0aWZpZWQsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaW5mbyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NUaWxlX214XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtuYW1lQ2xhc3Nlc30+eyBuYW1lIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLnByb3BzLnNob3dBZGRyZXNzID9cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtpZENsYXNzZXN9PnsgYWRkcmVzcy5hZGRyZXNzIH08L2Rpdj4gOlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiAvPlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTWF0cml4QWRkcmVzcykge1xuICAgICAgICAgICAgY29uc3QgdW5rbm93bk14Q2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgICAgIFwibXhfQWRkcmVzc1RpbGVfdW5rbm93bk14XCI6IHRydWUsXG4gICAgICAgICAgICAgICAgXCJteF9BZGRyZXNzVGlsZV9qdXN0aWZpZWRcIjogdGhpcy5wcm9wcy5qdXN0aWZpZWQsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaW5mbyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17dW5rbm93bk14Q2xhc3Nlc30+eyB0aGlzLnByb3BzLmFkZHJlc3MuYWRkcmVzcyB9PC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKGFkZHJlc3MuYWRkcmVzc1R5cGUgPT09IFwiZW1haWxcIikge1xuICAgICAgICAgICAgY29uc3QgZW1haWxDbGFzc2VzID0gY2xhc3NOYW1lcyh7XG4gICAgICAgICAgICAgICAgXCJteF9BZGRyZXNzVGlsZV9lbWFpbFwiOiB0cnVlLFxuICAgICAgICAgICAgICAgIFwibXhfQWRkcmVzc1RpbGVfanVzdGlmaWVkXCI6IHRoaXMucHJvcHMuanVzdGlmaWVkLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCBuYW1lTm9kZSA9IG51bGw7XG4gICAgICAgICAgICBpZiAoYWRkcmVzcy5kaXNwbGF5TmFtZSkge1xuICAgICAgICAgICAgICAgIG5hbWVOb2RlID0gPGRpdiBjbGFzc05hbWU9e25hbWVDbGFzc2VzfT57IGFkZHJlc3MuZGlzcGxheU5hbWUgfTwvZGl2PjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5mbyA9IChcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NUaWxlX214XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtlbWFpbENsYXNzZXN9PnsgYWRkcmVzcy5hZGRyZXNzIH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyBuYW1lTm9kZSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgdW5rbm93bkNsYXNzZXMgPSBjbGFzc05hbWVzKHtcbiAgICAgICAgICAgICAgICBcIm14X0FkZHJlc3NUaWxlX3Vua25vd25cIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBcIm14X0FkZHJlc3NUaWxlX2p1c3RpZmllZFwiOiB0aGlzLnByb3BzLmp1c3RpZmllZCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpbmZvID0gKFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXt1bmtub3duQ2xhc3Nlc30+eyBfdChcIlVua25vd24gQWRkcmVzc1wiKSB9PC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMoe1xuICAgICAgICAgICAgXCJteF9BZGRyZXNzVGlsZVwiOiB0cnVlLFxuICAgICAgICAgICAgXCJteF9BZGRyZXNzVGlsZV9lcnJvclwiOiBlcnJvcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGRpc21pc3M7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLmNhbkRpc21pc3MpIHtcbiAgICAgICAgICAgIGRpc21pc3MgPSAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9BZGRyZXNzVGlsZV9kaXNtaXNzXCIgb25DbGljaz17dGhpcy5wcm9wcy5vbkRpc21pc3NlZH0gPlxuICAgICAgICAgICAgICAgICAgICA8VGludGFibGVTdmcgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vLi4vcmVzL2ltZy9pY29uLWFkZHJlc3MtZGVsZXRlLnN2Z1wiKX0gd2lkdGg9XCI5XCIgaGVpZ2h0PVwiOVwiIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X0FkZHJlc3NUaWxlX2F2YXRhclwiPlxuICAgICAgICAgICAgICAgICAgICA8QmFzZUF2YXRhciBkZWZhdWx0VG9Jbml0aWFsTGV0dGVyPXt0cnVlfSB3aWR0aD17MjV9IGhlaWdodD17MjV9IG5hbWU9e25hbWV9IHRpdGxlPXtuYW1lfSB1cmxzPXtpbWdVcmxzfSAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIHsgaW5mbyB9XG4gICAgICAgICAgICAgICAgeyBkaXNtaXNzIH1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH0sXG59KTtcbiJdfQ==