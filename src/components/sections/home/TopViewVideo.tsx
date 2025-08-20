import React, { useRef, useState } from 'react';

const TopViewVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="topview-video-wrapper">
      <video 
        ref={videoRef}
        className="topview-video" 
        src="/movie/mv_topview-01.mp4" 
        autoPlay 
        loop 
        muted={isMuted}
        playsInline
      />
      <div className="topview-overlay">
        <div className="topview-content">
          <h1 className="topview-title">すべてのペットと<br />飼い主様の安心を繋ぐ。</h1>
        </div>
      </div>
      <button
        className="video-sound-toggle"
        onClick={toggleMute}
        aria-label={isMuted ? '音をオンにする' : '音をオフにする'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isMuted ? (
            // ミュートアイコン（スラッシュ付き）
            <>
              <path
                d="M11 5L6 9H2V15H6L11 19V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 9L17 15M17 9L23 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            // 通常の音量アイコン
            <>
              <path
                d="M11 5L6 9H2V15H6L11 19V5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.07 4.93A10 10 0 0 1 19.07 19.07M15.54 8.46A5 5 0 0 1 15.54 15.54"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </button>
    </div>
  );
};

export default TopViewVideo;