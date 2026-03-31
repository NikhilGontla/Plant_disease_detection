import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { predictEndpoint } from "../services/api";

const BOX_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function PredictionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageKey, setImageKey] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stateKey = location.state?.key;
    const stateUrl = location.state?.url;
    if (stateKey) {
      setImageKey(stateKey);
      if (stateUrl) setImageUrl(stateUrl);
      localStorage.setItem("plantdisease_image", JSON.stringify({ key: stateKey, url: stateUrl }));
      return;
    }
    const saved = JSON.parse(localStorage.getItem("plantdisease_image") || "null");
    if (saved?.key) {
      setImageKey(saved.key);
      if (saved.url) setImageUrl(saved.url);
    }
  }, [location.state]);

  useEffect(() => {
    if (!imageKey) {
      setError("No image selected. Go to welcome screen.");
      return;
    }

    const load = async () => {
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

    load();
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
          <div className="flex gap-6 flex-wrap">
            <p>Crop: <strong>{prediction.crop}</strong></p>
            <p>Disease: <strong>{prediction.disease}</strong></p>
          </div>

          {/* Image with bounding box overlay */}
          {imageUrl && (
            <div className="relative inline-block w-full max-w-2xl border rounded overflow-hidden shadow">
              <img
                src={imageUrl}
                alt="Uploaded leaf"
                className="w-full h-auto block"
              />
              {prediction.boundingBoxes?.map((box, idx) => {
                const color = BOX_COLORS[idx % BOX_COLORS.length];
                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.width * 100}%`,
                      height: `${box.height * 100}%`,
                      border: `2px solid ${color}`,
                      boxSizing: "border-box",
                      pointerEvents: "none",
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
                      }}
                    >
                      {box.label || prediction.disease}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={handleEdit} className="bg-blue-600 text-white px-4 py-2 rounded">
            Edit Predictions / Save Annotation
          </button>
        </div>
      )}

      <button onClick={() => navigate("/welcome")} className="mt-5 block text-sm text-slate-600 underline">
        Upload new image
      </button>
    </div>
  );
}
