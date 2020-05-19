"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.looksValid = looksValid;
exports.COUNTRIES = exports.getEmojiFlag = void 0;

/*
Copyright 2017 Vector Creations Ltd

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
const PHONE_NUMBER_REGEXP = /^[0-9 -.]+$/;
/*
 * Do basic validation to determine if the given input could be
 * a valid phone number.
 *
 * @param {String} phoneNumber The string to validate. This could be
 *     either an international format number (MSISDN or e.164) or
 *     a national-format number.
 * @return True if the number could be a valid phone number, otherwise false.
 */

function looksValid(phoneNumber
/*: string*/
) {
  return PHONE_NUMBER_REGEXP.test(phoneNumber);
} // Regional Indicator Symbol Letter A


const UNICODE_BASE = 127462 - 'A'.charCodeAt(0); // Country code should be exactly 2 uppercase characters

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

const getEmojiFlag = (countryCode
/*: string*/
) => {
  if (!COUNTRY_CODE_REGEX.test(countryCode)) return ''; // Rip the country code out of the emoji and use that

  return String.fromCodePoint(...countryCode.split('').map(l => UNICODE_BASE + l.charCodeAt(0)));
};

exports.getEmojiFlag = getEmojiFlag;
const COUNTRIES = [{
  "iso2": "GB",
  "name": "United Kingdom",
  "prefix": "44"
}, {
  "iso2": "US",
  "name": "United States",
  "prefix": "1"
}, {
  "iso2": "AF",
  "name": "Afghanistan",
  "prefix": "93"
}, {
  "iso2": "AX",
  "name": "\u00c5land Islands",
  "prefix": "358"
}, {
  "iso2": "AL",
  "name": "Albania",
  "prefix": "355"
}, {
  "iso2": "DZ",
  "name": "Algeria",
  "prefix": "213"
}, {
  "iso2": "AS",
  "name": "American Samoa",
  "prefix": "1"
}, {
  "iso2": "AD",
  "name": "Andorra",
  "prefix": "376"
}, {
  "iso2": "AO",
  "name": "Angola",
  "prefix": "244"
}, {
  "iso2": "AI",
  "name": "Anguilla",
  "prefix": "1"
}, {
  "iso2": "AQ",
  "name": "Antarctica",
  "prefix": "672"
}, {
  "iso2": "AG",
  "name": "Antigua & Barbuda",
  "prefix": "1"
}, {
  "iso2": "AR",
  "name": "Argentina",
  "prefix": "54"
}, {
  "iso2": "AM",
  "name": "Armenia",
  "prefix": "374"
}, {
  "iso2": "AW",
  "name": "Aruba",
  "prefix": "297"
}, {
  "iso2": "AU",
  "name": "Australia",
  "prefix": "61"
}, {
  "iso2": "AT",
  "name": "Austria",
  "prefix": "43"
}, {
  "iso2": "AZ",
  "name": "Azerbaijan",
  "prefix": "994"
}, {
  "iso2": "BS",
  "name": "Bahamas",
  "prefix": "1"
}, {
  "iso2": "BH",
  "name": "Bahrain",
  "prefix": "973"
}, {
  "iso2": "BD",
  "name": "Bangladesh",
  "prefix": "880"
}, {
  "iso2": "BB",
  "name": "Barbados",
  "prefix": "1"
}, {
  "iso2": "BY",
  "name": "Belarus",
  "prefix": "375"
}, {
  "iso2": "BE",
  "name": "Belgium",
  "prefix": "32"
}, {
  "iso2": "BZ",
  "name": "Belize",
  "prefix": "501"
}, {
  "iso2": "BJ",
  "name": "Benin",
  "prefix": "229"
}, {
  "iso2": "BM",
  "name": "Bermuda",
  "prefix": "1"
}, {
  "iso2": "BT",
  "name": "Bhutan",
  "prefix": "975"
}, {
  "iso2": "BO",
  "name": "Bolivia",
  "prefix": "591"
}, {
  "iso2": "BA",
  "name": "Bosnia",
  "prefix": "387"
}, {
  "iso2": "BW",
  "name": "Botswana",
  "prefix": "267"
}, {
  "iso2": "BV",
  "name": "Bouvet Island",
  "prefix": "47"
}, {
  "iso2": "BR",
  "name": "Brazil",
  "prefix": "55"
}, {
  "iso2": "IO",
  "name": "British Indian Ocean Territory",
  "prefix": "246"
}, {
  "iso2": "VG",
  "name": "British Virgin Islands",
  "prefix": "1"
}, {
  "iso2": "BN",
  "name": "Brunei",
  "prefix": "673"
}, {
  "iso2": "BG",
  "name": "Bulgaria",
  "prefix": "359"
}, {
  "iso2": "BF",
  "name": "Burkina Faso",
  "prefix": "226"
}, {
  "iso2": "BI",
  "name": "Burundi",
  "prefix": "257"
}, {
  "iso2": "KH",
  "name": "Cambodia",
  "prefix": "855"
}, {
  "iso2": "CM",
  "name": "Cameroon",
  "prefix": "237"
}, {
  "iso2": "CA",
  "name": "Canada",
  "prefix": "1"
}, {
  "iso2": "CV",
  "name": "Cape Verde",
  "prefix": "238"
}, {
  "iso2": "BQ",
  "name": "Caribbean Netherlands",
  "prefix": "599"
}, {
  "iso2": "KY",
  "name": "Cayman Islands",
  "prefix": "1"
}, {
  "iso2": "CF",
  "name": "Central African Republic",
  "prefix": "236"
}, {
  "iso2": "TD",
  "name": "Chad",
  "prefix": "235"
}, {
  "iso2": "CL",
  "name": "Chile",
  "prefix": "56"
}, {
  "iso2": "CN",
  "name": "China",
  "prefix": "86"
}, {
  "iso2": "CX",
  "name": "Christmas Island",
  "prefix": "61"
}, {
  "iso2": "CC",
  "name": "Cocos (Keeling) Islands",
  "prefix": "61"
}, {
  "iso2": "CO",
  "name": "Colombia",
  "prefix": "57"
}, {
  "iso2": "KM",
  "name": "Comoros",
  "prefix": "269"
}, {
  "iso2": "CG",
  "name": "Congo - Brazzaville",
  "prefix": "242"
}, {
  "iso2": "CD",
  "name": "Congo - Kinshasa",
  "prefix": "243"
}, {
  "iso2": "CK",
  "name": "Cook Islands",
  "prefix": "682"
}, {
  "iso2": "CR",
  "name": "Costa Rica",
  "prefix": "506"
}, {
  "iso2": "HR",
  "name": "Croatia",
  "prefix": "385"
}, {
  "iso2": "CU",
  "name": "Cuba",
  "prefix": "53"
}, {
  "iso2": "CW",
  "name": "Cura\u00e7ao",
  "prefix": "599"
}, {
  "iso2": "CY",
  "name": "Cyprus",
  "prefix": "357"
}, {
  "iso2": "CZ",
  "name": "Czech Republic",
  "prefix": "420"
}, {
  "iso2": "CI",
  "name": "C\u00f4te d\u2019Ivoire",
  "prefix": "225"
}, {
  "iso2": "DK",
  "name": "Denmark",
  "prefix": "45"
}, {
  "iso2": "DJ",
  "name": "Djibouti",
  "prefix": "253"
}, {
  "iso2": "DM",
  "name": "Dominica",
  "prefix": "1"
}, {
  "iso2": "DO",
  "name": "Dominican Republic",
  "prefix": "1"
}, {
  "iso2": "EC",
  "name": "Ecuador",
  "prefix": "593"
}, {
  "iso2": "EG",
  "name": "Egypt",
  "prefix": "20"
}, {
  "iso2": "SV",
  "name": "El Salvador",
  "prefix": "503"
}, {
  "iso2": "GQ",
  "name": "Equatorial Guinea",
  "prefix": "240"
}, {
  "iso2": "ER",
  "name": "Eritrea",
  "prefix": "291"
}, {
  "iso2": "EE",
  "name": "Estonia",
  "prefix": "372"
}, {
  "iso2": "ET",
  "name": "Ethiopia",
  "prefix": "251"
}, {
  "iso2": "FK",
  "name": "Falkland Islands",
  "prefix": "500"
}, {
  "iso2": "FO",
  "name": "Faroe Islands",
  "prefix": "298"
}, {
  "iso2": "FJ",
  "name": "Fiji",
  "prefix": "679"
}, {
  "iso2": "FI",
  "name": "Finland",
  "prefix": "358"
}, {
  "iso2": "FR",
  "name": "France",
  "prefix": "33"
}, {
  "iso2": "GF",
  "name": "French Guiana",
  "prefix": "594"
}, {
  "iso2": "PF",
  "name": "French Polynesia",
  "prefix": "689"
}, {
  "iso2": "TF",
  "name": "French Southern Territories",
  "prefix": "262"
}, {
  "iso2": "GA",
  "name": "Gabon",
  "prefix": "241"
}, {
  "iso2": "GM",
  "name": "Gambia",
  "prefix": "220"
}, {
  "iso2": "GE",
  "name": "Georgia",
  "prefix": "995"
}, {
  "iso2": "DE",
  "name": "Germany",
  "prefix": "49"
}, {
  "iso2": "GH",
  "name": "Ghana",
  "prefix": "233"
}, {
  "iso2": "GI",
  "name": "Gibraltar",
  "prefix": "350"
}, {
  "iso2": "GR",
  "name": "Greece",
  "prefix": "30"
}, {
  "iso2": "GL",
  "name": "Greenland",
  "prefix": "299"
}, {
  "iso2": "GD",
  "name": "Grenada",
  "prefix": "1"
}, {
  "iso2": "GP",
  "name": "Guadeloupe",
  "prefix": "590"
}, {
  "iso2": "GU",
  "name": "Guam",
  "prefix": "1"
}, {
  "iso2": "GT",
  "name": "Guatemala",
  "prefix": "502"
}, {
  "iso2": "GG",
  "name": "Guernsey",
  "prefix": "44"
}, {
  "iso2": "GN",
  "name": "Guinea",
  "prefix": "224"
}, {
  "iso2": "GW",
  "name": "Guinea-Bissau",
  "prefix": "245"
}, {
  "iso2": "GY",
  "name": "Guyana",
  "prefix": "592"
}, {
  "iso2": "HT",
  "name": "Haiti",
  "prefix": "509"
}, {
  "iso2": "HM",
  "name": "Heard & McDonald Islands",
  "prefix": "672"
}, {
  "iso2": "HN",
  "name": "Honduras",
  "prefix": "504"
}, {
  "iso2": "HK",
  "name": "Hong Kong",
  "prefix": "852"
}, {
  "iso2": "HU",
  "name": "Hungary",
  "prefix": "36"
}, {
  "iso2": "IS",
  "name": "Iceland",
  "prefix": "354"
}, {
  "iso2": "IN",
  "name": "India",
  "prefix": "91"
}, {
  "iso2": "ID",
  "name": "Indonesia",
  "prefix": "62"
}, {
  "iso2": "IR",
  "name": "Iran",
  "prefix": "98"
}, {
  "iso2": "IQ",
  "name": "Iraq",
  "prefix": "964"
}, {
  "iso2": "IE",
  "name": "Ireland",
  "prefix": "353"
}, {
  "iso2": "IM",
  "name": "Isle of Man",
  "prefix": "44"
}, {
  "iso2": "IL",
  "name": "Israel",
  "prefix": "972"
}, {
  "iso2": "IT",
  "name": "Italy",
  "prefix": "39"
}, {
  "iso2": "JM",
  "name": "Jamaica",
  "prefix": "1"
}, {
  "iso2": "JP",
  "name": "Japan",
  "prefix": "81"
}, {
  "iso2": "JE",
  "name": "Jersey",
  "prefix": "44"
}, {
  "iso2": "JO",
  "name": "Jordan",
  "prefix": "962"
}, {
  "iso2": "KZ",
  "name": "Kazakhstan",
  "prefix": "7"
}, {
  "iso2": "KE",
  "name": "Kenya",
  "prefix": "254"
}, {
  "iso2": "KI",
  "name": "Kiribati",
  "prefix": "686"
}, {
  "iso2": "XK",
  "name": "Kosovo",
  "prefix": "383"
}, {
  "iso2": "KW",
  "name": "Kuwait",
  "prefix": "965"
}, {
  "iso2": "KG",
  "name": "Kyrgyzstan",
  "prefix": "996"
}, {
  "iso2": "LA",
  "name": "Laos",
  "prefix": "856"
}, {
  "iso2": "LV",
  "name": "Latvia",
  "prefix": "371"
}, {
  "iso2": "LB",
  "name": "Lebanon",
  "prefix": "961"
}, {
  "iso2": "LS",
  "name": "Lesotho",
  "prefix": "266"
}, {
  "iso2": "LR",
  "name": "Liberia",
  "prefix": "231"
}, {
  "iso2": "LY",
  "name": "Libya",
  "prefix": "218"
}, {
  "iso2": "LI",
  "name": "Liechtenstein",
  "prefix": "423"
}, {
  "iso2": "LT",
  "name": "Lithuania",
  "prefix": "370"
}, {
  "iso2": "LU",
  "name": "Luxembourg",
  "prefix": "352"
}, {
  "iso2": "MO",
  "name": "Macau",
  "prefix": "853"
}, {
  "iso2": "MK",
  "name": "Macedonia",
  "prefix": "389"
}, {
  "iso2": "MG",
  "name": "Madagascar",
  "prefix": "261"
}, {
  "iso2": "MW",
  "name": "Malawi",
  "prefix": "265"
}, {
  "iso2": "MY",
  "name": "Malaysia",
  "prefix": "60"
}, {
  "iso2": "MV",
  "name": "Maldives",
  "prefix": "960"
}, {
  "iso2": "ML",
  "name": "Mali",
  "prefix": "223"
}, {
  "iso2": "MT",
  "name": "Malta",
  "prefix": "356"
}, {
  "iso2": "MH",
  "name": "Marshall Islands",
  "prefix": "692"
}, {
  "iso2": "MQ",
  "name": "Martinique",
  "prefix": "596"
}, {
  "iso2": "MR",
  "name": "Mauritania",
  "prefix": "222"
}, {
  "iso2": "MU",
  "name": "Mauritius",
  "prefix": "230"
}, {
  "iso2": "YT",
  "name": "Mayotte",
  "prefix": "262"
}, {
  "iso2": "MX",
  "name": "Mexico",
  "prefix": "52"
}, {
  "iso2": "FM",
  "name": "Micronesia",
  "prefix": "691"
}, {
  "iso2": "MD",
  "name": "Moldova",
  "prefix": "373"
}, {
  "iso2": "MC",
  "name": "Monaco",
  "prefix": "377"
}, {
  "iso2": "MN",
  "name": "Mongolia",
  "prefix": "976"
}, {
  "iso2": "ME",
  "name": "Montenegro",
  "prefix": "382"
}, {
  "iso2": "MS",
  "name": "Montserrat",
  "prefix": "1"
}, {
  "iso2": "MA",
  "name": "Morocco",
  "prefix": "212"
}, {
  "iso2": "MZ",
  "name": "Mozambique",
  "prefix": "258"
}, {
  "iso2": "MM",
  "name": "Myanmar",
  "prefix": "95"
}, {
  "iso2": "NA",
  "name": "Namibia",
  "prefix": "264"
}, {
  "iso2": "NR",
  "name": "Nauru",
  "prefix": "674"
}, {
  "iso2": "NP",
  "name": "Nepal",
  "prefix": "977"
}, {
  "iso2": "NL",
  "name": "Netherlands",
  "prefix": "31"
}, {
  "iso2": "NC",
  "name": "New Caledonia",
  "prefix": "687"
}, {
  "iso2": "NZ",
  "name": "New Zealand",
  "prefix": "64"
}, {
  "iso2": "NI",
  "name": "Nicaragua",
  "prefix": "505"
}, {
  "iso2": "NE",
  "name": "Niger",
  "prefix": "227"
}, {
  "iso2": "NG",
  "name": "Nigeria",
  "prefix": "234"
}, {
  "iso2": "NU",
  "name": "Niue",
  "prefix": "683"
}, {
  "iso2": "NF",
  "name": "Norfolk Island",
  "prefix": "672"
}, {
  "iso2": "KP",
  "name": "North Korea",
  "prefix": "850"
}, {
  "iso2": "MP",
  "name": "Northern Mariana Islands",
  "prefix": "1"
}, {
  "iso2": "NO",
  "name": "Norway",
  "prefix": "47"
}, {
  "iso2": "OM",
  "name": "Oman",
  "prefix": "968"
}, {
  "iso2": "PK",
  "name": "Pakistan",
  "prefix": "92"
}, {
  "iso2": "PW",
  "name": "Palau",
  "prefix": "680"
}, {
  "iso2": "PS",
  "name": "Palestine",
  "prefix": "970"
}, {
  "iso2": "PA",
  "name": "Panama",
  "prefix": "507"
}, {
  "iso2": "PG",
  "name": "Papua New Guinea",
  "prefix": "675"
}, {
  "iso2": "PY",
  "name": "Paraguay",
  "prefix": "595"
}, {
  "iso2": "PE",
  "name": "Peru",
  "prefix": "51"
}, {
  "iso2": "PH",
  "name": "Philippines",
  "prefix": "63"
}, {
  "iso2": "PN",
  "name": "Pitcairn Islands",
  "prefix": "870"
}, {
  "iso2": "PL",
  "name": "Poland",
  "prefix": "48"
}, {
  "iso2": "PT",
  "name": "Portugal",
  "prefix": "351"
}, {
  "iso2": "PR",
  "name": "Puerto Rico",
  "prefix": "1"
}, {
  "iso2": "QA",
  "name": "Qatar",
  "prefix": "974"
}, {
  "iso2": "RO",
  "name": "Romania",
  "prefix": "40"
}, {
  "iso2": "RU",
  "name": "Russia",
  "prefix": "7"
}, {
  "iso2": "RW",
  "name": "Rwanda",
  "prefix": "250"
}, {
  "iso2": "RE",
  "name": "R\u00e9union",
  "prefix": "262"
}, {
  "iso2": "WS",
  "name": "Samoa",
  "prefix": "685"
}, {
  "iso2": "SM",
  "name": "San Marino",
  "prefix": "378"
}, {
  "iso2": "SA",
  "name": "Saudi Arabia",
  "prefix": "966"
}, {
  "iso2": "SN",
  "name": "Senegal",
  "prefix": "221"
}, {
  "iso2": "RS",
  "name": "Serbia",
  "prefix": "381 p"
}, {
  "iso2": "SC",
  "name": "Seychelles",
  "prefix": "248"
}, {
  "iso2": "SL",
  "name": "Sierra Leone",
  "prefix": "232"
}, {
  "iso2": "SG",
  "name": "Singapore",
  "prefix": "65"
}, {
  "iso2": "SX",
  "name": "Sint Maarten",
  "prefix": "1"
}, {
  "iso2": "SK",
  "name": "Slovakia",
  "prefix": "421"
}, {
  "iso2": "SI",
  "name": "Slovenia",
  "prefix": "386"
}, {
  "iso2": "SB",
  "name": "Solomon Islands",
  "prefix": "677"
}, {
  "iso2": "SO",
  "name": "Somalia",
  "prefix": "252"
}, {
  "iso2": "ZA",
  "name": "South Africa",
  "prefix": "27"
}, {
  "iso2": "GS",
  "name": "South Georgia & South Sandwich Islands",
  "prefix": "500"
}, {
  "iso2": "KR",
  "name": "South Korea",
  "prefix": "82"
}, {
  "iso2": "SS",
  "name": "South Sudan",
  "prefix": "211"
}, {
  "iso2": "ES",
  "name": "Spain",
  "prefix": "34"
}, {
  "iso2": "LK",
  "name": "Sri Lanka",
  "prefix": "94"
}, {
  "iso2": "BL",
  "name": "St. Barth\u00e9lemy",
  "prefix": "590"
}, {
  "iso2": "SH",
  "name": "St. Helena",
  "prefix": "290 n"
}, {
  "iso2": "KN",
  "name": "St. Kitts & Nevis",
  "prefix": "1"
}, {
  "iso2": "LC",
  "name": "St. Lucia",
  "prefix": "1"
}, {
  "iso2": "MF",
  "name": "St. Martin",
  "prefix": "590"
}, {
  "iso2": "PM",
  "name": "St. Pierre & Miquelon",
  "prefix": "508"
}, {
  "iso2": "VC",
  "name": "St. Vincent & Grenadines",
  "prefix": "1"
}, {
  "iso2": "SD",
  "name": "Sudan",
  "prefix": "249"
}, {
  "iso2": "SR",
  "name": "Suriname",
  "prefix": "597"
}, {
  "iso2": "SJ",
  "name": "Svalbard & Jan Mayen",
  "prefix": "47"
}, {
  "iso2": "SZ",
  "name": "Swaziland",
  "prefix": "268"
}, {
  "iso2": "SE",
  "name": "Sweden",
  "prefix": "46"
}, {
  "iso2": "CH",
  "name": "Switzerland",
  "prefix": "41"
}, {
  "iso2": "SY",
  "name": "Syria",
  "prefix": "963"
}, {
  "iso2": "ST",
  "name": "S\u00e3o Tom\u00e9 & Pr\u00edncipe",
  "prefix": "239"
}, {
  "iso2": "TW",
  "name": "Taiwan",
  "prefix": "886"
}, {
  "iso2": "TJ",
  "name": "Tajikistan",
  "prefix": "992"
}, {
  "iso2": "TZ",
  "name": "Tanzania",
  "prefix": "255"
}, {
  "iso2": "TH",
  "name": "Thailand",
  "prefix": "66"
}, {
  "iso2": "TL",
  "name": "Timor-Leste",
  "prefix": "670"
}, {
  "iso2": "TG",
  "name": "Togo",
  "prefix": "228"
}, {
  "iso2": "TK",
  "name": "Tokelau",
  "prefix": "690"
}, {
  "iso2": "TO",
  "name": "Tonga",
  "prefix": "676"
}, {
  "iso2": "TT",
  "name": "Trinidad & Tobago",
  "prefix": "1"
}, {
  "iso2": "TN",
  "name": "Tunisia",
  "prefix": "216"
}, {
  "iso2": "TR",
  "name": "Turkey",
  "prefix": "90"
}, {
  "iso2": "TM",
  "name": "Turkmenistan",
  "prefix": "993"
}, {
  "iso2": "TC",
  "name": "Turks & Caicos Islands",
  "prefix": "1"
}, {
  "iso2": "TV",
  "name": "Tuvalu",
  "prefix": "688"
}, {
  "iso2": "VI",
  "name": "U.S. Virgin Islands",
  "prefix": "1"
}, {
  "iso2": "UG",
  "name": "Uganda",
  "prefix": "256"
}, {
  "iso2": "UA",
  "name": "Ukraine",
  "prefix": "380"
}, {
  "iso2": "AE",
  "name": "United Arab Emirates",
  "prefix": "971"
}, {
  "iso2": "UY",
  "name": "Uruguay",
  "prefix": "598"
}, {
  "iso2": "UZ",
  "name": "Uzbekistan",
  "prefix": "998"
}, {
  "iso2": "VU",
  "name": "Vanuatu",
  "prefix": "678"
}, {
  "iso2": "VA",
  "name": "Vatican City",
  "prefix": "39"
}, {
  "iso2": "VE",
  "name": "Venezuela",
  "prefix": "58"
}, {
  "iso2": "VN",
  "name": "Vietnam",
  "prefix": "84"
}, {
  "iso2": "WF",
  "name": "Wallis & Futuna",
  "prefix": "681"
}, {
  "iso2": "EH",
  "name": "Western Sahara",
  "prefix": "212"
}, {
  "iso2": "YE",
  "name": "Yemen",
  "prefix": "967"
}, {
  "iso2": "ZM",
  "name": "Zambia",
  "prefix": "260"
}, {
  "iso2": "ZW",
  "name": "Zimbabwe",
  "prefix": "263"
}];
exports.COUNTRIES = COUNTRIES;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9waG9uZW51bWJlci50cyJdLCJuYW1lcyI6WyJQSE9ORV9OVU1CRVJfUkVHRVhQIiwibG9va3NWYWxpZCIsInBob25lTnVtYmVyIiwidGVzdCIsIlVOSUNPREVfQkFTRSIsImNoYXJDb2RlQXQiLCJDT1VOVFJZX0NPREVfUkVHRVgiLCJnZXRFbW9qaUZsYWciLCJjb3VudHJ5Q29kZSIsIlN0cmluZyIsImZyb21Db2RlUG9pbnQiLCJzcGxpdCIsIm1hcCIsImwiLCJDT1VOVFJJRVMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQWdCQSxNQUFNQSxtQkFBbUIsR0FBRyxhQUE1QjtBQUVBOzs7Ozs7Ozs7O0FBU08sU0FBU0MsVUFBVCxDQUFvQkM7QUFBcEI7QUFBQSxFQUF5QztBQUM1QyxTQUFPRixtQkFBbUIsQ0FBQ0csSUFBcEIsQ0FBeUJELFdBQXpCLENBQVA7QUFDSCxDLENBRUQ7OztBQUNBLE1BQU1FLFlBQVksR0FBRyxTQUFTLElBQUlDLFVBQUosQ0FBZSxDQUFmLENBQTlCLEMsQ0FDQTs7QUFDQSxNQUFNQyxrQkFBa0IsR0FBRyxZQUEzQjs7QUFFTyxNQUFNQyxZQUFZLEdBQUcsQ0FBQ0M7QUFBRDtBQUFBLEtBQXlCO0FBQ2pELE1BQUksQ0FBQ0Ysa0JBQWtCLENBQUNILElBQW5CLENBQXdCSyxXQUF4QixDQUFMLEVBQTJDLE9BQU8sRUFBUCxDQURNLENBRWpEOztBQUNBLFNBQU9DLE1BQU0sQ0FBQ0MsYUFBUCxDQUFxQixHQUFHRixXQUFXLENBQUNHLEtBQVosQ0FBa0IsRUFBbEIsRUFBc0JDLEdBQXRCLENBQTBCQyxDQUFDLElBQUlULFlBQVksR0FBR1MsQ0FBQyxDQUFDUixVQUFGLENBQWEsQ0FBYixDQUE5QyxDQUF4QixDQUFQO0FBQ0gsQ0FKTTs7O0FBTUEsTUFBTVMsU0FBUyxHQUFHLENBQ3JCO0FBQ0ksVUFBUSxJQURaO0FBRUksVUFBUSxnQkFGWjtBQUdJLFlBQVU7QUFIZCxDQURxQixFQU1yQjtB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LEVBaXJDckI7QUFDSSxVQUFRLElBRFo7QUFFSSxVQUFRLFNBRlo7QUFHSSxZQUFVO0FBSGQsQ0FqckNxQixFQXNyQ3JCO0FBQ0ksVUFBUSxJQURaO0FBRUksVUFBUSxjQUZaO0FBR0ksWUFBVTtBQUhkLENBdHJDcUIsRUEyckNyQjtBQUNJLFVBQVEsSUFEWjtBQUVJLFVBQVEsV0FGWjtBQUdJLFlBQVU7QUFIZCxDQTNyQ3FCLEVBZ3NDckI7QUFDSSxVQUFRLElBRFo7QUFFSSxVQUFRLFNBRlo7QUFHSSxZQUFVO0FBSGQsQ0Foc0NxQixFQXFzQ3JCO0FBQ0ksVUFBUSxJQURaO0FBRUksVUFBUSxpQkFGWjtBQUdJLFlBQVU7QUFIZCxDQXJzQ3FCLEVBMHNDckI7QUFDSSxVQUFRLElBRFo7QUFFSSxVQUFRLGdCQUZaO0FBR0ksWUFBVTtBQUhkLENBMXNDcUIsRUErc0NyQjtBQUNJLFVBQVEsSUFEWjtBQUVJLFVBQVEsT0FGWjtBQUdJLFlBQVU7QUFIZCxDQS9zQ3FCLEVBb3RDckI7QUFDSSxVQUFRLElBRFo7QUFFSSxVQUFRLFFBRlo7QUFHSSxZQUFVO0FBSGQsQ0FwdENxQixFQXl0Q3JCO0FBQ0ksVUFBUSxJQURaO0FBRUksVUFBUSxVQUZaO0FBR0ksWUFBVTtBQUhkLENBenRDcUIsQ0FBbEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuQ29weXJpZ2h0IDIwMTcgVmVjdG9yIENyZWF0aW9ucyBMdGRcblxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbnlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbllvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cblVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbmRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbldJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxubGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG5jb25zdCBQSE9ORV9OVU1CRVJfUkVHRVhQID0gL15bMC05IC0uXSskLztcblxuLypcbiAqIERvIGJhc2ljIHZhbGlkYXRpb24gdG8gZGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBpbnB1dCBjb3VsZCBiZVxuICogYSB2YWxpZCBwaG9uZSBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBob25lTnVtYmVyIFRoZSBzdHJpbmcgdG8gdmFsaWRhdGUuIFRoaXMgY291bGQgYmVcbiAqICAgICBlaXRoZXIgYW4gaW50ZXJuYXRpb25hbCBmb3JtYXQgbnVtYmVyIChNU0lTRE4gb3IgZS4xNjQpIG9yXG4gKiAgICAgYSBuYXRpb25hbC1mb3JtYXQgbnVtYmVyLlxuICogQHJldHVybiBUcnVlIGlmIHRoZSBudW1iZXIgY291bGQgYmUgYSB2YWxpZCBwaG9uZSBudW1iZXIsIG90aGVyd2lzZSBmYWxzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvb2tzVmFsaWQocGhvbmVOdW1iZXI6IHN0cmluZykge1xuICAgIHJldHVybiBQSE9ORV9OVU1CRVJfUkVHRVhQLnRlc3QocGhvbmVOdW1iZXIpO1xufVxuXG4vLyBSZWdpb25hbCBJbmRpY2F0b3IgU3ltYm9sIExldHRlciBBXG5jb25zdCBVTklDT0RFX0JBU0UgPSAxMjc0NjIgLSAnQScuY2hhckNvZGVBdCgwKTtcbi8vIENvdW50cnkgY29kZSBzaG91bGQgYmUgZXhhY3RseSAyIHVwcGVyY2FzZSBjaGFyYWN0ZXJzXG5jb25zdCBDT1VOVFJZX0NPREVfUkVHRVggPSAvXltBLVpdezJ9JC87XG5cbmV4cG9ydCBjb25zdCBnZXRFbW9qaUZsYWcgPSAoY291bnRyeUNvZGU6IHN0cmluZykgPT4ge1xuICAgIGlmICghQ09VTlRSWV9DT0RFX1JFR0VYLnRlc3QoY291bnRyeUNvZGUpKSByZXR1cm4gJyc7XG4gICAgLy8gUmlwIHRoZSBjb3VudHJ5IGNvZGUgb3V0IG9mIHRoZSBlbW9qaSBhbmQgdXNlIHRoYXRcbiAgICByZXR1cm4gU3RyaW5nLmZyb21Db2RlUG9pbnQoLi4uY291bnRyeUNvZGUuc3BsaXQoJycpLm1hcChsID0+IFVOSUNPREVfQkFTRSArIGwuY2hhckNvZGVBdCgwKSkpO1xufTtcblxuZXhwb3J0IGNvbnN0IENPVU5UUklFUyA9IFtcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdCXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlVuaXRlZCBLaW5nZG9tXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVVNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVW5pdGVkIFN0YXRlc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQUZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQWZnaGFuaXN0YW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5M1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJBWFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJcXHUwMGM1bGFuZCBJc2xhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzU4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkFMXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkFsYmFuaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNTVcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiRFpcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQWxnZXJpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIxM1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJBU1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJBbWVyaWNhbiBTYW1vYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQURcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQW5kb3JyYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjM3NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJBT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJBbmdvbGFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNDRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQUlcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQW5ndWlsbGFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkFRXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkFudGFyY3RpY2FcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQUdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQW50aWd1YSAmIEJhcmJ1ZGFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkFSXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkFyZ2VudGluYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjU0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkFNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkFybWVuaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNzRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQVdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQXJ1YmFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyOTdcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQVVcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQXVzdHJhbGlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQVRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQXVzdHJpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjQzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkFaXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkF6ZXJiYWlqYW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5OTRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQlNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQmFoYW1hc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQkhcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQmFocmFpblwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk3M1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCRFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiODgwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJCXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJhcmJhZG9zXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCWVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJCZWxhcnVzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzc1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJFXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJlbGdpdW1cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzMlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCWlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJCZWxpemVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1MDFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQkpcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQmVuaW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMjlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQk1cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQmVybXVkYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQlRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQmh1dGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTc1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJPXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJvbGl2aWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQkFcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQm9zbmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzg3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJvdHN3YW5hXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjY3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJWXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJvdXZldCBJc2xhbmRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0N1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJCcmF6aWxcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1NVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJJT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJCcml0aXNoIEluZGlhbiBPY2VhbiBUZXJyaXRvcnlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNDZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVkdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQnJpdGlzaCBWaXJnaW4gSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQk5cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQnJ1bmVpXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjczXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJHXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJ1bGdhcmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzU5XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkJGXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkJ1cmtpbmEgRmFzb1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyNlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCSVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJCdXJ1bmRpXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjU3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIktIXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNhbWJvZGlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiODU1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNhbWVyb29uXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjM3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNhbmFkYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ1ZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ2FwZSBWZXJkZVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIzOFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJCUVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJDYXJpYmJlYW4gTmV0aGVybGFuZHNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiS1lcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ2F5bWFuIElzbGFuZHNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNGXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgQWZyaWNhbiBSZXB1YmxpY1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIzNlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJURFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJDaGFkXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjM1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNMXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNoaWxlXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ05cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ2hpbmFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJDWFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJDaHJpc3RtYXMgSXNsYW5kXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ0NcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ29jb3MgKEtlZWxpbmcpIElzbGFuZHNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJDT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJDb2xvbWJpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjU3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIktNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNvbW9yb3NcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNjlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ0dcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ29uZ28gLSBCcmF6emF2aWxsZVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI0MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJDRFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJDb25nbyAtIEtpbnNoYXNhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjQzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNLXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNvb2sgSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjY4MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJDUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJDb3N0YSBSaWNhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTA2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkhSXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNyb2F0aWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzODVcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ1VcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ3ViYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkN1cmFcXHUwMGU3YW9cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ1lcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiQ3lwcnVzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzU3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNaXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkN6ZWNoIFJlcHVibGljXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDIwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkNJXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkNcXHUwMGY0dGUgZFxcdTIwMTlJdm9pcmVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMjVcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiREtcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRGVubWFya1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjQ1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkRKXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkRqaWJvdXRpXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjUzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkRNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkRvbWluaWNhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJET1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJEb21pbmljYW4gUmVwdWJsaWNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkVDXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkVjdWFkb3JcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiRUdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRWd5cHRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTVlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJFbCBTYWx2YWRvclwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwM1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHUVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJFcXVhdG9yaWFsIEd1aW5lYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI0MFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJFUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJFcml0cmVhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjkxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkVFXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkVzdG9uaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNzJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiRVRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRXRoaW9waWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNTFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiRktcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRmFsa2xhbmQgSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwMFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJGT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJGYXJvZSBJc2xhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjk4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkZKXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkZpamlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiRklcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRmlubGFuZFwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjM1OFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJGUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJGcmFuY2VcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzM1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHRlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJGcmVuY2ggR3VpYW5hXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTk0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBGXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkZyZW5jaCBQb2x5bmVzaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2ODlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVEZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiRnJlbmNoIFNvdXRoZXJuIFRlcnJpdG9yaWVzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjYyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkdhYm9uXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjQxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkdhbWJpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyMFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHRVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJHZW9yZ2lhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTk1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkRFXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkdlcm1hbnlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0OVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHSFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJHaGFuYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIzM1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHSVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJHaWJyYWx0YXJcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNTBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR1JcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3JlZWNlXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR0xcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3JlZW5sYW5kXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjk5XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdEXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkdyZW5hZGFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdQXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkd1YWRlbG91cGVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR1VcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3VhbVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR1RcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3VhdGVtYWxhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTAyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdHXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkd1ZXJuc2V5XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR05cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3VpbmVhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjI0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkdXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkd1aW5lYS1CaXNzYXVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNDVcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiR1lcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiR3V5YW5hXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTkyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkhUXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkhhaXRpXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTA5XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkhNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkhlYXJkICYgTWNEb25hbGQgSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjY3MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJITlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJIb25kdXJhc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwNFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJIS1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJIb25nIEtvbmdcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NTJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSFVcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSHVuZ2FyeVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjM2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIklTXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkljZWxhbmRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNTRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSU5cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSW5kaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJJRFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJJbmRvbmVzaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJJUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJJcmFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOThcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSVFcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSXJhcVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk2NFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJJRVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJJcmVsYW5kXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzUzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIklNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIklzbGUgb2YgTWFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSUxcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTcyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIklUXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkl0YWx5XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSk1cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSmFtYWljYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiSlBcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiSmFwYW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJKRVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJKZXJzZXlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0NFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJKT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJKb3JkYW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5NjJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiS1pcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiS2F6YWtoc3RhblwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjdcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiS0VcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiS2VueWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNTRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiS0lcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiS2lyaWJhdGlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2ODZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiWEtcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiS29zb3ZvXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzgzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIktXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkt1d2FpdFwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk2NVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJLR1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJLeXJneXpzdGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTk2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkxBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkxhb3NcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NTZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTFZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTGF0dmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzcxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkxCXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkxlYmFub25cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5NjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTFNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTGVzb3Rob1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI2NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJMUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJMaWJlcmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjMxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkxZXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkxpYnlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjE4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkxJXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkxpZWNodGVuc3RlaW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0MjNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTFRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTGl0aHVhbmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzcwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkxVXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIkx1eGVtYm91cmdcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNTJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTU9cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFjYXVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NTNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTUtcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFjZWRvbmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzg5XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1HXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1hZGFnYXNjYXJcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTVdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFsYXdpXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjY1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1ZXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1hbGF5c2lhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTVZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFsZGl2ZXNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5NjBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTUxcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWFsaVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyM1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJNVFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNYWx0YVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjM1NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJNSFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNYXJzaGFsbCBJc2xhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjkyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1RXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1hcnRpbmlxdWVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTVJcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWF1cml0YW5pYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyMlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJNVVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNYXVyaXRpdXNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMzBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiWVRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTWF5b3R0ZVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI2MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJNWFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNZXhpY29cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJGTVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNaWNyb25lc2lhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjkxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1EXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1vbGRvdmFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNzNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTUNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTW9uYWNvXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzc3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1OXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1vbmdvbGlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTc2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1FXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk1vbnRlbmVncm9cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzODJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTVNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTW9udHNlcnJhdFwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTUFcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTW9yb2Njb1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIxMlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJNWlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJNb3phbWJpcXVlXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjU4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1NXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk15YW5tYXJcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5NVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJOQVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJOYW1pYmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjY0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk5SXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk5hdXJ1XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjc0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk5QXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk5lcGFsXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTc3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk5MXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk5ldGhlcmxhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTkNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTmV3IENhbGVkb25pYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjY4N1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJOWlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZFwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjY0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk5JXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk5pY2FyYWd1YVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwNVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJORVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJOaWdlclwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyN1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJOR1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJOaWdlcmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjM0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk5VXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIk5pdWVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2ODNcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTkZcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTm9yZm9sayBJc2xhbmRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiS1BcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTm9ydGggS29yZWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NTBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTVBcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiTm9ydGhlcm4gTWFyaWFuYSBJc2xhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJOT1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJOb3J3YXlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0N1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJPTVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJPbWFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTY4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBLXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlBha2lzdGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUFdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiUGFsYXVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2ODBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUFNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiUGFsZXN0aW5lXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTcwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlBhbmFtYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwN1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJQR1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJQYXB1YSBOZXcgR3VpbmVhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjc1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBZXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlBhcmFndWF5XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTk1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBFXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlBlcnVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJQSFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJQaGlsaXBwaW5lc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjYzXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlBOXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlBpdGNhaXJuIElzbGFuZHNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI4NzBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUExcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiUG9sYW5kXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUFRcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiUG9ydHVnYWxcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNTFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUFJcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiUHVlcnRvIFJpY29cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlFBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlFhdGFyXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTc0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlJPXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlJvbWFuaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0MFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJSVVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJSdXNzaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI3XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlJXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlJ3YW5kYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI1MFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJSRVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJSXFx1MDBlOXVuaW9uXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjYyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIldTXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlNhbW9hXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjg1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlNNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlNhbiBNYXJpbm9cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzNzhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0FcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU2F1ZGkgQXJhYmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTY2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlNOXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlNlbmVnYWxcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUlNcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU2VyYmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzgxIHBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0NcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU2V5Y2hlbGxlc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI0OFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTTFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTaWVycmEgTGVvbmVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyMzJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0dcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU2luZ2Fwb3JlXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjVcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU1hcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU2ludCBNYWFydGVuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTS1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJTbG92YWtpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjQyMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTSVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTbG92ZW5pYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjM4NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTQlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTb2xvbW9uIElzbGFuZHNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzdcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU09cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU29tYWxpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI1MlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJaQVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTb3V0aCBBZnJpY2FcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyN1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJHU1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJTb3V0aCBHZW9yZ2lhICYgU291dGggU2FuZHdpY2ggSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjUwMFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJLUlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTb3V0aCBLb3JlYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjgyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlNTXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlNvdXRoIFN1ZGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjExXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIkVTXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlNwYWluXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiTEtcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3JpIExhbmthXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQkxcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3QuIEJhcnRoXFx1MDBlOWxlbXlcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0hcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3QuIEhlbGVuYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjI5MCBuXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIktOXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlN0LiBLaXR0cyAmIE5ldmlzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJMQ1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJTdC4gTHVjaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIxXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIk1GXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlN0LiBNYXJ0aW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiUE1cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3QuIFBpZXJyZSAmIE1pcXVlbG9uXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNTA4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlZDXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlN0LiBWaW5jZW50ICYgR3JlbmFkaW5lc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0RcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3VkYW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNDlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU1JcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3VyaW5hbWVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI1OTdcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0pcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3ZhbGJhcmQgJiBKYW4gTWF5ZW5cIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0N1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTWlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTd2F6aWxhbmRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNjhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiU0VcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3dlZGVuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNDZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQ0hcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiU3dpdHplcmxhbmRcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI0MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTWVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTeXJpYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk2M1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJTVFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJTXFx1MDBlM28gVG9tXFx1MDBlOSAmIFByXFx1MDBlZG5jaXBlXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjM5XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRXXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlRhaXdhblwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjg4NlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJUSlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJUYWppa2lzdGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTkyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRaXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlRhbnphbmlhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjU1XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRIXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlRoYWlsYW5kXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjZcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVExcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVGltb3ItTGVzdGVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVEdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVG9nb1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIyOFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJUS1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJUb2tlbGF1XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjkwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRPXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlRvbmdhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNjc2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRUXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlRyaW5pZGFkICYgVG9iYWdvXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJUTlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJUdW5pc2lhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjE2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRSXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlR1cmtleVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjkwXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlRNXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlR1cmttZW5pc3RhblwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk5M1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJUQ1wiLFxuICAgICAgICBcIm5hbWVcIjogXCJUdXJrcyAmIENhaWNvcyBJc2xhbmRzXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJUVlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJUdXZhbHVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2ODhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVklcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVS5TLiBWaXJnaW4gSXNsYW5kc1wiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVUdcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVWdhbmRhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMjU2XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlVBXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlVrcmFpbmVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIzODBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiQUVcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVW5pdGVkIEFyYWIgRW1pcmF0ZXNcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI5NzFcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVVlcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVXJ1Z3VheVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjU5OFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJVWlwiLFxuICAgICAgICBcIm5hbWVcIjogXCJVemJla2lzdGFuXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiOTk4XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIlZVXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIlZhbnVhdHVcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCI2NzhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVkFcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVmF0aWNhbiBDaXR5XCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiMzlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVkVcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVmVuZXp1ZWxhXCIsXG4gICAgICAgIFwicHJlZml4XCI6IFwiNThcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiVk5cIixcbiAgICAgICAgXCJuYW1lXCI6IFwiVmlldG5hbVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjg0XCIsXG4gICAgfSxcbiAgICB7XG4gICAgICAgIFwiaXNvMlwiOiBcIldGXCIsXG4gICAgICAgIFwibmFtZVwiOiBcIldhbGxpcyAmIEZ1dHVuYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjY4MVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJFSFwiLFxuICAgICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYVwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjIxMlwiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJZRVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJZZW1lblwiLFxuICAgICAgICBcInByZWZpeFwiOiBcIjk2N1wiLFxuICAgIH0sXG4gICAge1xuICAgICAgICBcImlzbzJcIjogXCJaTVwiLFxuICAgICAgICBcIm5hbWVcIjogXCJaYW1iaWFcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNjBcIixcbiAgICB9LFxuICAgIHtcbiAgICAgICAgXCJpc28yXCI6IFwiWldcIixcbiAgICAgICAgXCJuYW1lXCI6IFwiWmltYmFid2VcIixcbiAgICAgICAgXCJwcmVmaXhcIjogXCIyNjNcIixcbiAgICB9LFxuXTtcbiJdfQ==