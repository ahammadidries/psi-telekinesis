import {
  useCallback,
  useRef,
  useState,
} from "react";
import TelekinesisCanvas from "./components/TelekinsisCanvas";
import HandTracking from "./components/HandTracking";
import "./styles.css";

export default function App() {
  const handLandmarksRef = useRef(null);

  const [psiStats, setPsiStats] = useState({
  power: 100,
  control: 100,
  force: 0,
  status: "READY",
});

  const handleLandmarksChange = useCallback(
    (landmarks) => {
      handLandmarksRef.current = landmarks;
    },
    []
  );

  const [missionCompleted, setMissionCompleted] =
  useState(false);

  return (
    <main className="app">
<TelekinesisCanvas
  handLandmarksRef={handLandmarksRef}
  onMissionComplete={() =>
    setMissionCompleted(true)
  }
  onPsiStatsChange={setPsiStats}
/>

<div className="mission-panel">
  <div className="mission-label">
    CHALLENGE 01
  </div>

  <div className="mission-title">
    Touchless CORE
  </div>

  <div className="mission-description">
    Move the energy core into the
    containment field.
  </div>

  <div
    className={`mission-status ${
      missionCompleted
        ? "mission-complete"
        : ""
    }`}
  >
    <span className="mission-status-dot" />

    {missionCompleted
      ? "MISSION COMPLETE"
      : "MISSION ACTIVE"}
  </div>
</div>
      <HandTracking
        onLandmarksChange={handleLandmarksChange}
      />

      <div className="hud">
        <div className="brand">
          <span className="brand-mark">Ψ</span>

          <div>
            <div className="brand-name">PSI</div>

            <div className="brand-subtitle">
              Touchless PROTOTYPE
            </div>
          </div>
        </div>

        <div className="mission-panel">
  <div className="mission-label">
    CHALLENGE 01
  </div>

  <div className="mission-title">
    Touchless CORE
  </div>

  <div className="mission-description">
    Move the energy core into the
    containment field.
  </div>

  <div className="mission-status">
    <span className="mission-status-dot" />

    {missionCompleted
  ? "MISSION COMPLETE"
  : "MISSION ACTIVE"}
  </div>
</div>

        <div className="status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>
      </div>

      <section className="hero-copy">
        <p className="eyebrow">PROJECT Touchless</p>

        <h1>Touchless</h1>

        <p className="description">
          Move the cursor over an object and press to
          manipulate matter.
        </p>

        <div className="controls">
          <span>PRESS</span>
          <span className="control-key">HOLD</span>
          <span>MOVE</span>
          <span className="control-key">RELEASE</span>
        </div>
      </section>

      <div className="footer">
        <span>TOuchless-01</span>

        <span className="footer-line" />

        <span>HUMAN → DIGITAL INTERFACE</span>
      </div>

      <div className="psi-hud">
  <div className="psi-hud-title">
    Touchless SYSTEM
  </div>

  <div className="psi-hud-status">
    <span className="psi-status-dot" />
    {psiStats.status}
  </div>

  <div className="psi-stat">
    <div className="psi-stat-header">
      <span>POWER</span>
      <span>{Math.round(psiStats.power)}%</span>
    </div>

    <div className="psi-bar">
      <div
        className="psi-bar-fill"
        style={{
          width: `${psiStats.power}%`,
        }}
      />
    </div>
  </div>

  <div className="psi-stat">
    <div className="psi-stat-header">
      <span>CONTROL</span>
      <span>{psiStats.control}%</span>
    </div>

    <div className="psi-bar">
      <div
        className="psi-bar-fill"
        style={{
          width: `${psiStats.control}%`,
        }}
      />
    </div>
  </div>

  <div className="psi-stat">
    <div className="psi-stat-header">
      <span>FORCE</span>
      <span>{psiStats.force}%</span>
    </div>

    <div className="psi-bar">
      <div
        className="psi-bar-fill"
        style={{
          width: `${psiStats.force}%`,
        }}
      />
    </div>
  </div>
</div>
    </main>
  );
}