import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId } = await req.json();

    console.log('Confirm booking request:', { bookingId });

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, expire any pending bookings that have timed out
    await supabase.rpc('expire_pending_bookings');

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if booking is still PENDING and not expired
    if (booking.status !== 'PENDING') {
      return new Response(
        JSON.stringify({ 
          error: `Booking cannot be confirmed. Current status: ${booking.status}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(booking.expires_at) < new Date()) {
      // Mark as failed
      await supabase
        .from('bookings')
        .update({ status: 'FAILED' })
        .eq('id', bookingId);
      
      // Release seats
      await supabase
        .from('seats')
        .update({ status: 'AVAILABLE' })
        .in('id', booking.seat_ids);

      return new Response(
        JSON.stringify({ error: 'Booking has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Confirm the booking
    const { error: confirmError } = await supabase
      .from('bookings')
      .update({ status: 'CONFIRMED' })
      .eq('id', bookingId)
      .eq('status', 'PENDING');

    if (confirmError) {
      console.error('Error confirming booking:', confirmError);
      return new Response(
        JSON.stringify({ error: 'Failed to confirm booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update seats to BOOKED
    const { error: seatsError } = await supabase
      .from('seats')
      .update({ status: 'BOOKED' })
      .in('id', booking.seat_ids);

    if (seatsError) {
      console.error('Error updating seats:', seatsError);
    }

    console.log('Booking confirmed successfully:', bookingId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: {
          id: bookingId,
          status: 'CONFIRMED'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
