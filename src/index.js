
'use strict';

let emojione = require('emojione');
let debug    = require('debug')('nime:emojime');


function respOnFilterKeyDown(request, state) {

  let {charCode, seqNum} = request;
  let {compositionString} = state;

  let response = {
    return: false,
    success: true,
    seqNum
  };

  if (compositionString !== '' || charCode === ':'.charCodeAt(0)) {
    response['return'] = true;
  }

  return response;
}

function respOnKeyDown(request, state) {

  let {keyCode, seqNum} = request;

  let response = {
    success: true,
    return: true,
    seqNum
  };

  if (state['action'] === 'UPDATE_STRING') {
    response['compositionString'] = state['compositionString'];
    response['compositionCursor'] = state['compositionCursor'];
    return response;
  }

  if (state['action'] === 'COMMIT_STRING') {
    response['commitString']      = state['commitString'];
    response['compositionString'] = state['compositionString'];
    return response;
  }

  return response;

}

function reduceOnKeyDown(request, preState) {

  let {keyCode, charCode, seqNum} = request;
  let {compositionString, compositionCursor} = preState;


  if (compositionString === '' && charCode === ':'.charCodeAt(0)) {
    return Object.assign({}, preState, {
      action: 'UPDATE_STRING',
      compositionString: ':',
      compositionCursor: 1
    });
  }

  if (compositionString !== '') {
    if (charCode === ':'.charCodeAt(0)) {
      let emojikey = compositionString + ':';

      debug('Get emoji short name');
      debug(emojikey);
      debug(emojione.shortnameToUnicode(emojikey));
      return Object.assign({}, preState, {
        action: 'COMMIT_STRING',
        commitString: emojione.shortnameToUnicode(emojikey),
        compositionString: '',
        compositionCursor: 0
      });

    } else if (
      (charCode >= 'a'.charCodeAt(0) && charCode <= 'z'.charCodeAt(0)) ||
      (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0))) {

      return Object.assign({}, preState, {
        action: 'UPDATE_STRING',
        compositionString: compositionString + String.fromCharCode(charCode),
        compositionCursor: compositionCursor + 1
      });
    }
  }

  return preState;
}

function reduceOnCompositionTerminated(request, preState) {
  return Object.assign({}, preState, {
    commitString: '',
    compositionString: '',
    compositionCursor: 0
  });
}

module.exports = {
  textReducer(request, preState) {

    if (request['method'] === 'init') {
      return Object.assign({}, preState, {
        action: '',
        compositionString: '',
        compositionCursor: 0,
        showCandidates: false
      });
    }

    if (request['method'] === 'onKeyDown') {
      return reduceOnKeyDown(request, preState);
    }

    if (request['method'] === 'onCompositionTerminated') {
      return reduceOnCompositionTerminated(request, preState);
    }
    return preState;
  },

  response(request, state) {
    if (request['method'] === 'filterKeyDown') {
      return respOnFilterKeyDown(request, state);

    } else if (request['method'] === 'onKeyDown') {
      return respOnKeyDown(request, state);
    }
    return {success: true, seqNum: request['seqNum']};
  }
}