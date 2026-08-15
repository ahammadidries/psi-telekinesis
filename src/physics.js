// src/physics.js

export class Body {
  constructor({
    x,
    y,
    vx = 0,
    vy = 0,
    radius = 30,
    type = "circle",
    rotation = 0,
    rotationSpeed = 0,
    hue = 200,
    mass = 1,
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.type = type;
    this.rotation = rotation;
    this.rotationSpeed = rotationSpeed;
    this.hue = hue;
    this.mass = mass;

    this.isGrabbed = false;
    this.prevX = x;
    this.prevY = y;
  }

  update(width, height, delta, grabbedBody) {
    if (this.isGrabbed) {
      this.prevX = this.x;
      this.prevY = this.y;
      return;
    }

    // Slight attraction toward the center for organic motion.
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = centerX - this.x;
    const dy = centerY - this.y;

  // Very subtle attraction toward the center.
const gravityStrength = 0.0000008;

this.vx += dx * gravityStrength * delta;
this.vy += dy * gravityStrength * delta;

    // Gentle drag.
    this.vx *= 0.9985;
    this.vy *= 0.9985;

    // Keep things slow and elegant.
    const maxSpeed = 0.22;

    const speed = Math.hypot(this.vx, this.vy);

    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx * delta;
    this.y += this.vy * delta;

    this.rotation += this.rotationSpeed * delta;

    // Soft screen bounds.
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * 0.8;
    }

    if (this.x > width - this.radius) {
      this.x = width - this.radius;
      this.vx = -Math.abs(this.vx) * 0.8;
    }

    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy) * 0.8;
    }

    if (this.y > height - this.radius) {
      this.y = height - this.radius;
      this.vy = -Math.abs(this.vy) * 0.8;
    }

    // Tiny repulsion from the grabbed object.
    if (grabbedBody && grabbedBody !== this) {
      const gx = this.x - grabbedBody.x;
      const gy = this.y - grabbedBody.y;

      const distance = Math.max(Math.hypot(gx, gy), 1);
      const minDistance = this.radius + grabbedBody.radius + 20;

      if (distance < minDistance) {
        const force = (minDistance - distance) * 0.0008;

        this.vx += (gx / distance) * force * delta;
        this.vy += (gy / distance) * force * delta;
      }
    }
  }

  release(vx, vy) {
    this.isGrabbed = false;

    // Carry a little hand/cursor momentum.
    this.vx = vx * 0.75;
    this.vy = vy * 0.75;
  }

  containsPoint(px, py) {
    return Math.hypot(px - this.x, py - this.y) <= this.radius;
  }
}

export function createBodies(width, height) {
  const definitions = [
    {
      x: width * 0.22,
      y: height * 0.3,
      radius: 34,
      type: "crystal",
      hue: 190,
    },
    {
      x: width * 0.72,
      y: height * 0.28,
      radius: 44,
      type: "hexagon",
      hue: 275,
    },
    {
      x: width * 0.48,
      y: height * 0.5,
      radius: 30,
      type: "circle",
      hue: 155,
    },
    {
      x: width * 0.3,
      y: height * 0.72,
      radius: 42,
      type: "square",
      hue: 35,
    },
    {
      x: width * 0.75,
      y: height * 0.68,
      radius: 27,
      type: "triangle",
      hue: 325,
    },
    {
      x: width * 0.55,
      y: height * 0.2,
      radius: 24,
      type: "diamond",
      hue: 215,
    },
  ];

  return definitions.map((item) => {
  return new Body({
    ...item,

    vx:
      (Math.random() - 0.5) * 0.12,

    vy:
      (Math.random() - 0.5) * 0.12,

    rotation:
      Math.random() * Math.PI * 2,

    rotationSpeed:
      (Math.random() - 0.5) * 0.0008,
  });
});
}