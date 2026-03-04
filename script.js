/* ── 导航高亮 ─────────────────────────── */
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section[id]");

function updateActiveNav() {
  const scrollOffset = window.scrollY + 160;
  let currentId = "";
  sections.forEach((s) => {
    if (scrollOffset >= s.offsetTop) currentId = s.id;
  });
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${currentId}`;
    link.classList.toggle("active", active);
    active
      ? link.setAttribute("aria-current", "page")
      : link.removeAttribute("aria-current");
  });
}
window.addEventListener("scroll", updateActiveNav);
updateActiveNav();

/* ── 头部 Motion 动效 ─────────────────── */
const headerContainer = document.querySelector(".header-container");
if (!headerContainer) throw new Error("header-container not found");

const headerMaskLayer = headerContainer.querySelector(".header-mask-layer");
const motionToggle    = headerContainer.querySelector(".header-motion-toggle");

let targetX = 50, targetY = 50;
let currentX = 50, currentY = 50;
let trailX = 50,   trailY = 50;
let rafId = null;
let isDragging = false;
let maskRadius = 420;
let motionEnabled = true;
let isAnimating = false;   // 防止开关动画期间重复触发

const isPortrait = () => window.innerHeight > window.innerWidth;

/* 读取 CSS 变量 --spot-size */
const updateMaskRadius = () => {
  const raw = getComputedStyle(headerContainer).getPropertyValue("--spot-size");
  const parsed = Number.parseFloat(raw);
  maskRadius = Number.isFinite(parsed) ? parsed : 420;
};

/* 胶囊形 clip-path 路径字符串 */
const buildCapsulePath = (x1, y1, x2, y2, r) => {
  const dx = x2 - x1, dy = y2 - y1;
  if (Math.hypot(dx, dy) < 1) {
    return `M ${x1 + r} ${y1} A ${r} ${r} 0 1 0 ${x1 - r} ${y1} A ${r} ${r} 0 1 0 ${x1 + r} ${y1} Z`;
  }
  const a = Math.atan2(dy, dx);
  const ox = Math.sin(a) * r, oy = -Math.cos(a) * r;
  return [
    `M ${x1 + ox} ${y1 + oy}`,
    `L ${x2 + ox} ${y2 + oy}`,
    `A ${r} ${r} 0 0 1 ${x2 - ox} ${y2 - oy}`,
    `L ${x1 - ox} ${y1 - oy}`,
    `A ${r} ${r} 0 0 1 ${x1 + ox} ${y1 + oy}`,
    "Z",
  ].join(" ");
};


/* 设置蒙版 clip-path（无 transition） */
const setMaskPath = (path) => {
  if (!headerMaskLayer) return;
  headerMaskLayer.style.transition = "none";
  headerMaskLayer.style.clipPath = path;
  headerMaskLayer.style.webkitClipPath = path;
};

/* rAF 动画循环 */
const animateSpotlight = () => {
  if (!motionEnabled) { rafId = null; return; }

  currentX += (targetX - currentX) * 0.18;
  currentY += (targetY - currentY) * 0.18;
  trailX   += (currentX - trailX)  * 0.08;
  trailY   += (currentY - trailY)  * 0.08;
  
  const b = headerContainer.getBoundingClientRect();
  const cx = (currentX / 100) * b.width,  cy = (currentY / 100) * b.height;
  const tx = (trailX   / 100) * b.width,  ty = (trailY   / 100) * b.height;

  setMaskPath(`path('${buildCapsulePath(cx, cy, tx, ty, maskRadius)}')`);

  rafId = requestAnimationFrame(animateSpotlight);
};

/* 鼠标进入 / 移动：更新目标位置 */
const updateTarget = (e) => {
  if (!motionEnabled || isAnimating) return;
  const b = headerContainer.getBoundingClientRect();
  targetX = ((e.clientX - b.left) / b.width)  * 100;
  targetY = ((e.clientY - b.top)  / b.height) * 100;
    headerContainer.classList.add("header-spotlight-active");
  if (!rafId) rafId = requestAnimationFrame(animateSpotlight);
};

/* 鼠标离开：隐藏蒙版，停止 rAF */
const stopSpotlight = () => {
  headerContainer.classList.remove("header-spotlight-active");
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  /* 离开后把蒙版收回 0，防止残留 */
  setMaskPath("circle(0 at 50% 50%)");
};

/* Motion 开关：仅切换底层配色，spotlight 逻辑完全不变 */
const setMotionEnabled = (enabled, centerPercent) => {
  motionEnabled = enabled;

  if (motionToggle) {
    motionToggle.setAttribute("aria-pressed", String(enabled));
    motionToggle.textContent = enabled ? "Motion On" : "Motion Off";
  }

  if (!enabled) {
    /* 关闭：停止 spotlight，底层变深蓝白字 */
    stopSpotlight();
    headerContainer.classList.add("header-motion-off");
  } else {
    /* 开启：恢复浅色 */
    headerContainer.classList.remove("header-motion-off");
  }
};

updateMaskRadius();
if (isPortrait()) setMotionEnabled(false);

headerContainer.addEventListener("mousemove",  updateTarget);
headerContainer.addEventListener("mouseenter", updateTarget);
headerContainer.addEventListener("mouseleave", stopSpotlight);
headerContainer.addEventListener("mousedown",  () => { isDragging = true; });
window.addEventListener("mouseup",             () => { isDragging = false; });
window.addEventListener("resize", updateMaskRadius);

if (motionToggle) {
  motionToggle.addEventListener("click", (e) => {
    const b = headerContainer.getBoundingClientRect();
    setMotionEnabled(!motionEnabled, {
      x: ((e.clientX - b.left) / b.width)  * 100,
      y: ((e.clientY - b.top)  / b.height) * 100,
    });
  });
}

headerContainer.addEventListener("dblclick", (e) => {
  if (e.target.closest(".header-motion-controls")) return;
  const b = headerContainer.getBoundingClientRect();
  setMotionEnabled(!motionEnabled, {
    x: ((e.clientX - b.left) / b.width)  * 100,
    y: ((e.clientY - b.top)  / b.height) * 100,
  });
});

