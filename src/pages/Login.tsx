import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Mail, 
  Lock, 
  LogIn, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Check, 
  Sparkles, 
  ThermometerSnowflake, 
  ShieldAlert, 
  Ship, 
  Layers,
  AlertCircle,
  Clock,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { requestGoogleAccount } from '../services/googleAuth';
import CompanyOnboardingForm from '../components/auth/CompanyOnboardingForm';
import type { ClientRegistrationRequest } from '../types/auth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un formato de correo válido (ej: usuario@gmail.com)'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type AuthMode = 'login' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const { 
    login, 
    loginWithGoogle, 
    setTempRegistrationUser, 
    isLoading: isAuthLoading 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [authMode, setAuthMode] = useState<AuthMode>(() => 
    typeof window !== 'undefined' && window.location.pathname.includes('register') ? 'register' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Credenciales/Google, 2: Datos de Empresa, 3: Solicitud en Revisión
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<ClientRegistrationRequest | null>(null);
  const [loginWarning, setLoginWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Flujo de Inicio de Sesión o Paso 1 de Registro con Correo/Password
  const onSubmit = async (data: LoginFormValues) => {
    setLoginWarning(null);

    if (authMode === 'register') {
      // Registro de cliente: Pasamos a Paso 2 (Datos de Empresa)
      setTempRegistrationUser({
        name: data.email.split('@')[0].replace('.', ' '),
        email: data.email,
      });
      setStep(2);
      toast.info('Paso 1 completado', {
        description: 'Ingresa ahora los datos de tu empresa para finalizar tu solicitud B2B.',
      });
      return;
    }

    try {
      const result = await login(data.email, data.password);

      if (result.ok && result.user) {
        toast.success('¡Bienvenido a Visons S.A.C.!', {
          description: `Sesión iniciada correctamente como ${result.user.name}.`,
        });

        if (result.user.role === 'CLIENTE') {
          navigate('/cliente');
        } else if (result.user.role === 'TRABAJADOR') {
          navigate('/trabajador');
        } else {
          navigate('/');
        }
      } else if (result.status === 'PENDIENTE') {
        const msg = result.message || 'Tu solicitud de acceso aún está en proceso de revisión por administración.';
        setLoginWarning(msg);
        toast.warning('Acceso Restringido: Solicitud en Revisión', {
          description: msg,
        });
      } else if (result.status === 'RECHAZADO') {
        const msg = result.message || 'Tu solicitud de acceso fue rechazada por la administración.';
        setLoginWarning(msg);
        toast.error('Acceso No Concedido', {
          description: msg,
        });
      } else {
        toast.error('Error de autenticación', {
          description: result.message || 'Correo o contraseña incorrectos.',
        });
      }
    } catch {
      toast.error('Error en el servidor', {
        description: 'No se pudo conectar con el servicio de autenticación.',
      });
    }
  };

  // Flujo Oficial de Google Identity Services (OAuth 2.0)
  const handleGoogleAuth = async () => {
    setLoginWarning(null);

    try {
      // 1. Abre el selector de cuentas oficial de Google con el Client ID de Google Cloud
      const googleUser = await requestGoogleAccount();

      if (authMode === 'register') {
        // En registro, vinculamos la cuenta real de Google y pasamos al formulario empresarial
        setTempRegistrationUser({
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
        });
        setStep(2);
        toast.success('Cuenta de Google vinculada con éxito', {
          description: `Hola ${googleUser.name}. Por favor completa los datos de tu empresa importadora.`,
        });
      } else {
        // En login, intentamos iniciar sesión con la cuenta de Google
        const result = await loginWithGoogle(googleUser);

        if (result.ok && result.user) {
          toast.success('Sesión iniciada con Google', {
            description: `Bienvenido de nuevo, ${result.user.name}.`,
          });
          if (result.user.role === 'CLIENTE') {
            navigate('/cliente');
          } else if (result.user.role === 'TRABAJADOR') {
            navigate('/trabajador');
          } else {
            navigate('/');
          }
        } else if (result.status === 'PENDIENTE') {
          const msg = result.message || 'Tu solicitud de acceso aún está en proceso de revisión por administración.';
          setLoginWarning(msg);
          toast.warning('Acceso Restringido: Solicitud en Revisión', {
            description: msg,
          });
        } else if (result.status === 'RECHAZADO') {
          const msg = result.message || 'Tu solicitud de acceso fue rechazada.';
          setLoginWarning(msg);
          toast.error('Acceso Rechazado', {
            description: msg,
          });
        } else if (result.status === 'NOT_REGISTERED') {
          toast.info('Cuenta no registrada', {
            description: 'Tu cuenta de Google no tiene una solicitud B2B enviada. Vamos a registrarla ahora.',
          });
          setTempRegistrationUser({
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.avatar,
          });
          setAuthMode('register');
          setStep(2);
        } else {
          toast.error('Error al iniciar sesión', {
            description: result.message || 'No se pudo verificar la cuenta de Google.',
          });
        }
      }
    } catch (err: any) {
      console.warn('Error en Google OAuth:', err);
      toast.error('Conexión con Google cancelada o interrumpida', {
        description: err.message || 'Puedes ingresar también con tu correo electrónico corporativo.',
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors selection:bg-emerald-500 selection:text-white">
      
      {/* =====================================================================
          COLUMNA IZQUIERDA: HERO & BRANDING (Inspirada en SaleSkip)
          ===================================================================== */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#0a192f] p-12 xl:p-16 flex-col justify-between overflow-hidden shadow-2xl">
        
        {/* Fondo decorativo con líneas concéntricas SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="280" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="200" r="380" stroke="white" strokeWidth="1" opacity="0.6" />
            <circle cx="200" cy="200" r="480" stroke="white" strokeWidth="1" opacity="0.4" />
            <circle cx="200" cy="200" r="580" stroke="white" strokeWidth="1" opacity="0.2" />
            <polygon points="600,100 750,250 650,400 500,250" stroke="white" strokeWidth="0.8" opacity="0.3" fill="rgba(16, 185, 129, 0.05)" />
            <polygon points="700,300 850,450 750,600 600,450" stroke="white" strokeWidth="0.8" opacity="0.2" fill="rgba(59, 130, 246, 0.05)" />
          </svg>
        </div>

        {/* Resplandor ambiental */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Superior del Banner */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-wider block">VISONS S.A.C.</span>
              <span className="text-[11px] text-emerald-300 font-semibold tracking-widest uppercase">Agroexport Platform</span>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            v2.4 Kubernetes Enterprise
          </span>
        </div>

        {/* Contenido Central: Gran Titular Hero y Beneficios */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-emerald-300 text-xs font-bold">
              <Sparkles size={14} className="text-emerald-400" />
              Trazabilidad de Exportación 100% Digital
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Hello Visons! <span className="inline-block animate-bounce">🥑</span>
            </h1>

            <p className="text-base text-emerald-100/90 leading-relaxed font-normal">
              Conectamos el campo con el mundo. Control integral de cadena de frío, packing, inspecciones SENASA y trazabilidad aduanera en una plataforma unificada.
            </p>
          </motion.div>

          {/* Tarjetas de Beneficios */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 gap-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ThermometerSnowflake size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cadena de Frío & Lotes Reefer</h4>
                <p className="text-[11px] text-emerald-200/70">Telemetría IoT en tiempo real desde packing hasta puerto.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Ship size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Portal B2B de Autoservicio</h4>
                <p className="text-[11px] text-blue-200/70">Contenedores, BL, certificados fitosanitarios y facturas.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cumplimiento Global FDA / SENASA</h4>
                <p className="text-[11px] text-purple-200/70">Trazabilidad de origen y certificados sanitarios digitales.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer del Banner */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 font-medium">
          <span>© 2026 Visons S.A.C. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <Layers size={13} className="text-emerald-400" />
            Backend SQL Server & Spring Boot
          </span>
        </div>
      </div>

      {/* =====================================================================
          COLUMNA DERECHA: FORMULARIO DE ACCESO Y ONBOARDING (SaleSkip Style)
          ===================================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-14 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Superior Móvil / Selector de Tema */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                V
              </div>
              <span className="font-extrabold text-sm text-[var(--text-primary)]">Visons S.A.C.</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Switcher de Pestañas: Iniciar Sesión vs Registrarse */}
                <div className="flex p-1 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => { 
                      setAuthMode('login'); 
                      setLoginWarning(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setAuthMode('register'); 
                      setLoginWarning(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-hint)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Registrarse (Cliente B2B)
                  </button>
                </div>

                {/* Banner de Advertencia de Restricción (si está en revisión) */}
                {loginWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3 shadow-sm"
                  >
                    <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Acceso Restringido: Solicitud en Revisión</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                        {loginWarning}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Título y Subtítulo estilo SaleSkip */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                    {authMode === 'login' ? '¡Bienvenido de nuevo!' : 'Crea tu Cuenta de Cliente'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
                    {authMode === 'login' ? (
                      <>
                        ¿No tienes una cuenta aún?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('register');
                            setLoginWarning(null);
                          }}
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Regístrate aquí gratis en 1 minuto
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya posees una cuenta registrada?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setLoginWarning(null);
                          }}
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Inicia sesión aquí
                        </button>
                      </>
                    )}
                  </p>
                </div>

                {/* Botón Oficial de Google OAuth 2.0 */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isAuthLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-sm font-bold text-[var(--text-primary)] transition-all shadow-sm hover:shadow active:scale-[0.99] cursor-pointer disabled:opacity-70"
                  >
                    {/* SVG Oficial de Google */}
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {authMode === 'login'
                        ? 'Continuar con Google'
                        : 'Registrarse con Google'}
                    </span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-medium text-[var(--text-hint)] uppercase tracking-wider">
                      o con correo corporativo
                    </span>
                    <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
                  </div>
                </div>

                {/* Formulario Estándar */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Correo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-hint)]">
                        <Mail size={17} />
                      </div>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="@gmail.com"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[var(--surface-subtle)] border rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500/30'
                            : 'border-[var(--border-subtle)] focus:ring-emerald-500'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{errors.email.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[var(--text-primary)]">
                        Contraseña
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => toast.info('Recuperación de contraseña', {
                            description: 'Por favor, contacta a administracion@visons.com para restablecer tus credenciales.',
                          })}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-hint)]">
                        <Lock size={17} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="••••••••••••"
                        className={`w-full pl-10 pr-10 py-2.5 bg-[var(--surface-subtle)] border rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:outline-none focus:ring-2 transition-all ${
                          errors.password
                            ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500/30'
                            : 'border-[var(--border-subtle)] focus:ring-emerald-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-hint)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{errors.password.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Checkbox Recordarme */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        rememberMe
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-[var(--border-strong)] bg-[var(--surface-card)]'
                      }`}
                    >
                      {rememberMe && <Check size={12} strokeWidth={3} />}
                    </button>
                    <span
                      onClick={() => setRememberMe(!rememberMe)}
                      className="text-xs text-[var(--text-secondary)] font-medium select-none cursor-pointer"
                    >
                      Recordar mi sesión en este dispositivo
                    </span>
                  </div>

                  {/* Botón de Enviar */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isAuthLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting || isAuthLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={17} />
                        <span>
                          {authMode === 'login'
                            ? 'Iniciar Sesión'
                            : 'Continuar al Registro B2B'}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Garantía de Seguridad */}
                <div className="pt-2 text-center text-[11px] text-[var(--text-hint)] flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Conexión cifrada TLS 1.3 con autenticación JWT</span>
                </div>
              </motion.div>
            ) : step === 2 ? (
              /* PASO 2: FORMULARIO DE ONBOARDING EMPRESARIAL */
              <CompanyOnboardingForm
                key="step-2"
                onBack={() => setStep(1)}
                onSuccess={(newReq) => {
                  setLastSubmittedRequest(newReq);
                  setStep(3);
                }}
              />
            ) : (
              /* PASO 3: CONFIRMACIÓN Y ESTADO PENDIENTE DE REVISIÓN */
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Clock size={32} className="animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Solicitud en Revisión B2B
                    </div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                      ¡Solicitud Enviada a Revisión!
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                      Hemos recibido la información de tu empresa. Por políticas de seguridad y comercio exterior, un <strong>Administrador</strong> o <strong>Personal de Planta</strong> de Visons S.A.C. validará tus datos antes de concederte acceso al portal.
                    </p>
                  </div>
                </div>

                {/* Resumen de la Solicitud Registrada */}
                {lastSubmittedRequest && (
                  <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className="text-emerald-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Datos de la Empresa</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Estado: Pendiente
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-hint)] uppercase tracking-wider block">Razón Social</span>
                        <span className="font-bold text-[var(--text-primary)] truncate block">
                          {lastSubmittedRequest.company.companyName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-hint)] uppercase tracking-wider block">Documento Fiscal</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {lastSubmittedRequest.company.documentType}: {lastSubmittedRequest.company.documentNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-hint)] uppercase tracking-wider block">Correo Registrado</span>
                        <span className="font-medium text-[var(--text-secondary)] truncate block">
                          {lastSubmittedRequest.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-hint)] uppercase tracking-wider block">País</span>
                        <span className="font-medium text-[var(--text-secondary)]">
                          {lastSubmittedRequest.company.country}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón para regresar al Login */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setAuthMode('login');
                      setLoginWarning(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn size={16} />
                    <span>Entendido, volver al Inicio de Sesión</span>
                  </button>

                  <p className="text-[11px] text-center text-[var(--text-hint)]">
                    Si intentas iniciar sesión antes de la aprobación, el sistema te recordará que tu cuenta sigue en revisión.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
