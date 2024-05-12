import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import "./PanCardReader.css"; // Import CSS file for styles
import { FaCamera, FaCopy } from "react-icons/fa"; // Import copy icon from Font Awesome

const PanCardReader = () => {
  const [panNumbers, setPanNumbers] = useState([]);
  const [openCamera, setCloseCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const videoRef = useRef(null);

  const handleImageUpload = async (e) => {
    setLoading(true);
    setError(null);
    closeCameraStream(); // Close the camera stream

    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      console.log('====================================');
      console.log(imageUrl);
      console.log('====================================');
      setUploadedImage(imageUrl); // Update uploadedImage state with the URL of the uploaded image

      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m),
      });

      const panNumber = extractPanNumber(text);
      if (panNumber) {
        setPanNumbers((prevPanNumbers) => [...prevPanNumbers, panNumber]);
      } else {
        setError("PAN number not found in the uploaded image.");
      }
    } catch (err) {
      setError("Error reading PAN card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractPanNumber = (text) => {
    // Regular expression to match PAN card number pattern
    const panNumberRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
    const panNumberMatch = text.match(panNumberRegex);

    if (panNumberMatch) {
      return panNumberMatch[0];
    } else {
      return null;
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPanNumbers([]);
    closeCameraStream();
  };

  const handleCameraOpen = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCloseCamera(true);
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
          setError("Error accessing camera. Please try again.");
        });
    } else {
      setError("Camera access not supported.");
    }
  };

  const handleImageCapture = async () => {
    setLoading(true);
    setError(null);
    setCloseCamera(false);
    closeCameraStream();

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    try {
      const imageUrl = canvas.toDataURL("image/jpeg");
      setUploadedImage(imageUrl); // Update uploadedImage state with the captured image

      const {
        data: { text },
      } = await Tesseract.recognize(canvas, "eng", {
        logger: (m) => console.log(m),
      });

      const panNumber = extractPanNumber(text);
      if (panNumber) {
        setPanNumbers((prevPanNumbers) => [...prevPanNumbers, panNumber]);
      } else {
        setError("PAN number not found in the captured image.");
      }
    } catch (err) {
      setError("Error reading PAN card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeCameraStream = () => {
    if (videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleCopyPanNumber = (panNumber) => {
    // Copy the PAN number to the clipboard
    navigator.clipboard.writeText(panNumber);
    alert(`PAN number "${panNumber}" copied to clipboard.`);
    // You may also provide a user feedback indicating that the PAN number has been copied.
    // For simplicity, I'm just logging it to the console here.
    console.log(`PAN number "${panNumber}" copied to clipboard.`);
  };

  return (
    <div className="pan-card-reader-container">
      <h1 className="title">PAN Card Reader</h1>
      <label htmlFor="upload-btn" className="upload-btn-label">
        {uploadedImage ? "Upload Another Image" : "Choose Image"}
      </label>
      <input
        id="upload-btn"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {!uploadedImage && (
        <div className="camera-controls">
          <button onClick={handleCameraOpen} className="camera-btn">
            <FaCamera /> Open Camera
          </button>
          <button onClick={closeCameraStream} className="camera-btn">
            <FaCamera /> Close Camera
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        className="video"
        style={{ display: uploadedImage ? "none" : "block" }}
      />

      {openCamera && (
        <button onClick={handleImageCapture} className="camera-btn">
        <FaCamera /> Capture Image
      </button>
      )}

      {uploadedImage && (
        <div className="image-container">
          <img
            src={uploadedImage}
            alt="Uploaded PAN Card"
            className="uploaded-image"
          />
          <div className="loader-overlay">
            {loading && <div className="loader"></div>}
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {uploadedImage && (
        <button onClick={handleRemoveImage} className="remove-image-btn">
          Remove Image
        </button>
      )}
      {panNumbers.length > 0 && (
        <div className="pan-numbers-container">
          <h2 className="subtitle">PAN Card Numbers</h2>
          <ul className="pan-numbers-list">
            {panNumbers.map((panNumber, index) => (
              <li key={index} className="pan-number">
                <span className="pan-text">{panNumber}</span>
                <FaCopy
                  onClick={() => handleCopyPanNumber(panNumber)}
                  className="copy-icon"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PanCardReader;
