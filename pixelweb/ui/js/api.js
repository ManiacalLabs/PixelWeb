function _cl(val) {
  console.log(val);
} //shorhand for console.log. typing is hard...

var ErrorCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
};

var ___printAPIOutput = false;
var doTimeout = null;


function callAPI(data, success, error, complete) {

  function callSuccess(data) {
    if (!data['status']) {
      console.log(data)
    }
    if (___printAPIOutput) console.log(JSON.stringify(data));
    success(data);
  }

  if (___printAPIOutput) console.log(JSON.stringify(data))

  $.ajax({
    type: 'POST',
    url: "/api",
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    data: JSON.stringify(data),
    success: callSuccess,
    error: error,
    complete: complete
  });
}

function _GV(str, def) {
  if (str in localStorage) {
    return JSON.parse(localStorage[str]);
  } else {
    if (!def)
      def = null;
    return def;
  }
}

function _SV(str, data) {
  localStorage[str] = JSON.stringify(data);
}
