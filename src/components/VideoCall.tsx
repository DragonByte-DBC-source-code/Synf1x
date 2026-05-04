import React, { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../firebase/config"; // Adjust path if needed

// ─── Types ────────────────────────────────────────────────────────────────────

type WSMsg = {
  type: string;
  from?: string;
  to?: string;
  name?: string;
  data?: any;
};

type RemotePeer = {
  id: string;
  stream: MediaStream;
  name: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

const WS_URL = "ws://localhost:8080"; // Use wss:// in production

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoomFromPath(): string {
  return window.location.pathname.replace(/\//g, "").toLowerCase() || "room";
}

function getUserName(): string {
  // Replace with auth.currentUser?.displayName if Firebase is present
  return auth?.currentUser?.displayName || "Guest";
}

// ─── VideoTile ────────────────────────────────────────────────────────────────

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  muted?: boolean;
  audioMuted?: boolean;
  videoOff?: boolean;
  isSpotlight?: boolean;
  onClick?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  isLocal = false,
  muted = false,
  audioMuted = false,
  videoOff = false,
  isSpotlight = false,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: "#1a1a2e",
        borderRadius: isSpotlight ? "12px" : "8px",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        border: isSpotlight ? "2px solid #2563eb" : "1px solid #2a2a3e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Avatar fallback when video is off */}
      {videoOff && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f0f23",
          }}
        >
          <div
            style={{
              width: isSpotlight ? 96 : 48,
              height: isSpotlight ? 96 : 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isSpotlight ? 36 : 18,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {initials}
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: videoOff ? "none" : "block",
          transform: isLocal ? "scaleX(-1)" : "none", // mirror local feed
        }}
      />

      {/* Name bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "6px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {audioMuted && <span style={{ fontSize: 12 }}>🔇</span>}
        <span
          style={{
            color: "#fff",
            fontSize: isSpotlight ? 14 : 11,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          {name}
          {isLocal && " (You)"}
        </span>
      </div>

      {/* Spotlight indicator */}
      {isSpotlight && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#2563eb",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 10,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          SPOTLIGHT
        </div>
      )}
    </div>
  );
};

// ─── ControlButton ────────────────────────────────────────────────────────────

