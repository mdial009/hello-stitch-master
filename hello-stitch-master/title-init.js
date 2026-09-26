(function() {
  var customTitle = localStorage.getItem('customTitle') || 'Hello, Stitch';
  var now = new Date();
  var dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  var monthName = now.toLocaleDateString("en-US", { month: "long" });
  var day = now.getDate();
  var year = now.getFullYear();
  var hours = now.getHours();
  var minutes = now.getMinutes().toString().padStart(2, "0");
  var ampm = hours >= 12 ? "PM" : "AM";
  var hour12 = hours % 12 || 12;
  document.title = customTitle + " today is " + dayName + " " + monthName + " " + day + ", " + year + " and the time is " + hour12 + ":" + minutes + " " + ampm;
})();
