import React, { useRef, useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import ModelViewer from "./ModelViewer";
import FullScreenViewer from "./FullScreenViewer";
import { convertFloorPlanTo3D, parseFloorPlanData } from "./api";
import { build3DScene } from "./builder3D";

/* ===================== UPLOADER ===================== */

function Uploader({ onFiles }) {
  const inputRef = useRef(null);
  const [hover, setHover] = useState(false);

  const openFile = () => inputRef.current?.click();

  const handleFiles = (files) => {
    const arr = Array.from(files);
    onFiles?.(arr);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setHover(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  return (
    <div
      className={`uploader ${hover ? "hover" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      onClick={openFile}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.svg"
        className="visually-hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="uploader-icon" aria-hidden>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" />
          <polyline points="7 10 12 5 17 10" strokeWidth="1.5" />
          <line x1="12" y1="5" x2="12" y2="17" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="uploader-text">
        <strong>Upload your 2D floor plan</strong>
        <span>Click to browse or drag & drop files here (.png .jpg .svg .pdf)</span>
      </div>
    </div>
  );
}

/* ===================== DEMO MODAL ===================== */

// function DemoModal({ open, onClose }) {
//   const [show3d, setShow3d] = useState(false);

//   useEffect(() => {
//     if (open) setShow3d(false);
//   }, [open]);

//   if (!open) return null;

//   return (
//     <div className="demo-modal" role="dialog" aria-modal="true" onClick={onClose}>
//       <div className="demo-panel" onClick={(e) => e.stopPropagation()}>
//         <button className="demo-close" onClick={onClose} aria-label="Close demo">
//           ✕
//         </button>

//         <h3>Example: Upload → Convert</h3>

//         <div className="demo-stage demo-image-stage">
//           <div className="demo-uploader">
//             <div className="file-anim">
//               <div className="file-icon" />
//             </div>

//             <div className="progress">
//               <div className="bar" style={{ width: "90%" }} />
//             </div>
//           </div>

//           <div className="demo-views">
//             <div
//               className="demo-image"
//               role="button"
//               onClick={() => setShow3d((s) => !s)}
//             >
//               <img
//                 src={show3d ? "/3dmodel.jpg" : "/2dplanner.jpg"}
//                 alt={show3d ? "3D model" : "2D floor plan"}
//                 className="img static"
//               />
//             </div>
//           </div>
//         </div>

//         <p className="demo-caption">
//           Click the image to toggle between the 2D floor plan and the 3D model (static preview).
//         </p>
//       </div>
//     </div>
//   );
// }
function DemoModal({open, onClose}){
  const images = ['/2dplanner.jpg','/3dmodel.jpg']
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  // simulate loading progress on left; when complete start image loop
  React.useEffect(()=>{
    if(!open){
      setLoadingProgress(0)
      setLoadingComplete(false)
      setImgIndex(0)
      return
    }

    setLoadingProgress(0)
    setLoadingComplete(false)
    const duration = 1800 // ms
    const start = performance.now()
    let raf = null
    const step = (now)=>{
      const t = now - start
      const p = Math.min(100, (t / duration) * 100)
      setLoadingProgress(p)
      if(p < 100) raf = requestAnimationFrame(step)
      else setLoadingComplete(true)
    }
    raf = requestAnimationFrame(step)
    return ()=> raf && cancelAnimationFrame(raf)
  },[open])

  // start image loop only after loadingComplete
  React.useEffect(()=>{
    let id = null
    if(loadingComplete){
      setImgIndex(0)
      id = setInterval(()=> setImgIndex(i=> (i+1) % images.length), 1500)
    }
    return ()=> id && clearInterval(id)
  },[loadingComplete])

  if(!open) return null

  return (
    <div className="demo-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="demo-panel" onClick={(e)=>e.stopPropagation()}>
        <button className="demo-close" onClick={onClose} aria-label="Close demo">✕</button>
        <h3>Example: Upload → Convert</h3>
        <div className={`demo-stage demo-image-stage`}>
          <div className="demo-uploader">
            <div className={`file-anim`}>
              <div className="file-icon" />
            </div>
            <div className={`progress`} aria-hidden>
              <div className="bar" style={{width: `${loadingProgress}%`}} />
            </div>
          </div>

          <div className="demo-views">
            <div className="demo-image" aria-hidden>
              {images.map((src,i)=> (
                <img key={src} src={src} alt={i===0? '2D floor plan':'3D model'} className={i===imgIndex ? 'img active':'img'} />
              ))}
            </div>
          </div>
        </div>
        {/* <p className="demo-caption">The image loop starts after the left-side loading completes.</p> */}
      </div>
    </div>
  )
}

/* ===================== APP ===================== */

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [scene3DData, setScene3DData] = useState(null);
  const [rawApiData, setRawApiData] = useState(null);

  // Restore state from location when coming back from full-screen
  useEffect(() => {
    if (location.state?.scene3DData) {
      setScene3DData(location.state.scene3DData);
    }
    if (location.state?.rawApiData) {
      setRawApiData(location.state.rawApiData);
    }
  }, [location.state]);

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setConverting(true);
    setError(null);
    
    try {
      const imageFile = files[0];
      const apiResponse = await convertFloorPlanTo3D(imageFile);
      const parsed = parseFloorPlanData(apiResponse);
      const scene3D = build3DScene(parsed);
      
      setRawApiData(apiResponse);
      setScene3DData(scene3D);
    } catch (err) {
      setError(err.message || 'Failed to convert floor plan');
      console.error('Conversion error:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleFullScreen = () => {
    if (rawApiData) {
      navigate('/fullscreen', { state: { rawApiData } });
    }
  };

  return (
    <div className="app-root">
      <header className="hero">
        <div className="hero-badge">FloorPlan → 3D</div>
        <h1 className="hero-title">Convert 2D floor plans into interactive 3D models</h1>
        <p className="hero-sub">
          Upload a 2D floor plan and preview its 3D model.
        </p>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>How it works</h2>
          <ol className="steps">
            <li><div className="step-dot" /> Upload your floor plan</li>
            <li><div className="step-dot" /> Analyse layout & walls</li>
            <li><div className="step-dot" /> Generate a 3D model</li>
          </ol>
        </section>

        <section className="panel">
          <Uploader onFiles={setFiles} />

          <div className="preview">
            <h3>Selected files</h3>
            {files.length === 0 ? (
              <p className="muted">No files yet — try dragging an image here.</p>
            ) : (
              <ul>
                {files.map((f, i) => (
                  <li key={i} className="file-item">
                    <span>{f.name}</span>
                    <span className="file-size">{Math.round(f.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="actions">
            <button 
              className="primary" 
              disabled={files.length === 0 || converting}
              onClick={handleConvert}
            >
              {converting ? 'Converting...' : 'Start Conversion'}
            </button>
            <button className="ghost" onClick={() => setDemoOpen(true)}>
              See Example
            </button>
          </div>

          {error && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(255, 50, 50, 0.1)', 
              border: '1px solid rgba(255, 50, 50, 0.3)',
              borderRadius: '8px',
              color: '#ff6b6b'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>
      </main>

      <section style={{ marginTop: 20 }}>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>3D Preview</h2>
            {scene3DData && (
              <button 
                className="primary" 
                onClick={handleFullScreen}
                style={{ 
                  padding: '8px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                View Full Screen
              </button>
            )}
          </div>
          <p className="muted">
            {scene3DData 
              ? 'Interact with the converted model: rotate, pan and zoom.' 
              : 'Upload and convert a floor plan to see the 3D model here.'}
          </p>
          <ModelViewer scene3DData={scene3DData} />
        </div>
      </section>

      <footer className="footer">
        Tip: For best results use clean, top-down scans or exported CAD/SVG files.
      </footer>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/fullscreen" element={<FullScreenViewer />} />
    </Routes>
  );
}
