"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _languageHandler = require("../../../languageHandler");

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _Validation = _interopRequireDefault(require("./Validation"));

var _MatrixClientPeg = require("../../../MatrixClientPeg");

/*
Copyright 2019 New Vector Ltd

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
// Controlled form component wrapping Field for inputting a room alias scoped to a given domain
class RoomAliasField extends _react.default.PureComponent {
  constructor(props) {
    super(props);
    (0, _defineProperty2.default)(this, "_onChange", ev => {
      if (this.props.onChange) {
        this.props.onChange(this._asFullAlias(ev.target.value));
      }
    });
    (0, _defineProperty2.default)(this, "_onValidate", async fieldState => {
      const result = await this._validationRules(fieldState);
      this.setState({
        isValid: result.valid
      });
      return result;
    });
    (0, _defineProperty2.default)(this, "_validationRules", (0, _Validation.default)({
      rules: [{
        key: "safeLocalpart",
        test: async ({
          value
        }) => {
          if (!value) {
            return true;
          }

          const fullAlias = this._asFullAlias(value); // XXX: FIXME https://github.com/matrix-org/matrix-doc/issues/668


          return !value.includes("#") && !value.includes(":") && !value.includes(",") && encodeURI(fullAlias) === fullAlias;
        },
        invalid: () => (0, _languageHandler._t)("Some characters not allowed")
      }, {
        key: "required",
        test: async ({
          value,
          allowEmpty
        }) => allowEmpty || !!value,
        invalid: () => (0, _languageHandler._t)("Please provide a room alias")
      }, {
        key: "taken",
        final: true,
        test: async ({
          value
        }) => {
          if (!value) {
            return true;
          }

          const client = _MatrixClientPeg.MatrixClientPeg.get();

          try {
            await client.getRoomIdForAlias(this._asFullAlias(value)); // we got a room id, so the alias is taken

            return false;
          } catch (err) {
            // any server error code will do,
            // either it M_NOT_FOUND or the alias is invalid somehow,
            // in which case we don't want to show the invalid message
            return !!err.errcode;
          }
        },
        valid: () => (0, _languageHandler._t)("This alias is available to use"),
        invalid: () => (0, _languageHandler._t)("This alias is already in use")
      }]
    }));
    this.state = {
      isValid: true
    };
  }

  _asFullAlias(localpart) {
    return "#".concat(localpart, ":").concat(this.props.domain);
  }

  render() {
    const Field = sdk.getComponent('views.elements.Field');

    const poundSign = /*#__PURE__*/_react.default.createElement("span", null, "#");

    const aliasPostfix = ":" + this.props.domain;

    const domain = /*#__PURE__*/_react.default.createElement("span", {
      title: aliasPostfix
    }, aliasPostfix);

    const maxlength = 255 - this.props.domain.length - 2; // 2 for # and :

    return /*#__PURE__*/_react.default.createElement(Field, {
      label: (0, _languageHandler._t)("Room alias"),
      className: "mx_RoomAliasField",
      prefix: poundSign,
      postfix: domain,
      ref: ref => this._fieldRef = ref,
      onValidate: this._onValidate,
      placeholder: (0, _languageHandler._t)("e.g. my-room"),
      onChange: this._onChange,
      value: this.props.value.substring(1, this.props.value.length - this.props.domain.length - 1),
      maxLength: maxlength
    });
  }

  get isValid() {
    return this.state.isValid;
  }

  validate(options) {
    return this._fieldRef.validate(options);
  }

  focus() {
    this._fieldRef.focus();
  }

}

