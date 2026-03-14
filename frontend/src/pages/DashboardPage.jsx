import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, Truck, DollarSign } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';

export default function DashboardPage() {
  const stats = [
    { icon: Package, label: 'Total Products', value: '1,248', change: '+12%', color: '#2563eb' },
    { icon: AlertTriangle, label: 'Low Stock', value: '23', change: '-5%', color: '#d97706' },
    { icon: TrendingDown, label: 'Out of Stock', value: '8', change: '+2%', color: '#dc2626' },
    { icon: Truck, label: 'Pending Orders', value: '42', change: '+8%', color: '#7c3aed' },
    { icon: DollarSign, label: 'Inventory Value', value: '$124.5K', change: '+15%', color: '#059669' },
  ];

  return (
    <div>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '28px', fontWeight: '700', marginBottom: '30px' }}
      >
        Dashboard
      </motion.h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {stats.map((stat, index) => (
          <AnimatedCard key={index} delay={index * 0.1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: `${stat.color}15`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <span style={{
                padding: '4px 8px',
                background: stat.change.startsWith('+') ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                color: stat.change.startsWith('+') ? '#059669' : '#dc2626',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </span>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-gray-500)', marginBottom: '4px' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700' }}>{stat.value}</p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <AnimatedCard delay={0.5}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Recent Activity</h2>
          {[1,2,3,4].map(i => (
            <motion.div
              key={i}
              whileHover={{ x: 4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '8px'
              }}
            >
              <Package size={20} color="#2563eb" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '500' }}>Product #{i} was updated</p>
                <p style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>5 minutes ago</p>
              </div>
              <span style={{ color: '#059669', fontWeight: '600' }}>+{i*10} units</span>
            </motion.div>
          ))}
        </AnimatedCard>

        <AnimatedCard delay={0.6}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Quick Actions</h2>
          {['Add Product', 'Create Receipt', 'New Delivery', 'Stock Adjustment'].map((action, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, x: 4 }}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                background: 'var(--color-gray-50)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {action}
            </motion.button>
          ))}
        </AnimatedCard>
      </div>
    </div>
  );
}
