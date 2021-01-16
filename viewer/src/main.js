import React from "react";
import ReactDOM from "react-dom";
import MainGui from "./MainGui";

document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(MainGui, {"data": window.data, "MIN_GOOD_FREQUENCY": window.MIN_GOOD_FREQUENCY}),
    document.getElementById("mount")
  );
});
