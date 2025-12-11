import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

interface BookingFormProps {
  showId: string;
}

export function BookingForm({ showId }: BookingFormProps) {
  const { selectedSeats, currentBooking, loading, bookSeats, confirmBooking, clearSelection } = useBooking();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const handleBook = async () => {
    setEmailError('');
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    try {
      await bookSeats(showId, email);
      toast({
        title: 'Seats Reserved!',
        description: 'Please confirm your booking within 2 minutes.',
      });
    } catch (err) {
      toast({
        title: 'Booking Failed',
        description: err instanceof Error ? err.message : 'Unable to reserve seats',
        variant: 'destructive',
      });
    }
  };

  const handleConfirm = async () => {
    if (!currentBooking) return;
    
    try {
      await confirmBooking(currentBooking.id);
      toast({
        title: 'Booking Confirmed!',
        description: 'Your tickets have been booked successfully.',
      });
    } catch (err) {
      toast({
        title: 'Confirmation Failed',
        description: err instanceof Error ? err.message : 'Unable to confirm booking',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    if (!currentBooking) return null;
    switch (currentBooking.status) {
      case 'PENDING':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'CONFIRMED':
        return <CheckCircle2 className="h-6 w-6 text-primary" />;
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-destructive" />;
    }
  };

  if (currentBooking) {
    return (
      <Card className="card-glow border-border/50">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-3">
            {getStatusIcon()}
            Booking Status: {currentBooking.status}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentBooking.status === 'PENDING' && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-500">
                  Your seats are reserved. Please confirm within 2 minutes or they will be released.
                </p>
              </div>
              <Button 
                onClick={handleConfirm} 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Booking
              </Button>
            </>
          )}

          {currentBooking.status === 'CONFIRMED' && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
              <p className="text-primary font-semibold">Your booking is confirmed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                A confirmation email has been sent to {currentBooking.user_email}
              </p>
            </div>
          )}

          {currentBooking.status === 'FAILED' && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-destructive text-sm">
                Your booking has expired or failed. Please try again.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={clearSelection}
            className="w-full"
          >
            {currentBooking.status === 'CONFIRMED' ? 'Book More Seats' : 'Start Over'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow border-border/50">
      <CardHeader>
        <CardTitle className="font-display">Complete Your Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSeats.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Select seats from the grid to continue
          </p>
        ) : (
          <>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Selected seats</p>
              <p className="font-semibold text-lg text-primary">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50 border-border"
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <Button 
              onClick={handleBook} 
              disabled={loading || selectedSeats.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reserve Seats
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
