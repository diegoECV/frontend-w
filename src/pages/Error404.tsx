import { motion } from 'framer-motion';
import { Tractor, Sprout, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Error404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-main)]">
      
      {/* Elementos flotantes decorativos de fondo */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 text-[var(--color-brand-green)] opacity-20"
      >
        <Sprout size={120} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [0, -15, 15, 0] }} 
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 text-[var(--color-brand-purple)] opacity-20"
      >
        <Sprout size={100} />
      </motion.div>

      {/* Contenedor Principal */}
      <div className="z-10 text-center space-y-8 glass p-12 rounded-3xl max-w-2xl mx-auto border-[var(--border-color)]">
        
        {/* Animación del Tractor que se va */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex justify-center text-[var(--color-brand-green)]"
        >
          <Tractor size={96} strokeWidth={1.5} />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-green)] to-[var(--color-brand-purple)]">
            404
          </h1>
          <h2 className="text-3xl font-bold text-[var(--text-main)]">
            ¡Uups! Te saliste de la cosecha.
          </h2>
        </div>

        <p className="text-lg text-[var(--text-muted)] max-w-md mx-auto">
          La página que buscas no existe, ha sido movida o quizás un pájaro se la llevó.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--color-brand-green)] to-emerald-600 text-white rounded-full font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50"
          >
            <ArrowLeft size={20} />
            Volver al panel principal
          </Link>
        </motion.div>
      </div>

    </div>
  );
}
