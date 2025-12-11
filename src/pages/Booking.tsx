import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatGrid } from '@/components/booking/SeatGrid';
import { BookingForm } from '@/components/booking/BookingForm';
import { useBooking, Show } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const { clearSelection } = useBooking();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearSelection();
    
    async function fetchShow() {
      if (!id) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('shows')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Show not found');
        
        setShow(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load show');
      } finally {
        setLoading(false);
      }
    }

    fetchShow();
  }, [id, clearSelection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Show not found'}</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shows
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(show.start_time);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shows
        </Link>

        {/* Show Info */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{show.name}</h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{format(startDate, 'h:mm a')}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Grid */}
          <div className="lg:col-span-2 animate-slide-up">
            <Card className="card-glow border-border/50">
              <CardHeader>
                <CardTitle className="font-display">Select Your Seats</CardTitle>
              </CardHeader>
              <CardContent>
                <SeatGrid showId={show.id} />
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <BookingForm showId={show.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
