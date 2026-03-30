import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveAnnotationEndpoint } from "../services/api";

const BOX_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AnnotationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [imageKey, setImageKey] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [prediction, setPrediction] = useState({ crop: "", disease: "", boundingBoxes: [] });
  const [boxes, setBoxes] = useState([]);
  const [dragging, setDragging] = useState(null); // { id, startX, startY, origX, origY }
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stateKey = location.state?.key;
    const statePrediction = location.state?.prediction;
    const stateUrl = location.state?.url;
    if (stateKey) {
      setImageKey(stateKey);
      if (stateUrl) setImageUrl(stateUrl);
      localStorage.setItem("plantdisease_image", JSON.stringify({ key: stateKey, url: stateUrl }));
    } else {
      const saved = JSON.parse(localStorage.getItem("plantdisease_image") || "null");
      if (saved?.key) {
        setImageKey(saved.key);
        if (saved.url) setImageUrl(saved.url);
      }
    }
    if (statePrediction) {
      setPrediction(statePrediction);
      setBoxes(
        statePrediction.boundingBoxes?.map((b, i) => ({
          id: `box-${i + 1}`,
          label: statePrediction.disease || "unknown",
          ...b,
        })) || []
      );
    }
  }, [location.state]);

  // ── Drag handlers ──────────────────────────────────────────────────
  const handleBoxMouseDown = (e, box) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragging({
      id: box.id,
      startX: (e.clientX - rect.left) / rect.width,
      startY: (e.clientY - rect.top) / rect.height,
      origX: box.x,
      origY: box.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currX = (e.clientX - rect.left) / rect.width;
    const currY = (e.clientY - rect.top) / rect.height;
    const dx = currX - dragging.startX;
    const dy = currY - dragging.startY;
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== dragging.id) return b;
        return {
          ...b,
          x: Math.max(0, Math.min(1 - b.width, dragging.origX + dx)),
          y: Math.max(0, Math.min(1 - b.height, dragging.origY + dy)),
        };
      })
    );
  };

  const handleMouseUp = () => setDragging(null);

  // ── Box CRUD ───────────────────────────────────────────────────────
  const addNewBox = () => {
    const id = `box-${Date.now()}`;
    setBoxes((prev) => [...prev, { id, label: "unknown", x: 0.05, y: 0.05, width: 0.2, height: 0.2 }]);
  };

  const updateBox = (id, key, value) =>
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: value } : b)));

  const deleteBox = (id) => setBoxes((prev) => prev.filter((b) => b.id !== id));

  // ── Save ───────────────────────────────────────────────────────────
  const onSave = async () => {
    if (!imageKey || boxes.length === 0) {
      setError("Image key or boxes missing.");
      return;
    }
    setIsSaving(true);
    setError("");
    setStatus("Saving annotations...");
    try {
      await saveAnnotationEndpoint({ imageKey, annotations: boxes, userId: "currentUser" });
      setStatus("Saved successfully.");
      navigate("/welcome");
    } catch (e) {
      console.error(e);
      setError(e.message || "Unable to save annotation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Annotation Editor</h1>
      <p className="text-sm text-slate-500 mb-3">Drag boxes to reposition. Edit labels below. Click the image to add a new box.</p>
      {error && <p className="text-red-600 mb-1">{error}</p>}
      {status && <p className="text-blue-600 mb-1">{status}</p>}

      <div className="mb-4 flex items-center gap-3">
        <button onClick={addNewBox} className="px-3 py-2 bg-emerald-500 text-white rounded text-sm">+ Add Box</button>
        <button onClick={onSave} disabled={isSaving} className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
          {isSaving ? "Saving..." : "Save Annotation"}
        </button>
      </div>

      {/* ── Image canvas ───────────────────────────────────────────── */}
      {imageUrl && (
        <div
          ref={containerRef}
          className="relative inline-block w-full max-w-2xl border rounded overflow-hidden shadow mb-6 select-none"
          style={{ cursor: dragging ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img src={imageUrl} alt="Leaf" className="w-full h-auto block" draggable={false} />

          {boxes.map((box, idx) => {
            const color = BOX_COLORS[idx % BOX_COLORS.length];
            return (
              <div
                key={box.id}
                onMouseDown={(e) => handleBoxMouseDown(e, box)}
                style={{
                  position: "absolute",
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                  border: `2px solid ${color}`,
                  boxSizing: "border-box",
                  cursor: "grab",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -20,
                    left: 0,
                    background: color,
                    color: "#fff",
                    fontSize: 11,
                    padding: "1px 5px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {box.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Box list ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {boxes.length === 0 ? (
          <p className="text-slate-500 text-sm">No boxes yet. Click "+ Add Box".</p>
        ) : (
          boxes.map((box, idx) => {
            const color = BOX_COLORS[idx % BOX_COLORS.length];
            return (
              <div key={box.id} className="border p-3 rounded bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <span style={{ display: "inline-block", width: 12, height: 12, background: color, borderRadius: 2 }} />
                    {box.id}
                  </span>
                  <button onClick={() => deleteBox(box.id)} className="text-red-500 text-sm">Delete</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="col-span-2">Label
                    <input className="w-full border rounded px-2 py-1 mt-1" value={box.label}
                      onChange={(e) => updateBox(box.id, "label", e.target.value)} />
                  </label>
                  {["x", "y", "width", "height"].map((field) => (
                    <label key={field}>{field}
                      <input className="w-full border rounded px-2 py-1 mt-1" type="number"
                        min="0" max="1" step="0.01" value={box[field]}
                        onChange={(e) => updateBox(box.id, field, parseFloat(e.target.value))} />
                    </label>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button onClick={() => navigate("/prediction")} className="mt-4 text-slate-500 underline text-sm">
        Back to prediction
      </button>
    </div>
  );
}
