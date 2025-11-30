import { useRef, useState } from "react";

const App = () => {
  const [Rotation, setRotation] = useState(0); // committed rotation (multiples of 180)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rotatingElRef = useRef<HTMLDivElement | null>(null);

  // transient refs (no rerenders)
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  const getWidth = () => containerRef.current?.getBoundingClientRect().width || 1;

  // compute rotate (degrees) from start & current
  const computeRotate = (startX: number, currentX: number) => {
    const diff = startX - currentX; // same sign as your original code
    const width = getWidth();
    const percentage = diff / width;
    return -percentage * 180;
  };

  const applyLiveRotate = (deg: number) => {
    if (!rotatingElRef.current) return;
    // write transform directly for smoothness
    rotatingElRef.current.style.transform = `rotateY(${Rotation + deg}deg)`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // MOBILE ONLY: ignore non-touch pointers
    if (e.pointerType !== "touch") return;

    // stop page from also handling touch (optional but prevents scroll while dragging)
    e.preventDefault?.();

    draggingRef.current = true;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    pointerIdRef.current = e.pointerId;

    // ensure immediate visual reflects current Rotation (remove transition while dragging)
    if (rotatingElRef.current) {
      rotatingElRef.current.style.transition = "none";
      rotatingElRef.current.style.transform = `rotateY(${Rotation}deg)`;
    }

    // capture pointer so we keep receiving moves even if finger drifts
    const el = e.currentTarget as Element;
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore if not supported
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // only react if dragging started by touch
    if (!draggingRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    currentXRef.current = e.clientX;
    const deg = computeRotate(startXRef.current, currentXRef.current);
    applyLiveRotate(deg);
  };

  const endDrag = () => {
    if (!rotatingElRef.current) return;

    // restore transition for snap animation
    rotatingElRef.current.style.transition = "transform 350ms ease";

    const finalDeg = computeRotate(startXRef.current, currentXRef.current);
    // thresholds as in your original logic:
    if (finalDeg > 40) {
      setRotation((prev) => prev + 180);
      // final visual will be handled by React state update (next render)
    } else if (finalDeg < -40) {
      setRotation((prev) => prev - 180);
    } else {
      // snap back to current Rotation (no change)
      rotatingElRef.current.style.transform = `rotateY(${Rotation}deg)`;
    }

    // cleanup
    draggingRef.current = false;
    pointerIdRef.current = null;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // ensure we only end if it was the same pointer (touch)
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    // release capture
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      //
    }

    endDrag();
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    // snap back
    if (rotatingElRef.current) {
      rotatingElRef.current.style.transition = "transform 350ms ease";
      rotatingElRef.current.style.transform = `rotateY(${Rotation}deg)`;
    }
    draggingRef.current = false;
    pointerIdRef.current = null;
  };

  // when Rotation state changes (committed), ensure element matches it
  // this keeps DOM consistent after setRotation triggers a render
  // (React will re-run render and style prop would update, but we manage transform directly)
  // We'll set transform here to ensure exact value after state commit.
  // NOTE: this effect is intentionally minimal — React render will still run.
  // If you want, you can move the transform into the JSX style prop instead.
  // For simplicity we sync DOM immediately:
  // (no useEffect to avoid adding more code — transform set in JSX below using Rotation)

  return (
    <div className="w-full h-svh flex flex-col bg-[#f2f2f2]">
      <h1 className="text-[7vw] mukta-bold m-[3%] ml-[5%]">Setram Card</h1>

      <div
        className="w-full h-full"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        // prevent built-in touch actions (optional) so thumb drag isn't interpreted as scroll
        // you can tweak to "pan-y" if you still want vertical scroll
        style={{ touchAction: "none" }}
      >
        <div className="perspective-distant p-[5%] mt-[-7%] origin-center transform-3d h-full">
          <div
            className="relative transform-3d card"
            ref={rotatingElRef}
            // keep a baseline transform so state-driven rotation is reflected initially
            style={{ transform: `rotateY(${Rotation}deg)` }}
          >
            <img
              className="absolute translate-z-[-0.1vw] rotate-y-180 rounded-[5vw]"
              src="../public/back.jpg"
              alt=""
              draggable={false}
            />
            <img className="absolute rounded-[5vw]" src="../public/front.png" alt="" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
