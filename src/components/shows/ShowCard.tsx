import { Link } from 'react-router-dom';
import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Show } from '@/contexts/BookingContext';
import { format } from 'date-fns';

interface ShowCardProps {
  show: Show;
  index: number;
}

export function ShowCard({ show, index }: ShowCardProps) {
  const startDate = new Date(show.start_time);
  
  return (
    <Card 
      className="card-glow border-border/50 overflow-hidden group hover:border-primary/30 transition-all duration-300 animate-stagger"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="font-display text-xl group-hover:text-primary transition-colors">
            {show.name}
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            {show.total_seats} seats
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{format(startDate, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{show.total_seats} total capacity</span>
          </div>
        </div>
        
        <Link to={`/booking/${show.id}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Book Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
