import React, { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../firebase/config";
const ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.cloudflare.com:5349" },
];
const WS_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:8080/ws";
type Peer = {
  id: string;
  name: string;
  stream: MediaStream;
  connected: boolean;
};
type SignalMessage = {
  type: string;
  room?: string;
  peerId?: string;
  name?: string;
  from?: string;
  to?: string;
  data?: {
    sdp?: { type: RTCSdpType; sdp?: string };
    candidate?: RTCIceCandidateInit;
  };
};
interface VideoCallProps {
  onLeave?: () => void;
}
const C = {
  bg: "#080810",
  surface: "rgba(255,255,255,.05)",
  surfaceStrong: "rgba(255,255,255,.08)",
  border: "rgba(255,255,255,.09)",
  glass: "rgba(12,12,22,.78)",
  accent: "#4f8ef7",
  danger: "#f74f6a",
  success: "#22d46a",
  text: "#e8eaf2",
  muted: "#7a7d94",
};
function getMyId() {
  return auth?.currentUser?.uid || crypto.randomUUID();
}
function getMyName() {
  return auth?.currentUser?.displayName || "Guest";
}
function getRoom() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "room";
}
function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
function gradientFromId(id: string) {
  const hue = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${hue},60%,28%),hsl(${
    (hue + 40) % 360
  },70%,18%))`;
}
function Tile({
  stream,
  name,
  id,
  local,
  muted,
  videoOff,
  spotlight,
  onClick,
}: {
  stream: MediaStream | null;
  name: string;
  id: string;
  local?: boolean;
  muted?: boolean;
  videoOff?: boolean;
  spotlight?: boolean;
  onClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(() => {});
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        borderRadius: spotlight ? 20 : 16,
        background: gradientFromId(id),
        cursor: onClick ? "pointer" : "default",
        boxShadow: spotlight
          ? `0 0 0 2px ${C.accent}55,0 30px 70px rgba(0,0,0,.55)`
          : "0 10px 35px rgba(0,0,0,.35)",
      }}
    >
      {" "}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={local}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: videoOff ? "none" : "block",
          transform: local ? "scaleX(-1)" : undefined,
          background: "#101018",
        }}
      />{" "}
      {videoOff && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {" "}
          <span
            style={{
              fontSize: spotlight ? 60 : 42,
              fontWeight: 800,
              color: "rgba(255,255,255,.82)",
              letterSpacing: ".04em",
            }}
          >
            {" "}
            {initials(name)}{" "}
          </span>{" "}
        </div>
      )}{" "}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "18px 16px 13px",
          background: "linear-gradient(transparent,rgba(0,0,0,.75))",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {" "}
        {muted && (
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: C.danger,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {" "}
            <MicOffIcon size={11} />{" "}
          </span>
        )}{" "}
        <span
          style={{
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            textShadow: "0 1px 5px rgba(0,0,0,.7)",
          }}
        >
          {" "}
          {name} {local ? " · You" : ""}{" "}
        </span>{" "}
      </div>{" "}
    </div>
  );
}
function ControlButton({
  icon,
  label,
  active = true,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        minWidth: 64,
        height: 60,
        padding: "9px 13px",
        border: `1px solid ${danger ? "transparent" : C.border}`,
        borderRadius: 17,
        background: danger
          ? C.danger
          : active
          ? C.surfaceStrong
          : "rgba(247,79,106,.15)",
        color: danger ? "#fff" : active ? C.text : C.danger,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "transform .15s,background .15s",
        backdropFilter: "blur(15px)",
      }}
      onMouseEnter={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {" "}
      {icon}{" "}
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {" "}
        {label}{" "}
      </span>{" "}
    </button>
  );
}
function MicIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <rect x="9" y="2" width="6" height="12" rx="3" />{" "}
      <path d="M5 11a7 7 0 0 0 14 0" /> <path d="M12 18v4" />{" "}
      <path d="M8 22h8" />{" "}
    </svg>
  );
}
function MicOffIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="M9 9v3a3 3 0 0 0 5 2.2" /> <path d="M15 9V5a3 3 0 0 0-5.8-1" />{" "}
      <path d="M5 11a7 7 0 0 0 12.5 4.4" /> <path d="M19 11a7 7 0 0 1-.4 2.3" />{" "}
      <path d="M12 18v4" /> <path d="M8 22h8" /> <path d="M2 2l20 20" />{" "}
    </svg>
  );
}
function CameraIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <rect x="2" y="5" width="15" height="14" rx="2" />{" "}
      <path d="m17 10 5-3v10l-5-3z" />{" "}
    </svg>
  );
}
function CameraOffIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="m3 3 18 18" />{" "}
      <path d="M10 5h4a2 2 0 0 1 2 2v3l5-3v10l-5-3v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />{" "}
    </svg>
  );
}
function PhoneOffIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="M10.7 5.1A3 3 0 0 0 7 3.4L4.8 4.7a2 2 0 0 0-.8 2.7 18 18 0 0 0 11.8 11.8 2 2 0 0 0 2.7-.8l1.3-2.2a3 3 0 0 0-1.7-3.7l-2.3-.9a2 2 0 0 0-2.2.5l-.8.8a14 14 0 0 1-4.8-4.8l.8-.8a2 2 0 0 0 .5-2.2z" />{" "}
      <path d="m3 3 18 18" />{" "}
    </svg>
  );
}
const VideoCall: React.FC<VideoCallProps> = ({ onLeave }) => {
  const myId = useRef(getMyId()).current;
  const myName = useRef(getMyName()).current;
  const room = useRef(getRoom()).current;
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const namesRef = useRef<Map<string, string>>(new Map());
  const iceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const leavingRef = useRef(false);
  const mountedRef = useRef(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "starting" | "connecting" | "connected" | "error"
  >("starting");
  const [error, setError] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      if (!leavingRef.current) {
        setControlsVisible(false);
      }
    }, 3500);
  }, []);
  const removePeer = useCallback((id: string) => {
    const pc = peersRef.current.get(id);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peersRef.current.delete(id);
    }
    iceRef.current.delete(id);
    namesRef.current.delete(id);
    setPeers((current) => current.filter((peer) => peer.id !== id));
    setSpotlight((current) => (current === id ? null : current));
  }, []);
  const send = useCallback((message: object) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    ws.send(JSON.stringify(message));
    return true;
  }, []);
  const createPeer = useCallback(
    (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing && existing.connectionState !== "closed") {
        return existing;
      }
      if (existing) {
        existing.close();
        peersRef.current.delete(peerId);
      }
      const pc = new RTCPeerConnection({ iceServers: ICE });
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }
      pc.onicecandidate = (event) => {
        if (!event.candidate || leavingRef.current) {
          return;
        }
        send({
          type: "signal",
          to: peerId,
          from: myId,
          name: myName,
          data: { candidate: event.candidate.toJSON() },
        });
      };
      pc.ontrack = (event) => {
        if (peerId === myId || leavingRef.current) {
          return;
        }

        const remoteStream = event.streams[0] || new MediaStream([event.track]);

        const name = namesRef.current.get(peerId) || "Guest";

        setPeers((current) => {
          const existingPeer = current.find((peer) => peer.id === peerId);

          if (existingPeer) {
            return current.map((peer) =>
              peer.id === peerId
                ? {
                    ...peer,
                    stream: remoteStream,
                    name,
                    connected: true,
                  }
                : peer
            );
          }

          return [
            ...current,
            {
              id: peerId,
              name,
              stream: remoteStream,
              connected: true,
            },
          ];
        });

        setStatus("connected");
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          removePeer(peerId);
          return;
        }
        if (pc.connectionState === "closed") {
          removePeer(peerId);
          return;
        }
        if (pc.connectionState === "connected") {
          setStatus("connected");
        }
      };
      peersRef.current.set(peerId, pc);
      return pc;
    },
    [myId, myName, removePeer, send]
  );
  const flushIce = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      const candidates = iceRef.current.get(peerId);
      if (!candidates) {
        return;
      }
      iceRef.current.delete(peerId);
      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
    },
    []
  );
  const createOffer = useCallback(
    async (peerId: string) => {
      let pc = peersRef.current.get(peerId);
      if (
        pc &&
        pc.connectionState !== "closed" &&
        pc.signalingState !== "stable"
      ) {
        return;
      }
      if (!pc) {
        pc = createPeer(peerId);
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({
          type: "signal",
          to: peerId,
          from: myId,
          name: myName,
          data: { sdp: { type: offer.type, sdp: offer.sdp } },
        });
      } catch {
        removePeer(peerId);
      }
    },
    [createPeer, myId, myName, removePeer, send]
  );
  const handleSignal = useCallback(
    async (peerId: string, data: SignalMessage["data"]) => {
      if (leavingRef.current || !data) {
        return;
      }
      let pc = peersRef.current.get(peerId);
      if (!pc || pc.connectionState === "closed") {
        pc = createPeer(peerId);
      }
      if (data.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushIce(peerId, pc);
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send({
              type: "signal",
              to: peerId,
              from: myId,
              name: myName,
              data: { sdp: { type: answer.type, sdp: answer.sdp } },
            });
          }
        } catch {
          removePeer(peerId);
        }
      }
      if (data.candidate) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch {}
        } else {
          const candidates = iceRef.current.get(peerId) || [];
          candidates.push(data.candidate);
          iceRef.current.set(peerId, candidates);
        }
      }
    },
    [createPeer, flushIce, myId, myName, removePeer, send]
  );
  const finishLeave = useCallback(() => {
    if (onLeave) {
      onLeave();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  }, [onLeave]);
  const leave = useCallback(() => {
    if (leavingRef.current) {
      return;
    }
    leavingRef.current = true;
    setLeaving(true);
    send({ type: "leave", room, peerId: myId, name: myName });
    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    }
    for (const pc of peersRef.current.values()) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    peersRef.current.clear();
    namesRef.current.clear();
    iceRef.current.clear();
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;
    setLocalStream(null);
    setPeers([]);
    finishLeave();
  }, [finishLeave, myId, myName, room, send]);
  const toggleAudio = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks() || [];
    if (!tracks.length) {
      return;
    }
    const nextMuted = !audioMuted;
    for (const track of tracks) {
      track.enabled = !nextMuted;
    }
    setAudioMuted(nextMuted);
  }, [audioMuted]);
  const toggleVideo = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks() || [];
    if (!tracks.length) {
      return;
    }
    const nextOff = !videoOff;
    for (const track of tracks) {
      track.enabled = !nextOff;
    }
    setVideoOff(nextOff);
  }, [videoOff]);
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const start = async () => {
      setStatus("starting");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        if (!mountedRef.current) {
          return;
        }
        setStatus("error");
        setError("Camera or microphone permission was denied.");
        return;
      }
      if (cancelled || !mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setLocalStream(stream);
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        if (cancelled || leavingRef.current || wsRef.current !== ws) {
          return;
        }
        ws.send(
          JSON.stringify({ type: "join", room, peerId: myId, name: myName })
        );
      };
      ws.onmessage = async (event) => {
        if (cancelled || leavingRef.current || wsRef.current !== ws) {
          return;
        }
        let message: SignalMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.type === "existing-peers") {
          const existing = Array.isArray(message.data) ? message.data : [];
          for (const peer of existing as Array<{ id: string; name: string }>) {
            if (!peer.id || peer.id === myId) {
              continue;
            }
            namesRef.current.set(peer.id, peer.name || "Guest");
            await createOffer(peer.id);
          }
          return;
        }
        if (message.type === "peer-joined") {
          if (!message.from || message.from === myId) {
            return;
          }
          namesRef.current.set(message.from, message.name || "Guest");
          return;
        }
        if (message.type === "signal") {
          if (!message.from || message.from === myId) {
            return;
          }
          if (message.name) {
            namesRef.current.set(message.from, message.name);
          }
          await handleSignal(message.from, message.data);
          return;
        }
        if (message.type === "peer-left") {
          if (message.from) {
            removePeer(message.from);
          }
        }
      };
      ws.onerror = () => {
        if (!cancelled && !leavingRef.current && mountedRef.current) {
          setStatus("error");
          setError("Unable to connect to the call server.");
        }
      };
      ws.onclose = () => {
        if (!cancelled && !leavingRef.current && mountedRef.current) {
          setStatus("error");
          setError("Connection to the call server was lost.");
        }
      };
    };
    start();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      const ws = wsRef.current;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
      for (const pc of peersRef.current.values()) {
        pc.close();
      }
      peersRef.current.clear();
      namesRef.current.clear();
      iceRef.current.clear();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [createOffer, handleSignal, myId, myName, removePeer, room]);
  const total = peers.length + 1;
  const spotlightPeer = spotlight
    ? peers.find((peer) => peer.id === spotlight) || null
    : null;
  const gridColumns =
    total === 1
      ? "1fr"
      : total === 2
      ? "1fr 1fr"
      : total <= 4
      ? "1fr 1fr"
      : total <= 6
      ? "1fr 1fr 1fr"
      : "repeat(4,1fr)";
  return (
    <>
      {" "}
      <style>{` @keyframes vcFade { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes vcPulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } } .vc-root { position: fixed; inset: 0; z-index: 9999; overflow: hidden; background: ${C.bg}; font-family: Inter,system-ui,sans-serif; color: ${C.text}; } .vc-tile { animation: vcFade .25s ease both; } .vc-control-bar { transition: opacity .25s ease, transform .25s ease; } .vc-control-bar.hidden { opacity: 0; transform: translate(-50%,20px); pointer-events: none; } .vc-dot { animation: vcPulse 1.6s ease-in-out infinite; } .vc-dot:nth-child(2) { animation-delay: .2s; } .vc-dot:nth-child(3) { animation-delay: .4s; } @media (max-width: 600px) { .vc-controls { gap: 6px !important; padding: 8px 10px !important; } .vc-controls button { min-width: 58px !important; height: 56px !important; padding: 8px 10px !important; } } `}</style>{" "}
      <div
        className="vc-root"
        onMouseMove={showControls}
        onClick={showControls}
      >
        {" "}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 80% 60% at 15% 10%,rgba(79,142,247,.07),transparent 60%),radial-gradient(ellipse 70% 50% at 90% 90%,rgba(142,79,247,.06),transparent 60%)",
          }}
        />{" "}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 20,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 12px",
            borderRadius: 14,
            background: C.glass,
            border: `1px solid ${C.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          {" "}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background:
                status === "error"
                  ? C.danger
                  : status === "connected"
                  ? C.success
                  : C.accent,
              boxShadow:
                status === "error"
                  ? `0 0 10px ${C.danger}`
                  : `0 0 10px ${status === "connected" ? C.success : C.accent}`,
            }}
          />{" "}
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            {" "}
            {room}{" "}
          </span>{" "}
        </div>{" "}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            zIndex: 20,
            padding: "8px 12px",
            borderRadius: 14,
            background: C.glass,
            border: `1px solid ${C.border}`,
            backdropFilter: "blur(20px)",
            color: C.muted,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {" "}
          {total} {total === 1 ? "person" : "people"}{" "}
        </div>{" "}
        {status === "error" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {" "}
            <div
              style={{
                width: "min(420px,100%)",
                padding: 30,
                borderRadius: 24,
                background: C.glass,
                border: `1px solid ${C.border}`,
                backdropFilter: "blur(25px)",
                textAlign: "center",
              }}
            >
              {" "}
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: "0 auto 18px",
                  borderRadius: "50%",
                  background: "rgba(247,79,106,.14)",
                  color: C.danger,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {" "}
                <PhoneOffIcon size={23} />{" "}
              </div>{" "}
              <h2 style={{ fontSize: 19, marginBottom: 8, fontWeight: 800 }}>
                {" "}
                Call unavailable{" "}
              </h2>{" "}
              <p
                style={{
                  color: C.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginBottom: 22,
                }}
              >
                {" "}
                {error}{" "}
              </p>{" "}
              <button
                type="button"
                onClick={leave}
                style={{
                  border: 0,
                  borderRadius: 13,
                  padding: "11px 18px",
                  background: C.danger,
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {" "}
                Go back{" "}
              </button>{" "}
            </div>{" "}
          </div>
        ) : (
          <>
            {" "}
            {spotlightPeer ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  gap: 12,
                  padding: "62px 14px 100px",
                  zIndex: 1,
                }}
              >
                {" "}
                <div className="vc-tile" style={{ flex: 1, minWidth: 0 }}>
                  {" "}
                  <Tile
                    stream={spotlightPeer.stream}
                    name={spotlightPeer.name}
                    id={spotlightPeer.id}
                    spotlight
                    onClick={() => setSpotlight(null)}
                  />{" "}
                </div>{" "}
                <div
                  style={{
                    width: 170,
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    overflowY: "auto",
                  }}
                >
                  {" "}
                  <div style={{ height: 125, flexShrink: 0 }}>
                    {" "}
                    <Tile
                      stream={localStream}
                      name={myName}
                      id={myId}
                      local
                      muted={audioMuted}
                      videoOff={videoOff}
                      onClick={() => setSpotlight(null)}
                    />{" "}
                  </div>{" "}
                  {peers
                    .filter((peer) => peer.id !== spotlight)
                    .map((peer) => (
                      <div key={peer.id} style={{ height: 125, flexShrink: 0 }}>
                        {" "}
                        <Tile
                          stream={peer.stream}
                          name={peer.name}
                          id={peer.id}
                          onClick={() => setSpotlight(peer.id)}
                        />{" "}
                      </div>
                    ))}{" "}
                </div>{" "}
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  gridTemplateColumns: gridColumns,
                  gridAutoRows: total <= 2 ? "1fr" : undefined,
                  gap: 10,
                  padding: "62px 14px 100px",
                  zIndex: 1,
                }}
              >
                {" "}
                <div className="vc-tile">
                  {" "}
                  <Tile
                    stream={localStream}
                    name={myName}
                    id={myId}
                    local
                    muted={audioMuted}
                    videoOff={videoOff}
                  />{" "}
                </div>{" "}
                {peers.map((peer) => (
                  <div key={peer.id} className="vc-tile">
                    {" "}
                    <Tile
                      stream={peer.stream}
                      name={peer.name}
                      id={peer.id}
                      onClick={() => setSpotlight(peer.id)}
                    />{" "}
                  </div>
                ))}{" "}
              </div>
            )}{" "}
            {peers.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 155,
                  transform: "translateX(-50%)",
                  zIndex: 3,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                {" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 7,
                    marginBottom: 12,
                  }}
                >
                  {" "}
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="vc-dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: C.accent,
                      }}
                    />
                  ))}{" "}
                </div>{" "}
                <div
                  style={{
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  {" "}
                  Waiting for others{" "}
                </div>{" "}
              </div>
            )}{" "}
            <div
              className={`vc-control-bar ${controlsVisible ? "" : "hidden"}`}
              style={{
                position: "absolute",
                left: "50%",
                bottom: 22,
                zIndex: 30,
              }}
            >
              {" "}
              <div
                className="vc-controls"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 23,
                  background: C.glass,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 15px 50px rgba(0,0,0,.5)",
                  backdropFilter: "blur(25px)",
                }}
              >
                {" "}
                <ControlButton
                  icon={audioMuted ? <MicOffIcon /> : <MicIcon />}
                  label={audioMuted ? "Unmute" : "Mute"}
                  active={!audioMuted}
                  disabled={leaving}
                  onClick={toggleAudio}
                />{" "}
                <ControlButton
                  icon={videoOff ? <CameraOffIcon /> : <CameraIcon />}
                  label={videoOff ? "Camera" : "Camera"}
                  active={!videoOff}
                  disabled={leaving}
                  onClick={toggleVideo}
                />{" "}
                <div
                  style={{
                    width: 1,
                    height: 35,
                    background: C.border,
                    margin: "0 2px",
                  }}
                />{" "}
                <ControlButton
                  icon={<PhoneOffIcon />}
                  label={leaving ? "Leaving" : "Leave"}
                  danger
                  disabled={leaving}
                  onClick={leave}
                />{" "}
              </div>{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>{" "}
    </>
  );
};
export default VideoCall;
