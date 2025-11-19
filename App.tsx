import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import RevisionPlan from './components/RevisionPlan';
import MemorizationCards from './components/MemorizationCards';
import ComprehensionHelper from './components/ComprehensionHelper';
import Quiz from './components/Quiz';
import Profile from './components/Profile';
import { UserProfile } from './types';

type ActiveTab = 'revision' | 'memorization' | 'comprehension' | 'quiz' | 'profile';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('revision');

  // Load user profile on initial load
  useEffect(() => {
    const savedUserEmail = localStorage.getItem('revisionProUser');
    if (savedUserEmail) {
      const savedProfileJSON = localStorage.getItem(`revisionProProfile_${savedUserEmail}`);
      if (savedProfileJSON) {
        setUserProfile(JSON.parse(savedProfileJSON));
      } else {
        // Migration from old system
        const savedHistory = localStorage.getItem(`revisionProHistory_${savedUserEmail}`);
        const profile: UserProfile = {
          email: savedUserEmail,
          history: savedHistory ? JSON.parse(savedHistory) : [],
        };
        setUserProfile(profile);
        localStorage.setItem(`revisionProProfile_${savedUserEmail}`, JSON.stringify(profile));
        localStorage.removeItem(`revisionProHistory_${savedUserEmail}`);
      }
    }
  }, []);

  const saveProfile = (profile: UserProfile) => {
    localStorage.setItem(`revisionProProfile_${profile.email}`, JSON.stringify(profile));
  };

  const handleLogin = (email: string) => {
    const savedProfileJSON = localStorage.getItem(`revisionProProfile_${email}`);
    const profile: UserProfile = savedProfileJSON ? JSON.parse(savedProfileJSON) : { email, history: [] };
    localStorage.setItem('revisionProUser', email);
    setUserProfile(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('revisionProUser');
    setUserProfile(null);
  };

  const handleClearHistory = () => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, history: [] };
      setUserProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
  };

  const updateHistory = useCallback((newEntry: string) => {
    setUserProfile(currentProfile => {
      if (!currentProfile) return null;
      const updatedProfile = { ...currentProfile, history: [...currentProfile.history, newEntry] };
      saveProfile(updatedProfile);
      return updatedProfile;
    });
  }, []);

  const handleUpdateProfile = useCallback((updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    saveProfile(updatedProfile);
  }, []);

  const renderTabContent = () => {
    if (!userProfile) return null;
    switch (activeTab) {
      case 'revision':
        return <RevisionPlan userProfile={userProfile} updateHistory={updateHistory} />;
      case 'memorization':
        return <MemorizationCards userProfile={userProfile} updateHistory={updateHistory} />;
      case 'comprehension':
        return <ComprehensionHelper userProfile={userProfile} updateHistory={updateHistory} />;
      case 'quiz':
        return <Quiz userProfile={userProfile} updateHistory={updateHistory} />;
      case 'profile':
        return <Profile userProfile={userProfile} onLogout={handleLogout} onClearHistory={handleClearHistory} onUpdateProfile={handleUpdateProfile} />;
      default:
        return null;
    }
  };

  if (!userProfile) {
    return <Login onLogin={handleLogin} />;
  }

  const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-indigo-600 text-white shadow'
          : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.063a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM3.5 5.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13zM10 18a.75.75 0 00.75-.75v-.063a.75.75 0 00-1.5 0v.063c0 .414.336.75.75.75zM5.22 7.22a.75.75 0 001.06 0L10 3.47l3.72 3.75a.75.75 0 101.06-1.06L10.53 2.47a.75.75 0 00-1.06 0L5.22 6.16a.75.75 0 000 1.06zM14.78 12.78a.75.75 0 00-1.06 0L10 16.53l-3.72-3.75a.75.75 0 10-1.06 1.06l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 000-1.06z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">Révision Pro</h1>
          </div>
          <div className="text-sm text-gray-600">
            Connecté en tant que: <span className="font-semibold text-indigo-700">{userProfile.email}</span>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-white/50 backdrop-blur-sm p-2 rounded-lg shadow-inner mb-6">
            <div className="flex flex-wrap gap-2">
                <TabButton tab="revision" label="Plan de Révision" />
                <TabButton tab="memorization" label="Fiches & Audio" />
                <TabButton tab="comprehension" label="Aide Compréhension" />
                <TabButton tab="quiz" label="Quiz Interactif" />
                <TabButton tab="profile" label="Profil & Personnalisation" />
            </div>
        </div>
        
        {renderTabContent()}
      </main>
    </div>
  );
};

export default App;
