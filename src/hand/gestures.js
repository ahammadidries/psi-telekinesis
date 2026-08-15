// src/hand/gestures.js

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);

  return Math.sqrt(
    dx * dx +
      dy * dy +
      dz * dz
  );
}

/*
  PSI GRAB GESTURE

  All four fingers must be folded:

  Index  → 8 / 6
  Middle → 12 / 10
  Ring   → 16 / 14
  Pinky  → 20 / 18

  The thumb is intentionally ignored.
  The index finger can therefore be used
  for aiming when the hand is open.
*/

const FINGERS = [
  {
    name: "index",
    tip: 8,
    pip: 6,
  },
  {
    name: "middle",
    tip: 12,
    pip: 10,
  },
  {
    name: "ring",
    tip: 16,
    pip: 14,
  },
  {
    name: "pinky",
    tip: 20,
    pip: 18,
  },
];

export function isFist(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return false;
  }

  const wrist = landmarks[0];

  let closedFingers = 0;

  for (const finger of FINGERS) {
    const tip = landmarks[finger.tip];
    const pip = landmarks[finger.pip];

    const tipDistance = distance(
      tip,
      wrist
    );

    const pipDistance = distance(
      pip,
      wrist
    );

    /*
      A folded finger brings its fingertip
      closer to the wrist than its PIP joint.
    */

    if (
      tipDistance <
      pipDistance * 0.95
    ) {
      closedFingers++;
    }
  }

  // ALL FOUR fingers must be closed.
  return closedFingers === 4;
}