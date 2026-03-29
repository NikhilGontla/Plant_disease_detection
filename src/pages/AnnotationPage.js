import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveAnnotationEndpoint } from "../services/api";

export default function AnnotationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageKey, setImageKey] = useState("");
  const [prediction, setPrediction] = useState({ crop: "", disease: "", boundingBoxes: [] });
  const [boxes, setBoxes] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stateKey = location.state?.key;
    const statePrediction = location.state?.prediction;
    if (stateKey) {
      setImageKey(stateKey);
      localStorage.setItem("plantdisease_image", JSON.stringify({ key: stateKey }));
    }
    if (statePrediction) {
      setPrediction(statePrediction);
      setBoxes(statePrediction.boundingBoxes?.map((b, i) => ({ id: `box-${i + 1}`, ...b, label: `${statePrediction.disease}` })) || []);
    }
    if (!stateKey) {
      const saved = JSON.parse(localStorage.getItem("plantdisease_image") || "null");
      if (saved?.key) setImageKey(saved.key);
    }
  }, [location.state]);

  const addNewBox = () => {
    setBoxes((prev) => [...prev, { id: `box-${prev.length + 1}`, label: "unknown", x: 0.1, y: 0.1, width: 0.2, height: 0.2 }]);
  };

  const updateBox = (id, key, value) => {
    setBoxes((prev) => prev.map((box) => (box.id === id ? { ...box, [key]: value } : box)));
  };

  const deleteBox = (id) => setBoxes((prev) => prev.filter((b) => b.id !== id));

  const onSave = async () => {
    if (!imageKey || boxes.length === 0) {
      setError("Image key or boxes missing.");
      return;
    }
    setIsSaving(true);
    setError("");
    setStatus("Saving annotations...");

    try {
      const user = "currentUser";
      const payload = { imageKey, annotations: boxes, userId: user };
      await saveAnnotationEndpoint(payload);
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
      <h1 className="text-2xl font-bold mb-3">Annotation Editor</h1>
      <p className="text-sm text-slate-500 mb-3">Edit labels and bounding boxes, then save annotations.</p>
      {error && <p className="text-red-600">{error}</p>}
      {status && <p className="text-blue-600">{status}</p>}

      <div className="mb-4 flex items-center gap-3">
        <button onClick={addNewBox} className="px-3 py-2 bg-emerald-500 text-white rounded">Add Box</button>
        <button onClick={onSave} className="px-3 py-2 bg-blue-600 text-white rounded" disabled={isSaving}>{isSaving ? "Saving..." : "Save Annotation"}</button>
      </div>

      <div className="space-y-2">
        {boxes.length === 0 ? (
          <p className="text-slate-600">No boxes yet. Click 'Add Box'.</p>
        ) : (
          boxes.map((box) => (
            <div key={box.id} className="border p-3 rounded bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <strong>{box.id}</strong>
                <button onClick={() => deleteBox(box.id)} className="text-red-600">Delete</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">Label <input className="w-full border rounded px-2" value={box.label} onChange={(e) => updateBox(box.id, "label", e.target.value)} /></label>
                <label className="text-sm">x <input className="w-full border rounded px-2" type="number" min="0" max="1" step="0.01" value={box.x} onChange={(e) => updateBox(box.id, "x", parseFloat(e.target.value))} /></label>
                <label className="text-sm">y <input className="w-full border rounded px-2" type="number" min="0" max="1" step="0.01" value={box.y} onChange={(e) => updateBox(box.id, "y", parseFloat(e.target.value))} /></label>
                <label className="text-sm">width <input className="w-full border rounded px-2" type="number" min="0" max="1" step="0.01" value={box.width} onChange={(e) => updateBox(box.id, "width", parseFloat(e.target.value))} /></label>
                <label className="text-sm">height <input className="w-full border rounded px-2" type="number" min="0" max="1" step="0.01" value={box.height} onChange={(e) => updateBox(box.id, "height", parseFloat(e.target.value))} /></label>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={() => navigate("/prediction")} className="mt-4 text-slate-600 underline">Back to prediction</button>
    </div>
  );
}
