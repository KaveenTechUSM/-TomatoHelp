import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions

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
      default: return 'home';
    }
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());
  // State for Firebase instances and user object
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null); // Firebase Storage instance
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase Initialization and Authentication
  useEffect(() => {
    try {
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
      const realtimeDb = getDatabase(app);
      const firebaseAuth = getAuth(app);
      const firebaseStorage = getStorage(app); // Get Firebase Storage instance

      setDb(realtimeDb);
      setAuth(firebaseAuth);
      setStorage(firebaseStorage); // Set Storage instance

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          if (typeof __initial_auth_token !== 'undefined') {
            try {
              await signInWithCustomToken(firebaseAuth, __initial_auth_token);
              setUser(firebaseAuth.currentUser);
            } catch (error) {
              console.error("Error signing in with custom token:", error);
              await signInAnonymously(firebaseAuth);
              setUser(firebaseAuth.currentUser);
            }
          } else {
            await signInAnonymously(firebaseAuth);
            setUser(firebaseAuth.currentUser);
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
          setCurrentPage('home');
          window.location.hash = '#home';
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
              {/* Removed duplicate className from the following line */}
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
              {user && user.isAnonymous === false && (
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

  // EnvironmentalData Component
  const EnvironmentalData = ({ db, userId, isAuthReady }) => {
    const [envData, setEnvData] = useState({
      temperature: '--',
      humidity: '--',
      soilMoisture: '--',
      gasLevel: '--',
    });

    useEffect(() => {
      if (!db || !isAuthReady) {
        console.log("DB or Auth not ready for Environmental Data component.");
        return;
      }

      const dbRef = ref(db, '/');

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

      return () => unsubscribe();
    }, [db, isAuthReady]);

    return (
      <div className="content p-6 pt-24 min-h-screen bg-gray-900 text-white font-inter">
        <h2 className="mb-8 text-4xl font-extrabold text-center text-green-400">Environmental Data</h2>
        <div className="reading-container">
          <div className="reading-box">
            <div className="circle bg-blue-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
              {envData.temperature}°C
            </div>
            <div className="label text-lg font-semibold text-gray-200">Temperature (°C)</div>
          </div>
          <div className="reading-box">
            <div className="circle bg-purple-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
              {envData.humidity}%
            </div>
            <div className="label text-lg font-semibold text-gray-200">Humidity (%)</div>
          </div>
          <div className="reading-box">
            <div className="circle bg-yellow-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
              {envData.soilMoisture}%
            </div>
            <div className="label text-lg font-semibold text-gray-200">Soil Moisture (%)</div>
          </div>
          <div className="reading-box">
            <div className="circle bg-red-600 shadow-md flex items-center justify-center text-white text-3xl font-bold rounded-full w-32 h-32 mx-auto mb-2">
              {envData.gasLevel}%
            </div>
            <div className="label text-lg font-semibold text-gray-200">Gas Level (%)</div>
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/');

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
    }, [db, isAuthReady]);

    const { temperature, humidity, soilMoisture } = sensorData;

    const tempGood = temperature !== null && temperature >= 18 && temperature <= 25;
    const humGood = humidity !== null && humidity >= 60 && humidity <= 70;
    const moistGood = soilMoisture !== null && soilMoisture >= 40 && soilMoisture <= 60;

    const getStatusClass = (isGood) => (isGood ? 'status-good' : 'status-bad');
    const getStatusText = (isGood) => (isGood ? 'Good ✅' : 'Bad ❌');

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

    const renderResponses = () => {
      if (isLoading) {
        return (
          <div className="text-center text-lg font-semibold">Loading data...</div>
        );
      } else if (tempGood && humGood && moistGood) {
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
                <td className="p-3">{soilMoisture !== null ? soilMoisture : '-'}</td>
                <td className={`p-3 ${getStatusClass(moistGood)}`}>{soilMoisture !== null ? getStatusText(moistGood) : '-'}</td>
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
  const EmergencyCare = ({ db, userId, isAuthReady }) => {
    const [gasLevel, setGasLevel] = useState(null);
    const [statusImage, setStatusImage] = useState('/-TomatoHelp/ECare-happy.png');
    const [statusText, setStatusText] = useState('Loading data...');
    const [gasStatusClass, setGasStatusClass] = useState('');
    const [gasStatusText, setGasStatusText] = useState('--');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/');

      const timer = setTimeout(() => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const gas = data.gasLevel ?? 0;
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
    }, [db, isAuthReady]);

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
                className="mx-auto" // Corrected: Removed duplicate className and other attributes
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
  const Sowing = ({ db, userId, isAuthReady }) => {
    const [sensorData, setSensorData] = useState({
      temperature: null,
      humidity: null,
      soilMoisture: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!db || !isAuthReady) return;

      const dbRef = ref(db, '/');

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
                <td className="p-3">{soilMoisture !== null ? soilMoisture : '-'}</td>
                <td className={`p-3 ${getStatusClass(moistGood)}`}>{soilMoisture !== null ? getStatusText(moistGood) : '-'}</td>
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
  const Harvest = ({ db, userId, isAuthReady, storage }) => {
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
    const [isLoadingRecords, setIsLoadingRecords] = useState(true); // Separate loading for records

    // Fetch harvest records from Firebase
    useEffect(() => {
      if (!db || !userId || !isAuthReady) {
        return;
      }

      const harvestRef = ref(db, `users/${userId}/harvestRecords`);

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
        setIsLoadingRecords(false); // Records loaded
      }, (error) => {
        console.error("Error fetching harvest records:", error);
        setMessage('Error loading harvest records.');
        setIsLoadingRecords(false);
      });

      return () => unsubscribe();
    }, [db, userId, isAuthReady]);

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
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!db || !userId || !storage) {
        setMessage('Firebase services not fully initialized. Please wait or check console for errors.');
        console.error("Firebase services (db, auth, or storage) are not initialized.");
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
          const filePath = `harvest_images/${userId}/${Date.now()}_${file.name}`;
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
        const newRecordRef = push(ref(db, `users/${userId}/harvestRecords`));
        await set(newRecordRef, {
          harvestDate: formData.harvestDate,
          quantity: parseFloat(formData.quantity),
          quality: formData.quality,
          notes: formData.notes,
          photoURL: uploadedPhotoURL,
          timestamp: Date.now(),
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

    const handleDeleteRecord = async (recordId) => {
      if (!db || !userId) {
        setMessage('Firebase not initialized or user not authenticated. Cannot delete record.');
        return;
      }
      try {
        const recordRef = ref(db, `users/${userId}/harvestRecords/${recordId}`);
        await remove(recordRef);
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
                            onClick={() => handleDeleteRecord(record.id)}
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

  const Home = () => (
    <div className="main-content flex-grow flex items-center justify-center p-4 pt-24 min-h-screen bg-gray-900 font-inter">
      <div className="content-box bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-2xl text-white text-center border border-gray-700">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white tracking-wide leading-tight">Welcome to TomatoHelp</h1>
        <p className="text-lg md:text-xl text-gray-200 tracking-wide leading-relaxed">Monitor your tomato growth from sowing to harvest</p>
      </div>
    </div>
  );

  // AuthPage Component for Login/Register
  const AuthPage = ({ auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
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
      <div className="main-content flex-grow flex items-center justify-center p-4 pt-24 min-h-screen bg-gray-900 font-inter">
        <div className="auth-box bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-2xl text-white text-center border border-gray-700 w-full max-w-md">
          <h2 className="mb-6 text-3xl font-bold text-teal-300">Login to TomatoHelp</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="emailInput" className="form-label block text-gray-200 text-sm font-bold mb-2 text-left">Email address</label>
              <input
                type="email"
                className="form-control w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="passwordInput" className="form-label block text-gray-200 text-sm font-bold mb-2 text-left">Password</label>
              <input
                type="password"
                className="form-control w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                id="passwordInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="bg-red-900 text-red-200 p-3 rounded-md mt-4 text-sm">{error}</div>}
            <div className="d-grid gap-2 mt-6">
              <button type="submit" className="btn btn-success w-full p-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out">
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
        <div className="main-content flex-grow flex items-center justify-center p-4 pt-24 min-h-screen bg-gray-900 font-inter">
          <div className="content-box bg-gray-800 bg-opacity-70 p-8 rounded-2xl shadow-2xl text-white text-center border border-gray-700">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-teal-300">Loading...</h1>
            <p className="text-lg text-gray-200">Initializing application.</p>
          </div>
        </div>
      );
    }

    if (!user || user.isAnonymous) {
      return <AuthPage auth={auth} />;
    }

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
        return <Harvest db={db} userId={user.uid} isAuthReady={isAuthReady} storage={storage} />;
      default:
        return <Home />;
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
      paddingTop: '70px',
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
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
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
            max-width: 450px;
            padding: 2rem;
            background: rgba(0, 0, 0, 0.75);
            border-radius: 1.5rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.6);
            border: 1px solid rgba(255, 255, 255, 0.2);
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

          .emergency-status-display-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            max-width: 350px;
            width: 100%;
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
            .harvest-form-container, .harvest-records-table-container, .auth-box {
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

      {user && !user.isAnonymous && <Navbar />}
      {renderAppContent()}
      <footer>
        © 2025 TomatoHelp. All rights reserved.
      </footer>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
}

export default App;
