// Year in footer
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Mobile nav toggle (progressive; actual menu hidden on desktop)
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    if (!open) {
      nav.style.display = "flex";
    } else {
      if (window.innerWidth < 860) nav.style.display = "none";
    }
  });
  // Hide on resize to mobile
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 860) {
      nav.style.display = "flex";
    } else if (nav.getAttribute("data-open") !== "true") {
      nav.style.display = "none";
    }
  });
}

// IntersectionObserver for reveals
const revealTargets = document.querySelectorAll(".reveal-up, .reveal-fade");
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.16 }
);
revealTargets.forEach((el) => io.observe(el));

// Typewriter rotating roles
const roles = [
  "Screenwriter ",
  "Story Architect ",
  "Dialogue Specialist ",
  "Script Doctor ",
  "Pitch Writer ",
];
const rolesContainer = document.querySelector(".roles");
const cursorEl = document.querySelector(".tw-cursor");
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
let current = "";

function stepTypewriter() {
  const target = roles[roleIndex % roles.length];
  let delay;

  if (!deleting) {
    current = target.slice(0, charIndex + 1);
    charIndex++;
    if (current === target) {
      deleting = true;
      delay = 1400; // pause at full word
    } else {
      delay = 90;
    }
  } else {
    current = target.slice(0, Math.max(0, charIndex - 1));
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      roleIndex++;
    }
    delay = 45;
  }

  if (rolesContainer) {
    rolesContainer.firstChild &&
    rolesContainer.firstChild.nodeType === Node.TEXT_NODE
      ? (rolesContainer.firstChild.nodeValue = current)
      : rolesContainer.insertBefore(
          document.createTextNode(current),
          cursorEl || null
        );
  }

  setTimeout(stepTypewriter, delay);
}

if (rolesContainer) {
  setTimeout(stepTypewriter, 1000);
}

// Form handling moved to admin.js for message storage
