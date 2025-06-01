import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';

// Main App Component
function App() {
  // State to manage the current page view
  const [currentPage, setCurrentPage] = useState('home');
  // State for Firebase instances and user object
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null); // Stores the Firebase User object
  const [isAuthReady, setIsAuthReady] = useState(false); // To ensure database operations wait for auth

  // Firebase Initialization and Authentication
  useEffect(() => {
    try {
      // Firebase Config - Provided by user
      const firebaseConfig = {
        apiKey: "AIzaSyBzlgaWCQHIqug7lsaUAJGSz3PVQJ_xb-o",
        authDomain: "tomatohelp-cbf59.firebaseapp.com",
        databaseURL: "https://tomatohelp-cbf59-default-rtdb.asia-southeast1.firebasedatabase.app/",
        projectId: "tomatohelp-cbf59",
        storageBucket: "tomatohelp-cbf59.appspot.com",
        messagingSenderId: "1007986722395",
        appId: "1:1007986722395:web:abcdef1234567890",
      };

      const app = initializeApp(firebaseConfig);
      const realtimeDb = getDatabase(app); // Get Realtime Database instance
      const firebaseAuth = getAuth(app);

      setDb(realtimeDb); // Set Realtime Database instance
      setAuth(firebaseAuth);

      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
        if (currentUser) {
          // User is signed in
          setUser(currentUser);
        } else {
          // User is signed out, attempt anonymous sign-in if no custom token
          if (typeof __initial_auth_token !== 'undefined') {
            try {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
              setUser(firebaseAuth.currentUser); // Set user after successful sign-in
            } catch (error) {
              console.error("Error signing in with custom token:", error);
              // Fallback to anonymous if custom token fails
              await signInAnonymously(firebaseAuth);
              setUser(firebaseAuth.currentUser);
            }
          } else {
            // If no custom token, sign in anonymously by default
            await signInAnonymously(firebaseAuth);
            setUser(firebaseAuth.currentUser);
          }
        }
        setIsAuthReady(true); // Auth state is ready
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []); // Empty dependency array means this runs once on component mount

  // Navbar Component
  const Navbar = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isCareDropdownOpen, setIsCareDropdownOpen] = useState(false);

    const handleLogout = async () => {
      if (auth) {
        try {
          await signOut(auth);
          setCurrentPage('home'); // Redirect to home or login page after logout
          console.log("User logged out successfully.");
        } catch (error) {
          console.error("Error logging out:", error);
        }
      }
    };

    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="#" onClick={() => setCurrentPage('home')}>TomatoHelp</a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={isNavOpen ? "true" : "false"}
            aria-label="Toggle navigation"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''} justify-content-end`} id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item"><a className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('home'); setIsNavOpen(false); }}>Home</a></li>
              <li className="nav-item"><a className={`nav-link ${currentPage === 'environmental' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('environmental'); setIsNavOpen(false); }}>Environmental Data</a></li>
              <li className="nav-item"><a className={`nav-link ${currentPage === 'sowing' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('sowing'); setIsNavOpen(false); }}>Sowing</a></li>
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${currentPage.startsWith('care') ? 'active' : ''}`}
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded={isCareDropdownOpen ? "true" : "false"}
                  onClick={() => setIsCareDropdownOpen(!isCareDropdownOpen)}
                >
                  Care
                </a>
                <ul className={`dropdown-menu dropdown-menu-end ${isCareDropdownOpen ? 'show' : ''}`}>
                  <li><a className={`dropdown-item ${currentPage === 'care_general' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('care_general'); setIsNavOpen(false); setIsCareDropdownOpen(false); }}>General</a></li>
                  <li><a className={`dropdown-item ${currentPage === 'care_emergency' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('care_emergency'); setIsNavOpen(false); setIsCareDropdownOpen(false); }}>Emergency</a></li>
                </ul>
              </li>
              <li className="nav-item"><a className={`nav-link ${currentPage === 'harvest' ? 'active' : ''}`} href="#" onClick={() => { setCurrentPage('harvest'); setIsNavOpen(false); }}>Harvest</a></li>
              {user && user.isAnonymous === false && ( // Only show logout if not anonymous
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout} style={{ color: 'white', textDecoration: 'none' }}>Logout</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    );
  };

  // EnvironmentalData Component
  const EnvironmentalData = ({ db, userId, isAuthReady }) => {
    const [envData, setEnvData] = useState({
      temperature: '--',
      humidity: '--',
      soilMoisture: '--',
      gasLevel: '--',
    });

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/'); // Reference to the root of the Realtime Database

      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEnvData({
            temperature: data.temperature ?? '--',
            humidity: data.humidity ?? '--',
            soilMoisture: data.soilMoisture ?? '--',
            gasLevel: data.gasLevel ?? '--',
          });
        } else {
          console.log("No environmental data found in Realtime Database.");
          // Optionally, set some default/placeholder values if the database is empty
          setEnvData({
            temperature: '--',
            humidity: '--',
            soilMoisture: '--',
            gasLevel: '--',
          });
        }
      }, (error) => {
        console.error("Error fetching environmental data from Realtime Database:", error);
      });

      // Cleanup the listener on component unmount
      return () => unsubscribe();
    }, [db, isAuthReady]);

    return (
      <div className="content">
        <h2 className="mb-4 text-center">Environmental Data</h2>
        <div className="reading-container">
          <div className="reading-box">
            <div className="circle">{envData.temperature}°C</div>
            <div className="label">Temperature (°C)</div>
          </div>
          <div className="reading-box">
            <div className="circle">{envData.humidity}%</div>
            <div className="label">Humidity (%)</div>
          </div>
          <div className="reading-box">
            <div className="circle">{envData.soilMoisture}%</div>
            <div className="label">Soil Moisture (%)</div>
          </div>
          <div className="reading-box">
            <div className="circle">{envData.gasLevel}%</div>
            <div className="label">Gas Level (%)</div>
          </div>
        </div>
      </div>
    );
  };

  // GeneralCare Component
  const GeneralCare = ({ db, userId, isAuthReady }) => {
    const [sensorData, setSensorData] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [isLoading, setIsLoading] = useState(true); // New loading state

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/'); // Reference to the root of the Realtime Database

      // Simulate loading with a timeout
      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSensorData({
              temperature: data.temperature ?? null,
              humidity: data.humidity ?? null,
              soilMoisture: data.soilMoisture ?? null,
            });
          } else {
            console.log("No sensor data found for General Care in Realtime Database.");
            // Optionally, set some default/placeholder values if the database is empty
            setSensorData({
              temperature: null,
              humidity: null,
              soilMoisture: null,
            });
          }
          setIsLoading(false); // Data loaded, set loading to false
        }, (error) => {
          console.error("Error fetching general care data from Realtime Database:", error);
          setIsLoading(false); // Stop loading on error too
        });
        return () => unsubscribe(); // Cleanup snapshot listener
      }, 1000); // 1 second delay

      return () => clearTimeout(timer); // Cleanup timeout on unmount
    }, [db, isAuthReady]);

    const { temperature, humidity, soilMoisture } = sensorData;

    // Updated ideal ranges for conditions
    const tempGood = temperature !== null && temperature >= 18 && temperature <= 25;
    const humGood = humidity !== null && humidity >= 60 && humidity <= 70;
    const moistGood = soilMoisture !== null && soilMoisture >= 40 && soilMoisture <= 60;

    const getStatusClass = (isGood) => (isGood ? 'status-good' : 'status-bad');
    const getStatusText = (isGood) => (isGood ? 'Good ✅' : 'Bad ❌');

    const badResponses = [];
    if (temperature !== null && !tempGood) {
      badResponses.push({
        img: 'GCare-hot.png', // Updated image path
        text: 'It’s so hottt… I WANT AC',
      });
    }
    if (humidity !== null && !humGood) {
      badResponses.push({
        img: 'GCare-humid.png', // Updated image path
        text: 'It’s so dry… I WANT HUMIDIFIER',
      });
    }
    if (soilMoisture !== null && !moistGood) {
      badResponses.push({
        img: 'GCare-thirst.png', // Updated image path
        text: 'I am thirsty... GIVE ME WATER',
      });
    }

    const renderResponses = () => {
      if (isLoading) {
        return (
          <div className="text-center text-lg font-semibold">Loading data...</div>
        );
      } else if (tempGood && humGood && moistGood) {
        return (
          <div className="response-block">
            <img src="GCare-happy.png" alt="Happy Tomato" /> {/* Updated image path */}
            <div className="caption-text">I'm well taken care of... I LOVE YOU...</div>
          </div>
        );
      } else if (!tempGood && !humGood && !moistGood) {
        return (
          <div className="response-block">
            <img src="GCare-sad.png" alt="Very Sad Tomato" /> {/* Updated image path */}
            <div className="caption-text">I'm not well taken care of... I HATE YOU 💔</div>
          </div>
        );
      } else {
        return badResponses.slice(0, 2).map((resp, index) => (
          <div key={index} className="response-block">
            <img src={resp.img} alt="Condition" />
            <div className="caption-text">{resp.text}</div>
          </div>
        ));
      }
    };

    return (
      <div className="content">
        <h2 className="mb-4 text-center">General Care</h2>

        <div className="table-responsive">
          <table className="table table-bordered table-dark">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Current Value</th>
                <th>Ideal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Temperature (°C)</td>
                <td>{temperature !== null ? temperature : '-'}</td>
                <td>18 - 25</td>
                <td className={getStatusClass(tempGood)}>{temperature !== null ? getStatusText(tempGood) : '-'}</td>
              </tr>
              <tr>
                <td>Humidity (%)</td>
                <td>{humidity !== null ? humidity : '-'}</td>
                <td>60 - 70</td>
                <td className={getStatusClass(humGood)}>{humidity !== null ? getStatusText(humGood) : '-'}</td>
              </tr>
              <tr>
                <td>Soil Moisture (%)</td>
                <td>{soilMoisture !== null ? soilMoisture : '-'}</td>
                <td>40 - 60</td>
                <td className={getStatusClass(moistGood)}>{soilMoisture !== null ? getStatusText(moistGood) : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="caption-container" id="responses">
          {renderResponses()}
        </div>
      </div>
    );
  };

  // EmergencyCare Component
  const EmergencyCare = ({ db, userId, isAuthReady }) => {
    const [gasLevel, setGasLevel] = useState(null);
    const [statusImage, setStatusImage] = useState('ECare-happy.png'); // Default to happy placeholder, updated
    const [statusText, setStatusText] = useState('Loading data...');
    const [gasStatusClass, setGasStatusClass] = useState('');
    const [gasStatusText, setGasStatusText] = useState('--');
    const [isLoading, setIsLoading] = useState(true); // New loading state

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/'); // Reference to the root of the Realtime Database

      // Simulate loading with a timeout
      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const gas = data.gasLevel ?? 0;
            setGasLevel(gas);

            if (gas <= 30) {
              setGasStatusText('Low ✅');
              setGasStatusClass('status-good');
              setStatusImage('ECare-happy.png'); // Updated image path
              setStatusText('Chill Chill… No Fire… I’M COOL');
            } else {
              setGasStatusText('High ❌');
              setGasStatusClass('status-bad');
              setStatusImage('ECare-sad.png'); // Updated image path
              setStatusText('Help! Help! Fire fire...I’M WORRIED');
            }
          } else {
            console.log("No gas level data found for Emergency Care in Realtime Database.");
            // Optionally, set some default/placeholder values if the database is empty
            setGasLevel(null);
            setStatusImage('ECare-happy.png'); // Default to happy placeholder, updated
            setStatusText('Loading data...');
            setGasStatusClass('');
            setGasStatusText('--');
          }
          setIsLoading(false); // Data loaded, set loading to false
        }, (error) => {
          console.error("Error fetching emergency care data from Realtime Database:", error);
          setIsLoading(false); // Stop loading on error too
        });
        return () => unsubscribe(); // Cleanup snapshot listener
      }, 1000); // 1 second delay

      return () => clearTimeout(timer); // Cleanup timeout on unmount
    }, [db, isAuthReady]);

    return (
      <div className="content">
        <h2 className="mb-4 text-center">Emergency Care</h2>

        <div className="table-responsive">
          <table className="table table-bordered table-dark">
            <thead>
              <tr>
                <th>Presence of Fire</th>
                <th>Current Value</th>
                <th>Ideal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Smoke</td>
                <td>{gasLevel !== null ? `${gasLevel}%` : '--'}</td>
                <td>0% - 30%</td>
                <td className={gasStatusClass}>{gasLevel !== null ? gasStatusText : (isLoading ? '...' : '--')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="caption-container">
          {isLoading ? (
            <div className="text-center text-lg font-semibold">Loading data...</div>
          ) : (
            <>
              <img id="statusImage" src={statusImage} alt="Status Image" />
              <div className="caption-text" id="statusText">{statusText}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Sowing Component
  const Sowing = ({ db, userId, isAuthReady }) => {
    const [sensorData, setSensorData] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/'); // Reference to the root of the Realtime Database

      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSensorData({
              temperature: data.temperature ?? null,
              humidity: data.humidity ?? null,
              soilMoisture: data.soilMoisture ?? null,
            });
          } else {
            console.log("No sensor data found for Sowing Readiness in Realtime Database.");
            setSensorData({
              temperature: null,
              humidity: null,
              soilMoisture: null,
            });
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching sowing data from Realtime Database:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
      }, 1000);

      return () => clearTimeout(timer);
    }, [db, isAuthReady]);

    const { temperature, humidity, soilMoisture } = sensorData;

    // Ideal ranges for sowing readiness based on the provided image
    const tempGood = temperature !== null && temperature >= 18 && temperature <= 25;
    const humGood = humidity !== null && humidity >= 60 && humidity <= 70;
    const moistGood = soilMoisture !== null && soilMoisture >= 40 && soilMoisture <= 60;

    const getStatusClass = (isGood) => (isGood ? 'status-good' : 'status-bad');
    const getStatusText = (isGood) => (isGood ? 'Good ✅' : 'Bad ❌');

    const isReadyForSowing = tempGood && humGood && moistGood;

    const renderSowingStatus = () => {
      if (isLoading) {
        return (
          <div className="text-center text-lg font-semibold">Loading data...</div>
        );
      } else if (isReadyForSowing) {
        return (
          <div className="response-block">
            <img src="Sow-happy.png" alt="Happy Tomato" /> {/* Using Sow-happy.png */}
            <div className="caption-text">I am ready for sowing</div>
          </div>
        );
      } else {
        return (
          <div className="response-block">
            <img src="Sow-sad.png" alt="Sad Tomato" /> {/* Using Sow-sad.png */}
            <div className="caption-text">I am not ready for sowing</div>
          </div>
        );
      }
    };

    return (
      <div className="content">
        <h2 className="mb-4 text-center">Sowing Readiness</h2>

        <div className="table-responsive">
          <table className="table table-bordered table-dark">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Current Value</th>
                <th>Ideal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Temperature (°C)</td>
                <td>{temperature !== null ? temperature : '-'}</td>
                <td>18 - 25</td>
                <td className={getStatusClass(tempGood)}>{temperature !== null ? getStatusText(tempGood) : '-'}</td>
              </tr>
              <tr>
                <td>Humidity (%)</td>
                <td>{humidity !== null ? humidity : '-'}</td>
                <td>60 - 70</td>
                <td className={getStatusClass(humGood)}>{humidity !== null ? getStatusText(humGood) : '-'}</td>
              </tr>
              <tr>
                <td>Soil Moisture (%)</td>
                <td>{soilMoisture !== null ? soilMoisture : '-'}</td>
                <td>40 - 60</td>
                <td className={getStatusClass(moistGood)}>{soilMoisture !== null ? getStatusText(moistGood) : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="caption-container">
          {renderSowingStatus()}
        </div>
      </div>
    );
  };

  // Harvest Component
  const Harvest = ({ db, userId, isAuthReady }) => {
    const [formData, setFormData] = useState({
      harvestDate: '',
      quantity: '',
      quality: '',
      notes: '',
      photoFileName: '', // To store the filename
    });
    const [harvestRecords, setHarvestRecords] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch harvest records from Firebase
    useEffect(() => {
      if (!db || !userId || !isAuthReady) {
        // console.log("DB, UserID, or Auth not ready for Harvest component.");
        return;
      }

      const harvestRef = ref(db, `users/${userId}/harvestRecords`); // Path for user-specific harvest records

      const unsubscribe = onValue(harvestRef, (snapshot) => {
        const data = snapshot.val();
        const loadedRecords = [];
        for (let key in data) {
          loadedRecords.push({
            id: key,
            ...data[key]
          });
        }
        // Sort by date, newest first
        loadedRecords.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));
        setHarvestRecords(loadedRecords);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching harvest records:", error);
        setMessage('Error loading harvest records.');
        setIsLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener
    }, [db, userId, isAuthReady]); // Add userId to dependency array

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // For simplicity, we'll just store the filename.
        // In a real app, you'd upload the file to Firebase Storage and store its URL.
        setFormData(prev => ({ ...prev, photoFileName: file.name }));
      } else {
        setFormData(prev => ({ ...prev, photoFileName: '' }));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!db || !userId) {
        setMessage('Firebase not initialized or user not authenticated. Please wait.');
        return;
      }

      // Basic validation
      if (!formData.harvestDate || !formData.quantity || !formData.quality) {
        setMessage('Please fill in Harvest Date, Quantity, and Quality.');
        return;
      }

      try {
        const newRecordRef = push(ref(db, `users/${userId}/harvestRecords`)); // Use push to create a unique ID under user's path
        await set(newRecordRef, {
          harvestDate: formData.harvestDate,
          quantity: parseFloat(formData.quantity), // Convert to number
          quality: formData.quality,
          notes: formData.notes,
          photoFileName: formData.photoFileName,
          timestamp: Date.now(), // Add a timestamp for sorting
        });
        setMessage('Harvest record submitted successfully!');
        // Clear form
        setFormData({
          harvestDate: '',
          quantity: '',
          quality: '',
          notes: '',
          photoFileName: '',
        });
        // Clear file input manually if needed (not directly controlled by state)
        const fileInput = document.getElementById('photoInput');
        if (fileInput) fileInput.value = '';

      } catch (error) {
        console.error("Error submitting harvest record:", error);
        setMessage('Failed to submit harvest record. Please try again.');
      }
    };

    return (
      <div className="content">
        <h2 className="mb-4 text-center">Harvest Data</h2>

        {/* Harvest Data Submission Form */}
        <div className="harvest-form-container">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="harvestDate" className="form-label">Harvest Date</label>
              <input
                type="date"
                className="form-control"
                id="harvestDate"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="quantity" className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                id="quantity"
                name="quantity"
                placeholder="e.g., 15 kg"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="quality" className="form-label">Quality</label>
              <input
                type="text"
                className="form-control"
                id="quality"
                name="quality"
                placeholder="e.g., Good, Firm"
                value={formData.quality}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                className="form-control"
                id="notes"
                name="notes"
                rows="3"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="photoInput" className="form-label">Photo</label>
              <input
                type="file"
                className="form-control"
                id="photoInput"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formData.photoFileName && <small className="text-white">Selected: {formData.photoFileName}</small>}
            </div>

            {message && <div className="alert alert-info mt-3">{message}</div>}

            <div className="d-flex justify-content-between mt-4">
              <button type="submit" className="btn btn-success flex-grow-1 me-2">Submit</button>
              {/* The "View Record" button is not strictly necessary as records are displayed below,
                  but keeping it for visual consistency with the image if it implies a toggle.
                  For now, it will just scroll to records if they are off-screen. */}
              <button type="button" className="btn btn-primary flex-grow-1 ms-2" onClick={() => {
                const recordsTable = document.getElementById('harvestRecordsTable');
                if (recordsTable) recordsTable.scrollIntoView({ behavior: 'smooth' });
              }}>View Records</button>
            </div>
          </form>
        </div>

        <h2 className="mb-4 mt-5 text-center">Harvest Records</h2>

        {/* Harvest Records Table */}
        <div className="harvest-records-table-container">
          {isLoading ? (
            <div className="text-center text-lg font-semibold">Loading harvest records...</div>
          ) : harvestRecords.length === 0 ? (
            <div className="text-center text-lg font-semibold">No harvest records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-dark" id="harvestRecordsTable">
                <thead>
                  <tr>
                    <th>Harvest Date</th>
                    <th>Quantity</th>
                    <th>Quality</th>
                    <th>Notes</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {harvestRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.harvestDate}</td>
                      <td>{record.quantity}</td>
                      <td>{record.quality}</td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        {record.photoFileName ? (
                          // Directly use the filename from the public folder
                          <img
                            src={record.photoFileName}
                            alt={record.photoFileName}
                            className="img-thumbnail"
                            style={{ maxWidth: '100px', maxHeight: '70px', borderRadius: '0.5rem' }}
                            // Add onerror to handle cases where image might not load
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x70/000000/FFFFFF?text=No+Image'; }}
                          />
                        ) : (
                          'No Photo'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Home = () => (
    <div className="main-content">
      <div className="content-box">
        <h1>Welcome to TomatoHelp</h1>
        <p>Monitor your tomato growth from sowing to harvest</p>
      </div>
    </div>
  );

  // AuthPage Component for Login/Register
  const AuthPage = ({ auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
      e.preventDefault(); // Prevent default form submission
      setError(''); // Clear previous errors
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        let errorMessage = 'An unexpected error occurred.';
        if (err.code) {
          switch (err.code) {
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address format.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'User account has been disabled.';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No user found with this email.';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password.';
              break;
            default:
              errorMessage = err.message;
          }
        }
        setError(errorMessage);
        console.error("Authentication error:", err);
      }
    };

    return (
      <div className="main-content">
        <div className="content-box auth-box">
          <h2 className="mb-4 text-center">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="passwordInput" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="passwordInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <div className="d-grid gap-2 mt-4">
              <button type="submit" className="btn btn-success">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render the appropriate component based on authentication state and currentPage state
  const renderAppContent = () => {
    if (!isAuthReady) {
      return (
        <div className="main-content">
          <div className="content-box">
            <h1 className="text-center">Loading...</h1>
            <p className="text-center">Initializing application.</p>
          </div>
        </div>
      );
    }

    // If user is not logged in (and not anonymous), show AuthPage
    if (!user || user.isAnonymous) {
      return <AuthPage auth={auth} />;
    }

    // If user is logged in, show the main application content
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'environmental':
        return <EnvironmentalData db={db} userId={user.uid} isAuthReady={isAuthReady} />;
      case 'care_general':
        return <GeneralCare db={db} userId={user.uid} isAuthReady={isAuthReady} />;
      case 'care_emergency':
        return <EmergencyCare db={db} userId={user.uid} isAuthReady={isAuthReady} />;
      case 'sowing':
        return <Sowing db={db} userId={user.uid} isAuthReady={isAuthReady} />;
      case 'harvest':
        return <Harvest db={db} userId={user.uid} isAuthReady={isAuthReady} />;
      default:
        return <Home />;
    }
  };

  return (
    // The main div acts as the body, applying background and minimum height
    <div style={{
      backgroundImage: `url('https://images-prod.healthline.com/hlcmsresource/images/AN_images/tomatoes-1296x728-feature.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '70px', // Offset for fixed navbar
    }}>
      {/* Bootstrap CSS CDN */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"/>

      {/* Custom CSS styles */}
      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
          }
          .content { /* General content box for other pages */
            background: rgba(0, 0, 0, 0.6);
            padding: 2rem;
            border-radius: 1rem;
            max-width: 900px;
            margin: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          table {
            color: white;
            width: 100%;
          }
          th, td {
            text-align: center;
            vertical-align: middle;
          }
          .status-good {
            color: #4CAF50;
            font-weight: bold;
          }
          .status-bad {
            color: #E94B3C;
            font-weight: bold;
          }
          .caption-container {
            margin-top: 2rem;
            text-align: center;
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
          }
          .caption-container img {
            max-width: 300px;
            border-radius: 1rem;
            box-shadow: 0 0 10px rgba(0,0,0,0.7);
            width: 100%;
            height: auto;
          }
          .caption-text {
            margin-top: 0.8rem;
            font-size: 1.2rem;
            font-weight: 600;
          }
          footer {
            color: white;
            text-align: center;
            padding: 1rem 0 2rem; /* Adjusted padding for footer */
            font-size: 1rem; /* Adjusted font size for footer */
            margin-top: auto; /* Pushes footer to the bottom */
          }
          /* Styles for Environmental Data circles */
          .reading-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            width: 100%;
          }
          .reading-box {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            padding: 1.5rem;
            margin: 0.5rem;
            text-align: center;
            flex: 1 1 200px;
            max-width: 220px;
          }
          .circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2.5rem;
            font-weight: bold;
            color: white;
            margin: 0 auto 0.5rem;
          }
          .label {
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 0.5rem;
          }

          /* Home Page Specific Styles (from user's provided HTML) */
          .main-content {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%; /* Ensure it takes full width to center content-box */
          }

          .content-box {
            background: rgba(0, 0, 0, 0.6);
            padding: 2.5rem 3.5rem; /* Adjusted padding */
            border-radius: 1rem;
            text-align: center;
            max-width: 750px; /* Increased max-width to ensure single line for both */
            width: fit-content; /* Allow width to fit content */
            margin: auto; /* Center the box itself */
          }

          .content-box h1 {
            font-family: 'Inter', sans-serif;
            font-size: 3.2rem; /* Adjusted font size */
            font-weight: bold; /* Set to bold */
            margin-bottom: 0.5rem; /* Adjusted margin */
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
            line-height: 1.2;
            letter-spacing: 0.05em; /* Added letter spacing */
            white-space: nowrap; /* Force h1 to stay on one line */
          }

          .content-box p {
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem; /* Adjusted font size */
            margin-top: 0;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
            font-weight: normal;
            letter-spacing: 0.02em; /* Added letter spacing */
            line-height: 1.4; /* Adjusted line height */
            white-space: nowrap; /* Force p to stay on one line */
          }

          /* Harvest Page Specific Styles */
          .harvest-form-container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 1rem;
            margin-bottom: 3rem;
            width: 100%;
            max-width: 500px; /* Adjust max-width for the form */
            text-align: left; /* Align form labels to left */
          }

          .harvest-form-container .form-label {
            font-weight: bold;
            color: white;
            margin-bottom: 0.5rem;
          }

          .harvest-form-container .form-control {
            background-color: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 0.5rem; /* Rounded corners for inputs */
          }

          .harvest-form-container .form-control::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }

          .harvest-form-container .form-control:focus {
            background-color: rgba(255, 255, 255, 0.3);
            border-color: #88b04b; /* Highlight color on focus */
            box-shadow: 0 0 0 0.25rem rgba(136, 176, 75, 0.25);
            color: white;
          }

          .harvest-form-container .btn {
            border-radius: 0.5rem;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
            margin: 0 0.5rem; /* Space between buttons */
          }

          .harvest-records-table-container {
            width: 100%;
            max-width: 800px; /* Adjust max-width for the table */
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 1rem;
          }

          .harvest-records-table-container .table {
            margin-bottom: 0; /* Remove default table margin */
          }

          .harvest-records-table-container .table th,
          .harvest-records-table-container .table td {
            border-color: rgba(255, 255, 255, 0.2);
          }

          .harvest-records-table-container .table img {
            object-fit: cover;
            width: 100px; /* Fixed width for table images */
            height: 70px; /* Fixed height for table images */
          }

          /* Auth Page Specific Styles */
          .auth-box {
            max-width: 450px; /* Smaller max-width for auth form */
            padding: 2rem;
          }
          .auth-box .form-label {
            color: white;
            font-weight: bold;
          }
          .auth-box .form-control {
            background-color: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 0.5rem;
          }
          .auth-box .form-control:focus {
            background-color: rgba(255, 255, 255, 0.3);
            border-color: #88b04b;
            box-shadow: 0 0 0 0.25rem rgba(136, 176, 75, 0.25);
            color: white;
          }
          .auth-box .btn {
            border-radius: 0.5rem;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
          }

          /* Responsive adjustments */
          @media (max-width: 991.98px) {
            .content {
              padding-top: 4rem; /* Adjust padding for smaller screens */
            }
            .content-box h1 {
              font-size: 2.2rem; /* Smaller font for mobile */
              white-space: normal; /* Allow wrapping on small screens if needed */
            }
            .content-box p {
              font-size: 0.9rem; /* Smaller font for mobile */
              white-space: normal; /* Allow wrapping on small screens if needed */
            }
            .content-box {
              padding: 2rem 2.5rem; /* Smaller padding for mobile */
              max-width: 90%; /* Allow it to take more width on small screens */
              width: auto; /* Revert to auto width for wrapping */
              white-space: normal; /* Allow wrapping on small screens */
            }
            .harvest-form-container, .harvest-records-table-container, .auth-box {
              max-width: 95%; /* Allow forms/tables to take more width on small screens */
            }
            .harvest-form-container .btn {
              margin: 0.5rem 0;
              width: 100%;
            }
            .d-flex.justify-content.between.mt-4 {
              flex-direction: column;
            }
          }
        `}
      </style>

      {user && !user.isAnonymous && <Navbar />} {/* Only show Navbar if user is logged in and not anonymous */}
      {renderAppContent()}
      <footer>
        © 2025 TomatoHelp. All rights reserved.
      </footer>

      {/* Bootstrap JS Bundle CDN - Must be after HTML content for proper functionality */}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
}

export default App;