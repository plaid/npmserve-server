'use strict';

/* global $, document */

var createHashSelector = function(cls, hash) {
  return '.' + cls + '[hash=' + hash + ']';
};

var buttonClickSequence = function(hash, event, status, ajaxOpts, callback) {
  event.preventDefault();
  var messageSelector = $(createHashSelector('build-message', hash));
  var spinnerSelector = $(createHashSelector('build-spinner', hash));

  messageSelector.html(status).show();
  spinnerSelector.show();

  $.ajax(ajaxOpts).done(function() {
    messageSelector.html('').hide();
    spinnerSelector.hide();
    callback();
  });
};

$(document).ready(function() {

  $('.build-delete').click(function(event) {
    var hash = $(this).attr('hash');
    var ajaxOpts = {method: 'DELETE',  url: '/npm/install/' + hash};
    buttonClickSequence(hash, event, 'deleting build', ajaxOpts, function() {
      $(createHashSelector('build-row', hash)).fadeOut(1000, function() {
        $(this).remove();
      });
    });
  });
});
