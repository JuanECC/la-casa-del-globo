 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rosa/30 via-white to-cielo/30 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-sm border border-rosa/20 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🎈</span>
          <h1 className="text-3xl font-bold text-texto-suave mt-3">La Casa del Globo</h1>
          <p className="text-rosa-oscuro italic mt-1">Inflamos sonrisas</p>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-50 p-2 rounded-xl">{error}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none mb-4 text-texto-suave"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-rosa-oscuro outline-none mb-6 text-texto-suave"
          required
        />
        <button type="submit" className="w-full bg-rosa-oscuro hover:bg-rosa text-white py-3 rounded-full font-medium transition-colors shadow-md">
          Iniciar sesión
        </button>
        <p className="text-center text-sm text-texto-suave/60 mt-6 italic">
          “Inflamos sonrisas”
        </p>
      </form>
    </div>
  );
}