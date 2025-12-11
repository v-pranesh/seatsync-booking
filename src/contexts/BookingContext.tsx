import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Show {
  id: string;
  name: string;
  start_time: string;
  total_seats: number;
  created_at: string;
}

export interface Seat {
  id: string;
  show_id: string;
  seat_number: number;
  status: 'AVAILABLE' | 'PENDING' | 'BOOKED';
}

export interface Booking {
  id: string;
  show_id: string;
  user_email: string;
  seat_ids: string[];
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  expires_at: string;
  created_at: string;
}

interface BookingContextType {
  shows: Show[];
  seats: Seat[];
  selectedSeats: string[];
  currentBooking: Booking | null;
  loading: boolean;
  error: string | null;
  fetchShows: () => Promise<void>;
  fetchSeats: (showId: string) => Promise<void>;
  createShow: (name: string, startTime: string, totalSeats: number) => Promise<void>;
  toggleSeatSelection: (seatId: string) => void;
  clearSelection: () => void;
  bookSeats: (showId: string, userEmail: string) => Promise<Booking>;
  confirmBooking: (bookingId: string) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('shows')
        .select('*')
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      setShows(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shows');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeats = useCallback(async (showId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('seats')
        .select('*')
        .eq('show_id', showId)
        .order('seat_number', { ascending: true });

      if (fetchError) throw fetchError;
      const typedSeats = (data || []).map(seat => ({
        ...seat,
        status: seat.status as 'AVAILABLE' | 'PENDING' | 'BOOKED'
      }));
      setSeats(typedSeats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seats');
    } finally {
      setLoading(false);
    }
  }, []);

  const createShow = useCallback(async (name: string, startTime: string, totalSeats: number) => {
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('shows')
        .insert({ name, start_time: startTime, total_seats: totalSeats });

      if (insertError) throw insertError;
      await fetchShows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create show');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchShows]);

  const toggleSeatSelection = useCallback((seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
    setCurrentBooking(null);
  }, []);

  const bookSeats = useCallback(async (showId: string, userEmail: string): Promise<Booking> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('book-seats', {
        body: { showId, seatIds: selectedSeats, userEmail }
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      const booking: Booking = {
        id: data.booking.id,
        show_id: showId,
        user_email: userEmail,
        seat_ids: selectedSeats,
        status: data.booking.status,
        expires_at: data.booking.expiresAt,
        created_at: new Date().toISOString()
      };

      setCurrentBooking(booking);
      await fetchSeats(showId);
      return booking;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to book seats';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedSeats, fetchSeats]);

  const confirmBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('confirm-booking', {
        body: { bookingId }
      });

      if (invokeError) throw invokeError;
      if (data.error) throw new Error(data.error);

      if (currentBooking) {
        setCurrentBooking({ ...currentBooking, status: 'CONFIRMED' });
        await fetchSeats(currentBooking.show_id);
      }
      setSelectedSeats([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentBooking, fetchSeats]);

  return (
    <BookingContext.Provider value={{
      shows,
      seats,
      selectedSeats,
      currentBooking,
      loading,
      error,
      fetchShows,
      fetchSeats,
      createShow,
      toggleSeatSelection,
      clearSelection,
      bookSeats,
      confirmBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
