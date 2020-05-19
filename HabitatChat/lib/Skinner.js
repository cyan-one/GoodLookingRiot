"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
Copyright 2015, 2016 OpenMarket Ltd

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
class Skinner {
  constructor() {
    this.components = null;
  }

  getComponent(name) {
    if (!name) throw new Error("Invalid component name: ".concat(name));

    if (this.components === null) {
      throw new Error("Attempted to get a component before a skin has been loaded." + " This is probably because either:" + " a) Your app has not called sdk.loadSkin(), or" + " b) A component has called getComponent at the root level");
    }

    const doLookup = components => {
      if (!components) return null;
      let comp = components[name]; // XXX: Temporarily also try 'views.' as we're currently
      // leaving the 'views.' off views.

      if (!comp) {
        comp = components['views.' + name];
      }

      return comp;
    }; // Check the skin first


    const comp = doLookup(this.components); // Just return nothing instead of erroring - the consumer should be smart enough to
    // handle this at this point.

    if (!comp) {
      return null;
    } // components have to be functions.


    const validType = typeof comp === 'function';

    if (!validType) {
      throw new Error("Not a valid component: ".concat(name, " (type = ").concat(typeof comp, ")."));
    }

    return comp;
  }

  load(skinObject) {
    if (this.components !== null) {
      throw new Error("Attempted to load a skin while a skin is already loaded" + "If you want to change the active skin, call resetSkin first");
    }

    this.components = {};
    const compKeys = Object.keys(skinObject.components);

    for (let i = 0; i < compKeys.length; ++i) {
      const comp = skinObject.components[compKeys[i]];
      this.addComponent(compKeys[i], comp);
    } // Now that we have a skin, load our components too


    const idx = require("./component-index");

    if (!idx || !idx.components) throw new Error("Invalid react-sdk component index");

    for (const c in idx.components) {
      if (!this.components[c]) this.components[c] = idx.components[c];
    }
  }

  addComponent(name, comp) {
    let slot = name;

    if (comp.replaces !== undefined) {
      if (comp.replaces.indexOf('.') > -1) {
        slot = comp.replaces;
      } else {
        slot = name.substr(0, name.lastIndexOf('.') + 1) + comp.replaces.split('.').pop();
      }
    }

    this.components[slot] = comp;
  }

  reset() {
    this.components = null;
  }

} // We define one Skinner globally, because the intention is
// very much that it is a singleton. Relying on there only being one
// copy of the module can be dicey and not work as browserify's
// behaviour with multiple copies of files etc. is erratic at best.
// XXX: We can still end up with the same file twice in the resulting
// JS bundle which is nonideal.
// See https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/
// or https://nodejs.org/api/modules.html#modules_module_caching_caveats
// ("Modules are cached based on their resolved filename")


if (global.mxSkinner === undefined) {
  global.mxSkinner = new Skinner();
}

