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
  "Screenwriter",
  "Story Architect",
  "Dialogue Specialist",
  "Script Doctor",
  "Pitch Writer",
];
const rolesContainer = document.querySelector(".roles");
const cursorEl = document.querySelector(".tw-cursor");
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
let current = "";

function stepTypewriter() {
  const target = roles[roleIndex % roles.length];
  if (!deleting) {
    current = target.slice(0, charIndex + 1);
    charIndex++;
    if (current === target) {
      deleting = true;
      setTimeout(stepTypewriter, 1400);
      return;
    }
  } else {
    current = target.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      roleIndex++;
    }
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
  const delay = deleting ? 35 : 70;
  setTimeout(stepTypewriter, delay);
}

if (rolesContainer) {
  setTimeout(stepTypewriter, 800);
}

// Basic form handling fallback (Netlify attr present for static hosting)
const form = document.querySelector(".contact-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    // Let Netlify handle if deployed there; otherwise prevent default to demo success.
    if (!location.host.includes("netlify")) {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";
      setTimeout(() => {
        button.textContent = "Sent ✓";
        setTimeout(() => {
          button.textContent = original;
          button.disabled = false;
          form.reset();
        }, 1200);
      }, 900);
    }
  });
}
