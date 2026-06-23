import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Mobile Top Header & Bottom Navigation */}
      <MobileNav />

      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pt-16 pb-28 md:pt-0 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-4 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