var _default = global.mxSkinner;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9Ta2lubmVyLmpzIl0sIm5hbWVzIjpbIlNraW5uZXIiLCJjb25zdHJ1Y3RvciIsImNvbXBvbmVudHMiLCJnZXRDb21wb25lbnQiLCJuYW1lIiwiRXJyb3IiLCJkb0xvb2t1cCIsImNvbXAiLCJ2YWxpZFR5cGUiLCJsb2FkIiwic2tpbk9iamVjdCIsImNvbXBLZXlzIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJsZW5ndGgiLCJhZGRDb21wb25lbnQiLCJpZHgiLCJyZXF1aXJlIiwiYyIsInNsb3QiLCJyZXBsYWNlcyIsInVuZGVmaW5lZCIsImluZGV4T2YiLCJzdWJzdHIiLCJsYXN0SW5kZXhPZiIsInNwbGl0IiwicG9wIiwicmVzZXQiLCJnbG9iYWwiLCJteFNraW5uZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBLE1BQU1BLE9BQU4sQ0FBYztBQUNWQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixTQUFLQyxVQUFMLEdBQWtCLElBQWxCO0FBQ0g7O0FBRURDLEVBQUFBLFlBQVksQ0FBQ0MsSUFBRCxFQUFPO0FBQ2YsUUFBSSxDQUFDQSxJQUFMLEVBQVcsTUFBTSxJQUFJQyxLQUFKLG1DQUFxQ0QsSUFBckMsRUFBTjs7QUFDWCxRQUFJLEtBQUtGLFVBQUwsS0FBb0IsSUFBeEIsRUFBOEI7QUFDMUIsWUFBTSxJQUFJRyxLQUFKLENBQ0YsZ0VBQ0EsbUNBREEsR0FFQSxnREFGQSxHQUdBLDJEQUpFLENBQU47QUFNSDs7QUFFRCxVQUFNQyxRQUFRLEdBQUlKLFVBQUQsSUFBZ0I7QUFDN0IsVUFBSSxDQUFDQSxVQUFMLEVBQWlCLE9BQU8sSUFBUDtBQUNqQixVQUFJSyxJQUFJLEdBQUdMLFVBQVUsQ0FBQ0UsSUFBRCxDQUFyQixDQUY2QixDQUc3QjtBQUNBOztBQUNBLFVBQUksQ0FBQ0csSUFBTCxFQUFXO0FBQ1BBLFFBQUFBLElBQUksR0FBR0wsVUFBVSxDQUFDLFdBQVdFLElBQVosQ0FBakI7QUFDSDs7QUFDRCxhQUFP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LFMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTUsIDIwMTYgT3Blbk1hcmtldCBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5jbGFzcyBTa2lubmVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbnVsbDtcbiAgICB9XG5cbiAgICBnZXRDb21wb25lbnQobmFtZSkge1xuICAgICAgICBpZiAoIW5hbWUpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjb21wb25lbnQgbmFtZTogJHtuYW1lfWApO1xuICAgICAgICBpZiAodGhpcy5jb21wb25lbnRzID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJBdHRlbXB0ZWQgdG8gZ2V0IGEgY29tcG9uZW50IGJlZm9yZSBhIHNraW4gaGFzIGJlZW4gbG9hZGVkLlwiK1xuICAgICAgICAgICAgICAgIFwiIFRoaXMgaXMgcHJvYmFibHkgYmVjYXVzZSBlaXRoZXI6XCIrXG4gICAgICAgICAgICAgICAgXCIgYSkgWW91ciBhcHAgaGFzIG5vdCBjYWxsZWQgc2RrLmxvYWRTa2luKCksIG9yXCIrXG4gICAgICAgICAgICAgICAgXCIgYikgQSBjb21wb25lbnQgaGFzIGNhbGxlZCBnZXRDb21wb25lbnQgYXQgdGhlIHJvb3QgbGV2ZWxcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb0xvb2t1cCA9IChjb21wb25lbnRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudHMpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgbGV0IGNvbXAgPSBjb21wb25lbnRzW25hbWVdO1xuICAgICAgICAgICAgLy8gWFhYOiBUZW1wb3JhcmlseSBhbHNvIHRyeSAndmlld3MuJyBhcyB3ZSdyZSBjdXJyZW50bHlcbiAgICAgICAgICAgIC8vIGxlYXZpbmcgdGhlICd2aWV3cy4nIG9mZiB2aWV3cy5cbiAgICAgICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgICAgIGNvbXAgPSBjb21wb25lbnRzWyd2aWV3cy4nICsgbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29tcDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDaGVjayB0aGUgc2tpbiBmaXJzdFxuICAgICAgICBjb25zdCBjb21wID0gZG9Mb29rdXAodGhpcy5jb21wb25lbnRzKTtcblxuICAgICAgICAvLyBKdXN0IHJldHVybiBub3RoaW5nIGluc3RlYWQgb2YgZXJyb3JpbmcgLSB0aGUgY29uc3VtZXIgc2hvdWxkIGJlIHNtYXJ0IGVub3VnaCB0b1xuICAgICAgICAvLyBoYW5kbGUgdGhpcyBhdCB0aGlzIHBvaW50LlxuICAgICAgICBpZiAoIWNvbXApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29tcG9uZW50cyBoYXZlIHRvIGJlIGZ1bmN0aW9ucy5cbiAgICAgICAgY29uc3QgdmFsaWRUeXBlID0gdHlwZW9mIGNvbXAgPT09ICdmdW5jdGlvbic7XG4gICAgICAgIGlmICghdmFsaWRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhIHZhbGlkIGNvbXBvbmVudDogJHtuYW1lfSAodHlwZSA9ICR7dHlwZW9mKGNvbXApfSkuYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbXA7XG4gICAgfVxuXG4gICAgbG9hZChza2luT2JqZWN0KSB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIkF0dGVtcHRlZCB0byBsb2FkIGEgc2tpbiB3aGlsZSBhIHNraW4gaXMgYWxyZWFkeSBsb2FkZWRcIitcbiAgICAgICAgICAgICAgICBcIklmIHlvdSB3YW50IHRvIGNoYW5nZSB0aGUgYWN0aXZlIHNraW4sIGNhbGwgcmVzZXRTa2luIGZpcnN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IHt9O1xuICAgICAgICBjb25zdCBjb21wS2V5cyA9IE9iamVjdC5rZXlzKHNraW5PYmplY3QuY29tcG9uZW50cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcEtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSBza2luT2JqZWN0LmNvbXBvbmVudHNbY29tcEtleXNbaV1dO1xuICAgICAgICAgICAgdGhpcy5hZGRDb21wb25lbnQoY29tcEtleXNbaV0sIGNvbXApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBhIHNraW4sIGxvYWQgb3VyIGNvbXBvbmVudHMgdG9vXG4gICAgICAgIGNvbnN0IGlkeCA9IHJlcXVpcmUoXCIuL2NvbXBvbmVudC1pbmRleFwiKTtcbiAgICAgICAgaWYgKCFpZHggfHwgIWlkeC5jb21wb25lbnRzKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHJlYWN0LXNkayBjb21wb25lbnQgaW5kZXhcIik7XG4gICAgICAgIGZvciAoY29uc3QgYyBpbiBpZHguY29tcG9uZW50cykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbXBvbmVudHNbY10pIHRoaXMuY29tcG9uZW50c1tjXSA9IGlkeC5jb21wb25lbnRzW2NdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkQ29tcG9uZW50KG5hbWUsIGNvbXApIHtcbiAgICAgICAgbGV0IHNsb3QgPSBuYW1lO1xuICAgICAgICBpZiAoY29tcC5yZXBsYWNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoY29tcC5yZXBsYWNlcy5pbmRleE9mKCcuJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIHNsb3QgPSBjb21wLnJlcGxhY2VzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzbG90ID0gbmFtZS5zdWJzdHIoMCwgbmFtZS5sYXN0SW5kZXhPZignLicpICsgMSkgKyBjb21wLnJlcGxhY2VzLnNwbGl0KCcuJykucG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb21wb25lbnRzW3Nsb3RdID0gY29tcDtcbiAgICB9XG5cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gbnVsbDtcbiAgICB9XG59XG5cbi8vIFdlIGRlZmluZSBvbmUgU2tpbm5lciBnbG9iYWxseSwgYmVjYXVzZSB0aGUgaW50ZW50aW9uIGlzXG4vLyB2ZXJ5IG11Y2ggdGhhdCBpdCBpcyBhIHNpbmdsZXRvbi4gUmVseWluZyBvbiB0aGVyZSBvbmx5IGJlaW5nIG9uZVxuLy8gY29weSBvZiB0aGUgbW9kdWxlIGNhbiBiZSBkaWNleSBhbmQgbm90IHdvcmsgYXMgYnJvd3NlcmlmeSdzXG4vLyBiZWhhdmlvdXIgd2l0aCBtdWx0aXBsZSBjb3BpZXMgb2YgZmlsZXMgZXRjLiBpcyBlcnJhdGljIGF0IGJlc3QuXG4vLyBYWFg6IFdlIGNhbiBzdGlsbCBlbmQgdXAgd2l0aCB0aGUgc2FtZSBmaWxlIHR3aWNlIGluIHRoZSByZXN1bHRpbmdcbi8vIEpTIGJ1bmRsZSB3aGljaCBpcyBub25pZGVhbC5cbi8vIFNlZSBodHRwczovL2Rlcmlja2JhaWxleS5jb20vMjAxNi8wMy8wOS9jcmVhdGluZy1hLXRydWUtc2luZ2xldG9uLWluLW5vZGUtanMtd2l0aC1lczYtc3ltYm9scy9cbi8vIG9yIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvbW9kdWxlcy5odG1sI21vZHVsZXNfbW9kdWxlX2NhY2hpbmdfY2F2ZWF0c1xuLy8gKFwiTW9kdWxlcyBhcmUgY2FjaGVkIGJhc2VkIG9uIHRoZWlyIHJlc29sdmVkIGZpbGVuYW1lXCIpXG5pZiAoZ2xvYmFsLm14U2tpbm5lciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZ2xvYmFsLm14U2tpbm5lciA9IG5ldyBTa2lubmVyKCk7XG59XG5leHBvcnQgZGVmYXVsdCBnbG9iYWwubXhTa2lubmVyO1xuXG4iXX0=