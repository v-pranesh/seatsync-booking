import { useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { ShowCard } from './ShowCard';

export function ShowList() {
  const { shows, loading, error, fetchShows } = useBooking();

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  if (loading && shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading shows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-destructive text-center">
          <p className="font-semibold">Error loading shows</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Calendar className="h-16 w-16 text-muted-foreground/50" />
        <div className="text-center">
          <p className="font-semibold text-lg">No shows available</p>
          <p className="text-sm text-muted-foreground">
            Check back later or ask an admin to create a show.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shows.map((show, index) => (
        <ShowCard key={show.id} show={show} index={index} />
      ))}
    </div>
  );
}
