import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Veuillez entrer un identifiant.');
      return;
    }
    // Basic email validation
    if (!/S+@S+.S+/.test(email) && !/^[a-zA-Z0-9_-]{3,}$/.test(email)) {
        setError('Veuillez entrer un e-mail valide ou un pseudo (au moins 3 caractères).');
        return;
    }
    onLogin(email.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.063a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM3.5 5.75a.75.75 0 000 1.5h13a.75.75 0 000-1.5h-13zM10 18a.75.75 0 00.75-.75v-.063a.75.75 0 00-1.5 0v.063c0 .414.336.75.75.75zM5.22 7.22a.75.75 0 001.06 0L10 3.47l3.72 3.75a.75.75 0 101.06-1.06L10.53 2.47a.75.75 0 00-1.06 0L5.22 6.16a.75.75 0 000 1.06zM14.78 12.78a.75.75 0 00-1.06 0L10 16.53l-3.72-3.75a.75.75 0 10-1.06 1.06l4.25 4.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 000-1.06z" clipRule="evenodd" />
             </svg>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Bienvenue sur Révision Pro</h1>
          <p className="text-gray-600 mt-2">Votre assistant d'étude personnel qui apprend avec vous.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail ou Pseudo
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Commencer ma session
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-xs text-gray-500">
            En continuant, vos données d'apprentissage (historique) seront sauvegardées localement dans votre navigateur.
        </p>
      </div>
    </div>
  );
};

export default Login;
