"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startTermsFlow = startTermsFlow;
exports.dialogTermsInteractionCallback = dialogTermsInteractionCallback;
exports.Service = exports.TermsNotSignedError = void 0;

var _classnames = _interopRequireDefault(require("classnames"));

var _MatrixClientPeg = require("./MatrixClientPeg");

var sdk = _interopRequireWildcard(require("./"));

var _Modal = _interopRequireDefault(require("./Modal"));

/*
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
class TermsNotSignedError extends Error {}
/**
 * Class representing a service that may have terms & conditions that
 * require agreement from the user before the user can use that service.
 */


exports.TermsNotSignedError = TermsNotSignedError;

class Service {
  /**
   * @param {MatrixClient.SERVICE_TYPES} serviceType The type of service
   * @param {string} baseUrl The Base URL of the service (ie. before '/_matrix')
   * @param {string} accessToken The user's access token for the service
   */
  constructor(serviceType, baseUrl, accessToken) {
    this.serviceType = serviceType;
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

}
/**
 * Start a flow where the user is presented with terms & conditions for some services
 *
 * @param {Service[]} services Object with keys 'serviceType', 'baseUrl', 'accessToken'
 * @param {function} interactionCallback Function called with:
 *      * an array of { service: {Service}, policies: {terms response from API} }
 *      * an array of URLs the user has already agreed to
 *     Must return a Promise which resolves with a list of URLs of documents agreed to
 * @returns {Promise} resolves when the user agreed to all necessary terms or rejects
 *     if they cancel.
 */


exports.Service = Service;

async function startTermsFlow(services, interactionCallback = dialogTermsInteractionCallback) {
  const termsPromises = services.map(s => _MatrixClientPeg.MatrixClientPeg.get().getTerms(s.serviceType, s.baseUrl));
  /*
   * a /terms response looks like:
   * {
   *     "policies": {
   *         "terms_of_service": {
   *             "version": "2.0",
   *              "en": {
   *                 "name": "Terms of Service",
   *                 "url": "https://example.org/somewhere/terms-2.0-en.html"
   *             },
   *             "fr": {
   *                 "name": "Conditions d'utilisation",
   *                 "url": "https://example.org/somewhere/terms-2.0-fr.html"
   *             }
   *         }
   *     }
   * }
   */

  const terms = await Promise.all(termsPromises);
  const policiesAndServicePairs = terms.map((t, i) => {
    return {
      'service': services[i],
      'policies': t.policies
    };
  }); // fetch the set of agreed policy URLs from account data

  const currentAcceptedTerms = await _MatrixClientPeg.MatrixClientPeg.get().getAccountData('m.accepted_terms');
  let agreedUrlSet;

  if (!currentAcceptedTerms || !currentAcceptedTerms.getContent() || !currentAcceptedTerms.getContent().accepted) {
    agreedUrlSet = new Set();
  } else {
    agreedUrlSet = new Set(currentAcceptedTerms.getContent().accepted);
  } // remove any policies the user has already agreed to and any services where
  // they've already agreed to all the policies
  // NB. it could be nicer to show the user stuff they've already agreed to,
  // but then they'd assume they can un-check the boxes to un-agree to a policy,
  // but that is not a thing the API supports, so probably best to just show
  // things they've not agreed to yet.


  const unagreedPoliciesAndServicePairs = [];

  for (const {
    service,
    policies
  } of policiesAndServicePairs) {
    const unagreedPolicies = {};

    for (const [policyName, policy] of Object.entries(policies)) {
      let policyAgreed = false;

      for (const lang of Object.keys(policy)) {
        if (lang === 'version') continue;

        if (agreedUrlSet.has(policy[lang].url)) {
          policyAgreed = true;
          break;
        }
      }

      if (!policyAgreed) unagreedPolicies[policyName] = policy;
    }

    if (Object.keys(unagreedPolicies).length > 0) {
      unagreedPoliciesAndServicePairs.push({
        service,
        policies: unagreedPolicies
      });
    }
  } // if there's anything left to agree to, prompt the user


  const numAcceptedBeforeAgreement = agreedUrlSet.size;

  if (unagreedPoliciesAndServicePairs.length > 0) {
    const newlyAgreedUrls = await interactionCallback(unagreedPoliciesAndServicePairs, [...agreedUrlSet]);
    console.log("User has agreed to URLs", newlyAgreedUrls); // Merge with previously agreed URLs

    newlyAgreedUrls.forEach(url => agreedUrlSet.add(url));
  } else {
    console.log("User has already agreed to all required policies");
  } // We only ever add to the set of URLs, so if anything has changed then we'd see a different length


  if (agreedUrlSet.size !== numAcceptedBeforeAgreement) {
    const newAcceptedTerms = {
      accepted: Array.from(agreedUrlSet)
    };
    await _MatrixClientPeg.MatrixClientPeg.get().setAccountData('m.accepted_terms', newAcceptedTerms);
  }

  const agreePromises = policiesAndServicePairs.map(policiesAndService => {
    // filter the agreed URL list for ones that are actually for this service
    // (one URL may be used for multiple services)
    // Not a particularly efficient loop but probably fine given the numbers involved
    const urlsForService = Array.from(agreedUrlSet).filter(url => {
      for (const policy of Object.values(policiesAndService.policies)) {
        for (const lang of Object.keys(policy)) {
          if (lang === 'version') continue;
          if (policy[lang].url === url) return true;
        }
      }

      return false;
    });
    if (urlsForService.length === 0) return Promise.resolve();
    return _MatrixClientPeg.MatrixClientPeg.get().agreeToTerms(policiesAndService.service.serviceType, policiesAndService.service.baseUrl, policiesAndService.service.accessToken, urlsForService);
  });
  return Promise.all(agreePromises);
}

function dialogTermsInteractionCallback(policiesAndServicePairs, agreedUrls, extraClassNames) {
  return new Promise((resolve, reject) => {
    console.log("Terms that need agreement", policiesAndServicePairs);
    const TermsDialog = sdk.getComponent("views.dialogs.TermsDialog");

    _Modal.default.createTrackedDialog('Terms of Service', '', TermsDialog, {
      policiesAndServicePairs,
      agreedUrls,
      onFinished: (done, agreedUrls) => {
        if (!done) {
          reject(new TermsNotSignedError());
          return;
        }

        resolve(agreedUrls);
      }
    }, (0, _classnames.default)("mx_TermsDialog", extraClassNames));
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXJtcy5qcyJdLCJuYW1lcyI6WyJUZXJtc05vdFNpZ25lZEVycm9yIiwiRXJyb3IiLCJTZXJ2aWNlIiwiY29uc3RydWN0b3IiLCJzZXJ2aWNlVHlwZSIsImJhc2VVcmwiLCJhY2Nlc3NUb2tlbiIsInN0YXJ0VGVybXNGbG93Iiwic2VydmljZXMiLCJpbnRlcmFjdGlvbkNhbGxiYWNrIiwiZGlhbG9nVGVybXNJbnRlcmFjdGlvbkNhbGxiYWNrIiwidGVybXNQcm9taXNlcyIsIm1hcCIsInMiLCJNYXRyaXhDbGllbnRQZWciLCJnZXQiLCJnZXRUZXJtcyIsInRlcm1zIiwiUHJvbWlzZSIsImFsbCIsInBvbGljaWVzQW5kU2VydmljZVBhaXJzIiwidCIsImkiLCJwb2xpY2llcyIsImN1cnJlbnRBY2NlcHRlZFRlcm1zIiwiZ2V0QWNjb3VudERhdGEiLCJhZ3JlZWRVcmxTZXQiLCJnZXRDb250ZW50IiwiYWNjZXB0ZWQiLCJTZXQiLCJ1bmFncmVlZFBvbGljaWVzQW5kU2VydmljZVBhaXJzIiwic2VydmljZSIsInVuYWdyZWVkUG9saWNpZXMiLCJwb2xpY3lOYW1lIiwicG9saWN5IiwiT2JqZWN0IiwiZW50cmllcyIsInBvbGljeUFncmVlZCIsImxhbmciLCJrZXlzIiwiaGFzIiwidXJsIiwibGVuZ3RoIiwicHVzaCIsIm51bUFjY2VwdGVkQmVmb3JlQWdyZWVtZW50Iiwic2l6ZSIsIm5ld2x5QWdyZWVkVXJscyIsImNvbnNvbGUiLCJsb2ciLCJmb3JFYWNoIiwiYWRkIiwibmV3QWNjZXB0ZWRUZXJtcyIsIkFycmF5IiwiZnJvbSIsInNldEFjY291bnREYXRhIiwiYWdyZWVQcm9taXNlcyIsInBvbGljaWVzQW5kU2VydmljZSIsInVybHNGb3JTZXJ2aWNlIiwiZmlsdGVyIiwidmFsdWVzIiwicmVzb2x2ZSIsImFncmVlVG9UZXJtcyIsImFncmVlZFVybHMiLCJleHRyYUNsYXNzTmFtZXMiLCJyZWplY3QiLCJUZXJtc0RpYWxvZyIsInNkayIsImdldENvbXBvbmVudCIsIk1vZGFsIiwiY3JlYXRlVHJhY2tlZERpYWxvZyIsIm9uRmluaXNoZWQiLCJkb25lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBZ0JBOztBQUVBOztBQUNBOztBQUNBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O0FBc0JPLE1BQU1BLG1CQUFOLFNBQWtDQyxLQUFsQyxDQUF3QztBQUUvQzs7Ozs7Ozs7QUFJTyxNQUFNQyxPQUFOLENBQWM7QUFDakI7Ozs7O0FBS0FDLEVBQUFBLFdBQVcsQ0FBQ0MsV0FBRCxFQUFjQyxPQUFkLEVBQXVCQyxXQUF2QixFQUFvQztBQUMzQyxTQUFLRixXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtDLE9BQUwsR0FBZUEsT0FBZjtBQUNBLFNBQUtDLFdBQUwsR0FBbUJBLFdBQW5CO0FBQ0g7O0FBVmdCO0FBYXJCOzs7Ozs7Ozs7Ozs7Ozs7QUFXTyxlQUFlQyxjQUFmLENBQ0hDLFFBREcsRUFFSEMsbUJBQW1CLEdBQUdDLDhCQUZuQixFQUdMO0FBQ0UsUUFBTUMsYUFBYSxHQUFHSCxRQUFRLENBQUNJLEdBQVQsQ0FDakJDLENBQUQsSUFBT0MsaUNBQWdCQyxHQUFoQixHQUFzQkMsUUFBdEIsQ0FBK0JILENBQUMsQ0FBQ1QsV0FBakMsRUFBOENTLENBQUMsQ0FBQ1IsT0FBaEQsQ0FEVyxDQUF0QjtBQUlBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLFFBQU1ZLEtBQUssR0FBRyxNQUFNQyxPQUFPLENBQUNDLEdBQVIsQ0FBWVIsYUFBWixDQUFwQjtBQUNBLFFBQU1TLHVCQUF1QixHQUFHSCxLQUFLLENBQUNMLEdBQU4sQ0FBVSxDQUFDUyxDQUFELEVBQUlDLENBQUosS0FBVTtBQUFFLFdBQU87QUFBRSxpQkFBV2QsUUFBUSxDQUFDYyxDQUFELENBQXJCO0FBQTBCLGtCQUFZRCxDQUFDLENBQUNFO0FBQXhDLEtBQVA7QUFBNEQsR0FBbEYsQ0FBaEMsQ0F6QkYsQ0EyQkU7O0FBQ0EsUUFBTUMsb0JBQW9CLEdBQUcsTUFBTVYsaUNBQWdCQyxHQUFoQixH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TUMsbUJBQU4sQ0FBMEIsa0JBQTFCLEVBQThDLEVBQTlDLEVBQWtESixXQUFsRCxFQUErRDtBQUMzRDdDLE1BQUFBLHVCQUQyRDtBQUUzRDBDLE1BQUFBLFVBRjJEO0FBRzNEUSxNQUFBQSxVQUFVLEVBQUUsQ0FBQ0MsSUFBRCxFQUFPVCxVQUFQLEtBQXNCO0FBQzlCLFlBQUksQ0FBQ1MsSUFBTCxFQUFXO0FBQ1BQLFVBQUFBLE1BQU0sQ0FBQyxJQUFJaEUsbUJBQUosRUFBRCxDQUFOO0FBQ0E7QUFDSDs7QUFDRDRELFFBQUFBLE9BQU8sQ0FBQ0UsVUFBRCxDQUFQO0FBQ0g7QUFUMEQsS0FBL0QsRUFVRyx5QkFBVyxnQkFBWCxFQUE2QkMsZUFBN0IsQ0FWSDtBQVdILEdBZk0sQ0FBUDtBQWdCSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG5Db3B5cmlnaHQgMjAxOSBUaGUgTWF0cml4Lm9yZyBGb3VuZGF0aW9uIEMuSS5DLlxuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xueW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG5cbiAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG5TZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG5saW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuXG5pbXBvcnQge01hdHJpeENsaWVudFBlZ30gZnJvbSAnLi9NYXRyaXhDbGllbnRQZWcnO1xuaW1wb3J0ICogYXMgc2RrIGZyb20gJy4vJztcbmltcG9ydCBNb2RhbCBmcm9tICcuL01vZGFsJztcblxuZXhwb3J0IGNsYXNzIFRlcm1zTm90U2lnbmVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNlcnZpY2UgdGhhdCBtYXkgaGF2ZSB0ZXJtcyAmIGNvbmRpdGlvbnMgdGhhdFxuICogcmVxdWlyZSBhZ3JlZW1lbnQgZnJvbSB0aGUgdXNlciBiZWZvcmUgdGhlIHVzZXIgY2FuIHVzZSB0aGF0IHNlcnZpY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXJ2aWNlIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge01hdHJpeENsaWVudC5TRVJWSUNFX1RZUEVTfSBzZXJ2aWNlVHlwZSBUaGUgdHlwZSBvZiBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJhc2VVcmwgVGhlIEJhc2UgVVJMIG9mIHRoZSBzZXJ2aWNlIChpZS4gYmVmb3JlICcvX21hdHJpeCcpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjY2Vzc1Rva2VuIFRoZSB1c2VyJ3MgYWNjZXNzIHRva2VuIGZvciB0aGUgc2VydmljZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2VUeXBlLCBiYXNlVXJsLCBhY2Nlc3NUb2tlbikge1xuICAgICAgICB0aGlzLnNlcnZpY2VUeXBlID0gc2VydmljZVR5cGU7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9IGJhc2VVcmw7XG4gICAgICAgIHRoaXMuYWNjZXNzVG9rZW4gPSBhY2Nlc3NUb2tlbjtcbiAgICB9XG59XG5cbi8qKlxuICogU3RhcnQgYSBmbG93IHdoZXJlIHRoZSB1c2VyIGlzIHByZXNlbnRlZCB3aXRoIHRlcm1zICYgY29uZGl0aW9ucyBmb3Igc29tZSBzZXJ2aWNlc1xuICpcbiAqIEBwYXJhbSB7U2VydmljZVtdfSBzZXJ2aWNlcyBPYmplY3Qgd2l0aCBrZXlzICdzZXJ2aWNlVHlwZScsICdiYXNlVXJsJywgJ2FjY2Vzc1Rva2VuJ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gaW50ZXJhY3Rpb25DYWxsYmFjayBGdW5jdGlvbiBjYWxsZWQgd2l0aDpcbiAqICAgICAgKiBhbiBhcnJheSBvZiB7IHNlcnZpY2U6IHtTZXJ2aWNlfSwgcG9saWNpZXM6IHt0ZXJtcyByZXNwb25zZSBmcm9tIEFQSX0gfVxuICogICAgICAqIGFuIGFycmF5IG9mIFVSTHMgdGhlIHVzZXIgaGFzIGFscmVhZHkgYWdyZWVkIHRvXG4gKiAgICAgTXVzdCByZXR1cm4gYSBQcm9taXNlIHdoaWNoIHJlc29sdmVzIHdpdGggYSBsaXN0IG9mIFVSTHMgb2YgZG9jdW1lbnRzIGFncmVlZCB0b1xuICogQHJldHVybnMge1Byb21pc2V9IHJlc29sdmVzIHdoZW4gdGhlIHVzZXIgYWdyZWVkIHRvIGFsbCBuZWNlc3NhcnkgdGVybXMgb3IgcmVqZWN0c1xuICogICAgIGlmIHRoZXkgY2FuY2VsLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRUZXJtc0Zsb3coXG4gICAgc2VydmljZXMsXG4gICAgaW50ZXJhY3Rpb25DYWxsYmFjayA9IGRpYWxvZ1Rlcm1zSW50ZXJhY3Rpb25DYWxsYmFjayxcbikge1xuICAgIGNvbnN0IHRlcm1zUHJvbWlzZXMgPSBzZXJ2aWNlcy5tYXAoXG4gICAgICAgIChzKSA9PiBNYXRyaXhDbGllbnRQZWcuZ2V0KCkuZ2V0VGVybXMocy5zZXJ2aWNlVHlwZSwgcy5iYXNlVXJsKSxcbiAgICApO1xuXG4gICAgLypcbiAgICAgKiBhIC90ZXJtcyByZXNwb25zZSBsb29rcyBsaWtlOlxuICAgICAqIHtcbiAgICAgKiAgICAgXCJwb2xpY2llc1wiOiB7XG4gICAgICogICAgICAgICBcInRlcm1zX29mX3NlcnZpY2VcIjoge1xuICAgICAqICAgICAgICAgICAgIFwidmVyc2lvblwiOiBcIjIuMFwiLFxuICAgICAqICAgICAgICAgICAgICBcImVuXCI6IHtcbiAgICAgKiAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiVGVybXMgb2YgU2VydmljZVwiLFxuICAgICAqICAgICAgICAgICAgICAgICBcInVybFwiOiBcImh0dHBzOi8vZXhhbXBsZS5vcmcvc29tZXdoZXJlL3Rlcm1zLTIuMC1lbi5odG1sXCJcbiAgICAgKiAgICAgICAgICAgICB9LFxuICAgICAqICAgICAgICAgICAgIFwiZnJcIjoge1xuICAgICAqICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJDb25kaXRpb25zIGQndXRpbGlzYXRpb25cIixcbiAgICAgKiAgICAgICAgICAgICAgICAgXCJ1cmxcIjogXCJodHRwczovL2V4YW1wbGUub3JnL3NvbWV3aGVyZS90ZXJtcy0yLjAtZnIuaHRtbFwiXG4gICAgICogICAgICAgICAgICAgfVxuICAgICAqICAgICAgICAgfVxuICAgICAqICAgICB9XG4gICAgICogfVxuICAgICAqL1xuXG4gICAgY29uc3QgdGVybXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0ZXJtc1Byb21pc2VzKTtcbiAgICBjb25zdCBwb2xpY2llc0FuZFNlcnZpY2VQYWlycyA9IHRlcm1zLm1hcCgodCwgaSkgPT4geyByZXR1cm4geyAnc2VydmljZSc6IHNlcnZpY2VzW2ldLCAncG9saWNpZXMnOiB0LnBvbGljaWVzIH07IH0pO1xuXG4gICAgLy8gZmV0Y2ggdGhlIHNldCBvZiBhZ3JlZWQgcG9saWN5IFVSTHMgZnJvbSBhY2NvdW50IGRhdGFcbiAgICBjb25zdCBjdXJyZW50QWNjZXB0ZWRUZXJtcyA9IGF3YWl0IE1hdHJpeENsaWVudFBlZy5nZXQoKS5nZXRBY2NvdW50RGF0YSgnbS5hY2NlcHRlZF90ZXJtcycpO1xuICAgIGxldCBhZ3JlZWRVcmxTZXQ7XG4gICAgaWYgKCFjdXJyZW50QWNjZXB0ZWRUZXJtcyB8fCAhY3VycmVudEFjY2VwdGVkVGVybXMuZ2V0Q29udGVudCgpIHx8ICFjdXJyZW50QWNjZXB0ZWRUZXJtcy5nZXRDb250ZW50KCkuYWNjZXB0ZWQpIHtcbiAgICAgICAgYWdyZWVkVXJsU2V0ID0gbmV3IFNldCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFncmVlZFVybFNldCA9IG5ldyBTZXQoY3VycmVudEFjY2VwdGVkVGVybXMuZ2V0Q29udGVudCgpLmFjY2VwdGVkKTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgYW55IHBvbGljaWVzIHRoZSB1c2VyIGhhcyBhbHJlYWR5IGFncmVlZCB0byBhbmQgYW55IHNlcnZpY2VzIHdoZXJlXG4gICAgLy8gdGhleSd2ZSBhbHJlYWR5IGFncmVlZCB0byBhbGwgdGhlIHBvbGljaWVzXG4gICAgLy8gTkIuIGl0IGNvdWxkIGJlIG5pY2VyIHRvIHNob3cgdGhlIHVzZXIgc3R1ZmYgdGhleSd2ZSBhbHJlYWR5IGFncmVlZCB0byxcbiAgICAvLyBidXQgdGhlbiB0aGV5J2QgYXNzdW1lIHRoZXkgY2FuIHVuLWNoZWNrIHRoZSBib3hlcyB0byB1bi1hZ3JlZSB0byBhIHBvbGljeSxcbiAgICAvLyBidXQgdGhhdCBpcyBub3QgYSB0aGluZyB0aGUgQVBJIHN1cHBvcnRzLCBzbyBwcm9iYWJseSBiZXN0IHRvIGp1c3Qgc2hvd1xuICAgIC8vIHRoaW5ncyB0aGV5J3ZlIG5vdCBhZ3JlZWQgdG8geWV0LlxuICAgIGNvbnN0IHVuYWdyZWVkUG9saWNpZXNBbmRTZXJ2aWNlUGFpcnMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHtzZXJ2aWNlLCBwb2xpY2llc30gb2YgcG9saWNpZXNBbmRTZXJ2aWNlUGFpcnMpIHtcbiAgICAgICAgY29uc3QgdW5hZ3JlZWRQb2xpY2llcyA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IFtwb2xpY3lOYW1lLCBwb2xpY3ldIG9mIE9iamVjdC5lbnRyaWVzKHBvbGljaWVzKSkge1xuICAgICAgICAgICAgbGV0IHBvbGljeUFncmVlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yIChjb25zdCBsYW5nIG9mIE9iamVjdC5rZXlzKHBvbGljeSkpIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZyA9PT0gJ3ZlcnNpb24nKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAoYWdyZWVkVXJsU2V0Lmhhcyhwb2xpY3lbbGFuZ10udXJsKSkge1xuICAgICAgICAgICAgICAgICAgICBwb2xpY3lBZ3JlZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXBvbGljeUFncmVlZCkgdW5hZ3JlZWRQb2xpY2llc1twb2xpY3lOYW1lXSA9IHBvbGljeTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoT2JqZWN0LmtleXModW5hZ3JlZWRQb2xpY2llcykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdW5hZ3JlZWRQb2xpY2llc0FuZFNlcnZpY2VQYWlycy5wdXNoKHtzZXJ2aWNlLCBwb2xpY2llczogdW5hZ3JlZWRQb2xpY2llc30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlcmUncyBhbnl0aGluZyBsZWZ0IHRvIGFncmVlIHRvLCBwcm9tcHQgdGhlIHVzZXJcbiAgICBjb25zdCBudW1BY2NlcHRlZEJlZm9yZUFncmVlbWVudCA9IGFncmVlZFVybFNldC5zaXplO1xuICAgIGlmICh1bmFncmVlZFBvbGljaWVzQW5kU2VydmljZVBhaXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV3bHlBZ3JlZWRVcmxzID0gYXdhaXQgaW50ZXJhY3Rpb25DYWxsYmFjayh1bmFncmVlZFBvbGljaWVzQW5kU2VydmljZVBhaXJzLCBbLi4uYWdyZWVkVXJsU2V0XSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVXNlciBoYXMgYWdyZWVkIHRvIFVSTHNcIiwgbmV3bHlBZ3JlZWRVcmxzKTtcbiAgICAgICAgLy8gTWVyZ2Ugd2l0aCBwcmV2aW91c2x5IGFncmVlZCBVUkxzXG4gICAgICAgIG5ld2x5QWdyZWVkVXJscy5mb3JFYWNoKHVybCA9PiBhZ3JlZWRVcmxTZXQuYWRkKHVybCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVXNlciBoYXMgYWxyZWFkeSBhZ3JlZWQgdG8gYWxsIHJlcXVpcmVkIHBvbGljaWVzXCIpO1xuICAgIH1cblxuICAgIC8vIFdlIG9ubHkgZXZlciBhZGQgdG8gdGhlIHNldCBvZiBVUkxzLCBzbyBpZiBhbnl0aGluZyBoYXMgY2hhbmdlZCB0aGVuIHdlJ2Qgc2VlIGEgZGlmZmVyZW50IGxlbmd0aFxuICAgIGlmIChhZ3JlZWRVcmxTZXQuc2l6ZSAhPT0gbnVtQWNjZXB0ZWRCZWZvcmVBZ3JlZW1lbnQpIHtcbiAgICAgICAgY29uc3QgbmV3QWNjZXB0ZWRUZXJtcyA9IHthY2NlcHRlZDogQXJyYXkuZnJvbShhZ3JlZWRVcmxTZXQpfTtcbiAgICAgICAgYXdhaXQgTWF0cml4Q2xpZW50UGVnLmdldCgpLnNldEFjY291bnREYXRhKCdtLmFjY2VwdGVkX3Rlcm1zJywgbmV3QWNjZXB0ZWRUZXJtcyk7XG4gICAgfVxuXG4gICAgY29uc3QgYWdyZWVQcm9taXNlcyA9IHBvbGljaWVzQW5kU2VydmljZVBhaXJzLm1hcCgocG9saWNpZXNBbmRTZXJ2aWNlKSA9PiB7XG4gICAgICAgIC8vIGZpbHRlciB0aGUgYWdyZWVkIFVSTCBsaXN0IGZvciBvbmVzIHRoYXQgYXJlIGFjdHVhbGx5IGZvciB0aGlzIHNlcnZpY2VcbiAgICAgICAgLy8gKG9uZSBVUkwgbWF5IGJlIHVzZWQgZm9yIG11bHRpcGxlIHNlcnZpY2VzKVxuICAgICAgICAvLyBOb3QgYSBwYXJ0aWN1bGFybHkgZWZmaWNpZW50IGxvb3AgYnV0IHByb2JhYmx5IGZpbmUgZ2l2ZW4gdGhlIG51bWJlcnMgaW52b2x2ZWRcbiAgICAgICAgY29uc3QgdXJsc0ZvclNlcnZpY2UgPSBBcnJheS5mcm9tKGFncmVlZFVybFNldCkuZmlsdGVyKCh1cmwpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcG9saWN5IG9mIE9iamVjdC52YWx1ZXMocG9saWNpZXNBbmRTZXJ2aWNlLnBvbGljaWVzKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbGFuZyBvZiBPYmplY3Qua2V5cyhwb2xpY3kpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYW5nID09PSAndmVyc2lvbicpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9saWN5W2xhbmddLnVybCA9PT0gdXJsKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh1cmxzRm9yU2VydmljZS5sZW5ndGggPT09IDApIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICByZXR1cm4gTWF0cml4Q2xpZW50UGVnLmdldCgpLmFncmVlVG9UZXJtcyhcbiAgICAgICAgICAgIHBvbGljaWVzQW5kU2VydmljZS5zZXJ2aWNlLnNlcnZpY2VUeXBlLFxuICAgICAgICAgICAgcG9saWNpZXNBbmRTZXJ2aWNlLnNlcnZpY2UuYmFzZVVybCxcbiAgICAgICAgICAgIHBvbGljaWVzQW5kU2VydmljZS5zZXJ2aWNlLmFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgdXJsc0ZvclNlcnZpY2UsXG4gICAgICAgICk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGFncmVlUHJvbWlzZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlhbG9nVGVybXNJbnRlcmFjdGlvbkNhbGxiYWNrKFxuICAgIHBvbGljaWVzQW5kU2VydmljZVBhaXJzLFxuICAgIGFncmVlZFVybHMsXG4gICAgZXh0cmFDbGFzc05hbWVzLFxuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJUZXJtcyB0aGF0IG5lZWQgYWdyZWVtZW50XCIsIHBvbGljaWVzQW5kU2VydmljZVBhaXJzKTtcbiAgICAgICAgY29uc3QgVGVybXNEaWFsb2cgPSBzZGsuZ2V0Q29tcG9uZW50KFwidmlld3MuZGlhbG9ncy5UZXJtc0RpYWxvZ1wiKTtcblxuICAgICAgICBNb2RhbC5jcmVhdGVUcmFja2VkRGlhbG9nKCdUZXJtcyBvZiBTZXJ2aWNlJywgJycsIFRlcm1zRGlhbG9nLCB7XG4gICAgICAgICAgICBwb2xpY2llc0FuZFNlcnZpY2VQYWlycyxcbiAgICAgICAgICAgIGFncmVlZFVybHMsXG4gICAgICAgICAgICBvbkZpbmlzaGVkOiAoZG9uZSwgYWdyZWVkVXJscykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IFRlcm1zTm90U2lnbmVkRXJyb3IoKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShhZ3JlZWRVcmxzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIGNsYXNzTmFtZXMoXCJteF9UZXJtc0RpYWxvZ1wiLCBleHRyYUNsYXNzTmFtZXMpKTtcbiAgICB9KTtcbn1cbiJdfQ==