// DEV ONLY (imported from main.jsx behind import.meta.env.DEV).
// Ctrl+Shift+D toggles an overlay: every element gets an outline and a label
// shows the hovered element as tag.class.class plus its size.
import "./assets/styles/debug.css";

let label = null;

function describe(el) {
    const classes = [...el.classList].slice(0, 6).map((c) => `.${c}`).join("");
    const box = el.getBoundingClientRect();
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${classes}\n${Math.round(box.width)} x ${Math.round(box.height)}`;
}

function onMove(event) {
    if (label && event.target instanceof Element && event.target !== label) {
        label.textContent = describe(event.target);
    }
}

function toggle() {
    const on = document.body.classList.toggle("debug-layout");

    if (on) {
        label = document.createElement("div");
        label.id = "debug-layout-label";
        label.textContent = "Debug layout on. Hover an element.";
        document.body.appendChild(label);
        document.addEventListener("mousemove", onMove);
    } else {
        document.removeEventListener("mousemove", onMove);
        label?.remove();
        label = null;
    }
}

window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        toggle();
    }
});
