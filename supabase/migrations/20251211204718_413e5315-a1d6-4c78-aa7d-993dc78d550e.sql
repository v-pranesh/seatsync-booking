
-- Create shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seats table
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'PENDING', 'BOOKED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(show_id, seat_number)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  seat_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow public access for this demo)
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for shows
CREATE POLICY "Shows are viewable by everyone" ON public.shows FOR SELECT USING (true);
CREATE POLICY "Shows can be created by anyone" ON public.shows FOR INSERT WITH CHECK (true);
CREATE POLICY "Shows can be updated by anyone" ON public.shows FOR UPDATE USING (true);

-- Public access for seats
CREATE POLICY "Seats are viewable by everyone" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Seats can be created by anyone" ON public.seats FOR INSERT WITH CHECK (true);
CREATE POLICY "Seats can be updated by anyone" ON public.seats FOR UPDATE USING (true);

-- Public access for bookings
CREATE POLICY "Bookings are viewable by everyone" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Bookings can be created by anyone" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Bookings can be updated by anyone" ON public.bookings FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON public.seats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-generate seats when a show is created
CREATE OR REPLACE FUNCTION public.create_seats_for_show()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.seats (show_id, seat_number)
  SELECT NEW.id, generate_series(1, NEW.total_seats);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER create_seats_on_show_insert
  AFTER INSERT ON public.shows
  FOR EACH ROW EXECUTE FUNCTION public.create_seats_for_show();

-- Create function to expire pending bookings
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void AS $$
BEGIN
  -- Update expired pending bookings to FAILED
  UPDATE public.bookings 
  SET status = 'FAILED', updated_at = now()
  WHERE status = 'PENDING' AND expires_at < now();
  
  -- Release seats from failed bookings
  UPDATE public.seats s
  SET status = 'AVAILABLE', updated_at = now()
  FROM public.bookings b
  WHERE s.id = ANY(b.seat_ids)
    AND b.status = 'FAILED'
    AND s.status = 'PENDING';
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enable realtime for seats table (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
