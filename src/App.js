import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Main App Component
function App() {
  // State to manage the current page view
  const getInitialPage = () => {
    const hash = window.location.hash.substring(1);
    switch (hash) {
      case 'home': return 'home';
      case 'environmental': return 'environmental';
      case 'sowing': return 'sowing';
      case 'care_general': return 'care_general';
      case 'care_emergency': return 'care_emergency';
      case 'harvest': return 'harvest';
      case 'login': return 'login';
      default: return 'home'; // Default to home initially
    }
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());
  // State for Firebase instances and user object
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(crypto.randomUUID()); // Use a random UUID for all users for public data handling
  const [appId, setAppId] = useState(''); // App ID is still needed for storage paths, but not Realtime DB root

  // Firebase Initialization and Authentication
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyBzlgaWCQHIqug7lsaUAJGSz3PVQJ_xb-o",
        authDomain: "tomatohelp-cbf59.firebaseapp.com",
        databaseURL: "https://tomatohelp-cbf59-default-rtdb.asia-southeast1.firebasedatabase.app/",
        projectId: "tomatohelp-cbf59",
        storageBucket: "tomatohelp-cbf59.firebasestorage.app",
        messagingSenderId: "1007986722395",
        appId: "1:1007986722395:web:abcdef1234567890",
      };

      const currentAppId = firebaseConfig.appId;
      setAppId(currentAppId); // Set the appId for potential use in Storage paths

      const app = initializeApp(firebaseConfig);
      const realtimeDb = getDatabase(app);
      const firebaseAuth = getAuth(app);
      const firebaseStorage = getStorage(app);

      setDb(realtimeDb);
      setAuth(firebaseAuth);
      setStorage(firebaseStorage);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid); // Set userId from authenticated user's UID
        } else {
          // If no user is logged in, attempt anonymous sign-in or use custom token if available
          if (typeof __initial_auth_token !== 'undefined') {
            try {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
              setUser(firebaseAuth.currentUser);
              setUserId(firebaseAuth.currentUser.uid);
            } catch (error) {
              console.error("Error signing in with custom token:", error);
              await signInAnonymously(firebaseAuth);
              setUser(firebaseAuth.currentUser);
              setUserId(firebaseAuth.currentUser.uid || crypto.randomUUID());
            }
          } else {
            await signInAnonymously(firebaseAuth);
            setUser(firebaseAuth.currentUser);
            setUserId(firebaseAuth.currentUser.uid || crypto.randomUUID());
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  // Effect to handle URL hash changes and update currentPage
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getInitialPage());
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = '#home';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Effect to update URL hash when currentPage changes
  useEffect(() => {
    if (`#${currentPage}` !== window.location.hash) {
      window.location.hash = currentPage;
    }
  }, [currentPage]);

  // Navbar Component
  const Navbar = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isCareDropdownOpen, setIsCareDropdownOpen] = useState(false);

    const handleLogout = async () => {
      if (auth) {
        try {
          await signOut(auth);
          // Redirect to login page after logout
          setCurrentPage('login');
          window.location.hash = '#login';
          console.log("User logged out successfully.");
        } catch (error) {
          console.error("Error logging out:", error);
        }
      }
    };

    const navigateTo = (pageName) => {
      setCurrentPage(pageName);
      setIsNavOpen(false);
      setIsCareDropdownOpen(false);
      window.location.hash = `#${pageName}`;
    };

    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top rounded-b-lg shadow-lg">
        <div className="container-fluid mx-auto px-4 py-2">
          <a className="navbar-brand text-xl font-bold text-teal-300 hover:text-teal-100 transition duration-300 ease-in-out" href="#home" onClick={() => navigateTo('home')}>TomatoHelp</a>
          <button
            className="navbar-toggler lg:hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 rounded-md"
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
            <ul className="navbar-nav space-y-2 lg:space-y-0 lg:flex lg:space-x-4">
              <li className="nav-item"><a className={`nav-link ${currentPage === 'home' ? 'active font-semibold' : ''} text-gray-200 hover:text-white transition duration-300 ease-in-out px-3 py-2 rounded-md`} href="#home" onClick={() => navigateTo('home')}>Home</a></li>
              <li className="nav-item"><a className={`nav-link ${currentPage === 'environmental' ? 'active font-semibold' : ''} text-gray-200 hover:text-white transition duration-300 ease-in-out px-3 py-2 rounded-md`} href="#environmental" onClick={() => navigateTo('environmental')}>Environmental Data</a></li>
              {/* Removed duplicate className here */}
              <li className="nav-item"><a className={`nav-link ${currentPage === 'sowing' ? 'active font-semibold' : ''} text-gray-200 hover:text-white transition duration-300 ease-in-out px-3 py-2 rounded-md`} href="#sowing" onClick={() => navigateTo('sowing')}>Sowing</a></li>
              <li className="nav-item dropdown relative">
                <a
                  className={`nav-link dropdown-toggle ${currentPage.startsWith('care') ? 'active font-semibold' : ''} text-gray-200 hover:text-white transition duration-300 ease-in-out px-3 py-2 rounded-md`}
                  href="#care"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded={isCareDropdownOpen ? "true" : "false"}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCareDropdownOpen(!isCareDropdownOpen);
                  }}
                >
                  Care
                </a>
                <ul className={`dropdown-menu absolute bg-gray-800 rounded-md shadow-lg py-1 ${isCareDropdownOpen ? 'show' : ''} lg:absolute lg:top-full lg:left-0 mt-2 lg:mt-0`}
                    style={{ minWidth: '10rem' }}>
                  <li><a className={`dropdown-item ${currentPage === 'care_general' ? 'active font-semibold' : ''} block px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-md transition duration-300 ease-in-out`} href="#care_general" onClick={() => navigateTo('care_general')}>General</a></li>
                  <li><a className={`dropdown-item ${currentPage === 'care_emergency' ? 'active font-semibold' : ''} block px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-md transition duration-300 ease-in-out`} href="#care_emergency" onClick={() => navigateTo('care_emergency')}>Emergency</a></li>
                </ul>
              </li>
              <li className="nav-item"><a className={`nav-link ${currentPage === 'harvest' ? 'active font-semibold' : ''} text-gray-200 hover:text-white transition duration-300 ease-in-out px-3 py-2 rounded-md`} href="#harvest" onClick={() => navigateTo('harvest')}>Harvest</a></li>
              {user && !user.isAnonymous && (
                <li className="nav-item">
                  <button className="nav-link btn btn-link text-gray-200 hover:text-red-400 transition duration-300 ease-in-out px-3 py-2 rounded-md" onClick={handleLogout} style={{ textDecoration: 'none' }}>Logout</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    );
  };

  // EnvironmentalData Component: Displays real-time environmental sensor data.
  const EnvironmentalData = ({ db, isAuthReady }) => { // Removed appId, as data is at root
    const [envData, setEnvData] = useState({
      temperature: '--',
      humidity: '--',
      soilMoisture: '--',
      gasLevel: '--',
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Ensure Firebase DB and authentication are ready before fetching data
      if (!db || !isAuthReady) {
        console.log("DB or Auth not ready for Environmental Data component.");
        setIsLoading(false);
        return;
      }

      // Changed dbPath to fetch directly from the root
      const dbPath = '/';
      console.log("Attempting to fetch environmental data from Realtime Database path:", dbPath);
      const dbRef = ref(db, dbPath);

      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          console.log("Environmental data fetched from root:", data);
          // Access properties directly from the root data
          setEnvData({
            temperature: data.temperature ?? '--',
            humidity: data.humidity ?? '--',
            soilMoisture: data.soilMoisture ?? '--',
            gasLevel: data.gasLevel ?? '--',
          });
        } else {
          console.log("No environmental data found at root path:", dbPath);
          setEnvData({
            temperature: '--',
            humidity: '--',
            soilMoisture: '--',
            gasLevel: '--',
          });
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching environmental data from Realtime Database:", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [db, isAuthReady]); // No appId dependency here

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-8 text-4xl font-extrabold text-center text-green-400">Environmental Data</h2>
        {isLoading ? (
          <div className="text-center text-lg font-semibold text-gray-400">Loading sensor data...</div>
        ) : (
          <div className="reading-container">
            {/* Display Temperature */}
            <div className="reading-box">
              <div className="circle bg-blue-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
                {envData.temperature}°C
              </div>
              <div className="label text-lg font-semibold text-gray-200">Temperature (°C)</div>
            </div>
            {/* Display Humidity */}
            <div className="reading-box">
              <div className="circle bg-purple-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
                {envData.humidity}%
              </div>
              <div className="label text-lg font-semibold text-gray-200">Humidity (%)</div>
            </div>
            {/* Display Soil Moisture */}
            <div className="reading-box">
              <div className="circle bg-yellow-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
                {envData.soilMoisture}%
              </div>
              <div className="label text-lg font-semibold text-gray-200">Soil Moisture (%)</div>
            </div>
            {/* Display Gas Level */}
            <div className="reading-box">
              <div className="circle bg-red-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
                {envData.gasLevel}%
              </div>
              <div className="label text-lg font-semibold text-gray-200">Gas Level (%)</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // GeneralCare Component: Provides feedback based on environmental sensor data
  const GeneralCare = ({ db, isAuthReady }) => { // Removed appId, as data is at root
    const [sensorData, setSensorData] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) {
        setIsLoading(false);
        return;
      }

      // Changed dbPath to fetch directly from the root
      const dbRef = ref(db, '/');
      console.log("Attempting to fetch general care data from Realtime Database path:", dbRef);


      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log("General care data fetched from root:", data);
            setSensorData({
              temperature: data.temperature ?? null,
              humidity: data.humidity ?? null,
              soilMoisture: data.soilMoisture ?? null,
            });
          } else {
            console.log("No sensor data found for General Care in Realtime Database.");
            setSensorData({
              temperature: null,
              humidity: null,
              soilMoisture: null,
            });
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching general care data from Realtime Database:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
      }, 1000);

      return () => clearTimeout(timer);
    }, [db, isAuthReady]); // No appId dependency here

    const { temperature, humidity, soilMoisture } = sensorData;

    // Define ideal ranges for each parameter
    const tempGood = temperature !== null && temperature >= 18 && temperature <= 25;
    const humGood = humidity !== null && humidity >= 60 && humidity <= 70;
    const moistGood = soilMoisture !== null && soilMoisture >= 40 && soilMoisture <= 60;

    // Helper functions for status display
    const getStatusClass = (isGood) => (isGood ? 'status-good' : 'status-bad');
    const getStatusText = (isGood) => (isGood ? 'Good ✅' : 'Bad ❌');

    // Renders messages and images based on sensor data status
    const renderResponses = () => {
      if (isLoading) {
        return (
          <div className="text-center text-lg font-semibold response-block">Loading data...</div>
        );
      }

      const badResponses = [];
      if (temperature !== null && !tempGood) {
        badResponses.push({
          img: '/-TomatoHelp/GCare-hot.png',
          text: 'It’s so hottt… I WANT AC',
        });
      }
      if (humidity !== null && !humGood) {
        badResponses.push({
          img: '/-TomatoHelp/GCare-humid.png',
          text: 'It’s so dry… I WANT HUMIDIFIER',
        });
      }
      if (soilMoisture !== null && !moistGood) {
        badResponses.push({
          img: '/-TomatoHelp/GCare-thirst.png',
          text: 'I am thirsty... GIVE ME WATER',
        });
      }

      if (tempGood && humGood && moistGood) {
        return (
          <div className="response-block">
            <img
              src="/-TomatoHelp/GCare-happy.png"
              alt="Happy Tomato"
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                console.error("Failed to load image: /-TomatoHelp/GCare-happy.png");
              }}
            />
            <div className="caption-text">I'm well taken care of... I LOVE YOU...</div>
          </div>
        );
      } else if (!tempGood && !humGood && !moistGood) {
        return (
          <div className="response-block">
            <img
              src="/-TomatoHelp/GCare-sad.png"
              alt="Very Sad Tomato"
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                console.error("Failed to load image: /-TomatoHelp/GCare-sad.png");
              }}
            />
            <div className="caption-text">I'm not well taken care of... I HATE YOU 💔</div>
          </div>
        );
      } else {
        return badResponses.map((resp, index) => (
          <div key={index} className="response-block">
            <img
              src={resp.img}
              alt="Condition"
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                console.error(`Failed to load image: ${resp.img}`);
              }}
            />
            <div className="caption-text">{resp.text}</div>
          </div>
        ));
      }
    };

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-4 text-center text-4xl font-extrabold text-teal-400">General Care</h2>

        <div className="table-responsive w-full max-w-2xl mx-auto mb-8 rounded-lg overflow-hidden shadow-xl">
          <table className="table table-bordered table-dark w-full">
            <thead>
              <tr className="bg-gray-800 text-gray-200 text-lg">
                <th className="p-3">Parameter</th>
                <th className="p-3">Current Value</th>
                <th className="p-3">Ideal Range</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-700">
                <td className="p-3">Temperature (°C)</td>
                <td className="p-3">{temperature !== null ? temperature : '-'}</td>
                <td className="p-3">18 - 25</td>
                <td className={`p-3 ${getStatusClass(tempGood)}`}>{temperature !== null ? getStatusText(tempGood) : '-'}</td>
              </tr>
              <tr className="bg-gray-600">
                <td className="p-3">Humidity (%)</td>
                <td className="p-3">{humidity !== null ? humidity : '-'}</td>
                <td className="p-3">60 - 70</td>
                <td className={`p-3 ${getStatusClass(humGood)}`}>{humidity !== null ? getStatusText(humGood) : '-'}</td>
              </tr>
              <tr className="bg-gray-700">
                <td className="p-3">Soil Moisture (%)</td>
                <td className="p-3">
                  {soilMoisture !== null ?
                    (soilMoisture === 0 ? '0 (No Data)' : soilMoisture)
                    : '-'}
                </td>
                <td className="p-3">40 - 60</td>
                <td className={`p-3 ${getStatusClass(moistGood)}`}>
                  {soilMoisture !== null ? getStatusText(moistGood) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="caption-container flex-col items-center" id="responses">
          {renderResponses()}
        </div>
      </div>
    );
  };

  // EmergencyCare Component
  const EmergencyCare = ({ db, isAuthReady }) => { // Removed appId, as data is at root
    const [gasLevel, setGasLevel] = useState(null);
    const [statusImage, setStatusImage] = useState('/-TomatoHelp/ECare-happy.png');
    const [statusText, setStatusText] = useState('Loading data...');
    const [gasStatusClass, setGasStatusClass] = useState('');
    const [gasStatusText, setGasStatusText] = useState('--');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      // Changed dbPath to fetch directly from the root
      const dbRef = ref(db, '/');
      console.log("Attempting to fetch emergency care data from Realtime Database path:", dbRef);

      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log("Emergency care data fetched from root:", data);
            const gas = data.gasLevel ?? 0; // Access directly from root
            setGasLevel(gas);

            if (gas <= 30) {
              setGasStatusText('Low ✅');
              setGasStatusClass('status-good');
              setStatusImage('/-TomatoHelp/ECare-happy.png');
              setStatusText('Chill Chill… No Fire… I’M COOL');
            } else {
              setGasStatusText('High ❌');
              setGasStatusClass('status-bad');
              setStatusImage('/-TomatoHelp/ECare-sad.png');
              setStatusText('Help! Help! Fire fire...I’M WORRIED');
            }
          } else {
            console.log("No gas level data found for Emergency Care in Realtime Database.");
            setGasLevel(null);
            setStatusImage('/-TomatoHelp/ECare-happy.png');
            setStatusText('Loading data...');
            setGasStatusClass('');
            setGasStatusText('--');
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching emergency care data from Realtime Database:", error);
          setIsLoading(false);
        });
        return () => unsubscribe();
      }, 1000);
      return () => clearTimeout(timer);
    }, [db, isAuthReady]); // No appId dependency here

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-4 text-center text-4xl font-extrabold text-red-400">Emergency Care</h2>

        <div className="table-responsive w-full max-w-2xl mx-auto mb-8 rounded-lg overflow-hidden shadow-xl">
          <table className="table table-bordered table-dark w-full">
            <thead>
              <tr className="bg-gray-800 text-gray-200 text-lg">
                <th className="p-3">Presence of Fire</th>
                <th className="p-3">Current Value</th>
                <th className="p-3">Ideal Range</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-700">
                <td className="p-3">Smoke</td>
                <td className="p-3">{gasLevel !== null ? `${gasLevel}%` : '--'}</td>
                <td className="p-3">0% - 30%</td>
                <td className={`p-3 ${gasStatusClass}`}>{gasLevel !== null ? gasStatusText : (isLoading ? '...' : '--')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="emergency-status-display-wrapper mt-8">
          {isLoading ? (
            <div className="text-center text-lg font-semibold">Loading data...</div>
          ) : (
            <>
              <img
                id="statusImage"
                src={statusImage}
                className="mx-auto"
                alt="Status Image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                  console.error(`Failed to load image: ${statusImage}`);
                }}
              />
              <div className="caption-text" id="statusText">{statusText}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Sowing Component
  const Sowing = ({ db, isAuthReady }) => { // Removed appId, as data is at root
    const [sensorData, setSensorData] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      // Changed dbPath to fetch directly from the root
      const dbRef = ref(db, '/');
      console.log("Attempting to fetch sowing data from Realtime Database path:", dbRef);

      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            console.log("Sowing data fetched from root:", data);
            setSensorData({
              temperature: data.temperature ?? null, // Access directly from root
              humidity: data.humidity ?? null,     // Access directly from root
              soilMoisture: data.soilMoisture ?? null, // Access directly from root
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
    }, [db, isAuthReady]); // No appId dependency here

    const { temperature, humidity, soilMoisture } = sensorData;

    const tempGood = temperature !== null && temperature >= 18 && temperature <= 25;
    const humGood = humidity !== null && humidity >= 60 && humidity <= 70;
    const moistGood = soilMoisture !== null && soilMoisture >= 40 && soilMoisture <= 60;

    const getStatusClass = (isGood) => (isGood ? 'status-good' : 'status-bad');
    const getStatusText = (isGood) => (isGood ? 'Good ✅' : 'Bad ❌');

    const isReadyForSowing = tempGood && humGood && moistGood;

    const renderSowingStatus = () => {
      if (isLoading) {
        return (
          <div className="text-center text-lg font-semibold response-block">Loading data...</div>
        );
      } else if (isReadyForSowing) {
        return (
          <div className="response-block">
            <img
              src="/-TomatoHelp/Sow-happy.png"
              alt="Happy Tomato"
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                console.error("Failed to load image: /-TomatoHelp/Sow-happy.png");
              }}
            />
            <div className="caption-text">I am ready for sowing</div>
          </div>
        );
      } else {
        return (
          <div className="response-block">
            <img
              src="/-TomatoHelp/Sow-sad.png"
              alt="Sad Tomato"
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/250x150/000000/FFFFFF?text=Image+Load+Error';
                console.error("Failed to load image: /-TomatoHelp/Sow-sad.png");
              }}
            />
            <div className="caption-text">I am not ready for sowing</div>
          </div>
        );
      }
    };

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-4 text-center text-4xl font-extrabold text-yellow-400">Sowing Readiness</h2>

        <div className="table-responsive w-full max-w-2xl mx-auto mb-8 rounded-lg overflow-hidden shadow-xl">
          <table className="table table-bordered table-dark w-full">
            <thead>
              <tr className="bg-gray-800 text-gray-200 text-lg">
                <th className="p-3">Parameter</th>
                <th className="p-3">Current Value</th>
                <th className="p-3">Ideal Range</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-700">
                <td className="p-3">Temperature (°C)</td>
                <td className="p-3">{temperature !== null ? temperature : '-'}</td>
                <td className="p-3">18 - 25</td>
                <td className={`p-3 ${getStatusClass(tempGood)}`}>{temperature !== null ? getStatusText(tempGood) : '-'}</td>
              </tr>
              <tr className="bg-gray-600">
                <td className="p-3">Humidity (%)</td>
                <td className="p-3">{humidity !== null ? humidity : '-'}</td>
                <td className="p-3">60 - 70</td>
                <td className={`p-3 ${getStatusClass(humGood)}`}>{humidity !== null ? getStatusText(humGood) : '-'}</td>
              </tr>
              <tr className="bg-gray-700">
                <td className="p-3">Soil Moisture (%)</td>
                <td className="p-3">
                  {soilMoisture !== null ?
                    (soilMoisture === 0 ? '0 (No Data)' : soilMoisture)
                    : '-'}
                </td>
                <td className="p-3">40 - 60</td>
                <td className={`p-3 ${getStatusClass(moistGood)}`}>
                  {soilMoisture !== null ? getStatusText(moistGood) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="caption-container flex-col items-center">
          {renderSowingStatus()}
        </div>
      </div>
    );
  };

  // Harvest Component
  const Harvest = ({ db, userId, isAuthReady, storage, appId }) => {
    const [formData, setFormData] = useState({
      harvestDate: '',
      quantity: '',
      quality: '',
      notes: '',
      photoFile: null,
      photoURL: '',
    });
    const [harvestRecords, setHarvestRecords] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);

    // Fetch harvest records from Firebase
    useEffect(() => {
      if (!db || !isAuthReady) { // Removed userId dependency as records are public
        return;
      }

      // Changed path to fetch harvestRecords directly from the root
      const harvestRef = ref(db, `harvestRecords`);
      console.log("Attempting to fetch harvest records from Realtime Database path:", harvestRef);

      const unsubscribe = onValue(harvestRef, (snapshot) => {
        const data = snapshot.val();
        const loadedRecords = [];
        for (let key in data) {
          loadedRecords.push({
            id: key,
            ...data[key]
          });
        }
        loadedRecords.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));
        setHarvestRecords(loadedRecords);
        setIsLoadingRecords(false);
      }, (error) => {
        console.error("Error fetching harvest records:", error);
        setMessage('Error loading harvest records.');
        setIsLoadingRecords(false);
      });

      return () => unsubscribe();
    }, [db, isAuthReady]); // Removed userId dependency

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({ ...prev, photoFile: file }));
      } else {
        setFormData(prev => ({ ...prev, photoFile: null }));
      };
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!db || !userId || !storage || !appId) {
        setMessage('Firebase services not fully initialized. Please wait or check console for errors.');
        console.error("Firebase services (db, auth, storage, or appId) are not initialized.");
        return;
      }

      if (!formData.harvestDate || !formData.quantity || !formData.quality) {
        setMessage('Please fill in Harvest Date, Quantity, and Quality.');
        return;
      }

      let uploadedPhotoURL = '';
      if (formData.photoFile) {
        try {
          const file = formData.photoFile;
          // Storage path still uses appId and userId for organization within storage
          const filePath = `artifacts/${appId}/users/${userId}/harvest_images/${Date.now()}_${file.name}`;
          console.log("Attempting to upload image to Storage path:", filePath);
          const imageRef = storageRef(storage, filePath);

          await uploadBytes(imageRef, file);
          uploadedPhotoURL = await getDownloadURL(imageRef);
          console.log("Image uploaded successfully. Download URL:", uploadedPhotoURL);
        } catch (error) {
          console.error("Error uploading image to Firebase Storage:", error);
          setMessage(`Failed to upload image: ${error.message || 'Unknown error'}. Check Storage rules.`);
          return;
        }
      }

      try {
        // Changed path to push harvestRecords directly to the root
        const dbPath = `harvestRecords`;
        console.log("Attempting to add harvest record to Realtime Database path:", dbPath);
        const newRecordRef = push(ref(db, dbPath));
        await set(newRecordRef, {
          harvestDate: formData.harvestDate,
          quantity: parseFloat(formData.quantity),
          quality: formData.quality,
          notes: formData.notes,
          photoURL: uploadedPhotoURL,
          timestamp: Date.now(),
          userId: userId, // Store userId with the record even if data path is public
        });
        setMessage('Harvest record submitted successfully!');
        setFormData({
          harvestDate: '',
          quantity: '',
          quality: '',
          notes: '',
          photoFile: null,
          photoURL: '',
        });
        const fileInput = document.getElementById('photoInput');
        if (fileInput) fileInput.value = '';

        setTimeout(() => {
          setMessage('');
        }, 3000);

      } catch (error) {
        console.error("Error submitting harvest record to Realtime Database:", error);
        setMessage(`Failed to submit harvest record: ${error.message || 'Unknown error'}.`);
      }
    };

    const handleDeleteRecord = async (recordId, photoUrl) => {
      if (!db || !userId || !appId || !storage) {
        setMessage('Firebase not initialized, user not authenticated, or appId/storage not available. Cannot delete record.');
        return;
      }
      try {
        // Changed path to remove harvestRecords directly from the root
        const dbPath = `harvestRecords/${recordId}`;
        console.log("Attempting to delete harvest record from Realtime Database path:", dbPath);
        const recordRef = ref(db, dbPath);
        await remove(recordRef);

        // If there's an associated photo, delete it from Storage
        if (photoUrl) {
          const pathRegex = /o\/(.+)\?alt/;
          const match = photoUrl.match(pathRegex);
          let storagePath = null;
          if (match && match[1]) {
            storagePath = decodeURIComponent(match[1]);
          }

          if (storagePath) {
            const imageRef = storageRef(storage, storagePath);
            console.log("Attempting to delete image from Storage path:", storagePath);
            await deleteObject(imageRef);
            console.log("Associated image deleted from Storage.");
          } else {
            console.warn("Could not extract storage path from photoURL:", photoUrl);
          }
        }

        setMessage('Harvest record deleted successfully!');
      } catch (error) {
        console.error("Error deleting harvest record:", error);
        setMessage('Failed to delete harvest record. Please try again.');
      }
    };

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-4 text-center text-4xl font-extrabold text-orange-400">Harvest Data</h2>

        <div className="harvest-form-container w-full max-w-xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="harvestDate" className="form-label block text-gray-200 text-sm font-bold mb-2">Harvest Date</label>
              <input
                type="date"
                className="form-control w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="harvestDate"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="quantity" className="form-label block text-gray-200 text-sm font-bold mb-2">Quantity</label>
              <input
                type="number"
                className="form-control w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="quantity"
                name="quantity"
                placeholder="e.g., 15 kg"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="quality" className="form-label block text-gray-200 text-sm font-bold mb-2">Quality</label>
              <input
                type="text"
                className="form-control w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="quality"
                name="quality"
                placeholder="e.g., Good, Firm"
                value={formData.quality}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="notes" className="form-label block text-gray-200 text-sm font-bold mb-2">Notes</label>
              <textarea
                className="form-control w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="notes"
                name="notes"
                rows="3"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="photoInput" className="form-label block text-gray-200 text-sm font-bold mb-2">Photo</label>
              <input
                type="file"
                className="form-control w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                id="photoInput"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formData.photoFile && <small className="text-gray-400 mt-1 block">Selected: {formData.photoFile.name}</small>}
            </div>

            {message && <div className="bg-blue-900 text-blue-200 p-3 rounded-md mt-4 text-sm">{message}</div>}

            <div className="flex justify-center mt-6">
              <button type="submit" className="btn btn-success p-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out w-full max-w-xs" >
                Submit
              </button>
            </div>
          </form>
        </div>

        <h2 className="mb-4 mt-8 text-center text-4xl font-extrabold text-orange-400">Harvest Records</h2>

        <div className="harvest-records-table-container w-full max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
          {isLoadingRecords ? (
            <div className="text-center text-lg font-semibold text-gray-400">Loading harvest records...</div>
          ) : harvestRecords.length === 0 ? (
            <div className="text-center text-lg font-semibold text-gray-400">No harvest records found.</div>
          ) : (
            <div className="table-responsive overflow-x-auto">
              <table className="table table-bordered table-dark w-full text-left">
                <thead>
                  <tr className="bg-gray-700 text-gray-200 text-md">
                    <th className="p-3 whitespace-nowrap">Harvest Date</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Photo</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {harvestRecords.map(record => {
                    const displayImageSrc = record.photoURL || 'https://placehold.co/100x70/000000/FFFFFF?text=No+Image';
                    return (
                      <tr key={record.id} className="bg-gray-600 even:bg-gray-700">
                        <td className="p-3 whitespace-nowrap">{record.harvestDate}</td>
                        <td className="p-3">{record.quantity} kg</td>
                        <td className="p-3">{record.quality}</td>
                        <td className="p-3">{record.notes || '-'}</td>
                        <td className="p-3">
                          <img
                            src={displayImageSrc}
                            alt={record.notes || "Harvest Photo"}
                            className="img-thumbnail rounded-md shadow-sm"
                            style={{ maxWidth: '100px', maxHeight: '70px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/100x70/000000/FFFFFF?text=Error';
                              console.error(`Failed to load image from URL: ${displayImageSrc}`);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteRecord(record.id, record.photoURL)} // Pass photoURL to delete
                            className="btn btn-danger p-2 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300 ease-in-out"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

const Home = ({ setCurrentPage, user }) => { // Added user and setCurrentPage props
  return (
    <div
      className="main-content flex-grow flex items-center justify-center p-4 pt-24 min-h-screen bg-cover bg-center font-inter"
      style={{ backgroundImage: `url("https://images-prod.healthline.com/hlcmsresource/images/AN_images/tomatoes-1296x728-feature.jpg")` }}
    >
      <div className="content-box bg-black/50 px-10 py-6 rounded-[30px] shadow-2xl text-white text-center w-full max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-wide leading-tight">
          Welcome to TomatoHelp
        </h1>
        <p className="text-base md:text-lg text-white/80 tracking-wide leading-relaxed">
          Your ultimate companion for nurturing healthy and thriving tomato plants. Get real-time environmental data, learn about sowing, general and emergency care, and log your harvests.
        </p>
        {/* Show user info if authenticated, otherwise prompt for login */}
        {user && !user.isAnonymous ? (
          <div className="user-info text-center mt-6">
            <p className="text-xl text-gray-200 mb-4">Hello, {user.email || "Gardener"}!</p>
            <p className="text-md text-gray-400">Your User ID: <span className="font-mono bg-gray-800 p-2 rounded-md break-all">{user.uid}</span></p>
            <p className="text-lg text-gray-300 mt-6">
              Navigate using the menu above to explore your tomato data.
            </p>
          </div>
        ) : (
          <div className="auth-prompt mt-6">
            <p className="text-lg text-gray-300 mb-4">Please log in to manage your harvest records.</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition duration-300 ease-in-out"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


  // Login Component: Handles user login with email/password and Google
  const Login = ({ auth, setCurrentPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoggingIn(true);
      if (!auth) {
        setError("Firebase Auth not initialized.");
        setIsLoggingIn(false);
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setCurrentPage('home'); // Redirect to home on successful login
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
            case 'auth/invalid-credential': // More generic for failed login
              errorMessage = 'Invalid email or password.';
              break;
            default:
              errorMessage = err.message;
          }
        }
        setError(errorMessage);
        console.error("Authentication error:", err);
      } finally {
        setIsLoggingIn(false);
      }
    };

    // Google login function
    const handleGoogleLogin = async () => {
      setError('');
      setIsLoggingIn(true);
      if (!auth) {
        setError("Firebase Auth not initialized.");
        setIsLoggingIn(false);
        return;
      }
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        setCurrentPage('home'); // Redirect to home on successful Google login
      } catch (err) {
        console.error("Error logging in with Google:", err);
        setError(err.message);
      } finally {
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="main-content flex-grow flex items-center justify-center p-4 min-h-screen bg-gray-900 font-inter">
        <div className="auth-box login-design-override p-8 rounded-2xl w-full relative"> {/* Removed max-w-xl here */}
          <h2 className="mb-6 text-3xl font-bold text-white text-center">Login to TomatoHelp</h2>
          <form onSubmit={handleLogin} className="flex flex-col items-center"> {/* Centering form content */}
            <div className="mb-4 w-full"> {/* Full width for input containers */}
              <label htmlFor="emailInput" className="form-label block text-white text-base font-medium mb-2 text-left">Email address</label>
              <input
                type="email"
                className="form-control w-full p-3 rounded-lg bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6 w-full"> {/* Full width for input containers */}
              <label htmlFor="passwordInput" className="form-label block text-white text-base font-medium mb-2 text-left">Password</label>
              <input
                type="password"
                id="passwordInput"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent border-gray-500" /* Changed text-gray-700 to text-white */
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="bg-red-900 text-red-200 p-3 rounded-md mt-4 text-sm w-full">{error}</div>}
            <div className="d-grid gap-2 mt-6 w-full">
              <button
                type="submit"
                className="btn btn-success w-full p-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging In...' : 'Login'}
              </button>
            </div>
          </form>
          {/* Google Login button added below the main login button */}
          <div className="d-grid gap-2 mt-4 w-full">
            <button
              onClick={handleGoogleLogin}
              className="btn w-full p-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out text-white flex items-center justify-center"
              disabled={isLoggingIn}
            >
              {/* Adjusted Google SVG size to w-5 h-5 for a slightly larger logo */}
              <svg className="w-5 h-5 mr-2" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path d="M533.5 272.3c0-18.7-1.5-36.9-4.7-54.7H272.7v104.9h146.4c-6.6 34.6-26.6 63.9-56.7 83.7l-0.3 1.9 88.5 68.6 0.8 1.4c52.2-48.2 82.5-118.8 82.5-200.8z" fill="#4285F4"/><path d="M272.7 544.3c73.3 0 134.9-24.2 179.6-65.7l-89.2-68.9c-24.8 16.5-56.4 26.5-90.4 26.5-69.5 0-128.3-46.7-149.2-109.1l-1.3-0.7-8.9 69.9-0.5 1.7C90.2 467.4 177.5 544.3 272.7 544.3z" fill="#34A853"/><path d="M123.5 329.3c-11.4-32.3-11.4-66.9 0-99.2l-0.8-2.6-86.8-67.1-1.6 0.9C10.7 190 0 229.8 0 272.3s10.7 82.3 29.5 119l87.6 67.8 0.8-2.6z" fill="#FBBC04"/><path d="M272.7 107.5c39.1 0 74.5 13.9 102.1 39.5l75.4-75.4C407.8 24.5 345.5 0 272.7 0 177.5 0 90.2 76.9 29.5 160.7l87.6 67.8C144.4 154.2 203.2 107.5 272.7 107.5z" fill="#EA4335"/></svg>
              {isLoggingIn ? 'Signing In...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    );
  };


  // SignUp Component: Not directly linked or used in navigation for this scenario
  const SignUp = ({ auth, setCurrentPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleSignUp = async (e) => {
      e.preventDefault();
      setError('');
      setIsSigningUp(true);
      if (!auth) {
        setError("Firebase Auth not initialized.");
        setIsSigningUp(false);
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setCurrentPage('home');
      } catch (err) {
        console.error("Error signing up:", err);
        setError(err.message);
      } finally {
        setIsSigningUp(false);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 pt-24 pb-12">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-3xl font-extrabold text-center text-green-400 mb-6">Sign Up</h2>
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="signup-email">
                Email
              </label>
              <input
                type="email"
                id="signup-email"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-700 border-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="signup-password">
                Password
              </label>
              <input
                type="password"
                id="signup-password"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-700 border-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSigningUp}
              >
                {isSigningUp ? 'Signing Up...' : 'Sign Up'}
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
        <div className="main-content flex-grow flex items-center justify-center p-4 pt-24 min-h-screen bg-gray-900 font-inter">
          <div className="content-box bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-2xl text-white text-center border border-gray-700">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-teal-300">Loading...</h1>
            <p className="text-lg text-gray-200">Initializing application.</p>
          </div>
        </div>
      );
    }

    // If user is not authenticated (or is anonymous)
    if (!user || user.isAnonymous) {
      // If currentPage is anything other than 'login', force it to 'login'
      if (currentPage !== 'login') {
        setCurrentPage('login'); // This will trigger a re-render
        // For the current render cycle, still return the Login component directly
        return <Login auth={auth} setCurrentPage={setCurrentPage} />;
      }
      // If currentPage is already 'login', just render it
      return <Login auth={auth} setCurrentPage={setCurrentPage} />;
    }

    // If user is authenticated (not anonymous), render the requested page
    switch (currentPage) {
      case 'home':
        return <Home user={user} setCurrentPage={setCurrentPage} />;
      case 'environmental':
        return <EnvironmentalData db={db} isAuthReady={isAuthReady} />;
      case 'sowing':
        return <Sowing db={db} isAuthReady={isAuthReady} />;
      case 'care_general':
        return <GeneralCare db={db} isAuthReady={isAuthReady} />;
      case 'care_emergency':
        return <EmergencyCare db={db} isAuthReady={isAuthReady} />;
      case 'harvest':
        return <Harvest db={db} userId={user.uid} isAuthReady={isAuthReady} storage={storage} appId={appId} />;
      case 'login': // If logged in, going to login page should redirect to home
        setCurrentPage('home'); // User is logged in, no need for login page
        return <Home user={user} setCurrentPage={setCurrentPage} />; // Render Home directly after setting current page
      default:
        return <Home user={user} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div style={{
      backgroundImage: `url('https://images-prod.healthline.com/hlcmsresource/images/AN_images/tomatoes-1296x728-feature.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: currentPage === 'login' ? '0px' : '70px', // No padding-top if on login page
    }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"/>
      <script src="https://cdn.tailwindcss.com"></script>

      <style>
        {`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          .app-container {
            padding-top: 4rem; /* Adjust based on navbar height to prevent content overlap */
            background-color: #1a202c; /* bg-gray-900 */
            color: #e2e8f0; /* text-gray-200 */
            min-height: 100vh;
          }
          .content {
            background: rgba(0, 0, 0, 0.7);
            padding: 2.5rem;
            border-radius: 1.5rem;
            max-width: 950px;
            margin: 2rem auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
          }
          table {
            color: white;
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: center;
            vertical-align: middle;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          thead th {
            background-color: rgba(255, 255, 255, 0.1);
            font-weight: 700;
          }
          tbody tr:nth-child(odd) {
            background-color: rgba(255, 255, 255, 0.05);
          }
          tbody tr:hover {
            background-color: rgba(255, 255, 255, 0.15);
          }
          .status-good {
            color: #4CAF50;
            font-weight: bold;
          }
          .status-bad {
            color: #FF6347;
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
          .response-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.8rem;
            background: rgba(255, 255, 255, 0.08);
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
          }
          .caption-container img, .emergency-status-display-wrapper img {
            max-width: 250px;
            border-radius: 1.5rem;
            box-shadow: 0 0 15px rgba(0,0,0,0.6);
            width: 100%;
            height: auto;
          }
          .caption-text {
            margin-top: 0.5rem;
            font-size: 1.3rem;
            font-weight: 600;
            color: #E0E0E0;
          }
          footer {
            color: rgba(255, 255, 255, 0.7);
            text-align: center;
            padding: 1.5rem 0 2rem;
            font-size: 0.9rem;
            margin-top: auto;
          }
          .reading-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
            width: 100%;
            margin-bottom: 2rem;
          }
          .reading-box {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 1.5rem;
            padding: 2rem;
            margin: 0.75rem;
            text-align: center;
            flex: 1 1 200px;
            max-width: 240px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.4);
            transition: transform 0.2s ease-in-out;
          }
          .reading-box:hover {
            transform: translateY(-5px);
          }
          .circle {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.35);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2.8rem;
            font-weight: bold;
            color: white;
            margin: 0 auto 0.75rem;
            border: 3px solid rgba(255, 255, 255, 0.4);
          }
          .label {
            font-size: 1.3rem;
            font-weight: 600;
            margin-top: 0.75rem;
            color: #C0C0C0;
          }

          .main-content {
            /* Ensures the container takes full height and uses flexbox to center its child */
            flex-grow: 1;
            display: flex;
            justify-content: center; /* Centers horizontally */
            align-items: center;   /* Centers vertically */
            width: 100%;
            padding: 1rem;
          }

          .content-box {
            background: rgba(0, 0, 0, 0.75);
            padding: 3rem 4rem;
            border-radius: 2rem;
            text-align: center;
            max-width: 800px;
            width: fit-content;
            margin: auto;
            box-shadow: 0 15px 30px rgba(0,0,0,0.8);
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
          }

          .content-box h1 {
            font-family: 'Inter', sans-serif;
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 0.8rem;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
            line-height: 1.1;
            letter-spacing: 0.08em;
            color: white;
          }

          .content-box p {
            font-family: 'Inter', sans-serif;
            font-size: 1.25rem;
            margin-top: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            font-weight: 500;
            letter-spacing: 0.03em;
            line-height: 1.5;
            color: gray;
          }

          .harvest-form-container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 1rem;
            margin-bottom: 3rem;
            width: 100%;
            max-width: 500px;
            text-align: left;
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
            border-radius: 0.5rem;
          }

          .harvest-form-container .form-control::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }

          .harvest-form-container .form-control:focus {
            background-color: rgba(255, 255, 255, 0.3);
            border-color: #88b04b;
            box-shadow: 0 0 0 0.25rem rgba(136, 176, 75, 0.25);
            color: white;
          }

          .harvest-form-container .btn {
            border-radius: 0.5rem;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
            margin: 0 0.5rem;
          }

          .harvest-records-table-container {
            width: 100%;
            max-width: 800px;
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 1rem;
          }

          .harvest-records-table-container .table {
            margin-bottom: 0;
          }

          .harvest-records-table-container .table th,
          .harvest-records-table-container .table td {
            border-color: rgba(255, 255, 255, 0.2);
          }

          .harvest-records-table-container .table img {
            object-fit: cover;
            width: 100px;
            height: 70px;
          }

          .auth-box {
            /* This ensures all direct children of auth-box are centered horizontally */
            display: flex;
            flex-direction: column;
            align-items: center; 
            justify-content: center;
            margin: auto; /* Added for horizontal centering */
          }
          
          /* Specific styles for the login box to match the image */
          .auth-box.login-design-override {
              background: rgba(255, 100, 50, 0.15); /* Orange-red tint with transparency */
              border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle border */
              box-shadow: 0 5px 15px rgba(0,0,0,0.3); /* Softer shadow */
              backdrop-filter: blur(12px); /* Stronger blur effect */
              position: relative;
              border-radius: 1.2rem; /* More subtle rounded corners */

              /* Responsive width and padding */
              width: 90%; /* Take 90% of available width on all screens */
              padding: 2rem; /* Default padding for mobile */

              /* Explicitly setting margin-left and margin-right to auto to ensure centering */
              margin-left: auto;
              margin-right: auto;

              @media (min-width: 640px) { /* sm breakpoint */
                  max-width: 400px; /* Constrain width for small tablets */
                  padding: 2.5rem;
              }
              @media (min-width: 768px) { /* md breakpoint (larger tablets, small laptops) */
                  max-width: 550px; /* Wider for medium screens */
                  padding: 3rem;
              }
              @media (min-width: 1024px) { /* lg breakpoint (most laptops, desktops) */
                  max-width: 700px; /* Significantly wider for PC */
                  padding: 3.5rem;
              }
              @media (min-width: 1280px) { /* xl breakpoint (larger desktops) */
                  max-width: 850px; /* Even wider for large monitors */
                  padding: 4rem;
              }
              @media (min-width: 1536px) { /* 2xl breakpoint (very large desktops) */
                  max-width: 950px; /* Maximum width on very large screens */
                  padding: 4.5rem;
              }
          }

          /* Adjust font sizes within the auth box for responsiveness */
          .auth-box h2 {
            font-size: 2.25rem; /* Default for mobile (3xl in Tailwind) */
            @media (min-width: 768px) {
                font-size: 2.5rem; /* Larger on tablets (4xl in Tailwind) */
            }
            @media (min-width: 1024px) {
                font-size: 3rem; /* Even larger on PC (5xl in Tailwind) */
            }
          }

          .auth-box .form-label {
            font-size: 1rem; /* Default for mobile (base in Tailwind) */
            @media (min-width: 768px) {
                font-size: 1.125rem; /* Slightly larger on tablets (lg in Tailwind) */
            }
            @media (min-width: 1024px) {
                font-size: 1.25rem; /* Larger on PC (xl in Tailwind) */
            }
          }

          .auth-box .form-control {
            padding: 0.8rem 1rem; /* Default for mobile */
            @media (min-width: 768px) {
                padding: 1rem 1.2rem; /* Larger padding for inputs */
            }
          }

          .auth-box .btn {
            padding: 0.75rem 1.5rem; /* Default for mobile */
            @media (min-width: 768px) {
                padding: 1rem 2rem; /* Larger buttons */
            }
          }

          @media (max-width: 991.98px) {
            .content {
              padding-top: 4rem;
              padding: 1.5rem;
              margin: 1rem auto;
            }
            .content-box {
              padding: 2rem 2.5rem;
              max-width: 90%;
              width: auto;
            }
            .content-box h1 {
              font-size: 2.5rem;
              white-space: normal;
              letter-spacing: 0.05em;
            }
            .content-box p {
              font-size: 1rem;
              white-space: normal;
              letter-spacing: 0.02em;
            }
            .harvest-form-container, .harvest-records-table-container {
              max-width: 95%;
              padding: 1.5rem;
            }
            .harvest-form-container .btn {
              margin: 0.5rem 0;
              width: 100%;
            }
            .flex-col.sm:flex-row {
              flex-direction: column;
            }
            .sm:space-x-2 {
              space-x: 0;
            }
            .reading-box {
              flex: 1 1 150px;
              max-width: 180px;
              padding: 1.5rem;
            }
            .circle {
              width: 100px;
              height: 100px;
              font-size: 2rem;
            }
            .label {
              font-size: 1rem;
            }
            .caption-container img, .emergency-status-display-wrapper img {
              max-width: 200px;
            }
            .emergency-status-display-wrapper {
              max-width: 90%;
            }
          }
        `}
      </style>

      {/* Navbar only visible if not on the login page */}
      {currentPage !== 'login' && <Navbar />}
      {renderAppContent()}
      <footer>
        © 2025 TomatoHelp. All rights reserved.
      </footer>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
}

export default App;
