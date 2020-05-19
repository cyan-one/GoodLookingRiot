"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var sdk = _interopRequireWildcard(require("../../../index"));

var _browserRequest = _interopRequireDefault(require("browser-request"));

var _languageHandler = require("../../../languageHandler");

/*
 Copyright 2016 Aviral Dasgupta
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
const REPOS = ['vector-im/riot-web', 'matrix-org/matrix-react-sdk', 'matrix-org/matrix-js-sdk'];

class ChangelogDialog extends _react.default.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const version = this.props.newVersion.split('-');
    const version2 = this.props.version.split('-');
    if (version == null || version2 == null) return; // parse versions of form: [vectorversion]-react-[react-sdk-version]-js-[js-sdk-version]

    for (let i = 0; i < REPOS.length; i++) {
      const oldVersion = version2[2 * i];
      const newVersion = version[2 * i];
      const url = "https://riot.im/github/repos/".concat(REPOS[i], "/compare/").concat(oldVersion, "...").concat(newVersion);
      (0, _browserRequest.default)(url, (err, response, body) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          this.setState({
            [REPOS[i]]: response.statusText
          });
          return;
        }

        this.setState({
          [REPOS[i]]: JSON.parse(body).commits
        });
      });
    }
  }

  _elementsForCommit(commit) {
    return /*#__PURE__*/_react.default.createElement("li", {
      key: commit.sha,
      className: "mx_ChangelogDialog_li"
    }, /*#__PURE__*/_react.default.createElement("a", {
      href: commit.html_url,
      target: "_blank",
      rel: "noreferrer noopener"
    }, commit.commit.message.split('\n')[0]));
  }

  render() {
    const Spinner = sdk.getComponent('views.elements.Spinner');
    const QuestionDialog = sdk.getComponent('dialogs.QuestionDialog');
    const logs = REPOS.map(repo => {
      let content;

      if (this.state[repo] == null) {
        content = /*#__PURE__*/_react.default.createElement(Spinner, {
          key: repo
        });
      } else if (typeof this.state[repo] === "string") {
        content = (0, _languageHandler._t)("Unable to load commit detail: %(msg)s", {
          msg: this.state[repo]
        });
      } else {
        content = this.state[repo].map(this._elementsForCommit);
      }

      return /*#__PURE__*/_react.default.createElement("div", {
        key: repo
      }, /*#__PURE__*/_react.default.createElement("h2", null, repo), /*#__PURE__*/_react.default.createElement("ul", null, content));
    });

    const content = /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_ChangelogDialog_content"
    }, this.props.version == null || this.props.newVersion == null ? /*#__PURE__*/_react.default.createElement("h2", null, (0, _languageHandler._t)("Unavailable")) : logs);

    return /*#__PURE__*/_react.default.createElement(QuestionDialog, {
      title: (0, _languageHandler._t)("Changelog"),
      description: content,
      button: (0, _languageHandler._t)("Update"),
      onFinished: this.props.onFinished
    });
  }

}

