import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadEndpoint, validateEndpoint } from "../services/api";
import { uploadToS3 } from "../services/s3";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => {
    setError("");
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setFile(selected);
  };

  const startProcess = async () => {
    if (!file) {
      setError("Please select an image.");
      return;
    }
    setLoading(true);
    setStatus("Requesting secure upload URL...");

    try {
      const { uploadUrl, key, getUrl } = await uploadEndpoint({ filename: file.name, contentType: file.type });

      setStatus("Uploading image to S3...");
      await uploadToS3(uploadUrl, file);

      setStatus("Validating leaf image with Rekognition...");
      const validateResp = await validateEndpoint({ key });
      if (!validateResp.valid) {
        throw new Error("Image does not appear to be a leaf. Choose another image.");
      }

      localStorage.setItem("plantdisease_image", JSON.stringify({ key, url: getUrl }));
      navigate("/prediction", { state: { key, url: getUrl } });
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed pipeline step. Please try again.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Plant Disease Labeling Pipeline</h1>
      <p className="mb-4 text-slate-700">Upload a leaf image to validate and predict disease labels.</p>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100 cursor-pointer"
        />
        {error && <p className="text-red-600">{error}</p>}
        {status && <p className="text-blue-600">{status}</p>}
        <button
          onClick={startProcess}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Working..." : "Start Upload & Validate"}
        </button>
      </div>
    </div>
  );
}
