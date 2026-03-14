import { motion } from 'framer-motion';

export default function AnimatedCard({ children, delay = 0, style, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
      style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        ...style
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
