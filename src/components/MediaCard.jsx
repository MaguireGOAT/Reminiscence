import { Maximize2, Minimize2, Music, Pause, Play, Repeat, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MEDIA_TYPE_LABELS } from "../data/starter.js";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

function ProgressBar({ value, max, onSeek }) {
  return (
    <div className="media-progress">
      <input
        type="range"
        min="0"
        max={max || 1}
        step="0.1"
        value={Math.min(value, max || 1)}
        onChange={(event) => onSeek?.(Number(event.target.value))}
        aria-label="播放進度"
      />
      <span>{formatTime(value)}</span>
    </div>
  );
}

function SongPlayer({ item, repeat }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || item.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [item, repeat]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="song-player">
      <audio ref={audioRef} src={item.mediaUrl} preload="metadata" />
      <div
        className="song-cover"
        style={
          item.coverUrl
            ? { backgroundImage: `url("${item.coverUrl}")` }
            : undefined
        }
      >
        <Music size={40} aria-hidden="true" />
      </div>
      <button type="button" className="play-toggle" onClick={toggle} aria-label={playing ? "暫停" : "播放"}>
        {playing ? <Pause size={26} aria-hidden="true" /> : <Play size={26} aria-hidden="true" />}
      </button>
      <ProgressBar
        value={time}
        max={duration}
        onSeek={(value) => {
          if (audioRef.current) audioRef.current.currentTime = value;
          setTime(value);
        }}
      />
      <div className="playback-meta">
        <span>{playing ? "正在播放" : "已暫停"}</span>
        {repeat ? (
          <span className="tag tag-jade">
            <Repeat size={12} aria-hidden="true" /> 重播
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubePlayer({ item }) {
  const id = getYouTubeId(item.mediaUrl);
  if (!id) return <p style={{ color: "#fff", padding: 24 }}>無效的 YouTube 連結</p>;
  return (
    <div className="youtube-embed">
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0`}
        title={item.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function VideoPlayer({ item }) {
  const isYT = getYouTubeId(item.mediaUrl);
  if (isYT) return <YouTubePlayer item={item} />;

  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setTime(video.currentTime);
    const onDuration = () => setDuration(video.duration || item.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setStarted(false);
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onDuration);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    return () => {
      video.pause();
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onDuration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [item]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setStarted(true);
    } else {
      video.pause();
    }
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={item.mediaUrl}
        poster={item.posterUrl}
        onClick={toggle}
        playsInline
        preload="metadata"
      />
      {!started ? (
        <button type="button" className="video-play-overlay" onClick={toggle} aria-label="播放影片">
          <Play size={42} aria-hidden="true" />
        </button>
      ) : null}
      <div className="video-controls">
        <button
          type="button"
          className="control-btn control-btn-compact"
          onClick={toggle}
          aria-label={playing ? "暫停" : "播放"}
        >
          {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
          <span>{playing ? "暫停" : "播放"}</span>
        </button>
        <ProgressBar
          value={time}
          max={duration}
          onSeek={(value) => {
            if (videoRef.current) videoRef.current.currentTime = value;
            setTime(value);
          }}
        />
        {!playing && time >= duration ? (
          <button type="button" className="control-btn control-btn-compact" onClick={toggle} aria-label="重播">
            <RotateCcw size={18} aria-hidden="true" />
            <span>重播</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function MediaCard({ item, mode = "detail", repeat = false, onOpenQuestions }) {
  const typeLabel = MEDIA_TYPE_LABELS[item.type];
  const hasQuestions =
    (item.questions?.recall?.length || 0) + (item.questions?.discussion?.length || 0) > 0;

  const stageRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onChange = () => {
      setFullscreen(
        document.fullscreenElement === el || document.webkitFullscreenElement === el
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
      const p = el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
      if (p?.catch) p.catch(() => {});
    } else {
      const p = document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      if (p?.catch) p.catch(() => {});
    }
  };

  return (
    <article className={`media-card media-card-${mode} media-card-${item.type}`}>
      <div className="media-card-stage" ref={stageRef}>
        {item.type === "photo" ? (
          <div className="photo-stage">
            <img src={item.mediaUrl} alt={item.title} />
          </div>
        ) : null}
        {item.type === "song" ? <SongPlayer item={item} repeat={repeat} /> : null}
        {item.type === "video" ? <VideoPlayer item={item} /> : null}
        {item.type === "text" ? (
          <div className="text-stage">
            <span className="tag tag-accent">{typeLabel}</span>
            <p className="text-card-caption">{item.caption}</p>
          </div>
        ) : null}
        {item.type === "photo" || item.type === "video" ? (
          <button
            type="button"
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "退出全螢幕" : "全螢幕"}
          >
            {fullscreen ? (
              <Minimize2 size={20} aria-hidden="true" />
            ) : (
              <Maximize2 size={20} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <div className="media-card-caption">
        <div>
          <span className="tag">{typeLabel}</span>
          <h2>{item.title}</h2>
          {item.caption ? <p className="media-card-copy">{item.caption}</p> : null}
          <div className="media-card-meta">
            {item.year ? <span>{item.year}</span> : null}
            {item.place ? <span>{item.place}</span> : null}
            {item.theme ? <span>{item.theme}</span> : null}
          </div>
          {item.sourceCredit ? (
            <p className="media-source">
              來源：{item.sourceCredit}
              {item.license ? <span className="tag tag-source">授權 {item.license}</span> : null}
              {item.sourceUrl ? (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  查看來源頁
                </a>
              ) : null}
            </p>
          ) : null}
          {item.notes ? <p className="media-notes">備註：{item.notes}</p> : null}
        </div>
        {onOpenQuestions && hasQuestions ? (
          <button type="button" className="btn btn-dark" onClick={onOpenQuestions}>
            問題
          </button>
        ) : null}
      </div>
    </article>
  );
}
