(function () {

  'use strict';

  angular.module('inboxServices', ['ngResource']);

  require('./add-attachment');
  require('./add-read-status');
  require('./analytics-modules');
  require('./android-api');
  require('./auth');
  require('./cache');
  require('./changes');
  require('./check-date');
  require('./child-facility');
  require('./clean-etag');
  require('./contact-form');
  require('./contact-save');
  require('./contact-schema');
  require('./contact-summary');
  require('./contact-view-model-generator');
  require('./contacts');
  require('./count-messages');
  require('./db');
  require('./db-sync');
  require('./debug');
  require('./delete-docs');
  require('./download-url');
  require('./edit-group');
  require('./enketo');
  require('./enketo-prepopulation-data');
  require('./enketo-translation');
  require('./export');
  require('./extract-lineage');
  require('./file-reader');
  require('./json-forms');
  require('./json-parse');
  require('./format-data-record');
  require('./format-date');
  require('./generate-lucene-query');
  require('./generate-search-requests');
  require('./geolocation');
  require('./get-contact-summaries');
  require('./get-data-records');
  require('./import-contacts');
  require('./kanso-packages');
  require('./language');
  require('./languages');
  require('./lineage-model-generator');
  require('./live-list');
  require('./location');
  require('./markdown');
  require('./mark-read');
  require('./merge-uri-parameters');
  require('./message-contacts');
  require('./message-state');
  require('./modal');
  require('./moment-locale-data');
  require('./place-hierarchy');
  require('./properties');
  require('./report-view-model-generator');
  require('./resource-icons');
  require('./rules-engine');
  require('./scheduled-forms');
  require('./search');
  require('./search-filters');
  require('./select2-search');
  require('./send-message');
  require('./session');
  require('./settings');
  require('./simprints');
  require('./snackbar');
  require('./target-generator');
  require('./tasks-for-contact');
  require('./tour');
  require('./translate');
  require('./translate-from');
  require('./translation-loader');
  require('./translation-null-interpolation');
  require('./unread-records');
  require('./update-facility');
  require('./update-settings');
  require('./update-user');
  require('./user');
  require('./user-contact');
  require('./version');
  require('./web-worker');
  require('./xml-form');
  require('./xml-forms');
  require('./xml-forms-context-utils');
  require('./xslt');
  require('./z-score');

}());
