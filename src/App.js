import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && webcamEnabled) {
        captureAndPredict();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [webcamEnabled]);

  const captureAndPredict = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error("Unable to capture image from webcam");
      setPredictions([]);
      return;
    }

    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    try {
      const apiUrl = process.env.REACT_APP_API_URL; // Accessing the API URL from .env
      const response = await axios.post(`${apiUrl}/predict`, formData);
      console.log('Predictions:', response.data);
      setPredictions(response.data);
    } catch (error) {
      console.error('Error predicting expression:', error);
    }
  };

  const toggleWebcam = () => {
    setWebcamEnabled(!webcamEnabled);
    setPredictions([]);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Face Detection</h1>
        {webcamEnabled ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={videoConstraints}
            onUserMedia={() => console.log('Webcam is enabled')}
            onUserMediaError={(err) => {
              console.error('Webcam error:', err);
              setWebcamEnabled(false);
              setPredictions([]);
            }}
          />
        ) : (
          <p className="no-webcam-message">Webcam not enabled or not accessible. Please check permissions.</p>
        )}
        {webcamEnabled && (
          <canvas id="overlay" width="640" height="480"></canvas>
        )}
        {webcamEnabled && predictions.map((pred, index) => (
          <div key={index} className="prediction-box" style={{
            left: `${pred.coordinates.x}px`,
            top: `${pred.coordinates.y}px`,
            width: `${pred.coordinates.w}px`,
            height: `${pred.coordinates.h}px`,
          }}>
            {pred.expression}
          </div>
        ))}
      </header>
      <div className="button-container">
        <button className="button" onClick={toggleWebcam}>
          {webcamEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        </button>
      </div>
    </div>
  );
}

export default App;
