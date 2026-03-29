import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { predictEndpoint } from "../services/api";

export default function PredictionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageKey, setImageKey] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stateImage = location.state?.key;
    if (stateImage) {
      setImageKey(stateImage);
      localStorage.setItem("plantdisease_image", JSON.stringify({ key: stateImage }));
      return;
    }
    const saved = JSON.parse(localStorage.getItem("plantdisease_image") || "null");
    if (saved?.key) setImageKey(saved.key);
  }, [location.state]);

  useEffect(() => {
    if (!imageKey) {
      setError("No image selected. Go to welcome screen.");
      return;
    }

    const loadPrediction = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await predictEndpoint({ key: imageKey });
        setPrediction(result);
      } catch (e) {
        console.error(e);
        setError(e.message || "Prediction failed.");
      } finally {
        setLoading(false);
      }
    };

    loadPrediction();
  }, [imageKey]);

  const handleEdit = () => {
    navigate("/annotation", { state: { key: imageKey, prediction } });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Prediction Results</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading && <p className="text-blue-600">Loading predictions...</p>}
      {!loading && prediction && (
        <div className="space-y-4">
          <p>Image key: <code>{imageKey}</code></p>
          <p>Crop: <strong>{prediction.crop}</strong></p>
          <p>Disease: <strong>{prediction.disease}</strong></p>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Bounding Boxes</h3>
            {prediction.boundingBoxes && prediction.boundingBoxes.length > 0 ? (
              prediction.boundingBoxes.map((box, idx) => (
                <div key={idx} className="text-sm py-1">
                  #{idx + 1} x={box.x} y={box.y} w={box.width} h={box.height}
                </div>
              ))
            ) : (
              <p>No boxes returned.</p>
            )}
          </div>
          <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded">
            Edit Predictions / Save Annotation
          </button>
        </div>
      )}
      <button onClick={() => navigate("/welcome")} className="mt-5 text-sm text-slate-600 underline">
        Upload new image
      </button>
    </div>
  );
}
