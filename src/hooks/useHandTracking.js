import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

const MODEL_PATH = "/models/hand_landmarker.task";

export function useHandTracking(videoRef) {
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [handLandmarks, setHandLandmarks] = useState(null);
  const [status, setStatus] = useState("initializing");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setStatus("loading");

        const vision = await FilesetResolver.forVisionTasks(
          WASM_PATH
        );

        const handLandmarker =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath: MODEL_PATH,
                delegate: "GPU",
              },

              runningMode: "VIDEO",

              numHands: 1,

              minHandDetectionConfidence: 0.5,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            }
          );

        if (cancelled) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;

        const video = videoRef.current;

        if (!video) {
          throw new Error("Webcam video element is unavailable.");
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
              facingMode: "user",
            },
            audio: false,
          });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          handLandmarker.close();
          return;
        }

        streamRef.current = stream;

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        await video.play();

        setStatus("ready");

        const detectFrame = () => {
          if (cancelled) {
            return;
          }

          const currentVideo = videoRef.current;
          const detector = handLandmarkerRef.current;

          if (!currentVideo || !detector) {
            return;
          }

          if (
            currentVideo.readyState >= 2 &&
            currentVideo.currentTime !==
              lastVideoTimeRef.current
          ) {
            lastVideoTimeRef.current =
              currentVideo.currentTime;

            const results = detector.detectForVideo(
              currentVideo,
              performance.now()
            );

            if (
              results.landmarks &&
              results.landmarks.length > 0
            ) {
              setHandLandmarks(results.landmarks[0]);
            } else {
              setHandLandmarks(null);
            }
          }

          animationFrameRef.current =
            requestAnimationFrame(detectFrame);
        };

        animationFrameRef.current =
          requestAnimationFrame(detectFrame);
      } catch (err) {
        console.error(
          "Hand tracking initialization failed:",
          err
        );

        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialize hand tracking."
        );

        setStatus("error");
      }
    }

    initialize();

    return () => {
      cancelled = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  return {
    handLandmarks,
    status,
    error,
  };
}