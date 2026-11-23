(function () {
  "use strict";
  const drop = document.getElementById("drop");
  const input = document.getElementById("file");
  const list = document.getElementById("results");
  const MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

  input.addEventListener("change", () => handle(input.files));
  ["dragenter", "dragover"].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", ev => handle(ev.dataTransfer.files));

  async function handle(files) {
    for (const f of files) {
      const li = document.createElement("li");
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = f.name;
      const msg = document.createElement("div");
      li.append(name, msg);
      list.prepend(li);
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const r = ScrubPic.strip(bytes);
        const unique = [...new Set(r.removed)];
        const blob = new Blob([r.bytes], { type: MIME[r.type] });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = cleanName(f.name);
        a.textContent = "Download clean copy";
        msg.className = "ok";
        msg.textContent = unique.length ? "Removed: " + unique.join(", ") + ". " : "No metadata found. ";
        msg.append(a);
        const size = document.createElement("div");
        size.className = "small";
        size.textContent = kb(bytes.length) + " → " + kb(r.bytes.length);
        li.append(size);
        if (unique.length) a.click();
      } catch (e) {
        msg.className = "err";
        msg.textContent = e.message;
      }
    }
    input.value = "";
  }

  function cleanName(n) {
    const i = n.lastIndexOf(".");
    return i > 0 ? n.slice(0, i) + "-clean" + n.slice(i) : n + "-clean";
  }
  function kb(n) { return (n / 1024).toFixed(1) + " KB"; }
})();
