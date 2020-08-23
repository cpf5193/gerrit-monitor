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

import * as browser from './browser.js';
import * as config from './config.js';
import * as dombuilder from './dombuilder.js';
import * as gerrit from './gerrit.js';

// Option object.
export class Options {
  constructor() {
    this.instances_ = [];
    this.groupNames_ = [];
  }

  // Return the value for the instance option.
  instances() {
    return this.instances_;
  }

  // Return the value for the groupName option.
  groupNames() {
    return this.groupNames_;
  }

  // Sets the status text (with a timeout).
  setStatusText(text, opt_timeout) {
    browser.getElement('status').innerText = text;
    setTimeout(
        function() { browser.getElement('status').innerText = ''; },
        opt_timeout || 750);
  }

  // Add a new Gerrit instance, or enable the instance if it already exists.
  addGerritInstance(host, name, enabled) {
    for (var i = 0; i < this.instances_.length; i++) {
      var instance = this.instances_[i];
      if (instance.host === host) {
        instance.enabled = true;
        instance.name = name;
        browser.getElement('instance-' + i).checked = 'true';
        return;
      }
    }

    this.instances_.push({ host: host, name: name, enabled: enabled });
    var instance_index = this.instances_.length - 1;
    var instance = this.instances_[instance_index];

    // Calling setAttribute('for', checkbox_id) does not work during the
    // construction, so wait until the element have been created to set it.
    var labels = [];
    dombuilder.DomBuilder.attach(browser.getElement('instances'))
      .begin('tr')
        .begin('td')
          .begin('label')
            .appendText(name)
            .withCurrentNode(function(node) { labels.push(node); })
          .end('label')
        .end('td')
        .begin('td')
          .begin('label')
            .appendText(host)
            .withCurrentNode(function(node) { labels.push(node); })
          .end('label')
        .end('td')
        .begin('td')
          .addClass('center-aligned')
          .begin('input')
            .setAttribute('type', 'checkbox')
            .setAttribute('id', 'instance-' + instance_index)
            .setAttribute('checked', enabled)
            .withCurrentNode(function(node) {
              node.addEventListener('change', function() {
                instance.enabled = node.checked;
              });
            })
          .end('input')
        .end('td')
      .end('tr');

    labels.forEach(function(node) {
      node.setAttribute('for', 'instance-' + instance_index);
    });
  }

  // Add a new group name.
  addGroupName(groupName) {
    this.groupNames_.forEach(function(name) {
      if (name === groupName) {
        this.setStatusText('Already have this group name');
        return;
      }
    });

    this.groupNames_.push(groupName);

    dombuilder.DomBuilder.attach(browser.getElement('group-names'))
      .begin('li')
        .addClass('group-name')
        .appendText(groupName)
      .end('li');
  }

  // Apply the restored Gerrit instance options.
  applyInstanceOptions(instances) {
    instances.forEach((function(instance) {
      this.addGerritInstance(instance.host, instance.name, instance.enabled);
    }).bind(this));
  }

  // Apply the restored Gerrit group name options.
  applyGroupNameOptions(groupNames) {
    groupNames.forEach(function(groupName) {
      this.addGroupName(groupName);
    }.bind(this));
  }

  // Restore the options from Chrome storage and update the option page.
  loadOptions() {
    return gerrit.fetchOptions().then((function(options) {
      this.applyInstanceOptions(options.instances);
      this.applyGroupNameOptions(options.groupNames);
    }).bind(this));
  }

  // Save the options to Chrome storage and update permissions.
  saveInstanceOptions() {
    var origins = [];
    console.log(`groupNames: ${this.groupNames_}`);
    var options = { instances: this.instances_, groupNames: this.groupNames_ };
    this.instances_.forEach(function(instance) {
      if (instance.enabled) {
        var match = config.ORIGIN_REGEXP.exec(instance.host);
        if (match !== null) {
          origins.push(match[1] + "/*");
        }
      }
    });
    return browser.setAllowedOrigins(origins)
      .then(function () {
        return browser.saveOptions(options);
      })
      .then((function () {
        this.setStatusText('Options saved.');
      }).bind(this))
      .catch((function (error) {
        this.setStatusText(String(error));
      }).bind(this));
  }

  // Save the options to Chrome storage and update permissions.
  saveGroupNameOptions() {
    console.log('calling saveGroupNameOptions');
    var groups = [];
    var invalidGroups = [];
    var options = { instances: this.instances_, groupNames: this.groupNames_ };
    this.groupNames_.forEach(function(groupName) {
      if (config.GROUP_NAME_REGEXP.exec(groupName) !== null) {
        groups.push(groupName);
      } else {
        invalidGroups.push(groupName);
      }
    });
    if (invalidGroups.length > 0) {
      this.setStatusText(`Invalid group names: ${invalidGroups.join(', ')}`);
    } else if (groups.length === 0) {
      this.setStatusText(`Nothing to save`);
    } else {
      console.log(`saveOptions: ${options}`);
      browser.saveOptions(options)
        .then((function () {
          this.setStatusText('Options saved.');
        }).bind(this))
        .catch((function (error) {
          this.setStatusText(String(error));
        }).bind(this));
    }
  }

  handleInstanceAdd() {
    browser.getElement('add-group-name').pattern = config.GROUP_NAME_PATTERN;
    browser.getElement('add-group-button').addEventListener('click', (function () {
      var name = browser.getElement('add-group-name').value;
      var match = config.GROUP_NAME_REGEXP.exec(name);
      if (match !== null) {
        this.addGroupName(name);
        browser.getElement('add-group-name').value = '';
      } else {
        this.setStatusText('Incorrect group name values.');
      }
    }).bind(this));
  }

  handleGroupNameAdd() {
    browser.getElement('add-button-name').pattern = '.+';
    browser.getElement('add-button-host').pattern = config.ORIGIN_PATTERN;
    browser.getElement('add-button').addEventListener('click', (function () {
      var host = browser.getElement('add-button-host').value;
      var name = browser.getElement('add-button-name').value;

      var match = config.ORIGIN_REGEXP.exec(host);
      var host_is_valid = match !== null && match[0].length == host.length;
      if (host_is_valid && name.length !== 0) {
        this.addGerritInstance(host, name, true);
        browser.getElement('add-button-host').value = '';
        browser.getElement('add-button-name').value = '';
      } else {
        this.setStatusText('Incorrect instance values.');
      }
    }).bind(this));
  }

  // Main method.
  onLoaded() {
    console.log('loading options');
    this.loadOptions();

    this.handleInstanceAdd();
    this.handleGroupNameAdd();

    browser.getElement('save-instance-button').addEventListener('click', (function () {
      console.log('save instance');
      this.saveInstanceOptions();
    }).bind(this));

    browser.getElement('save-group-name-button').addEventListener('click', (function () {
      console.log('save group name');
      this.saveGroupNameOptions();
    }).bind(this));
  }
}

// Singleton Options object.
export var options = new Options();

// Called to initialize the options page.
browser.callWhenLoaded(function () { options.onLoaded(); });
