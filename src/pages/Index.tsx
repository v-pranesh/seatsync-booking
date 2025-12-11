import { Ticket, Zap, Shield, Clock } from 'lucide-react';
import { ShowList } from '@/components/shows/ShowList';

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Ticket className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Secure Ticket Booking</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Book Your Perfect
              <span className="block text-primary">Experience</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Fast, secure, and reliable ticket booking with real-time seat availability and instant confirmation.
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Secure Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Instant Confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Section */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold">Available Shows</h2>
              <p className="text-muted-foreground">Select a show to book your seats</p>
            </div>
          </div>
          
          <ShowList />
        </div>
      </section>
    </div>
  );
};

export default Index;
