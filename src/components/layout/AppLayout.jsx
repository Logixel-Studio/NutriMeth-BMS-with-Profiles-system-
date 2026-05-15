import { useState, useEffect, useCallback, memo } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Apply sidebar width as a CSS variable (no inline <style> injection per render)
function useSidebarStyle(sidebarW) {
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${sidebarW}px`);
  }, [sidebarW]);
}

// Memoized so it doesn't re-render when parent sidebar state changes
const MainContent = memo(function MainContent({ onMobileMenuToggle }) {
  return (
    <div className="main-content-area flex flex-col min-h-screen">
      <Topbar onMobileMenuToggle={onMobileMenuToggle} />
      <main className="flex-1 p-3 sm:p-4 lg:p-5 xl:p-6 overflow-x-hidden w-full">
        <div className="w-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
});

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? 72 : 260;
  useSidebarStyle(sidebarW);

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleMobileToggle = useCallback(() => setMobileOpen(v => !v), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop fixed sidebar */}
      <div
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-40"
        style={{ width: sidebarW, transition: 'width 0.3s ease' }}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleMobileClose}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              style={{ width: 260 }}
            >
              <Sidebar collapsed={false} isMobile onClose={handleMobileClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area - uses CSS variable for sidebar offset */}
      <MainContent onMobileMenuToggle={handleMobileToggle} />
    </div>
  );
}
