"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { slides } from "./slides";
import styles from "./viewer.module.css";

const assets = "/presentation-assets";
const clip = assets + "/tokyo-pet-showroom.mp4";
const clipIndex = 4;
const stages = ["Animal record", "Portal", "CRM", "Warehouse", "Reports", "Forecast"] as const;

function slideImage(index: number) {
  return assets + "/slide-" + String(index + 1).padStart(2, "0") + ".jpg";
}

function hashIndex() {
  const value = /^#([1-9]\d*)$/.exec(window.location.hash);
  const index = value ? Number(value[1]) - 1 : 0;
  return index >= 0 && index < slides.length ? index : 0;
}

function clipStageAt(seconds: number) {
  if (seconds < 5) return 0;
  if (seconds < 7.5) return 1;
  if (seconds < 10) return 2;
  if (seconds < 14.5) return 3;
  if (seconds < 20.5) return 4;
  return 5;
}

export function PresentationViewer() {
  const [view, setView] = useState({ index: 0, previous: null as number | null });
  const [failedVideo, setFailedVideo] = useState(false);
  const [clipStage, setClipStage] = useState<number | null>(null);
  const [focusView, setFocusView] = useState(false);
  const slide = slides[view.index];
  const activeStage = view.index === clipIndex ? clipStage ?? slide.stage : slide.stage;

  useEffect(() => {
    const fromHash = () => {
      const index = hashIndex();
      setView(current => current.index === index ? current : { index, previous: null });
      setFailedVideo(false);
      setClipStage(null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    for (const neighbor of [view.index - 1, view.index + 1]) {
      if (neighbor < 0 || neighbor >= slides.length) continue;
      const preview = new Image();
      preview.src = slideImage(neighbor);
    }
  }, [view.index]);

  const go = useCallback((index: number) => {
    if (index < 0 || index >= slides.length || index === view.index) return;
    setFailedVideo(false);
    setClipStage(null);
    setView({ index, previous: view.index });
    window.history.replaceState(window.history.state, "", "#" + (index + 1));
  }, [view.index]);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement &&
          event.target.closest("video, input, textarea, select, [contenteditable]")) return;
      const destinations: Record<string, number> = {
        ArrowLeft: view.index - 1, ArrowRight: view.index + 1, Home: 0, End: slides.length - 1,
      };
      const target = destinations[event.key];
      if (target === undefined) return;
      event.preventDefault();
      go(target);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [go, view.index]);

  return (
    <div className={styles.page} data-focus-view={focusView}>
      <header className={styles.top}>
        <a className={styles.brand} href="/">Tokyo Pet OS</a>
        <span className={styles.topLabel}>Business presentation</span>
        <a className={styles.demoLink} href="/data-platform">Interactive demo</a>
      </header>
      <main className={styles.main}>
        <h1 className={styles.hidden}>Tokyo Pet OS business presentation</h1>
        <section className={styles.story} aria-label="Mugi’s data flow">
          <div className={styles.handoff} key={view.index}>
            <div>
              <span className={styles.label}>{slide.label}</span>
              <p>{slide.handoff}</p>
            </div>
            <span className={styles.record}>Mugi <span>AN-088</span></span>
          </div>
          <ol className={styles.flow}
            style={{ "--stage-position": ((activeStage + 0.5) * 100 / stages.length) + "%" } as CSSProperties}>
            {stages.map((name, index) => (
              <li key={name} data-reached={index <= activeStage} aria-current={index === activeStage ? "step" : undefined}>{name}</li>
            ))}
          </ol>
        </section>

        <section className={styles.deck} aria-label="Slides">
          <div className={styles.stage} aria-label={slide.title} data-slide={view.index + 1}>
            {view.previous !== null && (
              <img key={view.previous} src={slideImage(view.previous)} className={styles.previous} alt="" aria-hidden="true" />
            )}
            <div className={styles.current} key={view.index} data-transition={view.previous !== null}
              data-direction={view.previous !== null && view.index < view.previous ? "back" : "forward"}>
              {view.index === clipIndex ? (
                <>
                  <video src={clip} poster={slideImage(clipIndex)} controls playsInline preload="none"
                    width={1280} height={720} aria-label="25-second Blender cutaway"
                    onPlay={event => setClipStage(clipStageAt(event.currentTarget.currentTime))}
                    onTimeUpdate={event => setClipStage(clipStageAt(event.currentTarget.currentTime))}
                    onError={() => setFailedVideo(true)}>
                    <a href={clip}>Open the Blender clip</a>
                  </video>
                  {failedVideo && (
                    <div className={styles.videoError} role="status">
                      Playback failed. <a href={clip}>Open the video file</a>.
                    </div>
                  )}
                </>
              ) : (
                <img src={slideImage(view.index)} width={1280} height={720}
                  alt={slide.title + ". Slide text is available below."} />
              )}
            </div>
          </div>

          <nav className={styles.controls} aria-label="Presentation controls">
            <button type="button" onClick={() => go(view.index - 1)} disabled={view.index === 0}>Previous</button>
            <span className={styles.counter} aria-live="polite" aria-atomic="true">
              <strong>{view.index + 1} / {slides.length}</strong> <span>{slide.title}</span>
            </span>
            <button type="button" className={styles.next} onClick={() => go(view.index + 1)}
              disabled={view.index === slides.length - 1}>Next</button>
            <button type="button" onClick={() => setFocusView(current => !current)} aria-pressed={focusView}>
              {focusView ? "Exit focus view" : "Focus view"}
            </button>
          </nav>
          {view.index === slides.length - 1 && <a className={styles.finish} href="/data-platform">Open the interactive demo</a>}
          <details className={styles.text} key={view.index}>
            <summary>{view.index === clipIndex ? "Read the clip transcript" : "Read slide text"}</summary>
            <div>{slide.text.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            {view.index === clipIndex && <a href={clip}>Open the MP4</a>}
          </details>
        </section>
      </main>
    </div>
  );
}
