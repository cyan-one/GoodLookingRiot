"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _createReactClass = _interopRequireDefault(require("create-react-class"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ContentMessages = _interopRequireDefault(require("../../ContentMessages"));

var _dispatcher = _interopRequireDefault(require("../../dispatcher/dispatcher"));

var _filesize = _interopRequireDefault(require("filesize"));

var _languageHandler = require("../../languageHandler");

/*
Copyright 2015, 2016 OpenMarket Ltd
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
var _default = (0, _createReactClass.default)({
  displayName: 'UploadBar',
  propTypes: {
    room: _propTypes.default.object
  },
  componentDidMount: function () {
    this.dispatcherRef = _dispatcher.default.register(this.onAction);
    this.mounted = true;
  },
  componentWillUnmount: function () {
    this.mounted = false;

    _dispatcher.default.unregister(this.dispatcherRef);
  },
  onAction: function (payload) {
    switch (payload.action) {
      case 'upload_progress':
      case 'upload_finished':
      case 'upload_canceled':
      case 'upload_failed':
        if (this.mounted) this.forceUpdate();
        break;
    }
  },
  render: function () {
    const uploads = _ContentMessages.default.sharedInstance().getCurrentUploads(); // for testing UI... - also fix up the ContentMessages.getCurrentUploads().length
    // check in RoomView
    //
    // uploads = [{
    //     roomId: this.props.room.roomId,
    //     loaded: 123493,
    //     total: 347534,
    //     fileName: "testing_fooble.jpg",
    // }];


    if (uploads.length == 0) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    }

    let upload;

    for (let i = 0; i < uploads.length; ++i) {
      if (uploads[i].roomId == this.props.room.roomId) {
        upload = uploads[i];
        break;
      }
    }

    if (!upload) {
      return /*#__PURE__*/_react.default.createElement("div", null);
    }

    const innerProgressStyle = {
      width: upload.loaded / (upload.total || 1) * 100 + '%'
    };
    let uploadedSize = (0, _filesize.default)(upload.loaded);
    const totalSize = (0, _filesize.default)(upload.total);

    if (uploadedSize.replace(/^.* /, '') === totalSize.replace(/^.* /, '')) {
      uploadedSize = uploadedSize.replace(/ .*/, '');
    } // MUST use var name 'count' for pluralization to kick in


    const uploadText = (0, _languageHandler._t)("Uploading %(filename)s and %(count)s others", {
      filename: upload.fileName,
      count: uploads.length - 1
    });
    return /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UploadBar"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UploadBar_uploadProgressOuter"
    }, /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UploadBar_uploadProgressInner",
      style: innerProgressStyle
    })), /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_UploadBar_uploadIcon mx_filterFlipColor",
      src: require("../../../res/img/fileicon.png"),
      width: "17",
      height: "22"
    }), /*#__PURE__*/_react.default.createElement("img", {
      className: "mx_UploadBar_uploadCancel mx_filterFlipColor",
      src: require("../../../res/img/cancel.svg"),
      width: "18",
      height: "18",
      onClick: function () {
        _ContentMessages.default.sharedInstance().cancelUpload(upload.promise);
      }
    }), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UploadBar_uploadBytes"
    }, uploadedSize, " / ", totalSize), /*#__PURE__*/_react.default.createElement("div", {
      className: "mx_UploadBar_uploadFilename"
    }, uploadText));
  }
});

exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3N0cnVjdHVyZXMvVXBsb2FkQmFyLmpzIl0sIm5hbWVzIjpbImRpc3BsYXlOYW1lIiwicHJvcFR5cGVzIiwicm9vbSIsIlByb3BUeXBlcyIsIm9iamVjdCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlzcGF0Y2hlclJlZiIsImRpcyIsInJlZ2lzdGVyIiwib25BY3Rpb24iLCJtb3VudGVkIiwiY29tcG9uZW50V2lsbFVubW91bnQiLCJ1bnJlZ2lzdGVyIiwicGF5bG9hZCIsImFjdGlvbiIsImZvcmNlVXBkYXRlIiwicmVuZGVyIiwidXBsb2FkcyIsIkNvbnRlbnRNZXNzYWdlcyIsInNoYXJlZEluc3RhbmNlIiwiZ2V0Q3VycmVudFVwbG9hZHMiLCJsZW5ndGgiLCJ1cGxvYWQiLCJpIiwicm9vbUlkIiwicHJvcHMiLCJpbm5lclByb2dyZXNzU3R5bGUiLCJ3aWR0aCIsImxvYWRlZCIsInRvdGFsIiwidXBsb2FkZWRTaXplIiwidG90YWxTaXplIiwicmVwbGFjZSIsInVwbG9hZFRleHQiLCJmaWxlbmFtZSIsImZpbGVOYW1lIiwiY291bnQiLCJyZXF1aXJlIiwiY2FuY2VsVXBsb2FkIiwicHJvbWlzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQXZCQTs7Ozs7Ozs7Ozs7Ozs7OztlQXlCZSwrQkFBaUI7QUFDNUJBLEVBQUFBLFdBQVcsRUFBRSxXQURlO0FBRTVCQyxFQUFBQSxTQUFTLEVBQUU7QUFDUEMsSUFBQUEsSUFBSSxFQUFFQyxtQkFBVUM7QUFEVCxHQUZpQjtBQU01QkMsRUFBQUEsaUJBQWlCLEVBQUUsWUFBVztBQUMxQixTQUFLQyxhQUFMLEdBQXFCQyxvQkFBSUMsUUFBSixDQUFhLEtBQUtDLFFBQWxCLENBQXJCO0FBQ0EsU0FBS0MsT0FBTCxHQUFlLElBQWY7QUFDSCxHQVQyQjtBQVc1QkMsRUFBQUEsb0JBQW9CLEVBQUUsWUFB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QWdCQyxjQUFoQixHQUFpQ21CLFlBQWpDLENBQThDaEIsTUFBTSxDQUFDaUIsT0FBckQ7QUFBZ0U7QUFEMUYsTUFMSixlQVFJO0FBQUssTUFBQSxTQUFTLEVBQUM7QUFBZixPQUNNVCxZQUROLFNBQ3lCQyxTQUR6QixDQVJKLGVBV0k7QUFBSyxNQUFBLFNBQVMsRUFBQztBQUFmLE9BQStDRSxVQUEvQyxDQVhKLENBREo7QUFlSDtBQWxGMkIsQ0FBakIsQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNSwgMjAxNiBPcGVuTWFya2V0IEx0ZFxuQ29weXJpZ2h0IDIwMTkgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNyZWF0ZVJlYWN0Q2xhc3MgZnJvbSAnY3JlYXRlLXJlYWN0LWNsYXNzJztcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgQ29udGVudE1lc3NhZ2VzIGZyb20gJy4uLy4uL0NvbnRlbnRNZXNzYWdlcyc7XG5pbXBvcnQgZGlzIGZyb20gXCIuLi8uLi9kaXNwYXRjaGVyL2Rpc3BhdGNoZXJcIjtcbmltcG9ydCBmaWxlc2l6ZSBmcm9tIFwiZmlsZXNpemVcIjtcbmltcG9ydCB7IF90IH0gZnJvbSAnLi4vLi4vbGFuZ3VhZ2VIYW5kbGVyJztcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlUmVhY3RDbGFzcyh7XG4gICAgZGlzcGxheU5hbWU6ICdVcGxvYWRCYXInLFxuICAgIHByb3BUeXBlczoge1xuICAgICAgICByb29tOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIH0sXG5cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlclJlZiA9IGRpcy5yZWdpc3Rlcih0aGlzLm9uQWN0aW9uKTtcbiAgICAgICAgdGhpcy5tb3VudGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vdW50ZWQgPSBmYWxzZTtcbiAgICAgICAgZGlzLnVucmVnaXN0ZXIodGhpcy5kaXNwYXRjaGVyUmVmKTtcbiAgICB9LFxuXG4gICAgb25BY3Rpb246IGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAgICAgICAgc3dpdGNoIChwYXlsb2FkLmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAndXBsb2FkX3Byb2dyZXNzJzpcbiAgICAgICAgICAgIGNhc2UgJ3VwbG9hZF9maW5pc2hlZCc6XG4gICAgICAgICAgICBjYXNlICd1cGxvYWRfY2FuY2VsZWQnOlxuICAgICAgICAgICAgY2FzZSAndXBsb2FkX2ZhaWxlZCc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91bnRlZCkgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHVwbG9hZHMgPSBDb250ZW50TWVzc2FnZXMuc2hhcmVkSW5zdGFuY2UoKS5nZXRDdXJyZW50VXBsb2FkcygpO1xuXG4gICAgICAgIC8vIGZvciB0ZXN0aW5nIFVJLi4uIC0gYWxzbyBmaXggdXAgdGhlIENvbnRlbnRNZXNzYWdlcy5nZXRDdXJyZW50VXBsb2FkcygpLmxlbmd0aFxuICAgICAgICAvLyBjaGVjayBpbiBSb29tVmlld1xuICAgICAgICAvL1xuICAgICAgICAvLyB1cGxvYWRzID0gW3tcbiAgICAgICAgLy8gICAgIHJvb21JZDogdGhpcy5wcm9wcy5yb29tLnJvb21JZCxcbiAgICAgICAgLy8gICAgIGxvYWRlZDogMTIzNDkzLFxuICAgICAgICAvLyAgICAgdG90YWw6IDM0NzUzNCxcbiAgICAgICAgLy8gICAgIGZpbGVOYW1lOiBcInRlc3RpbmdfZm9vYmxlLmpwZ1wiLFxuICAgICAgICAvLyB9XTtcblxuICAgICAgICBpZiAodXBsb2Fkcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdXBsb2FkO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVwbG9hZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmICh1cGxvYWRzW2ldLnJvb21JZCA9PSB0aGlzLnByb3BzLnJvb20ucm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgdXBsb2FkID0gdXBsb2Fkc1tpXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXVwbG9hZCkge1xuICAgICAgICAgICAgcmV0dXJuIDxkaXYgLz47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbm5lclByb2dyZXNzU3R5bGUgPSB7XG4gICAgICAgICAgICB3aWR0aDogKCh1cGxvYWQubG9hZGVkIC8gKHVwbG9hZC50b3RhbCB8fCAxKSkgKiAxMDApICsgJyUnLFxuICAgICAgICB9O1xuICAgICAgICBsZXQgdXBsb2FkZWRTaXplID0gZmlsZXNpemUodXBsb2FkLmxvYWRlZCk7XG4gICAgICAgIGNvbnN0IHRvdGFsU2l6ZSA9IGZpbGVzaXplKHVwbG9hZC50b3RhbCk7XG4gICAgICAgIGlmICh1cGxvYWRlZFNpemUucmVwbGFjZSgvXi4qIC8sICcnKSA9PT0gdG90YWxTaXplLnJlcGxhY2UoL14uKiAvLCAnJykpIHtcbiAgICAgICAgICAgIHVwbG9hZGVkU2l6ZSA9IHVwbG9hZGVkU2l6ZS5yZXBsYWNlKC8gLiovLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNVVNUIHVzZSB2YXIgbmFtZSAnY291bnQnIGZvciBwbHVyYWxpemF0aW9uIHRvIGtpY2sgaW5cbiAgICAgICAgY29uc3QgdXBsb2FkVGV4dCA9IF90KFwiVXBsb2FkaW5nICUoZmlsZW5hbWUpcyBhbmQgJShjb3VudClzIG90aGVyc1wiLCB7ZmlsZW5hbWU6IHVwbG9hZC5maWxlTmFtZSwgY291bnQ6ICh1cGxvYWRzLmxlbmd0aCAtIDEpfSk7XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXBsb2FkQmFyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9VcGxvYWRCYXJfdXBsb2FkUHJvZ3Jlc3NPdXRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm14X1VwbG9hZEJhcl91cGxvYWRQcm9ncmVzc0lubmVyXCIgc3R5bGU9e2lubmVyUHJvZ3Jlc3NTdHlsZX0+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGltZyBjbGFzc05hbWU9XCJteF9VcGxvYWRCYXJfdXBsb2FkSWNvbiBteF9maWx0ZXJGbGlwQ29sb3JcIiBzcmM9e3JlcXVpcmUoXCIuLi8uLi8uLi9yZXMvaW1nL2ZpbGVpY29uLnBuZ1wiKX0gd2lkdGg9XCIxN1wiIGhlaWdodD1cIjIyXCIgLz5cbiAgICAgICAgICAgICAgICA8aW1nIGNsYXNzTmFtZT1cIm14X1VwbG9hZEJhcl91cGxvYWRDYW5jZWwgbXhfZmlsdGVyRmxpcENvbG9yXCIgc3JjPXtyZXF1aXJlKFwiLi4vLi4vLi4vcmVzL2ltZy9jYW5jZWwuc3ZnXCIpfSB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIlxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtmdW5jdGlvbigpIHsgQ29udGVudE1lc3NhZ2VzLnNoYXJlZEluc3RhbmNlKCkuY2FuY2VsVXBsb2FkKHVwbG9hZC5wcm9taXNlKTsgfX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXhfVXBsb2FkQmFyX3VwbG9hZEJ5dGVzXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgdXBsb2FkZWRTaXplIH0gLyB7IHRvdGFsU2l6ZSB9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJteF9VcGxvYWRCYXJfdXBsb2FkRmlsZW5hbWVcIj57IHVwbG9hZFRleHQgfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIl19