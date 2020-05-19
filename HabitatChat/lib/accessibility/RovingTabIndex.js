"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RovingTabIndexWrapper = exports.useRovingTabIndex = exports.RovingTabIndexProvider = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Keyboard = require("../Keyboard");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/**
 * Module to simplify implementing the Roving TabIndex accessibility technique
 *
 * Wrap the Widget in an RovingTabIndexContextProvider
 * and then for all buttons make use of useRovingTabIndex or RovingTabIndexWrapper.
 * The code will keep track of which tabIndex was most recently focused and expose that information as `isActive` which
 * can then be used to only set the tabIndex to 0 as expected by the roving tabindex technique.
 * When the active button gets unmounted the closest button will be chosen as expected.
 * Initially the first button to mount will be given active state.
 *
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets#Technique_1_Roving_tabindex
 */
const DOCUMENT_POSITION_PRECEDING = 2;
const RovingTabIndexContext = (0, _react.createContext)({
  state: {
    activeRef: null,
    refs: [] // list of refs in DOM order

  },
  dispatch: () => {}
});
RovingTabIndexContext.displayName = "RovingTabIndexContext"; // TODO use a TypeScript type here

const types = {
  REGISTER: "REGISTER",
  UNREGISTER: "UNREGISTER",
  SET_FOCUS: "SET_FOCUS"
};

const reducer = (state, action) => {
  switch (action.type) {
    case types.REGISTER:
      {
        if (state.refs.length === 0) {
          // Our list of refs was empty, set activeRef to this first item
          return _objectSpread({}, state, {
            activeRef: action.payload.ref,
            refs: [action.payload.ref]
          });
        }

        if (state.refs.includes(action.payload.ref)) {
          return state; // already in refs, this should not happen
        } // find the index of the first ref which is not preceding this one in DOM order


        let newIndex = state.refs.findIndex(ref => {
          return ref.current.compareDocumentPosition(action.payload.ref.current) & DOCUMENT_POSITION_PRECEDING;
        });

        if (newIndex < 0) {
          newIndex = state.refs.length; // append to the end
        } // update the refs list


        return _objectSpread({}, state, {
          refs: [...state.refs.slice(0, newIndex), action.payload.ref, ...state.refs.slice(newIndex)]
        });
      }

    case types.UNREGISTER:
      {
        // filter out the ref which we are removing
        const refs = state.refs.filter(r => r !== action.payload.ref);

        if (refs.length === state.refs.length) {
          return state; // already removed, this should not happen
        }

        if (state.activeRef === action.payload.ref) {
          // we just removed the active ref, need to replace it
          // pick the ref which is now in the index the old ref was in
          const oldIndex = state.refs.findIndex(r => r === action.payload.ref);
          return _objectSpread({}, state, {
            activeRef: oldIndex >= refs.length ? refs[refs.length - 1] : refs[oldIndex],
            refs
          });
        } // update the refs list


        return _objectSpread({}, state, {
          refs
        });
      }

    case types.SET_FOCUS:
      {
        // update active ref
        return _objectSpread({}, state, {
          activeRef: action.payload.ref
        });
      }

    default:
      return state;
  }
};

const RovingTabIndexProvider = ({
  children,
  handleHomeEnd,
  onKeyDown
}) => {
  const [state, dispatch] = (0, _react.useReducer)(reducer, {
    activeRef: null,
    refs: []
  });
  const context = (0, _react.useMemo)(() => ({
    state,
    dispatch
  }), [state]);
  const onKeyDownHandler = (0, _react.useCallback)(ev => {
    let handled = false;

    if (handleHomeEnd) {
      // check if we actually have any items
      switch (ev.key) {
        case _Keyboard.Key.HOME:
          handled = true; // move focus to first item

          if (context.state.refs.length > 0) {
            context.state.refs[0].current.focus();
          }

          break;

        case _Keyboard.Key.END:
          handled = true; // move focus to last item

          if (context.state.refs.length > 0) {
            context.state.refs[context.state.refs.length - 1].current.focus();
          }

          break;
      }
    }

    if (handled) {
      ev.preventDefault();
      ev.stopPropagation();
    } else if (onKeyDown) {
      return onKeyDown(ev);
    }
  }, [context.state, onKeyDown, handleHomeEnd]);
  return /*#__PURE__*/_react.default.createElement(RovingTabIndexContext.Provider, {
    value: context
  }, children({
    onKeyDownHandler
  }));
};

exports.RovingTabIndexProvider = RovingTabIndexProvider;
RovingTabIndexProvider.propTypes = {
  handleHomeEnd: _propTypes.default.bool,
  onKeyDown: _propTypes.default.func
}; // Hook to register a roving tab index
// inputRef parameter specifies the ref to use
// onFocus should be called when the index gained focus in any manner
// isActive should be used to set tabIndex in a manner such as `tabIndex={isActive ? 0 : -1}`
// ref should be passed to a DOM node which will be used for DOM compareDocumentPosition

const useRovingTabIndex = inputRef => {
  const context = (0, _react.useContext)(RovingTabIndexContext);
  let ref = (0, _react.useRef)(null);

  if (inputRef) {
    // if we are given a ref, use it instead of ours
    ref = inputRef;
  } // setup (after refs)


  (0, _react.useLayoutEffect)(() => {
    context.dispatch({
      type: types.REGISTER,
      payload: {
        ref
      }
    }); // teardown

    return () => {
      context.dispatch({
        type: types.UNREGISTER,
        payload: {
          ref
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFocus = (0, _react.useCallback)(() => {
    context.dispatch({
      type: types.SET_FOCUS,
      payload: {
        ref
      }
    });
  }, [ref, context]);
  const isActive = context.state.activeRef === ref;
  return [onFocus, isActive, ref];
}; // Wrapper to allow use of useRovingTabIndex outside of React Functional Components.


exports.useRovingTabIndex = useRovingTabIndex;

const RovingTabIndexWrapper = ({
  children,
  inputRef
}) => {
  const [onFocus, isActive, ref] = useRovingTabIndex(inputRef);
  return children({
    onFocus,
    isActive,
    ref
  });
};

exports.RovingTabIndexWrapper = RovingTabIndexWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY2Nlc3NpYmlsaXR5L1JvdmluZ1RhYkluZGV4LmpzIl0sIm5hbWVzIjpbIkRPQ1VNRU5UX1BPU0lUSU9OX1BSRUNFRElORyIsIlJvdmluZ1RhYkluZGV4Q29udGV4dCIsInN0YXRlIiwiYWN0aXZlUmVmIiwicmVmcyIsImRpc3BhdGNoIiwiZGlzcGxheU5hbWUiLCJ0eXBlcyIsIlJFR0lTVEVSIiwiVU5SRUdJU1RFUiIsIlNFVF9GT0NVUyIsInJlZHVjZXIiLCJhY3Rpb24iLCJ0eXBlIiwibGVuZ3RoIiwicGF5bG9hZCIsInJlZiIsImluY2x1ZGVzIiwibmV3SW5kZXgiLCJmaW5kSW5kZXgiLCJjdXJyZW50IiwiY29tcGFyZURvY3VtZW50UG9zaXRpb24iLCJzbGljZSIsImZpbHRlciIsInIiLCJvbGRJbmRleCIsIlJvdmluZ1RhYkluZGV4UHJvdmlkZXIiLCJjaGlsZHJlbiIsImhhbmRsZUhvbWVFbmQiLCJvbktleURvd24iLCJjb250ZXh0Iiwib25LZXlEb3duSGFuZGxlciIsImV2IiwiaGFuZGxlZCIsImtleSIsIktleSIsIkhPTUUiLCJmb2N1cyIsIkVORCIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwiYm9vbCIsImZ1bmMiLCJ1c2VSb3ZpbmdUYWJJbmRleCIsImlucHV0UmVmIiwib25Gb2N1cyIsImlzQWN0aXZlIiwiUm92aW5nVGFiSW5kZXhXcmFwcGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQVNBOztBQUNBOzs7Ozs7QUFFQTs7Ozs7Ozs7Ozs7O0FBYUEsTUFBTUEsMkJBQTJCLEdBQUcsQ0FBcEM7QUFFQSxNQUFNQyxxQkFBcUIsR0FBRywwQkFBYztBQUN4Q0MsRUFBQUEsS0FBSyxFQUFFO0FBQ0hDLElBQUFBLFNBQVMsRUFBRSxJQURSO0FBRUhDLElBQUFBLElBQUksRUFBRSxFQUZILENBRU87O0FBRlAsR0FEaUM7QUFLeENDLEVBQUFB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QUQ7QUFBVUMsSUFBQUEsUUFBVjtBQUFvQmhDLElBQUFBO0FBQXBCLEdBQUQsQ0FBZjtBQUNILENBSE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMjAgVGhlIE1hdHJpeC5vcmcgRm91bmRhdGlvbiBDLkkuQy5cblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5pbXBvcnQgUmVhY3QsIHtcbiAgICBjcmVhdGVDb250ZXh0LFxuICAgIHVzZUNhbGxiYWNrLFxuICAgIHVzZUNvbnRleHQsXG4gICAgdXNlTGF5b3V0RWZmZWN0LFxuICAgIHVzZU1lbW8sXG4gICAgdXNlUmVmLFxuICAgIHVzZVJlZHVjZXIsXG59IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0IHtLZXl9IGZyb20gXCIuLi9LZXlib2FyZFwiO1xuXG4vKipcbiAqIE1vZHVsZSB0byBzaW1wbGlmeSBpbXBsZW1lbnRpbmcgdGhlIFJvdmluZyBUYWJJbmRleCBhY2Nlc3NpYmlsaXR5IHRlY2huaXF1ZVxuICpcbiAqIFdyYXAgdGhlIFdpZGdldCBpbiBhbiBSb3ZpbmdUYWJJbmRleENvbnRleHRQcm92aWRlclxuICogYW5kIHRoZW4gZm9yIGFsbCBidXR0b25zIG1ha2UgdXNlIG9mIHVzZVJvdmluZ1RhYkluZGV4IG9yIFJvdmluZ1RhYkluZGV4V3JhcHBlci5cbiAqIFRoZSBjb2RlIHdpbGwga2VlcCB0cmFjayBvZiB3aGljaCB0YWJJbmRleCB3YXMgbW9zdCByZWNlbnRseSBmb2N1c2VkIGFuZCBleHBvc2UgdGhhdCBpbmZvcm1hdGlvbiBhcyBgaXNBY3RpdmVgIHdoaWNoXG4gKiBjYW4gdGhlbiBiZSB1c2VkIHRvIG9ubHkgc2V0IHRoZSB0YWJJbmRleCB0byAwIGFzIGV4cGVjdGVkIGJ5IHRoZSByb3ZpbmcgdGFiaW5kZXggdGVjaG5pcXVlLlxuICogV2hlbiB0aGUgYWN0aXZlIGJ1dHRvbiBnZXRzIHVubW91bnRlZCB0aGUgY2xvc2VzdCBidXR0b24gd2lsbCBiZSBjaG9zZW4gYXMgZXhwZWN0ZWQuXG4gKiBJbml0aWFsbHkgdGhlIGZpcnN0IGJ1dHRvbiB0byBtb3VudCB3aWxsIGJlIGdpdmVuIGFjdGl2ZSBzdGF0ZS5cbiAqXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BY2Nlc3NpYmlsaXR5L0tleWJvYXJkLW5hdmlnYWJsZV9KYXZhU2NyaXB0X3dpZGdldHMjVGVjaG5pcXVlXzFfUm92aW5nX3RhYmluZGV4XG4gKi9cblxuY29uc3QgRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HID0gMjtcblxuY29uc3QgUm92aW5nVGFiSW5kZXhDb250ZXh0ID0gY3JlYXRlQ29udGV4dCh7XG4gICAgc3RhdGU6IHtcbiAgICAgICAgYWN0aXZlUmVmOiBudWxsLFxuICAgICAgICByZWZzOiBbXSwgLy8gbGlzdCBvZiByZWZzIGluIERPTSBvcmRlclxuICAgIH0sXG4gICAgZGlzcGF0Y2g6ICgpID0+IHt9LFxufSk7XG5Sb3ZpbmdUYWJJbmRleENvbnRleHQuZGlzcGxheU5hbWUgPSBcIlJvdmluZ1RhYkluZGV4Q29udGV4dFwiO1xuXG4vLyBUT0RPIHVzZSBhIFR5cGVTY3JpcHQgdHlwZSBoZXJlXG5jb25zdCB0eXBlcyA9IHtcbiAgICBSRUdJU1RFUjogXCJSRUdJU1RFUlwiLFxuICAgIFVOUkVHSVNURVI6IFwiVU5SRUdJU1RFUlwiLFxuICAgIFNFVF9GT0NVUzogXCJTRVRfRk9DVVNcIixcbn07XG5cbmNvbnN0IHJlZHVjZXIgPSAoc3RhdGUsIGFjdGlvbikgPT4ge1xuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSB0eXBlcy5SRUdJU1RFUjoge1xuICAgICAgICAgICAgaWYgKHN0YXRlLnJlZnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gT3VyIGxpc3Qgb2YgcmVmcyB3YXMgZW1wdHksIHNldCBhY3RpdmVSZWYgdG8gdGhpcyBmaXJzdCBpdGVtXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVJlZjogYWN0aW9uLnBheWxvYWQucmVmLFxuICAgICAgICAgICAgICAgICAgICByZWZzOiBbYWN0aW9uLnBheWxvYWQucmVmXSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhdGUucmVmcy5pbmNsdWRlcyhhY3Rpb24ucGF5bG9hZC5yZWYpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlOyAvLyBhbHJlYWR5IGluIHJlZnMsIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZmluZCB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHJlZiB3aGljaCBpcyBub3QgcHJlY2VkaW5nIHRoaXMgb25lIGluIERPTSBvcmRlclxuICAgICAgICAgICAgbGV0IG5ld0luZGV4ID0gc3RhdGUucmVmcy5maW5kSW5kZXgocmVmID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVmLmN1cnJlbnQuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYWN0aW9uLnBheWxvYWQucmVmLmN1cnJlbnQpICYgRE9DVU1FTlRfUE9TSVRJT05fUFJFQ0VESU5HO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChuZXdJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBuZXdJbmRleCA9IHN0YXRlLnJlZnMubGVuZ3RoOyAvLyBhcHBlbmQgdG8gdGhlIGVuZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHJlZnMgbGlzdFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICAgICAgICByZWZzOiBbXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLnJlZnMuc2xpY2UoMCwgbmV3SW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24ucGF5bG9hZC5yZWYsXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLnJlZnMuc2xpY2UobmV3SW5kZXgpLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgdHlwZXMuVU5SRUdJU1RFUjoge1xuICAgICAgICAgICAgLy8gZmlsdGVyIG91dCB0aGUgcmVmIHdoaWNoIHdlIGFyZSByZW1vdmluZ1xuICAgICAgICAgICAgY29uc3QgcmVmcyA9IHN0YXRlLnJlZnMuZmlsdGVyKHIgPT4gciAhPT0gYWN0aW9uLnBheWxvYWQucmVmKTtcblxuICAgICAgICAgICAgaWYgKHJlZnMubGVuZ3RoID09PSBzdGF0ZS5yZWZzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTsgLy8gYWxyZWFkeSByZW1vdmVkLCB0aGlzIHNob3VsZCBub3QgaGFwcGVuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGF0ZS5hY3RpdmVSZWYgPT09IGFjdGlvbi5wYXlsb2FkLnJlZikge1xuICAgICAgICAgICAgICAgIC8vIHdlIGp1c3QgcmVtb3ZlZCB0aGUgYWN0aXZlIHJlZiwgbmVlZCB0byByZXBsYWNlIGl0XG4gICAgICAgICAgICAgICAgLy8gcGljayB0aGUgcmVmIHdoaWNoIGlzIG5vdyBpbiB0aGUgaW5kZXggdGhlIG9sZCByZWYgd2FzIGluXG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkSW5kZXggPSBzdGF0ZS5yZWZzLmZpbmRJbmRleChyID0+IHIgPT09IGFjdGlvbi5wYXlsb2FkLnJlZik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVJlZjogb2xkSW5kZXggPj0gcmVmcy5sZW5ndGggPyByZWZzW3JlZnMubGVuZ3RoIC0gMV0gOiByZWZzW29sZEluZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgcmVmcyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHJlZnMgbGlzdFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICAgICAgICByZWZzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIHR5cGVzLlNFVF9GT0NVUzoge1xuICAgICAgICAgICAgLy8gdXBkYXRlIGFjdGl2ZSByZWZcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICAgICAgYWN0aXZlUmVmOiBhY3Rpb24ucGF5bG9hZC5yZWYsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0IFJvdmluZ1RhYkluZGV4UHJvdmlkZXIgPSAoe2NoaWxkcmVuLCBoYW5kbGVIb21lRW5kLCBvbktleURvd259KSA9PiB7XG4gICAgY29uc3QgW3N0YXRlLCBkaXNwYXRjaF0gPSB1c2VSZWR1Y2VyKHJlZHVjZXIsIHtcbiAgICAgICAgYWN0aXZlUmVmOiBudWxsLFxuICAgICAgICByZWZzOiBbXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnRleHQgPSB1c2VNZW1vKCgpID0+ICh7c3RhdGUsIGRpc3BhdGNofSksIFtzdGF0ZV0pO1xuXG4gICAgY29uc3Qgb25LZXlEb3duSGFuZGxlciA9IHVzZUNhbGxiYWNrKChldikgPT4ge1xuICAgICAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoaGFuZGxlSG9tZUVuZCkge1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgd2UgYWN0dWFsbHkgaGF2ZSBhbnkgaXRlbXNcbiAgICAgICAgICAgIHN3aXRjaCAoZXYua2V5KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBLZXkuSE9NRTpcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdmUgZm9jdXMgdG8gZmlyc3QgaXRlbVxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dC5zdGF0ZS5yZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc3RhdGUucmVmc1swXS5jdXJyZW50LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBLZXkuRU5EOlxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbW92ZSBmb2N1cyB0byBsYXN0IGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQuc3RhdGUucmVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnN0YXRlLnJlZnNbY29udGV4dC5zdGF0ZS5yZWZzLmxlbmd0aCAtIDFdLmN1cnJlbnQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAob25LZXlEb3duKSB7XG4gICAgICAgICAgICByZXR1cm4gb25LZXlEb3duKGV2KTtcbiAgICAgICAgfVxuICAgIH0sIFtjb250ZXh0LnN0YXRlLCBvbktleURvd24sIGhhbmRsZUhvbWVFbmRdKTtcblxuICAgIHJldHVybiA8Um92aW5nVGFiSW5kZXhDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXtjb250ZXh0fT5cbiAgICAgICAgeyBjaGlsZHJlbih7b25LZXlEb3duSGFuZGxlcn0pIH1cbiAgICA8L1JvdmluZ1RhYkluZGV4Q29udGV4dC5Qcm92aWRlcj47XG59O1xuUm92aW5nVGFiSW5kZXhQcm92aWRlci5wcm9wVHlwZXMgPSB7XG4gICAgaGFuZGxlSG9tZUVuZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgb25LZXlEb3duOiBQcm9wVHlwZXMuZnVuYyxcbn07XG5cbi8vIEhvb2sgdG8gcmVnaXN0ZXIgYSByb3ZpbmcgdGFiIGluZGV4XG4vLyBpbnB1dFJlZiBwYXJhbWV0ZXIgc3BlY2lmaWVzIHRoZSByZWYgdG8gdXNlXG4vLyBvbkZvY3VzIHNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGUgaW5kZXggZ2FpbmVkIGZvY3VzIGluIGFueSBtYW5uZXJcbi8vIGlzQWN0aXZlIHNob3VsZCBiZSB1c2VkIHRvIHNldCB0YWJJbmRleCBpbiBhIG1hbm5lciBzdWNoIGFzIGB0YWJJbmRleD17aXNBY3RpdmUgPyAwIDogLTF9YFxuLy8gcmVmIHNob3VsZCBiZSBwYXNzZWQgdG8gYSBET00gbm9kZSB3aGljaCB3aWxsIGJlIHVzZWQgZm9yIERPTSBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxuZXhwb3J0IGNvbnN0IHVzZVJvdmluZ1RhYkluZGV4ID0gKGlucHV0UmVmKSA9PiB7XG4gICAgY29uc3QgY29udGV4dCA9IHVzZUNvbnRleHQoUm92aW5nVGFiSW5kZXhDb250ZXh0KTtcbiAgICBsZXQgcmVmID0gdXNlUmVmKG51bGwpO1xuXG4gICAgaWYgKGlucHV0UmVmKSB7XG4gICAgICAgIC8vIGlmIHdlIGFyZSBnaXZlbiBhIHJlZiwgdXNlIGl0IGluc3RlYWQgb2Ygb3Vyc1xuICAgICAgICByZWYgPSBpbnB1dFJlZjtcbiAgICB9XG5cbiAgICAvLyBzZXR1cCAoYWZ0ZXIgcmVmcylcbiAgICB1c2VMYXlvdXRFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjb250ZXh0LmRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGVzLlJFR0lTVEVSLFxuICAgICAgICAgICAgcGF5bG9hZDoge3JlZn0sXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0ZWFyZG93blxuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29udGV4dC5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZXMuVU5SRUdJU1RFUixcbiAgICAgICAgICAgICAgICBwYXlsb2FkOiB7cmVmfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH0sIFtdKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcblxuICAgIGNvbnN0IG9uRm9jdXMgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIGNvbnRleHQuZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogdHlwZXMuU0VUX0ZPQ1VTLFxuICAgICAgICAgICAgcGF5bG9hZDoge3JlZn0sXG4gICAgICAgIH0pO1xuICAgIH0sIFtyZWYsIGNvbnRleHRdKTtcblxuICAgIGNvbnN0IGlzQWN0aXZlID0gY29udGV4dC5zdGF0ZS5hY3RpdmVSZWYgPT09IHJlZjtcbiAgICByZXR1cm4gW29uRm9jdXMsIGlzQWN0aXZlLCByZWZdO1xufTtcblxuLy8gV3JhcHBlciB0byBhbGxvdyB1c2Ugb2YgdXNlUm92aW5nVGFiSW5kZXggb3V0c2lkZSBvZiBSZWFjdCBGdW5jdGlvbmFsIENvbXBvbmVudHMuXG5leHBvcnQgY29uc3QgUm92aW5nVGFiSW5kZXhXcmFwcGVyID0gKHtjaGlsZHJlbiwgaW5wdXRSZWZ9KSA9PiB7XG4gICAgY29uc3QgW29uRm9jdXMsIGlzQWN0aXZlLCByZWZdID0gdXNlUm92aW5nVGFiSW5kZXgoaW5wdXRSZWYpO1xuICAgIHJldHVybiBjaGlsZHJlbih7b25Gb2N1cywgaXNBY3RpdmUsIHJlZn0pO1xufTtcblxuIl19