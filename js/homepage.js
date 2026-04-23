(function () {
  var items = document.querySelectorAll(".ts-item");
  var panels = document.querySelectorAll(".era-chapters");

  items.forEach(function (item) {
    item.addEventListener("click", function () {
      var era = this.dataset.era;

      items.forEach(function (i) {
        i.classList.remove("active");
      });
      panels.forEach(function (p) {
        p.classList.remove("active");
      });

      this.classList.add("active");
      var panel = document.getElementById("era-" + era);
      if (panel) panel.classList.add("active");
    });
  });
})();
