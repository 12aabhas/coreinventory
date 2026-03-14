import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, BarChart3, Truck, TrendingUp, Users, Shield, 
  Zap, Target, Box, ClipboardList, RefreshCw, Globe,
  Warehouse, ClipboardCheck, TrendingDown, Award 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Cursor Follower Component
const CursorFollower = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      animate={{
        x: mousePosition.x - 75,
        y: mousePosition.y - 75,
      }}
      transition={{
        type: "spring",
        stiffness: 30,
        damping: 15
      }}
      style={{
        position: 'fixed',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
      }}
    />
  );
};

// Animated Background with Floating Icons
const AnimatedBackground = () => {
  const icons = [
    { Icon: Package, size: 60, color: '#2563eb', top: '10%', left: '5%', delay: 0 },
    { Icon: BarChart3, size: 50, color: '#7c3aed', top: '70%', left: '8%', delay: 0.5 },
    { Icon: Truck, size: 55, color: '#f59e0b', top: '20%', right: '5%', delay: 1 },
    { Icon: TrendingUp, size: 45, color: '#10b981', top: '80%', right: '8%', delay: 1.5 },
    { Icon: Box, size: 40, color: '#2563eb', top: '40%', left: '15%', delay: 2 },
    { Icon: ClipboardList, size: 35, color: '#7c3aed', top: '60%', right: '15%', delay: 2.5 },
    { Icon: Warehouse, size: 70, color: '#f59e0b', top: '30%', left: '20%', delay: 3 },
    { Icon: Shield, size: 45, color: '#10b981', top: '50%', right: '20%', delay: 3.5 },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    }}>
      {/* Gradient Orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          animate={{
            x: [0, 150, -150, 0],
            y: [0, -150, 150, 0],
            scale: [1, 1.3, 0.7, 1],
          }}
          transition={{
            duration: 25 + i * 5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            width: 400 + i * 200,
            height: 400 + i * 200,
            background: `radial-gradient(circle, rgba(37,99,235,${0.03 - i*0.005}) 0%, transparent 70%)`,
            borderRadius: '50%',
            top: `${10 + i * 20}%`,
            left: `${5 + i * 15}%`,
            filter: 'blur(40px)',
          }}
        />
      ))}

      {/* Floating Inventory Icons */}
      {icons.map((item, i) => (
        <motion.div
          key={`icon-${i}`}
          animate={{
            y: [0, -30, 30, -20, 0],
            x: [0, 20, -20, 10, 0],
            rotate: [0, 10, -10, 5, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: 12 + i,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            right: item.right,
            color: item.color,
            opacity: 0.15,
            zIndex: 0,
          }}
        >
          <item.Icon size={item.size} />
        </motion.div>
      ))}

      {/* Animated Grid */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(37,99,235,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Moving Lines */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            top: `${5 + i * 12}%`,
            left: 0,
            width: '200px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, #2563eb, #7c3aed, transparent)`,
            transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)`,
            zIndex: 0
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Inventory Manager', email: form.email }));
      toast.success('Welcome to CoreInventory!');
      navigate('/dashboard');
    }, 1000);
  };

  // Inventory Features
  const features = [
    { icon: Package, label: 'Stock Tracking', value: 'Real-time', color: '#2563eb' },
    { icon: BarChart3, label: 'Analytics', value: 'Live Reports', color: '#7c3aed' },
    { icon: Truck, label: 'Shipments', value: 'Track & Trace', color: '#f59e0b' },
    { icon: Shield, label: 'Security', value: 'Enterprise Grade', color: '#10b981' },
  ];

  // Stats
  const stats = [
    { icon: Package, value: '10K+', label: 'Products', color: '#2563eb' },
    { icon: Users, value: '5K+', label: 'Users', color: '#7c3aed' },
    { icon: Warehouse, value: '1.2K', label: 'Warehouses', color: '#f59e0b' },
    { icon: Award, value: '99.9%', label: 'Accuracy', color: '#10b981' },
  ];

  return (
    <>
      <CursorFollower />
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <AnimatedBackground />
        
        {/* Main Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            maxWidth: '1200px',
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            {/* Left Side - Inventory Information */}
            <div style={{
              flex: 1.2,
              padding: '48px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(124,58,237,0.1) 100%)',
              borderRight: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* Animated Logo */}
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  width: '70px',
                  height: '70px',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '30px',
                  boxShadow: '0 20px 30px -10px rgba(37,99,235,0.3)'
                }}
              >
                <Package size={35} color="white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: '42px',
                  fontWeight: '800',
                  marginBottom: '20px',
                  color: 'white',
                  lineHeight: 1.2
                }}
              >
                <span style={{ 
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  CoreInventory
                </span>
                <br />
                <span style={{
                  fontSize: '18px',
                  color: '#94a3b8',
                  fontWeight: '400',
                  display: 'block',
                  marginTop: '10px'
                }}>
                  Enterprise Inventory Management System
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  color: '#94a3b8',
                  fontSize: '16px',
                  lineHeight: 1.6,
                  marginBottom: '40px'
                }}
              >
                Streamline your inventory operations with real-time tracking, 
                intelligent analytics, and seamless team collaboration.
              </motion.p>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '40px'
                }}
              >
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05, x: 5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <feature.icon size={20} color={feature.color} />
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginTop: '8px' }}>
                      {feature.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{feature.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '15px'
                }}
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    style={{ textAlign: 'center' }}
                  >
                    <stat.icon size={24} color={stat.color} />
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '5px' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
              flex: 0.8,
              padding: '48px',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: 'white'
                }}>
                  Welcome Back
                </h2>
                <p style={{
                  color: '#94a3b8',
                  marginBottom: '32px',
                  fontSize: '14px'
                }}>
                  Sign in to access your inventory dashboard
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '6px'
                    }}>
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      placeholder="Enter your password"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '20px'
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </motion.button>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Link
                      to="/signup"
                      style={{
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Create account
                    </Link>
                    <Link
                      to="/forgot-password"
                      style={{
                        color: '#94a3b8',
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                </form>

                {/* Demo Credentials */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  style={{
                    marginTop: '30px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                    Demo Access:
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setForm({ email: 'demo@coreinventory.com', password: 'demo123' })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(37,99,235,0.1)',
                        border: '1px solid rgba(37,99,235,0.3)',
                        borderRadius: '8px',
                        color: '#2563eb',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Demo User
                    </button>
                    <button
                      onClick={() => setForm({ email: 'admin@coreinventory.com', password: 'admin123' })}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Admin
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
