"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PillCompletion = exports.TextualCompletion = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _react = _interopRequireDefault(require("react"));

var _classnames = _interopRequireDefault(require("classnames"));

/*
Copyright 2016 Aviral Dasgupta

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
class TextualCompletion extends _react.default.PureComponent
/*:: <ITextualCompletionProps>*/
{
  render() {
    const _this$props = this.props,
          {
      title,
      subtitle,
      description,
      className
    } = _this$props,
          restProps = (0, _objectWithoutProperties2.default)(_this$props, ["title", "subtitle", "description", "className"]);
    return /*#__PURE__*/_react.default.createElement("div", (0, _extends2.default)({
      className: (0, _classnames.default)('mx_Autocomplete_Completion_block', className),
      role: "option"
    }, restProps), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_title"
    }, title), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_subtitle"
    }, subtitle), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_description"
    }, description));
  }

}

exports.TextualCompletion = TextualCompletion;

class PillCompletion extends _react.default.PureComponent
/*:: <IPillCompletionProps>*/
{
  render() {
    const _this$props2 = this.props,
          {
      title,
      subtitle,
      description,
      initialComponent,
      className
    } = _this$props2,
          restProps = (0, _objectWithoutProperties2.default)(_this$props2, ["title", "subtitle", "description", "initialComponent", "className"]);
    return /*#__PURE__*/_react.default.createElement("div", (0, _extends2.default)({
      className: (0, _classnames.default)('mx_Autocomplete_Completion_pill', className),
      role: "option"
    }, restProps), initialComponent, /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_title"
    }, title), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_subtitle"
    }, subtitle), /*#__PURE__*/_react.default.createElement("span", {
      className: "mx_Autocomplete_Completion_description"
    }, description));
  }

}

exports.PillCompletion = PillCompletion;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvY29tcGxldGUvQ29tcG9uZW50cy50c3giXSwibmFtZXMiOlsiVGV4dHVhbENvbXBsZXRpb24iLCJSZWFjdCIsIlB1cmVDb21wb25lbnQiLCJyZW5kZXIiLCJwcm9wcyIsInRpdGxlIiwic3VidGl0bGUiLCJkZXNjcmlwdGlvbiIsImNsYXNzTmFtZSIsInJlc3RQcm9wcyIsIlBpbGxDb21wbGV0aW9uIiwiaW5pdGlhbENvbXBvbmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQTs7QUFDQTs7QUFqQkE7Ozs7Ozs7Ozs7Ozs7OztBQWdDTyxNQUFNQSxpQkFBTixTQUFnQ0MsZUFBTUM7QUFBdEM7QUFBNkU7QUFDaEZDLEVBQUFBLE1BQU0sR0FBRztBQUNMLHdCQU1JLEtBQUtDLEtBTlQ7QUFBQSxVQUFNO0FBQ0ZDLE1BQUFBLEtBREU7QUFFRkMsTUFBQUEsUUFGRTtBQUdGQyxNQUFBQSxXQUhFO0FBSUZDLE1BQUFBO0FBSkUsS0FBTjtBQUFBLFVBS09DLFNBTFA7QUFPQSx3QkFDSTtBQUFLLE1BQUEsU0FBUyxFQUFFLHlCQUFXLGtDQUFYLEVBQStDRCxTQUEvQyxDQUFoQjtBQUEyRSxNQUFBLElBQUksRUFBQztBQUFoRixPQUE2RkMsU0FBN0YsZ0JBQ0k7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUFxREosS0FBckQsQ0FESixlQUVJO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsT0FBd0RDLFFBQXhELENBRkosZUFHSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQTJEQyxXQUEzRCxDQUhKLENBREo7QUFPSDs7QUFoQitFOzs7O0FBMkI3RSxNQUFNRyxjQUFOLFNBQTZCVCxlQUFNQztBQUFuQztBQUF1RTtBQUMxRUMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wseUJBT0ksS0FBS0MsS0FQVDtBQUFBLFVBQU07QUFDRkMsTUFBQUEsS0FERTtBQUVGQyxNQUFBQSxRQUZFO0FBR0ZDLE1BQUFBLFdBSEU7QUFJRkksTUFBQUEsZ0JBSkU7QUFLRkgsTUFBQUE7QUFMRSxLQUFOO0FBQUEsVUFNT0MsU0FOUDtBQVFBLHdCQUNJO0FBQUssTUFBQSxTQUFTLEVBQUUseUJBQVcsaUNBQVgsRUFBOENELFNBQTlDLENBQWhCO0FBQTBFLE1BQUEsSUFBSSxFQUFDO0FBQS9FLE9BQTRGQyxTQUE1RixHQUNNRSxnQkFETixlQUVJO0FBQU0sTUFBQSxTQUFTLEVBQUM7QUFBaEIsT0FBcUROLEtBQXJELENBRkosZUFHSTtBQUFNLE1BQUEsU0FBUyxFQUFDO0FBQWhCLE9BQXdEQyxRQUF4RCxDQUhKLGVBSUk7QUFBTSxNQUFBLFNBQVMsRUFBQztBQUFoQixPQUEyREMsV0FBM0QsQ0FKSixDQURKO0FBUUg7O0FBbEJ5RSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxNiBBdmlyYWwgRGFzZ3VwdGFcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbi8qIFRoZXNlIHdlcmUgZWFybGllciBzdGF0ZWxlc3MgZnVuY3Rpb25hbCBjb21wb25lbnRzIGJ1dCBoYWQgdG8gYmUgY29udmVydGVkXG5zaW5jZSB3ZSBuZWVkIHRvIHVzZSByZWZzL2ZpbmRET01Ob2RlIHRvIGFjY2VzcyB0aGUgdW5kZXJseWluZyBET00gbm9kZSB0byBmb2N1cyB0aGUgY29ycmVjdCBjb21wbGV0aW9uLFxuc29tZXRoaW5nIHRoYXQgaXMgbm90IGVudGlyZWx5IHBvc3NpYmxlIHdpdGggc3RhdGVsZXNzIGZ1bmN0aW9uYWwgY29tcG9uZW50cy4gT25lIGNvdWxkXG5wcmVzdW1hYmx5IHdyYXAgdGhlbSBpbiBhIDxkaXY+IGJlZm9yZSByZW5kZXJpbmcgYnV0IEkgdGhpbmsgdGhpcyBpcyB0aGUgYmV0dGVyIHdheSB0byBkbyBpdC5cbiAqL1xuXG5pbnRlcmZhY2UgSVRleHR1YWxDb21wbGV0aW9uUHJvcHMge1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICAgIHN1YnRpdGxlPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIGNsYXNzTmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1YWxDb21wbGV0aW9uIGV4dGVuZHMgUmVhY3QuUHVyZUNvbXBvbmVudDxJVGV4dHVhbENvbXBsZXRpb25Qcm9wcz4ge1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBzdWJ0aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgLi4ucmVzdFByb3BzXG4gICAgICAgIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZXMoJ214X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2Jsb2NrJywgY2xhc3NOYW1lKX0gcm9sZT1cIm9wdGlvblwiIHsuLi5yZXN0UHJvcHN9PlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX3RpdGxlXCI+eyB0aXRsZSB9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX3N1YnRpdGxlXCI+eyBzdWJ0aXRsZSB9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm14X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX2Rlc2NyaXB0aW9uXCI+eyBkZXNjcmlwdGlvbiB9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgSVBpbGxDb21wbGV0aW9uUHJvcHMge1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICAgIHN1YnRpdGxlPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIGluaXRpYWxDb21wb25lbnQ/OiBSZWFjdC5SZWFjdE5vZGUsXG4gICAgY2xhc3NOYW1lPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUGlsbENvbXBsZXRpb24gZXh0ZW5kcyBSZWFjdC5QdXJlQ29tcG9uZW50PElQaWxsQ29tcGxldGlvblByb3BzPiB7XG4gICAgcmVuZGVyKCkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIHN1YnRpdGxlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBpbml0aWFsQ29tcG9uZW50LFxuICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgLi4ucmVzdFByb3BzXG4gICAgICAgIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZXMoJ214X0F1dG9jb21wbGV0ZV9Db21wbGV0aW9uX3BpbGwnLCBjbGFzc05hbWUpfSByb2xlPVwib3B0aW9uXCIgey4uLnJlc3RQcm9wc30+XG4gICAgICAgICAgICAgICAgeyBpbml0aWFsQ29tcG9uZW50IH1cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl90aXRsZVwiPnsgdGl0bGUgfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9zdWJ0aXRsZVwiPnsgc3VidGl0bGUgfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJteF9BdXRvY29tcGxldGVfQ29tcGxldGlvbl9kZXNjcmlwdGlvblwiPnsgZGVzY3JpcHRpb24gfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgIH1cbn1cbiJdfQ==