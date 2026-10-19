import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-bold text-[var(--color-brand-green)]">Visons S.A.C.</h1>
      <p className="text-xl text-[var(--text-muted)]">Dashboard Premium en construcción...</p>
      
      {/* Botón para forzar un error 404 y probarlo */}
      <Link 
        to="/ruta-inventada-que-no-existe"
        className="px-6 py-3 bg-[var(--color-surface-dark)] text-white rounded-lg shadow-md hover:bg-black transition-colors"
      >
        Ir a una ruta secreta (Probar Error 404)
      </Link>
    </div>
  );
}
