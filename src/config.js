// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Pattern matching a valid origin (protocol, host, port) supported by
// the extension.
export const ORIGIN_PATTERN = "(https?://[^/]*)(/[^/]+)*";
export const ORIGIN_REGEXP = new RegExp('^' + ORIGIN_PATTERN);

// Pattern matching a valid group name.
// Word character class not working for some reason.
const WORD_CHS = '[a-zA-Z0-9_-]+'
export const GROUP_NAME_PATTERN = `${WORD_CHS}@*${WORD_CHS}\.*${WORD_CHS}`;
export const GROUP_NAME_REGEXP = new RegExp(`^${GROUP_NAME_PATTERN}$`, 'i');

// Login prompt.
export const LOGIN_PROMPT = ' Try logging in.';

// Missing configuration.
export const NO_HOST_ALLOWED = 'No host configured.';

// Delay between automatic refresh of the badge data.
export const REFRESH_DELAY_IN_MINUTES = 5;

// Default options.
export const DEFAULT_OPTIONS = {
  // URL of the gerrit instance to monitor.
  instances: [{
    name: 'Chromium',
    host: 'https://chromium-review.googlesource.com',
    enabled: false,
  },
  {
    name: 'Fuchsia',
    host: 'https://fuchsia-review.googlesource.com',
    enabled: false,
  }],

  groupNames: [],
};
