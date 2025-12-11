import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useBooking, Seat } from '@/contexts/BookingContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SeatGridProps {
  showId: string;
}

export function SeatGrid({ showId }: SeatGridProps) {
  const { seats, selectedSeats, loading, fetchSeats, toggleSeatSelection } = useBooking();

  useEffect(() => {
    fetchSeats(showId);

    // Subscribe to realtime seat updates
    const channel = supabase
      .channel('seats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `show_id=eq.${showId}`
        },
        () => {
          fetchSeats(showId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, fetchSeats]);

  if (loading && seats.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate grid dimensions based on seat count
  const cols = Math.ceil(Math.sqrt(seats.length));
  
  const getSeatClass = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) {
      return 'seat-selected';
    }
    switch (seat.status) {
      case 'AVAILABLE':
        return 'seat-available cursor-pointer';
      case 'PENDING':
        return 'seat-pending';
      case 'BOOKED':
        return 'seat-booked';
      default:
        return 'seat-booked';
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'AVAILABLE' || selectedSeats.includes(seat.id)) {
      toggleSeatSelection(seat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen indicator */}
      <div className="relative mb-8">
        <div className="w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        <p className="text-center text-xs text-muted-foreground mt-2 uppercase tracking-widest">
          Screen
        </p>
      </div>

      {/* Seat grid */}
      <div 
        className="grid gap-2 justify-center mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 48}px`
        }}
      >
        {seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleSeatClick(seat)}
            disabled={seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
            className={cn(
              "w-10 h-10 rounded-lg border-2 text-xs font-bold flex items-center justify-center transition-all duration-200",
              getSeatClass(seat)
            )}
            title={`Seat ${seat.seat_number} - ${seat.status}`}
          >
            {seat.seat_number}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 seat-available" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 seat-selected" />
          <span className="text-xs text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 seat-pending" />
          <span className="text-xs text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 seat-booked" />
          <span className="text-xs text-muted-foreground">Booked</span>
        </div>
      </div>
    </div>
  );
}
