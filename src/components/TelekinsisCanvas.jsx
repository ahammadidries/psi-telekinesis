// src/components/TelekinesisCanvas.jsx

import { useEffect, useRef } from "react";
import { Body, createBodies } from "../physics";
import { isFist } from "../hand/gestures";

const PARTICLE_COUNT = 120;

function createParticles(width, height) {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.3,
    alpha: Math.random() * 0.45 + 0.1,
    speed: Math.random() * 0.02 + 0.005,
  }));
}
export default function TelekinesisCanvas({
  handLandmarksRef,
  onMissionComplete,
  onPsiStatsChange,
}) {
  const canvasRef = useRef(null);

const stateRef = useRef({
  bodies: [],

  particles: [],

  pointer: {
    x: 0,
    y: 0,
    active: false,
    down: false,
    previousX: 0,
    previousY: 0,
    vx: 0,
    vy: 0,
  },

  grabbedBody: null,

  telekinesis: {
    grabbedBody: null,
    fistActive: false,

    targetX: 0,
    targetY: 0,

    previousX: 0,
    previousY: 0,

    velocityX: 0,
    velocityY: 0,

    initialized: false,
  },

  // PSI HUD state
  psi: {
    power: 100,
    control: 100,
    force: 0,
    status: "READY",
  },

  effects: [],
  telekinesisParticles: [],
  handTrail: [],
  shockwaves: [],

  mission: {
    active: true,
    completed: false,

    targetX: 0,
    targetY: 0,
    targetRadius: 70,

    core: null,

    score: 0,
  },

  lastTime: 0,
});
  function landmarkToCanvas(
  landmark,
  width,
  height
) {
  return {
    // Same mirroring used by your hand visualization.
    x: (1 - landmark.x) * width,
    y: landmark.y * height,
  };
}

  const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  [0, 17],
];

