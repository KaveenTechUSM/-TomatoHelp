import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://tomatohelp-cbf59-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  const [sensorData, setSensorData] = useState({
    temperature: "Loading...",
    humidity: "Loading...",
    soilMoisture: "Loading...",
    gasLevel: "Loading..."
  });

  useEffect(() => {
    const dbRef = ref(database, "/");
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorData(prev => ({
            ...prev,
            temperature: data.temperature ?? "N/A",
            humidity: data.humidity ?? "N/A",
            soilMoisture: data.soilMoisture ?? "N/A",
            gasLevel: data.gasLevel ?? "N/A"
          }));
        }
      },
      (error) => {
        console.error("Firebase read failed:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Function to get the color based on the value
  const getCircleColor = (value) => {
    if (isNaN(value)) {
      if (value === "LOW") return "#f39c12";
      if (value === "HIGH") return "#2ecc71";
      return "#9b59b6";
    }

    const numberValue = parseFloat(value);

    if (numberValue <= 30) return "#e74c3c";
    if (numberValue > 30 && numberValue <= 70) return "#f39c12";
    return "#2ecc71";
  };

  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <style>{`
        .circle-chart {
          width: 120px;
          height: 120px;
        }
        .circle-svg {
          width: 100%;
          height: 100%;
        }
        .circle-bg {
          fill: none;
          stroke: #eee;
          stroke-width: 3.8;
        }
        .circle {
          fill: none;
          stroke-width: 3.8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.5s ease;
        }
        .circle-text {
          fill: #007bff;
          font-size: 6px;
          font-weight: bold;
          text-anchor: middle;
          dominant-baseline: middle;
        }
      `}</style>

      <div className="container py-5">
        <h2 className="text-center mb-5 fw-bold">🍅 TOMATO MONITORING SYSTEM</h2>

        {/* Single Row - Temperature, Humidity, Soil Moisture, Gas Level */}
        <div className="row g-4 justify-content-center">
          {["temperature", "humidity", "soilMoisture", "gasLevel"].map((key) => {
            const value = sensorData[key];
            const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
            const displayValue = isNumeric
              ? Math.min(100, Math.max(0, parseFloat(value)))
              : 100;
            const color = getCircleColor(value);

            return (
              <div className="col-sm-6 col-lg-3" key={key}>
                <div className="card shadow h-100 text-center p-4 border-0">
                  <div className="circle-chart mx-auto mb-3">
                    <svg className="circle-svg" viewBox="0 0 36 36">
                      <path
                        className="circle-bg"
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle"
                        stroke={color}
                        strokeDasharray={`${displayValue}, 100`}
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.5" className="circle-text">
                        {String(value).toUpperCase()}
                      </text>
                    </svg>
                  </div>
                  <h5 className="text-capitalize">
                    {key === "soilMoisture" ? "Soil Moisture" : 
                     key === "gasLevel" ? "Gas Level" : 
                     key.charAt(0).toUpperCase() + key.slice(1)}
                  </h5>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-5 text-muted small">
          &copy; {new Date().getFullYear()} Tomato Monitoring System
        </div>
      </div>
    </>
  );
}

export default App;