interface ControlBtnProps {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

const ControlBtn: React.FC<ControlBtnProps> = ({
  icon,
  label,
  active = true,
  danger = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={label}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      background: danger ? "#dc2626" : active ? "#2a2a3e" : "#3f3f5a",
      border: "none",
      borderRadius: 10,
      padding: "10px 16px",
      cursor: "pointer",
      color: active ? "#fff" : "#ef4444",
      transition: "all 0.15s ease",
      minWidth: 64,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
    }}
  >
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const VideoCall: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcMap = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerNames = useRef<Map<string, string>>(new Map()); // <-- FIX: Ref to hold latest names safely
  const iceCandidateBuffer = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  );
  const streamRef = useRef<MediaStream | null>(null);

  const myId = useRef<string>(crypto.randomUUID()).current;
  const myName = useRef<string>(getUserName()).current;
  const room = useRef<string>(getRoomFromPath()).current;

  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [spotlightId, setSpotlightId] = useState<string | null>(null); // null = local
  const [connected, setConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  // ── Media helpers ──────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setAudioMuted((m) => !m);
  }, []);

  const toggleVideo = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setVideoOff((v) => !v);
  }, []);

  const leaveCall = useCallback(() => {
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcMap.current.forEach((pc) => pc.close());
    window.location.reload();
  }, []);

  // ── Remove peer ────────────────────────────────────────────────────────────

  const removePeer = useCallback((peerId: string) => {
    pcMap.current.get(peerId)?.close();
    pcMap.current.delete(peerId);
    iceCandidateBuffer.current.delete(peerId);
    peerNames.current.delete(peerId);

    // FIX: Functional state update
    setRemotePeers((prev) => {
      const next = prev.filter((p) => p.id !== peerId);
      setParticipantCount(next.length + 1);
      return next;
    });

    setSpotlightId((id) => (id === peerId ? null : id));
  }, []);

  // ── PeerConnection factory ─────────────────────────────────────────────────

  const createPC = useCallback(
    (peerId: string, peerName: string): RTCPeerConnection => {
      peerNames.current.set(peerId, peerName); // Store name immediately

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      streamRef.current
        ?.getTracks()
        .forEach((track) => pc.addTrack(track, streamRef.current!));

      // Trickle ICE
      pc.onicecandidate = (e) => {
        if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "signal",
              to: peerId,
              from: myId,
              name: myName, // Include our name
              data: { candidate: e.candidate.toJSON() },
            })
          );
        }
      };

      // Remote stream
      pc.ontrack = (e) => {
        const stream = e.streams[0];
        if (!stream) return;

        // FIX: Use functional update to avoid stale state closures
        setRemotePeers((prev) => {
          const existing = prev.find((p) => p.id === peerId);
          if (existing) {
            return prev.map((p) => (p.id === peerId ? { ...p, stream } : p));
          }
          return [
            ...prev,
            {
              id: peerId,
              stream,
              name: peerNames.current.get(peerId) || "Guest",
            },
          ];
        });
        setParticipantCount((n) => pcMap.current.size + 1);
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          removePeer(peerId);
        }
      };

      pcMap.current.set(peerId, pc);
      return pc;
    },
    [myId, myName, removePeer]
  );

  // ── Drain buffered ICE candidates ─────────────────────────────────────────

  const drainCandidates = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      const buffered = iceCandidateBuffer.current.get(peerId) ?? [];
      for (const c of buffered) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {
          // ignore stale candidates
        }
      }
      iceCandidateBuffer.current.delete(peerId);
    },
    []
  );

  // ── Offer / Answer ─────────────────────────────────────────────────────────

  const createOffer = useCallback(
    async (peerId: string, peerName: string) => {
      if (pcMap.current.has(peerId)) return;
      const pc = createPC(peerId, peerName);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(
        JSON.stringify({
          type: "signal",
          to: peerId,
          from: myId,
          name: myName, // Include our name
          data: { sdp: { type: offer.type, sdp: offer.sdp } },
        })
      );
    },
    [createPC, myId, myName]
  );

  // ── Signal handler ─────────────────────────────────────────────────────────

  const handleSignal = useCallback(
    async (peerId: string, peerName: string, data: any) => {
      let pc = pcMap.current.get(peerId);

      if (!pc) {
        pc = createPC(peerId, peerName);
      }

      if (data.sdp) {
        const desc = new RTCSessionDescription(data.sdp);
        await pc.setRemoteDescription(desc);

        // Drain any buffered candidates now that remote desc is set
        await drainCandidates(peerId, pc);

        if (desc.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsRef.current?.send(
            JSON.stringify({
              type: "signal",
              to: peerId,
              from: myId,
              name: myName, // Include our name
              data: { sdp: { type: answer.type, sdp: answer.sdp } },
            })
          );
        }
      }

      if (data.candidate) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch {
            // ignore
          }
        } else {
          // Buffer until remote description is set
          const buf = iceCandidateBuffer.current.get(peerId) ?? [];
          buf.push(data.candidate);
          iceCandidateBuffer.current.set(peerId, buf);
        }
      }
    },
    [createPC, drainCandidates, myId, myName]
  );

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "join",
            peerId: myId,
            name: myName,
            room,
          })
        );
        setConnected(true);
      };

      ws.onclose = () => setConnected(false);

      ws.onmessage = async (ev) => {
        const msg: WSMsg = JSON.parse(ev.data);
        switch (msg.type) {
          case "existing-peers": {
            const peers: { id: string; name: string }[] = msg.data ?? [];
            for (const peer of peers) {
              if (peer.id !== myId) {
                await createOffer(peer.id, peer.name ?? peer.id);
              }
            }
            break;
          }
          case "peer-joined": {
            // A new peer joined, they will send an offer soon. Record their name.
            if (msg.from) {
              peerNames.current.set(msg.from, msg.name || "Guest");
            }
            break;
          }
          case "signal": {
            if (msg.from && msg.data) {
              const peerName =
                msg.name || peerNames.current.get(msg.from) || "Remote";
              await handleSignal(msg.from, peerName, msg.data);
            }
            break;
          }
          case "peer-left": {
            if (msg.from) removePeer(msg.from);
            break;
          }
        }
      };
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcMap.current.forEach((pc) => pc.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Notice empty array is safe now!

  // ─── Layout logic ──────────────────────────────────────────────────────────

  const totalPeers = remotePeers.length + 1; // +1 for local

  // Determine spotlight peer
  const spotlightPeer =
    spotlightId === null
      ? null // local is spotlight
      : remotePeers.find((p) => p.id === spotlightId) ?? null;

  const showStripLayout = totalPeers > 2;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0d0d1a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
        userSelect: "none",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #1e1e38",
          background: "#0d0d1a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: connected ? "#22c55e" : "#ef4444",
              boxShadow: connected ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
            }}
          />
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "#e2e8f0",
          }}
        >
          Room: <span style={{ color: "#60a5fa" }}>{room}</span>
        </div>
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          👥 {participantCount} participant{participantCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Main video area ── */}
      <div
        style={{ flex: 1, display: "flex", gap: 8, padding: 12, minHeight: 0 }}
      >
        {showStripLayout ? (
          // Spotlight + strip layout (3+ participants)
          <>
            {/* Spotlight */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <VideoTile
                stream={
                  spotlightPeer ? spotlightPeer.stream : streamRef.current
                }
                name={spotlightPeer ? spotlightPeer.name : myName}
                isLocal={!spotlightPeer}
                muted={!spotlightPeer}
                audioMuted={!spotlightPeer && audioMuted}
                videoOff={!spotlightPeer && videoOff}
                isSpotlight
              />
            </div>

            {/* Right strip */}
            <div
              style={{
                width: 180,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              {/* Local tile in strip */}
              <div
                style={{ height: 130, flexShrink: 0 }}
                onClick={() => setSpotlightId(null)}
              >
                <VideoTile
                  stream={streamRef.current}
                  name={myName}
                  isLocal
                  muted
                  audioMuted={audioMuted}
                  videoOff={videoOff}
                  isSpotlight={spotlightId === null}
                  onClick={() => setSpotlightId(null)}
                />
              </div>

              {/* Remote tiles in strip */}
              {remotePeers.map((peer) => (
                <div key={peer.id} style={{ height: 130, flexShrink: 0 }}>
                  <VideoTile
                    stream={peer.stream}
                    name={peer.name}
                    isSpotlight={spotlightId === peer.id}
                    onClick={() => setSpotlightId(peer.id)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : totalPeers === 1 ? (
          // Solo — show self large
          <VideoTile
            stream={streamRef.current}
            name={myName}
            isLocal
            muted
            audioMuted={audioMuted}
            videoOff={videoOff}
          />
        ) : (
          // 2-person — side-by-side
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              width: "100%",
            }}
          >
            <VideoTile
              stream={streamRef.current}
              name={myName}
              isLocal
              muted
              audioMuted={audioMuted}
              videoOff={videoOff}
              onClick={() => setSpotlightId(null)}
            />
            {remotePeers.map((peer) => (
              <VideoTile
                key={peer.id}
                stream={peer.stream}
                name={peer.name}
                onClick={() => setSpotlightId(peer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Waiting overlay ── */}
      {remotePeers.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)",
              borderRadius: 16,
              padding: "24px 36px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #2563eb",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "#e2e8f0",
                fontWeight: 500,
              }}
            >
              Waiting for others to join…
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>
              Share this room link to invite participants
            </p>
          </div>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 20px",
          borderTop: "1px solid #1e1e38",
          background: "#0d0d1a",
          flexShrink: 0,
        }}
      >
        <ControlBtn
          icon={audioMuted ? "🔇" : "🎙️"}
          label={audioMuted ? "Unmute" : "Mute"}
          active={!audioMuted}
          onClick={toggleAudio}
        />
        <ControlBtn
          icon={videoOff ? "📷" : "📹"}
          label={videoOff ? "Start Video" : "Stop Video"}
          active={!videoOff}
          onClick={toggleVideo}
        />
        <ControlBtn
          icon="💬"
          label="Chat"
          onClick={() => {
            /* wire up chat panel */
          }}
        />
        <ControlBtn
          icon="👥"
          label="Participants"
          onClick={() => {
            /* wire up participants panel */
          }}
        />
        <ControlBtn
          icon="📤"
          label="Share"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
          }}
        />
        <ControlBtn icon="📵" label="Leave" danger onClick={leaveCall} />
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VideoCall;
