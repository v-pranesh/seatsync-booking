import { useEffect } from 'react';
import { Calendar, Clock, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { format } from 'date-fns';

export function AdminShowList() {
  const { shows, loading, fetchShows } = useBooking();

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  if (loading && shows.length === 0) {
    return (
      <Card className="card-glow border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (shows.length === 0) {
    return (
      <Card className="card-glow border-border/50">
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No shows created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow border-border/50">
      <CardHeader>
        <CardTitle className="font-display">All Shows ({shows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shows.map((show, index) => {
            const startDate = new Date(show.start_time);
            return (
              <div 
                key={show.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors animate-stagger"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-1">
                  <p className="font-semibold">{show.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(startDate, 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(startDate, 'h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">{show.total_seats} seats</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