exports.default = RoomAliasField;
(0, _defineProperty2.default)(RoomAliasField, "propTypes", {
  domain: _propTypes.default.string.isRequired,
  onChange: _propTypes.default.func,
  value: _propTypes.default.string.isRequired
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2VsZW1lbnRzL1Jvb21BbGlhc0ZpZWxkLmpzIl0sIm5hbWVzIjpbIlJvb21BbGlhc0ZpZWxkIiwiUmVhY3QiLCJQdXJlQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJwcm9wcyIsImV2Iiwib25DaGFuZ2UiLCJfYXNGdWxsQWxpYXMiLCJ0YXJnZXQiLCJ2YWx1ZSIsImZpZWxkU3RhdGUiLCJyZXN1bHQiLCJfdmFsaWRhdGlvblJ1bGVzIiwic2V0U3RhdGUiLCJpc1ZhbGlkIiwidmFsaWQiLCJydWxlcyIsImtleSIsInRlc3QiLCJmdWxsQWxpYXMiLCJpbmNsdWRlcyIsImVuY29kZVVSSSIsImludmFsaWQiLCJhbGxvd0VtcHR5IiwiZmluYWwiLCJjbGllbnQiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRSb29tSWRGb3JBbGlhcyIsImVyciIsImVycmNvZGUiLCJzdGF0ZSIsImxvY2FscGFydCIsImRvbWFpbiIsInJlbmRlciIsIkZpZWxkIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwicG91bmRTaWduIiwiYWxpYXNQb3N0Zml4IiwibWF4bGVuZ3RoIiwibGVuZ3RoIiwicmVmIiwiX2ZpZWxkUmVmIiwiX29uVmFsaWRhdGUiLCJfb25DaGFuZ2UiLCJzdWJzdHJpbmciLCJ2YWxpZGF0ZSIsIm9wdGlvbnMiLCJmb2N1cyIsIlByb3BUeXBlcyIsInN0cmluZyIsImlzUmVxdWlyZWQiLCJmdW5jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBcEJBOzs7Ozs7Ozs7Ozs7Ozs7QUFzQkE7QUFDZSxNQUFNQSxjQUFOLFNBQTZCQyxlQUFNQyxhQUFuQyxDQUFpRDtBQU81REMsRUFBQUEsV0FBVyxDQUFDQyxLQUFELEVBQVE7QUFDZixVQUFNQSxLQUFOO0FBRGUscURBOEJOQyxFQUFELElBQVE7QUFDaEIsVUFBSSxLQUFLRCxLQUFMLENB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LEVBQUFBLE1BQU0sRUFBRWlCLG1CQUFVQyxNQUFWLENBQWlCQyxVQURWO0FBRWY5QyxFQUFBQSxRQUFRLEVBQUU0QyxtQkFBVUcsSUFGTDtBQUdmNUMsRUFBQUEsS0FBSyxFQUFFeUMsbUJBQVVDLE1BQVYsQ0FBaUJDO0FBSFQsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBOZXcgVmVjdG9yIEx0ZFxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgeyBfdCB9IGZyb20gJy4uLy4uLy4uL2xhbmd1YWdlSGFuZGxlcic7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgd2l0aFZhbGlkYXRpb24gZnJvbSAnLi9WYWxpZGF0aW9uJztcbmltcG9ydCB7TWF0cml4Q2xpZW50UGVnfSBmcm9tICcuLi8uLi8uLi9NYXRyaXhDbGllbnRQZWcnO1xuXG4vLyBDb250cm9sbGVkIGZvcm0gY29tcG9uZW50IHdyYXBwaW5nIEZpZWxkIGZvciBpbnB1dHRpbmcgYSByb29tIGFsaWFzIHNjb3BlZCB0byBhIGdpdmVuIGRvbWFpblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUm9vbUFsaWFzRmllbGQgZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50IHtcbiAgICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgICAgICBkb21haW46IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAgICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICB2YWx1ZTogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7aXNWYWxpZDogdHJ1ZX07XG4gICAgfVxuXG4gICAgX2FzRnVsbEFsaWFzKGxvY2FscGFydCkge1xuICAgICAgICByZXR1cm4gYCMke2xvY2FscGFydH06JHt0aGlzLnByb3BzLmRvbWFpbn1gO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgRmllbGQgPSBzZGsuZ2V0Q29tcG9uZW50KCd2aWV3cy5lbGVtZW50cy5GaWVsZCcpO1xuICAgICAgICBjb25zdCBwb3VuZFNpZ24gPSAoPHNwYW4+Izwvc3Bhbj4pO1xuICAgICAgICBjb25zdCBhbGlhc1Bvc3RmaXggPSBcIjpcIiArIHRoaXMucHJvcHMuZG9tYWluO1xuICAgICAgICBjb25zdCBkb21haW4gPSAoPHNwYW4gdGl0bGU9e2FsaWFzUG9zdGZpeH0+e2FsaWFzUG9zdGZpeH08L3NwYW4+KTtcbiAgICAgICAgY29uc3QgbWF4bGVuZ3RoID0gMjU1IC0gdGhpcy5wcm9wcy5kb21haW4ubGVuZ3RoIC0gMjsgICAvLyAyIGZvciAjIGFuZCA6XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPEZpZWxkXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsPXtfdChcIlJvb20gYWxpYXNcIil9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm14X1Jvb21BbGlhc0ZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4PXtwb3VuZFNpZ259XG4gICAgICAgICAgICAgICAgICAgIHBvc3RmaXg9e2RvbWFpbn1cbiAgICAgICAgICAgICAgICAgICAgcmVmPXtyZWYgPT4gdGhpcy5fZmllbGRSZWYgPSByZWZ9XG4gICAgICAgICAgICAgICAgICAgIG9uVmFsaWRhdGU9e3RoaXMuX29uVmFsaWRhdGV9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfdChcImUuZy4gbXktcm9vbVwiKX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuX29uQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5wcm9wcy52YWx1ZS5zdWJzdHJpbmcoMSwgdGhpcy5wcm9wcy52YWx1ZS5sZW5ndGggLSB0aGlzLnByb3BzLmRvbWFpbi5sZW5ndGggLSAxKX1cbiAgICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPXttYXhsZW5ndGh9IC8+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgX29uQ2hhbmdlID0gKGV2KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uQ2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKHRoaXMuX2FzRnVsbEFsaWFzKGV2LnRhcmdldC52YWx1ZSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9vblZhbGlkYXRlID0gYXN5bmMgKGZpZWxkU3RhdGUpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5fdmFsaWRhdGlvblJ1bGVzKGZpZWxkU3RhdGUpO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtpc1ZhbGlkOiByZXN1bHQudmFsaWR9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgX3ZhbGlkYXRpb25SdWxlcyA9IHdpdGhWYWxpZGF0aW9uKHtcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBrZXk6IFwic2FmZUxvY2FscGFydFwiLFxuICAgICAgICAgICAgICAgIHRlc3Q6IGFzeW5jICh7IHZhbHVlIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnVsbEFsaWFzID0gdGhpcy5fYXNGdWxsQWxpYXModmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBYWFg6IEZJWE1FIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRyaXgtb3JnL21hdHJpeC1kb2MvaXNzdWVzLzY2OFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXZhbHVlLmluY2x1ZGVzKFwiI1wiKSAmJiAhdmFsdWUuaW5jbHVkZXMoXCI6XCIpICYmICF2YWx1ZS5pbmNsdWRlcyhcIixcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSShmdWxsQWxpYXMpID09PSBmdWxsQWxpYXM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdChcIlNvbWUgY2hhcmFjdGVycyBub3QgYWxsb3dlZFwiKSxcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBrZXk6IFwicmVxdWlyZWRcIixcbiAgICAgICAgICAgICAgICB0ZXN0OiBhc3luYyAoeyB2YWx1ZSwgYWxsb3dFbXB0eSB9KSA9PiBhbGxvd0VtcHR5IHx8ICEhdmFsdWUsXG4gICAgICAgICAgICAgICAgaW52YWxpZDogKCkgPT4gX3QoXCJQbGVhc2UgcHJvdmlkZSBhIHJvb20gYWxpYXNcIiksXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAga2V5OiBcInRha2VuXCIsXG4gICAgICAgICAgICAgICAgZmluYWw6IHRydWUsXG4gICAgICAgICAgICAgICAgdGVzdDogYXN5bmMgKHt2YWx1ZX0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xpZW50ID0gTWF0cml4Q2xpZW50UGVnLmdldCgpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmdldFJvb21JZEZvckFsaWFzKHRoaXMuX2FzRnVsbEFsaWFzKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBnb3QgYSByb29tIGlkLCBzbyB0aGUgYWxpYXMgaXMgdGFrZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbnkgc2VydmVyIGVycm9yIGNvZGUgd2lsbCBkbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVpdGhlciBpdCBNX05PVF9GT1VORCBvciB0aGUgYWxpYXMgaXMgaW52YWxpZCBzb21laG93LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gd2hpY2ggY2FzZSB3ZSBkb24ndCB3YW50IHRvIHNob3cgdGhlIGludmFsaWQgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEhZXJyLmVycmNvZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHZhbGlkOiAoKSA9PiBfdChcIlRoaXMgYWxpYXMgaXMgYXZhaWxhYmxlIHRvIHVzZVwiKSxcbiAgICAgICAgICAgICAgICBpbnZhbGlkOiAoKSA9PiBfdChcIlRoaXMgYWxpYXMgaXMgYWxyZWFkeSBpbiB1c2VcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pO1xuXG4gICAgZ2V0IGlzVmFsaWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmlzVmFsaWQ7XG4gICAgfVxuXG4gICAgdmFsaWRhdGUob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmllbGRSZWYudmFsaWRhdGUob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkUmVmLmZvY3VzKCk7XG4gICAgfVxufVxuIl19