import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {useState, useEffect} from 'react';
import './App.css';
import {verifyToken} from './Services/api';
import {SocketProvider} from './Contexts/SocketContext.jsx';

import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import Matching from './Pages/Matching';
import Chat from './Pages/Chat';

import {ROUTES} from './Constants/values.js';
import Profile from "./Pages/Profile.jsx";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                const response = await verifyToken();
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                console.log(error)
            }

            setLoading(false);
        };

        checkAuth().catch(error => {
            setIsAuthenticated(false);
            console.log(error)
        })
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="matching-loader"></div>
            </div>
        );
    }

    return (
        <Router>
            <SocketProvider>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        <Route
                            path={ROUTES.LOGIN}
                            element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated}/> :
                                <Navigate to={ROUTES.DASHBOARD}/>}
                        />
                        <Route
                            path={ROUTES.REGISTER}
                            element={!isAuthenticated ? <Register setIsAuthenticated={setIsAuthenticated}/> :
                                <Navigate to={ROUTES.DASHBOARD}/>}
                        />

                        <Route
                            path={ROUTES.DASHBOARD}
                            element={
                                isAuthenticated
                                    ? <Dashboard isAuthenticated={isAuthenticated}
                                                 setIsAuthenticated={setIsAuthenticated}/>
                                    : <Navigate to={ROUTES.LOGIN}/>
                            }
                        />
                        <Route
                            path={ROUTES.MATCHING}
                            element={isAuthenticated ? <Matching/> : <Navigate to={ROUTES.LOGIN}/>}
                        />
                        <Route
                            path={ROUTES.PROFILE}
                            element={
                                isAuthenticated
                                    ? <Profile setIsAuthenticated={setIsAuthenticated}/>
                                    : <Navigate to={ROUTES.LOGIN}/>
                            }
                        />
                        <Route
                            path="/chat/:sessionId"
                            element={isAuthenticated ? <Chat/> : <Navigate to={ROUTES.LOGIN}/>}
                        />

                        <Route
                            path="/"
                            element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}/>}
                        />
                    </Routes>
                </div>
            </SocketProvider>
        </Router>
    );
}

export default App;
