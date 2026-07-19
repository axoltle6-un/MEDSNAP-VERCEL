/**
 * Zero-dependency celebratory confetti burst for milestone achievements.
 * Fires canvas particles with spring physics, rotation, and smooth fade-out.
 */
export function fireConfetti(options?: { particleCount?: number; spread?: number }) {
  if (typeof window === "undefined") return;

  const count = options?.particleCount || 60;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ["#2563eb", "#4f46e5", "#059669", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRotation: number;
    opacity: number;
    decay: number;
  }

  const particles: Particle[] = [];
  const originX = width / 2;
  const originY = height * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2) - Math.PI / 2;
    const speed = Math.random() * 12 + 6;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      opacity: 1,
      decay: Math.random() * 0.015 + 0.01,
    });
  }

  let animationFrameId: number;

  function render() {
    ctx?.clearRect(0, 0, width, height);
    let active = false;

    particles.forEach((p) => {
      if (p.opacity <= 0) return;
      active = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // drag
      p.vy *= 0.98;
      p.rotation += p.vRotation;
      p.opacity = Math.max(0, p.opacity - p.decay);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (active) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    if (document.body.contains(canvas)) {
      canvas.remove();
    }
  }, 4000);
}
