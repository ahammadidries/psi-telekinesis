import { useEffect, useRef } from "react";
import { useHandTracking } from "../hooks/useHandTracking";

export default function HandTracking({
  onLandmarksChange,
}) {
  const videoRef = useRef(null);

  const {
    handLandmarks,
    status,
    error,
  } = useHandTracking(videoRef);

  useEffect(() => {
    onLandmarksChange?.(handLandmarks);
  }, [handLandmarks, onLandmarksChange]);

  return (
    <div className="hand-tracking">
      <video
        ref={videoRef}
        className="webcam-preview"
        autoPlay
        muted
        playsInline
      />

      <div className="webcam-overlay">
        <div
          className={`camera-status ${
            status === "ready"
              ? "camera-status-ready"
              : ""
          }`}
        >
          <span className="camera-dot" />

          {status === "initializing" &&
            "INITIALIZING"}

          {status === "loading" &&
            "LOADING HAND TRACKING"}

          {status === "ready" &&
            "HAND SENSOR ONLINE"}

          {status === "error" &&
            "CAMERA ERROR"}
        </div>

        {error && (
          <div className="camera-error">
            Camera access failed.
            <br />
            Please allow webcam access and reload.
          </div>
        )}
      </div>
    </div>
  );
}