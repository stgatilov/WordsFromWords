import React from "react";
import ReactDOM from "react-dom";
import MainGui from "./MainGui";

document.addEventListener("DOMContentLoaded", function() {
  ReactDOM.render(
    React.createElement(MainGui, {"data": window.data}),
    document.getElementById("mount")
  );
});