function drawHand(ctx, landmarks, width, height) {
  if (!landmarks || landmarks.length === 0) {
    return;
  }

  const points = landmarks.map((landmark) => ({
    // Mirror X so the virtual hand matches the mirrored webcam.
    x: (1 - landmark.x) * width,
    y: landmark.y * height,
  }));

  // -----------------------------
  // Hand connection lines
  // -----------------------------

  ctx.save();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(110, 220, 255, 0.65)";
  ctx.shadowColor = "rgba(80, 200, 255, 0.8)";
  ctx.shadowBlur = 8;

  HAND_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const start = points[startIndex];
    const end = points[endIndex];

    if (!start || !end) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // -----------------------------
  // Landmark points
  // -----------------------------

  points.forEach((point, index) => {
    const isIndexTip = index === 8;

    ctx.beginPath();

    ctx.arc(
      point.x,
      point.y,
      isIndexTip ? 6 : 3,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = isIndexTip
      ? "#dffaff"
      : "#75dfff";

    ctx.shadowColor = "#4fdcff";
    ctx.shadowBlur = isIndexTip ? 20 : 8;

    ctx.fill();
  });

  // -----------------------------
  // Index fingertip energy field
  // -----------------------------

  const indexTip = points[8];

  if (indexTip) {
    const gradient = ctx.createRadialGradient(
      indexTip.x,
      indexTip.y,
      0,
      indexTip.x,
      indexTip.y,
      42
    );

    gradient.addColorStop(
      0,
      "rgba(210, 250, 255, 0.95)"
    );

    gradient.addColorStop(
      0.15,
      "rgba(100, 220, 255, 0.65)"
    );

    gradient.addColorStop(
      0.45,
      "rgba(70, 190, 255, 0.2)"
    );

    gradient.addColorStop(
      1,
      "rgba(70, 190, 255, 0)"
    );

    ctx.beginPath();

    ctx.arc(
      indexTip.x,
      indexTip.y,
      42,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = gradient;
    ctx.fill();

    // Outer energy ring
    ctx.beginPath();

    ctx.arc(
      indexTip.x,
      indexTip.y,
      12,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(190, 245, 255, 0.9)";

    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#66ddff";
    ctx.shadowBlur = 15;

    ctx.stroke();
  }

  ctx.restore();
}

  useEffect(() => {
    let lastPsiUpdate = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const state = stateRef.current;

    const drawMissionTarget = (time) => {
  const mission =
    state.mission;

  if (
    !mission.active &&
    !mission.completed
  ) {
    return;
  }

  const pulse =
    Math.sin(time * 0.004) * 5;

  const radius =
    mission.targetRadius +
    pulse;

  ctx.save();

  ctx.translate(
    mission.targetX,
    mission.targetY
  );

  // Outer glow
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius + 18,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(100, 220, 255, 0.12)";

  ctx.lineWidth = 10;

  ctx.shadowColor =
    "rgba(70, 220, 255, 0.5)";

  ctx.shadowBlur = 25;

  ctx.stroke();

  // Main target
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(120, 235, 255, 0.7)";

  ctx.lineWidth = 2;

  ctx.setLineDash([
    8,
    8,
  ]);

  ctx.rotate(
    time * 0.0005
  );

  ctx.stroke();

  // Inner core
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    8,
    0,
    Math.PI * 2
  );

  ctx.setLineDash([]);

  ctx.fillStyle =
    "rgba(180, 245, 255, 0.8)";

  ctx.shadowColor =
    "#5ee7ff";

  ctx.shadowBlur = 20;

  ctx.fill();

  ctx.restore();
};

    const checkMission = () => {
  const mission =
    state.mission;

  if (
    !mission.active ||
    mission.completed ||
    !mission.core
  ) {
    return;
  }

  const core = mission.core;

  const dx =
    core.x - mission.targetX;

  const dy =
    core.y - mission.targetY;

  const distance = Math.hypot(
    dx,
    dy
  );

  if (
    distance <
    mission.targetRadius
  ) {
    mission.completed = true;
    mission.active = false;

    mission.score = 100;

    onMissionComplete?.();

    createShockwave(
      core.x,
      core.y,
      2
    );

    createReleaseFlash(
      core.x,
      core.y
    );
  }
};

    const createShockwave = (x, y, power = 1) => {
  state.shockwaves.push({
    x,
    y,
    radius: 5,
    maxRadius: 45 + power * 35,
    life: 1,
    power,
  });
};

const drawShockwaves = (delta) => {
  for (
    let i = state.shockwaves.length - 1;
    i >= 0;
    i--
  ) {
    const wave = state.shockwaves[i];

    wave.radius +=
      (wave.maxRadius - wave.radius) *
      0.18;

    wave.life -= delta * 0.003;

    if (wave.life <= 0) {
      state.shockwaves.splice(i, 1);
      continue;
    }

    const progress =
      wave.radius / wave.maxRadius;

    ctx.save();

    ctx.globalAlpha =
      wave.life * (1 - progress * 0.35);

    ctx.beginPath();

    ctx.arc(
      wave.x,
      wave.y,
      wave.radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(150, 240, 255, 0.9)";

    ctx.lineWidth =
      3 * (1 - progress) + 1;

    ctx.shadowColor =
      "#4de3ff";

    ctx.shadowBlur = 25;

    ctx.stroke();

    ctx.restore();
  }
};

    const updateHandTrail = () => {
  const landmarks = handLandmarksRef?.current;

  if (!landmarks || landmarks.length < 21) {
    return;
  }

  const indexTip = landmarks[8];

  const point = landmarkToCanvas(
    indexTip,
    width,
    height
  );

  const trail = state.handTrail;

  // Add current fingertip position
trail.push({
  x: point.x,
  y: point.y,
  life: 1,
});

  // Keep the trail small for performance
  if (trail.length > 28) {
  trail.splice(
    0,
    trail.length - 28
  );
}
};
const drawHandTrail = (delta) => {
  const trail = state.handTrail;

  if (trail.length < 2) {
    return;
  }

  // Fade older points.
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life -= delta * 0.0025;

    if (trail[i].life <= 0) {
      trail.splice(i, 1);
    }
  }

  if (trail.length < 2) {
    return;
  }

  ctx.save();

  /*
   * Draw a smooth curve through the fingertip history.
   *
   * Quadratic curves are used between the points rather
   * than straight line segments, making the trail feel
   * like an energy ribbon.
   */

  const drawRibbon = () => {
    ctx.beginPath();

    const first = trail[0];

    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < trail.length - 1; i++) {
      const current = trail[i];
      const next = trail[i + 1];

      const midpointX =
        (current.x + next.x) / 2;

      const midpointY =
        (current.y + next.y) / 2;

      ctx.quadraticCurveTo(
        current.x,
        current.y,
        midpointX,
        midpointY
      );
    }

    const last = trail[trail.length - 1];

    ctx.lineTo(last.x, last.y);
  };

  // --------------------------------------------------
  // Outer atmospheric glow
  // --------------------------------------------------

  drawRibbon();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle =
    "rgba(60, 210, 255, 0.12)";

  ctx.lineWidth = 16;

  ctx.shadowColor =
    "rgba(60, 210, 255, 0.8)";

  ctx.shadowBlur = 28;

  ctx.stroke();

  // --------------------------------------------------
  // Main energy glow
  // --------------------------------------------------

  drawRibbon();

  ctx.strokeStyle =
    "rgba(80, 225, 255, 0.35)";

  ctx.lineWidth = 8;

  ctx.shadowColor =
    "rgba(70, 220, 255, 1)";

  ctx.shadowBlur = 18;

  ctx.stroke();

  // --------------------------------------------------
  // Bright energy core
  // --------------------------------------------------

  drawRibbon();

  ctx.strokeStyle =
    "rgba(205, 250, 255, 0.9)";

  ctx.lineWidth = 2.5;

  ctx.shadowColor =
    "#8cecff";

  ctx.shadowBlur = 10;

  ctx.stroke();

  ctx.restore();
};

    const createTelekinesisParticles = (
  x,
  y,
  amount = 3
) => {
  for (let i = 0; i < amount; i++) {
    const angle =
      Math.random() * Math.PI * 2;

    const distance =
      Math.random() * 25 + 8;

    state.telekinesisParticles.push({
      x:
        x +
        Math.cos(angle) * distance,

      y:
        y +
        Math.sin(angle) * distance,

      vx:
        Math.cos(angle) *
        (Math.random() * 0.03 + 0.01),

      vy:
        Math.sin(angle) *
        (Math.random() * 0.03 + 0.01),

      life: 1,

      size:
        Math.random() * 2.5 + 1,
    });
  }
};

const drawTelekinesisParticles = (
  delta
) => {
  for (
    let i =
      state.telekinesisParticles.length - 1;
    i >= 0;
    i--
  ) {
    const particle =
      state.telekinesisParticles[i];

    particle.x +=
      particle.vx * delta;

    particle.y +=
      particle.vy * delta;

    particle.life -=
      delta * 0.0018;

    if (particle.life <= 0) {
      state.telekinesisParticles.splice(
        i,
        1
      );

      continue;
    }

    ctx.save();

    ctx.globalAlpha =
      particle.life;

    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#b9f5ff";

    ctx.shadowColor =
      "#43ddff";

    ctx.shadowBlur = 15;

    ctx.fill();

    ctx.restore();
  }
};

const drawThrowEffects = (delta) => {
  for (
    let i = state.effects.length - 1;
    i >= 0;
    i--
  ) {
    const effect = state.effects[i];

    // -----------------------------------------
    // Release flash
    // -----------------------------------------

    if (effect.type === "releaseFlash") {
      effect.life -= delta * 0.006;
      effect.size += delta * 0.08;

      if (effect.life <= 0) {
        state.effects.splice(i, 1);
        continue;
      }

      ctx.save();

      ctx.globalAlpha = effect.life;

      const gradient =
        ctx.createRadialGradient(
          effect.x,
          effect.y,
          0,
          effect.x,
          effect.y,
          effect.size * 3
        );

      gradient.addColorStop(
        0,
        "rgba(240, 255, 255, 1)"
      );

      gradient.addColorStop(
        0.25,
        "rgba(120, 235, 255, 0.8)"
      );

      gradient.addColorStop(
        1,
        "rgba(70, 200, 255, 0)"
      );

      ctx.beginPath();

      ctx.arc(
        effect.x,
        effect.y,
        effect.size * 3,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = gradient;

      ctx.fill();

      ctx.restore();

      continue;
    }

    // -----------------------------------------
    // Existing throw particle
    // -----------------------------------------

    effect.x += effect.vx * delta;
    effect.y += effect.vy * delta;

    effect.vx *= 0.96;
    effect.vy *= 0.96;

    effect.life -= delta * 0.0025;

    if (effect.life <= 0) {
      state.effects.splice(i, 1);
      continue;
    }

    ctx.save();

    ctx.globalAlpha = effect.life;

    ctx.beginPath();

    ctx.arc(
      effect.x,
      effect.y,
      effect.size,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#a8edff";

    ctx.shadowColor =
      "#45dfff";

    ctx.shadowBlur = 15;

    ctx.fill();

    ctx.restore();
  }
};

    const createThrowEffect = (
  x,
  y,
  vx,
  vy
) => {
  const speed = Math.min(
    Math.hypot(vx, vy),
    18
  );

  const count = Math.floor(
    8 + speed * 1.5
  );

  for (let i = 0; i < count; i++) {
    const angle =
      Math.random() *
      Math.PI *
      2;

    const particleSpeed =
      Math.random() *
      speed *
      0.7;

    state.effects.push({
      x,
      y,

      vx:
        Math.cos(angle) *
        particleSpeed,

      vy:
        Math.sin(angle) *
        particleSpeed,

      life: 1,

      size:
        Math.random() * 3 + 1,
    });
  }
};

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

    state.mission.targetX =
        width * 0.78;

     state.mission.targetY =
        height * 0.48;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!state.bodies.length) {
        state.bodies = createBodies(width, height);
        state.mission.core =
  state.bodies[0];
      }

      state.particles = createParticles(width, height);
    };

    const getPointerPosition = (event) => {
      const rect = canvas.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const onPointerMove = (event) => {
      const point = getPointerPosition(event);

      const pointer = state.pointer;

      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;

      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;

      pointer.x = point.x;
      pointer.y = point.y;

      pointer.vx = dx;
      pointer.vy = dy;
      pointer.active = true;

      if (state.grabbedBody) {
        state.grabbedBody.prevX = state.grabbedBody.x;
        state.grabbedBody.prevY = state.grabbedBody.y;

        // Smooth follow instead of snapping.
        state.grabbedBody.x +=
          (pointer.x - state.grabbedBody.x) * 0.32;

        state.grabbedBody.y +=
          (pointer.y - state.grabbedBody.y) * 0.32;
      }
    };

    const onPointerDown = (event) => {
      const point = getPointerPosition(event);

      state.pointer.down = true;
      state.pointer.x = point.x;
      state.pointer.y = point.y;

      // Search from top to bottom so overlapping objects behave naturally.
      for (let i = state.bodies.length - 1; i >= 0; i -= 1) {
        const body = state.bodies[i];

        if (body.containsPoint(point.x, point.y)) {
          body.isGrabbed = true;
          state.grabbedBody = body;
          break;
        }
      }
    };

    const onPointerUp = () => {
      state.pointer.down = false;

      if (state.grabbedBody) {
        state.grabbedBody.release(
          state.pointer.vx,
          state.pointer.vy
        );

        state.grabbedBody = null;
      }
    };

    const onPointerLeave = () => {
      state.pointer.active = false;
    };

    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.7
      );

      gradient.addColorStop(0, "#111827");
      gradient.addColorStop(0.5, "#070b14");
      gradient.addColorStop(1, "#02040a");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle grid.
      ctx.save();
      ctx.globalAlpha = 0.055;
      ctx.strokeStyle = "#8ea4c8";
      ctx.lineWidth = 1;

      const gridSize = 60;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawParticles = (time) => {
      state.particles.forEach((particle) => {
        particle.y -= particle.speed;

        if (particle.y < -10) {
          particle.y = height + 10;
          particle.x = Math.random() * width;
        }

        const pulse =
          0.5 +
          Math.sin(time * 0.001 + particle.x) * 0.25;

        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = `rgba(180, 210, 255, ${
          particle.alpha * pulse
        })`;

        ctx.fill();
      });
    };

    const polygon = (sides, radius) => {
      ctx.beginPath();

      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
    };

    const drawBody = (body) => {
      ctx.save();

      ctx.translate(body.x, body.y);
      ctx.rotate(body.rotation);

      const hue = body.hue;
      const glow = body.isGrabbed ? 35 : 20;

      ctx.shadowColor = `hsla(${hue}, 95%, 65%, 0.9)`;
      ctx.shadowBlur = glow;

      const gradient = ctx.createRadialGradient(
        -body.radius * 0.3,
        -body.radius * 0.3,
        2,
        0,
        0,
        body.radius
      );

      gradient.addColorStop(
        0,
        `hsla(${hue}, 100%, 90%, 0.95)`
      );

      gradient.addColorStop(
        0.4,
        `hsla(${hue}, 90%, 65%, 0.75)`
      );

      gradient.addColorStop(
        1,
        `hsla(${hue}, 80%, 35%, 0.15)`
      );

      ctx.fillStyle = gradient;
      ctx.strokeStyle = `hsla(${hue}, 100%, 82%, 0.9)`;
      ctx.lineWidth = body.isGrabbed ? 3 : 1.5;

      if (body.type === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (body.type === "square") {
        ctx.beginPath();
        ctx.roundRect(
          -body.radius,
          -body.radius,
          body.radius * 2,
          body.radius * 2,
          10
        );
        ctx.fill();
        ctx.stroke();
      }

      if (body.type === "diamond") {
        ctx.beginPath();
        ctx.moveTo(0, -body.radius);
        ctx.lineTo(body.radius * 0.7, 0);
        ctx.lineTo(0, body.radius);
        ctx.lineTo(-body.radius * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (body.type === "triangle") {
        polygon(3, body.radius);
        ctx.fill();
        ctx.stroke();
      }

      if (body.type === "hexagon") {
        polygon(6, body.radius);
        ctx.fill();
        ctx.stroke();
      }

      if (body.type === "crystal") {
        ctx.beginPath();
        ctx.moveTo(0, -body.radius);
        ctx.lineTo(body.radius * 0.65, -body.radius * 0.25);
        ctx.lineTo(body.radius * 0.45, body.radius);
        ctx.lineTo(-body.radius * 0.45, body.radius);
        ctx.lineTo(-body.radius * 0.65, -body.radius * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -body.radius);
        ctx.lineTo(0, body.radius);
        ctx.moveTo(-body.radius * 0.65, -body.radius * 0.25);
        ctx.lineTo(0, body.radius);
        ctx.moveTo(body.radius * 0.65, -body.radius * 0.25);
        ctx.lineTo(0, body.radius);
        ctx.strokeStyle = `hsla(${hue}, 100%, 95%, 0.35)`;
        ctx.stroke();
      }

      ctx.restore();

      if (body.isGrabbed) {
        ctx.save();

        ctx.translate(body.x, body.y);

        ctx.beginPath();
        ctx.arc(
          0,
          0,
          body.radius + 16,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle = `hsla(${hue}, 100%, 75%, 0.35)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 8]);
        ctx.stroke();

        ctx.restore();
      }
    };

    const drawEnergyConnection = () => {
      const grabbed = state.grabbedBody;

      if (!grabbed || !state.pointer.active) {
        return;
      }

      const gradient = ctx.createLinearGradient(
        state.pointer.x,
        state.pointer.y,
        grabbed.x,
        grabbed.y
      );

      gradient.addColorStop(0, "rgba(170, 220, 255, 0)");
      gradient.addColorStop(0.5, "rgba(120, 190, 255, 0.5)");
      gradient.addColorStop(1, "rgba(180, 230, 255, 0)");

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(100, 190, 255, 0.7)";
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(
        state.pointer.x,
        state.pointer.y
      );

      ctx.lineTo(grabbed.x, grabbed.y);
      ctx.stroke();

      ctx.restore();
    };

    const drawCursor = () => {
      if (!state.pointer.active) {
        return;
      }

      const { x, y, down } = state.pointer;

      const radius = down ? 22 : 15;

      const gradient = ctx.createRadialGradient(
        x,
        y,
        1,
        x,
        y,
        radius * 2.5
      );

      gradient.addColorStop(
        0,
        "rgba(220, 245, 255, 0.95)"
      );

      gradient.addColorStop(
        0.2,
        "rgba(130, 210, 255, 0.5)"
      );

      gradient.addColorStop(
        1,
        "rgba(100, 180, 255, 0)"
      );

      ctx.beginPath();
      ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 245, 255, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const createReleaseFlash = (x, y) => {
  state.effects.push({
    type: "releaseFlash",
    x,
    y,
    life: 1,
    size: 8,
  });
};

const findNearestBody = (x, y) => {
  let nearest = null;
  let nearestDistance = Infinity;

  state.bodies.forEach((body) => {
    const dx = body.x - x;
    const dy = body.y - y;

    const distance = Math.hypot(dx, dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = body;
    }
  });

  return {
    body: nearest,
    distance: nearestDistance,
  };
};

const updateTelekinesis = (delta) => {
  const landmarks = handLandmarksRef?.current;

  const telekinesis = state.telekinesis;

  // No hand detected.
  if (!landmarks || landmarks.length < 21) {
    telekinesis.fistActive = false;
    telekinesis.initialized = false;
    telekinesis.velocityX = 0;
    telekinesis.velocityY = 0;

    if (telekinesis.grabbedBody) {
      telekinesis.grabbedBody.isGrabbed = false;
      telekinesis.grabbedBody = null;
    }

    return;
  }

  // MediaPipe landmark 8 = index fingertip.
  const indexTip = landmarks[8];

  const handPosition = landmarkToCanvas(
    indexTip,
    width,
    height
  );

  telekinesis.targetX = handPosition.x;
  telekinesis.targetY = handPosition.y;

  // -----------------------------------------
  // Calculate hand movement velocity
  // -----------------------------------------

  if (!telekinesis.initialized) {
    telekinesis.previousX = handPosition.x;
    telekinesis.previousY = handPosition.y;

    telekinesis.velocityX = 0;
    telekinesis.velocityY = 0;

    telekinesis.initialized = true;
  } else {
    const rawVelocityX =
      handPosition.x -
      telekinesis.previousX;

    const rawVelocityY =
      handPosition.y -
      telekinesis.previousY;

    // Smooth the velocity to reduce webcam jitter.
    telekinesis.velocityX =
      telekinesis.velocityX * 0.7 +
      rawVelocityX * 0.3;

    telekinesis.velocityY =
      telekinesis.velocityY * 0.7 +
      rawVelocityY * 0.3;

    telekinesis.previousX = handPosition.x;
    telekinesis.previousY = handPosition.y;
  }

  const fist = isFist(landmarks);


  if (
  fist &&
  telekinesis.grabbedBody
) {
  state.psi.status = "GRABBING";
} else if (fist) {
  state.psi.status = "TARGETING";
} else {
  state.psi.status = "READY";
}

  // -----------------------------------------
  // START GRAB
  // -----------------------------------------

  if (
    fist &&
    !telekinesis.fistActive
  ) {
    const nearest = findNearestBody(
      handPosition.x,
      handPosition.y
    );

    if (
      nearest.body &&
      nearest.distance <
        nearest.body.radius + 120
    ) {
      telekinesis.grabbedBody =
        nearest.body;

      nearest.body.isGrabbed = true;

      nearest.body.vx = 0;
      nearest.body.vy = 0;

      nearest.body.x =
        handPosition.x;

      nearest.body.y =
        handPosition.y;

      telekinesis.velocityX = 0;
      telekinesis.velocityY = 0;
    }
  }

  // -----------------------------------------
  // CONTINUE GRAB
  // -----------------------------------------

if (
  fist &&
  telekinesis.grabbedBody
) {

    
  const body =
    telekinesis.grabbedBody;

  body.isGrabbed = true;

  body.prevX = body.x;
  body.prevY = body.y;

  body.x +=
    (handPosition.x - body.x) *
    0.28;

  body.y +=
    (handPosition.y - body.y) *
    0.28;

    const handError = Math.hypot(
  handPosition.x - body.x,
  handPosition.y - body.y
);

state.psi.power = Math.max(
  0,
  state.psi.power -
    delta * 0.002
);

if (!telekinesis.grabbedBody) {
  state.psi.power = Math.min(
    100,
    state.psi.power +
      delta * 0.001
  );
}

state.psi.control = Math.max(
  0,
  Math.round(
    100 - handError * 0.5
  )
);

  body.vx = 0;
  body.vy = 0;

  body.rotation +=
  0.0025 * delta;

  createTelekinesisParticles(
    body.x,
    body.y,
    2
  );
}

const drawTelekinesisRing = (
  time
) => {
  const body =
    state.telekinesis.grabbedBody;

  if (!body) {
    return;
  }

  const pulse =
    Math.sin(time * 0.008) * 4;

  const radius =
    body.radius + 18 + pulse;

  ctx.save();

  ctx.translate(
    body.x,
    body.y
  );

  ctx.rotate(
    time * 0.001
  );

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 1.4
  );

  ctx.strokeStyle =
    "rgba(120, 230, 255, 0.85)";

  ctx.lineWidth = 2;

  ctx.shadowColor =
    "rgba(80, 220, 255, 1)";

  ctx.shadowBlur = 18;

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius + 7,
    Math.PI,
    Math.PI * 2.5
  );

  ctx.strokeStyle =
    "rgba(180, 245, 255, 0.35)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();
};

  // -----------------------------------------
  // RELEASE / THROW
  // -----------------------------------------

  if (
    !fist &&
    telekinesis.fistActive &&
    telekinesis.grabbedBody
  ) {
    const body =
      telekinesis.grabbedBody;

    body.isGrabbed = false;

    // Transfer hand velocity to object.
    const throwMultiplier = 2.5;

    let throwX =
      telekinesis.velocityX *
      throwMultiplier;

    let throwY =
      telekinesis.velocityY *
      throwMultiplier;

    // Prevent absurdly fast throws.
    const maxThrowSpeed = 18;

    const throwSpeed = Math.hypot(
  throwX,
  throwY
);

state.psi.force = Math.min(
  100,
  Math.round(
    (throwSpeed / maxThrowSpeed) * 100
  )
);

state.psi.force = Math.min(
  100,
  Math.round(
    (throwSpeed / maxThrowSpeed) *
      100
  )
);

    if (throwSpeed > maxThrowSpeed) {
      const scale =
        maxThrowSpeed /
        throwSpeed;

      throwX *= scale;
      throwY *= scale;
    }

    body.vx = throwX;
    body.vy = throwY;

    createThrowEffect(
  body.x,
  body.y,
  throwX,
  throwY
);

const throwPower = Math.min(
  Math.hypot(throwX, throwY) / 10,
  2
);

createShockwave(
  body.x,
  body.y,
  throwPower
);

createReleaseFlash(
  body.x,
  body.y
);


    telekinesis.grabbedBody = null;

    telekinesis.velocityX = 0;
    telekinesis.velocityY = 0;
  }

  telekinesis.fistActive = fist;



  const now = performance.now();

if (now - lastPsiUpdate > 100) {
  onPsiStatsChange?.({
    ...state.psi,
  });

  lastPsiUpdate = now;
}

};

const animate = (time) => {
  if (!state.lastTime) {
    state.lastTime = time;
  }

  const delta = Math.min(
    time - state.lastTime,
    32
  );

  state.lastTime = time;

updateTelekinesis(delta);

updateHandTrail();

checkMission();

  drawBackground();

  drawParticles(time);

  state.bodies.forEach((body) => {
    body.update(
      width,
      height,
      delta,
      state.grabbedBody
    );
  });

  drawEnergyConnection();

drawTelekinesisBeam();


drawMissionTarget(time);

drawHandTrail(delta);

state.bodies.forEach(drawBody);

  drawTelekinesisRing(time);

drawTelekinesisParticles(delta);

drawShockwaves(delta);

drawThrowEffects(delta);

  drawHand(
    ctx,
    handLandmarksRef?.current,
    width,
    height
  );

  drawCursor();

  animationFrameId =
    requestAnimationFrame(animate);
};


    const drawTelekinesisBeam = () => {
  const body =
    state.telekinesis.grabbedBody;

  if (
    !body ||
    !handLandmarksRef?.current
  ) {
    return;
  }

  const indexTip =
    handLandmarksRef.current[8];

  if (!indexTip) {
    return;
  }

  const handPosition =
    landmarkToCanvas(
      indexTip,
      width,
      height
    );

  const gradient = ctx.createLinearGradient(
    handPosition.x,
    handPosition.y,
    body.x,
    body.y
  );

  gradient.addColorStop(
    0,
    "rgba(120, 230, 255, 0)"
  );

  gradient.addColorStop(
    0.5,
    "rgba(100, 220, 255, 0.8)"
  );

  gradient.addColorStop(
    1,
    "rgba(180, 245, 255, 0)"
  );

  ctx.save();

  ctx.beginPath();

  ctx.moveTo(
    handPosition.x,
    handPosition.y
  );

  ctx.lineTo(
    body.x,
    body.y
  );

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;

  ctx.shadowColor =
    "rgba(80, 220, 255, 0.9)";

  ctx.shadowBlur = 20;

  ctx.stroke();

  ctx.restore();
};

const drawTelekinesisRing = (time) => {
  const body = state.telekinesis.grabbedBody;

  if (!body) {
    return;
  }

  const pulse = Math.sin(time * 0.008) * 4;

  const radius = body.radius + 18 + pulse;

  ctx.save();

  ctx.translate(body.x, body.y);

  ctx.rotate(time * 0.001);

  // First energy arc
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 1.4
  );

  ctx.strokeStyle =
    "rgba(120, 230, 255, 0.85)";

  ctx.lineWidth = 2;

  ctx.shadowColor =
    "rgba(80, 220, 255, 1)";

  ctx.shadowBlur = 18;

  ctx.stroke();

  // Second energy arc
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    radius + 7,
    Math.PI,
    Math.PI * 2.5
  );

  ctx.strokeStyle =
    "rgba(180, 245, 255, 0.35)";

  ctx.lineWidth = 1;

  ctx.stroke();

  ctx.restore();
};

    resize();

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="PSI telekinesis simulation"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: "none",
        touchAction: "none",
      }}
    />
  );
}