exports.default = ChangelogDialog;
ChangelogDialog.propTypes = {
  version: _propTypes.default.string.isRequired,
  newVersion: _propTypes.default.string.isRequired,
  onFinished: _propTypes.default.func.isRequired
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3ZpZXdzL2RpYWxvZ3MvQ2hhbmdlbG9nRGlhbG9nLmpzIl0sIm5hbWVzIjpbIlJFUE9TIiwiQ2hhbmdlbG9nRGlhbG9nIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwic3RhdGUiLCJjb21wb25lbnREaWRNb3VudCIsInZlcnNpb24iLCJuZXdWZXJzaW9uIiwic3BsaXQiLCJ2ZXJzaW9uMiIsImkiLCJsZW5ndGgiLCJvbGRWZXJzaW9uIiwidXJsIiwiZXJyIiwicmVzcG9uc2UiLCJib2R5Iiwic3RhdHVzQ29kZSIsInNldFN0YXRlIiwic3RhdHVzVGV4dCIsIkpTT04iLCJwYXJzZSIsImNvbW1pdHMiLCJfZWxlbWVudHNGb3JDb21taXQiLCJjb21taXQiLCJzaGEiLCJodG1sX3VybCIsIm1lc3NhZ2UiLCJyZW5kZXIiLCJTcGlubmVyIiwic2RrIiwiZ2V0Q29tcG9uZW50IiwiUXVlc3Rpb25EaWFsb2ciLCJsb2dzIiwibWFwIiwicmVwbyIsImNvbnRlbnQiLCJtc2ciLCJvbkZpbmlzaGVkIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwic3RyaW5nIiwiaXNSZXF1aXJlZCIsImZ1bmMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7OztBQXVCQSxNQUFNQSxLQUFLLEdBQUcsQ0FBQyxvQkFBRCxFQUF1Qiw2QkFBdkIsRUFBc0QsMEJBQXRELENBQWQ7O0FBRWUsTUFBTUMsZUFBTixTQUE4QkMsZUFBTUMsU0FBcEMsQ0FBOEM7QUFDekRDLEVBQUFBLFdBQVcsQ0FBQ0MsS0FBRCxFQUFRO0FBQ2YsVUFBTUEsS0FBTjtBQUVBLFNBQUtDLEtBQUwsR0FBYSxFQUFiO0FBQ0g7O0FBRURDLEVBQUFBLGlCQUFpQixHQUFHO0FBQ2hCLFVBQU1DLE9BQU8sR0FBRyxLQUFLSCxLQUFMLENBQVdJLFVBQVgsQ0FBc0JDLEtBQXRCLENBQTRCLEdBQTVCLENBQWhCO0FBQ0EsVUFBTUMsUUFBUSxHQUFHLEtBQUtOLEtBQUwsQ0FBV0csT0FBWCxDQUFtQkUsS0FBbkIsQ0FBeUIsR0FBekIsQ0FBakI7QUFDQSxRQUFJRixPQUFPLElBQUksSUFBWCxJQUFtQkcsUUFBUSxJQUFJLElBQW5DLEVBQXlDLE9BSHpCLENBSWhCOztBQUNBLFNBQUssSUFBSUMsQ0FBQyxHQUFDLENBQVgsRUFBY0EsQ0FBQyxHQUFDWixLQUFLLENBQUNhLE1BQXRCLEVBQThCRCxDQUFDLEVBQS9CLEVBQW1DO0FBQy9CLFlBQU1FLFVBQVUsR0FBR0gsUUFBUSxDQUFDLElBQUVDLENBQUgsQ0FBM0I7QUFDQSxZQUFNSCxVQUFVLEdBQUdELE9BQU8sQ0FBQyxJQUFFSSxDQUFILENBQTFCO0FBQ0EsWUFBTUcsR0FBRywwQ0FBbUNmLEtBQUssQ0FBQ1ksQ0FBRCxDQUF4QyxzQkFBdURFLFVBQXZELGdCQUF1RUwsVUFBdkUsQ0FBVDtBQUNBLG1DQUFRTSxHQUFSLEVBQWEsQ0FBQ0MsR0FBRCxFQUFNQyxRQUFOLEVBQWdCQyxJQUFoQixLQUF5QjtBQUNsQyxZQUFJRCxRQUFRLENBQUNFLFVBQVQsR0FBc0IsR0FBdEIsSUFBNkJGLFFBQVEsQ0FBQ0UsVUFBVCxJQUF1QixHQUF4RCxFQUE2RDtBQUN6RCxlQUFLQyxRQUFMLENBQWM7QUFBRSxhQUFDcEIsS0FBSyxDQUFDWSxDQUFELENBQU4sR0FBWUssUUFBUSxDQUFDSTtBQUF2QixXQUFkO0FBQ0E7QUFDSDs7QUFDRCxhQUFLRCxRQUFMLENBQWM7QUFBQyxXQUFDcEIsS0FBSyxDQUFDWSxDQUFELENBQU4sR0FBWVUsSUFBSSxDQUFDQyxLQUFMLENBQVdMLElBQVgsRUFBaUJNO0FBQTlCLFNBQWQ7QUFDSCxPQU5EO0FBT0g7QUFDSjs7QUFFREMsRUFBQUEsa0JBQWtCLENBQUNDLE1BQUQsRUFBUztBQUN2Qix3QkFDSTtBQUFJLE1BQUEsR0FBRyxFQUFFQSxNQUFNLENBQUNDLEdBQWhCO0FBQXFCLE1BQUEsU0FBUyxFQUFDO0FBQS9CLG9CQUNJO0FBQUcsTUFBQSxJQUFJLEVBQUVELE1BQU0sQ0FBQ0UsUUFBaEI7QUFBMEIsTUFBQSxNQUFNLEVBQUMsUUFBakM7QUFBMEMsTUFBQSxHQUFHLEVBQUM7QUFBOUMsT0FDS0YsTUFBTSxDQUFDQSxNQUFQLENBQWNHLE9BQWQsQ0FBc0JuQixLQUF0QixDQUE0QixJQUE1QixFQUFrQyxDQUFsQyxDQURMLENBREosQ0FESjtBQU9IOztBQUVEb0IsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsVUFBTUMsT0FBTyxHQUFHQyxHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQWhCO0FBQ0EsVUFBTUMsY0FBYyxHQUFHRixHQUFHLENBQUNDLFlBQUosQ0FBaUIsd0JBQWpCLENBQXZCO0FBRUEsVUFBTUUsSUFBSSxHQUFHbkMsS0FBSyxDQUFDb0MsR0FBTixDQUFVQyxJQUFJLElBQUk7QUFDM0IsVUFBSUMsT0FBSjs7QUFDQSxVQUFJLEtBQUtoQyxLQUFMLENBQVcrQixJQUFYLEtBQW9CLElBQXhCLEVBQThCO0FBQzFCQyxRQUFBQSxPQUFPLGdCQUFHLDZCQUFDLE9BQUQ7QUFBUyxVQUFBLEdBQUcsRUFBRUQ7QUFBZCxVQUFWO0FBQ0gsT0FGRCxNQUVPLElBQUksT0FBTyxLQUFLL0IsS0FBTCxDQUFXK0IsSUFBWCxDQUFQLEtBQTRCLFFBQWhDLEVBQTBDO0FBQzdDQyxRQUFBQSxPQUFPLEdBQUcseUJBQUcsdUNBQUgsRUFBNEM7QUFDbERDLFVBQUFBLEdBQUcsRUFBRSxLQUFLakMsS0FBTCxDQUFXK0IsSUFBWDtBQUQ2QyxTQUE1QyxDQUFWO0FBR0gsT0FKTSxNQUlBO0FBQ0hDLFFBQUFBLE9BQU8sR0FBRyxLQUFLaEMsS0FBTCxDQUFXK0IsSUFBWCxFQUFpQkQsR0FBakIsQ0FBcUIsS0FBS1gsa0JBQTFCLENBQVY7QUFDSDs7QUFDRCwwQkFDSTtBQUFLLFFBQUEsR0FBRyxFQUFFWTtBQUFWLHNCQUNJLHlDQUFLQSxJQUFMLENBREosZUFFSSx5Q0FBS0MsT0FBTCxDQUZKLENBREo7QUFNSCxLQWpCWSxDQUFiOztBQW1CQSxVQUFNQSxPQUFPLGdCQUNUO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNLLEtBQUtqQyxLQUFMLENBQVdHLE9BQVgsSUFBc0IsSUFBdEIsSUFBOEIsS0FBS0gsS0FBTCxDQUFXSSxVQUFYLElBQXlCLElBQXZELGdCQUE4RCx5Q0FBSyx5QkFBRyxhQUFILENBQUwsQ0FBOUQsR0FBNkYwQixJQURsRyxDQURKOztBQU9BLHdCQUNJLDZCQUFDLGNBQUQ7QUFDSSxNQUFBLEtBQUssRUFBRSx5QkFBRyxXQUFILENBRFg7QUFFSSxNQUFBLFdBQVcsRUFBRUcsT0FGakI7QUFHSSxNQUFBLE1BQU0sRUFBRSx5QkFBRyxRQUFILENBSFo7QUFJSSxNQUFBLFVBQVUsRUFBRSxLQUFLakMsS0FBTCxDQUFXbUM7QUFKM0IsTUFESjtBQVFIOztBQTFFd0Q7OztBQTZFN0R2QyxlQUFlLENBQUN3QyxTQUFoQixHQUE0QjtBQUN4QmpDLEVBQUFBLE9BQU8sRUFBRWtDLG1CQUFVQyxNQUFWLENBQWlCQyxVQURGO0FBRXhCbkMsRUFBQUEsVUFBVSxFQUFFaUMsbUJBQVVDLE1BQVYsQ0FBaUJDLFVBRkw7QUFHeEJKLEVBQUFBLFVBQVUsRUFBRUUsbUJBQVVHLElBQVYsQ0FBZUQ7QUFISCxDQUE1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gQ29weXJpZ2h0IDIwMTYgQXZpcmFsIERhc2d1cHRhXG5Db3B5cmlnaHQgMjAxOSBNaWNoYWVsIFRlbGF0eW5za2kgPDd0M2NoZ3V5QGdtYWlsLmNvbT5cblxuIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdwcm9wLXR5cGVzJztcbmltcG9ydCAqIGFzIHNkayBmcm9tICcuLi8uLi8uLi9pbmRleCc7XG5pbXBvcnQgcmVxdWVzdCBmcm9tICdicm93c2VyLXJlcXVlc3QnO1xuaW1wb3J0IHsgX3QgfSBmcm9tICcuLi8uLi8uLi9sYW5ndWFnZUhhbmRsZXInO1xuXG5jb25zdCBSRVBPUyA9IFsndmVjdG9yLWltL3Jpb3Qtd2ViJywgJ21hdHJpeC1vcmcvbWF0cml4LXJlYWN0LXNkaycsICdtYXRyaXgtb3JnL21hdHJpeC1qcy1zZGsnXTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hhbmdlbG9nRGlhbG9nIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgIH1cblxuICAgIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gdGhpcy5wcm9wcy5uZXdWZXJzaW9uLnNwbGl0KCctJyk7XG4gICAgICAgIGNvbnN0IHZlcnNpb24yID0gdGhpcy5wcm9wcy52ZXJzaW9uLnNwbGl0KCctJyk7XG4gICAgICAgIGlmICh2ZXJzaW9uID09IG51bGwgfHwgdmVyc2lvbjIgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAvLyBwYXJzZSB2ZXJzaW9ucyBvZiBmb3JtOiBbdmVjdG9ydmVyc2lvbl0tcmVhY3QtW3JlYWN0LXNkay12ZXJzaW9uXS1qcy1banMtc2RrLXZlcnNpb25dXG4gICAgICAgIGZvciAobGV0IGk9MDsgaTxSRVBPUy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgb2xkVmVyc2lvbiA9IHZlcnNpb24yWzIqaV07XG4gICAgICAgICAgICBjb25zdCBuZXdWZXJzaW9uID0gdmVyc2lvblsyKmldO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vcmlvdC5pbS9naXRodWIvcmVwb3MvJHtSRVBPU1tpXX0vY29tcGFyZS8ke29sZFZlcnNpb259Li4uJHtuZXdWZXJzaW9ufWA7XG4gICAgICAgICAgICByZXF1ZXN0KHVybCwgKGVyciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA8IDIwMCB8fCByZXNwb25zZS5zdGF0dXNDb2RlID49IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgW1JFUE9TW2ldXTogcmVzcG9uc2Uuc3RhdHVzVGV4dCB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtbUkVQT1NbaV1dOiBKU09OLnBhcnNlKGJvZHkpLmNvbW1pdHN9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2VsZW1lbnRzRm9yQ29tbWl0KGNvbW1pdCkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGxpIGtleT17Y29tbWl0LnNoYX0gY2xhc3NOYW1lPVwibXhfQ2hhbmdlbG9nRGlhbG9nX2xpXCI+XG4gICAgICAgICAgICAgICAgPGEgaHJlZj17Y29tbWl0Lmh0bWxfdXJsfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyIG5vb3BlbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIHtjb21taXQuY29tbWl0Lm1lc3NhZ2Uuc3BsaXQoJ1xcbicpWzBdfVxuICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBTcGlubmVyID0gc2RrLmdldENvbXBvbmVudCgndmlld3MuZWxlbWVudHMuU3Bpbm5lcicpO1xuICAgICAgICBjb25zdCBRdWVzdGlvbkRpYWxvZyA9IHNkay5nZXRDb21wb25lbnQoJ2RpYWxvZ3MuUXVlc3Rpb25EaWFsb2cnKTtcblxuICAgICAgICBjb25zdCBsb2dzID0gUkVQT1MubWFwKHJlcG8gPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZVtyZXBvXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IDxTcGlubmVyIGtleT17cmVwb30gLz47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnN0YXRlW3JlcG9dID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IF90KFwiVW5hYmxlIHRvIGxvYWQgY29tbWl0IGRldGFpbDogJShtc2cpc1wiLCB7XG4gICAgICAgICAgICAgICAgICAgIG1zZzogdGhpcy5zdGF0ZVtyZXBvXSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuc3RhdGVbcmVwb10ubWFwKHRoaXMuX2VsZW1lbnRzRm9yQ29tbWl0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBrZXk9e3JlcG99PlxuICAgICAgICAgICAgICAgICAgICA8aDI+e3JlcG99PC9oMj5cbiAgICAgICAgICAgICAgICAgICAgPHVsPntjb250ZW50fTwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9DaGFuZ2Vsb2dEaWFsb2dfY29udGVudFwiPlxuICAgICAgICAgICAgICAgIHt0aGlzLnByb3BzLnZlcnNpb24gPT0gbnVsbCB8fCB0aGlzLnByb3BzLm5ld1ZlcnNpb24gPT0gbnVsbCA/IDxoMj57X3QoXCJVbmF2YWlsYWJsZVwiKX08L2gyPiA6IGxvZ3N9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcblxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UXVlc3Rpb25EaWFsb2dcbiAgICAgICAgICAgICAgICB0aXRsZT17X3QoXCJDaGFuZ2Vsb2dcIil9XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb249e2NvbnRlbnR9XG4gICAgICAgICAgICAgICAgYnV0dG9uPXtfdChcIlVwZGF0ZVwiKX1cbiAgICAgICAgICAgICAgICBvbkZpbmlzaGVkPXt0aGlzLnByb3BzLm9uRmluaXNoZWR9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgKTtcbiAgICB9XG59XG5cbkNoYW5nZWxvZ0RpYWxvZy5wcm9wVHlwZXMgPSB7XG4gICAgdmVyc2lvbjogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIG5ld1ZlcnNpb246IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICBvbkZpbmlzaGVkOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxufTtcbiJdfQ==