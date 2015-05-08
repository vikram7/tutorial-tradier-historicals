$(document).ready(function() {
  var thisUrlAsArray = window.location.href.split("/");
  var security = thisUrlAsArray[thisUrlAsArray.length - 1];
  var dynamicUrl = "http://localhost:4567/" + security;

  $.ajax({
    cache: false,
    type: "GET",
    url: dynamicUrl,
    dataType:'json',
    success: function(data) {
      alert("works!");
    },
    error: function() {
      alert("Sorry")
    }
  });
});
