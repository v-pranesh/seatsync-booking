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

    const { showId, seatIds, userEmail } = await req.json();

    console.log('Booking request received:', { showId, seatIds, userEmail });

    if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: showId, seatIds (array), userEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, expire any pending bookings that have timed out
    await supabase.rpc('expire_pending_bookings');

    // Use a transaction-like approach with row locking via FOR UPDATE
    // Check if all requested seats are available
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('id, status, seat_number')
      .eq('show_id', showId)
      .in('id', seatIds);

    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch seats', details: seatsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!seats || seats.length !== seatIds.length) {
      console.log('Some seats not found:', { requested: seatIds.length, found: seats?.length || 0 });
      return new Response(
        JSON.stringify({ error: 'Some seats were not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if all seats are available
    const unavailableSeats = seats.filter(seat => seat.status !== 'AVAILABLE');
    if (unavailableSeats.length > 0) {
      console.log('Some seats are not available:', unavailableSeats);
      return new Response(
        JSON.stringify({ 
          error: 'Some seats are not available',
          unavailableSeats: unavailableSeats.map(s => s.seat_number)
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atomically update seats to PENDING status
    // Using update with match condition for optimistic locking
    const { data: updatedSeats, error: updateError } = await supabase
      .from('seats')
      .update({ status: 'PENDING' })
      .in('id', seatIds)
      .eq('status', 'AVAILABLE')
      .select();

    if (updateError) {
      console.error('Error updating seats:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reserve seats', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if all seats were successfully updated (optimistic lock check)
    if (!updatedSeats || updatedSeats.length !== seatIds.length) {
      console.log('Race condition detected - some seats were already taken');
      // Rollback any seats we did manage to update
      if (updatedSeats && updatedSeats.length > 0) {
        await supabase
          .from('seats')
          .update({ status: 'AVAILABLE' })
          .in('id', updatedSeats.map(s => s.id));
      }
      return new Response(
        JSON.stringify({ error: 'Some seats were just taken by another user. Please try again.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the booking with PENDING status
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes from now
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        show_id: showId,
        user_email: userEmail,
        seat_ids: seatIds,
        status: 'PENDING',
        expires_at: expiresAt
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      // Rollback seat reservations
      await supabase
        .from('seats')
        .update({ status: 'AVAILABLE' })
        .in('id', seatIds);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create booking', details: bookingError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking created successfully:', booking.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: {
          id: booking.id,
          status: booking.status,
          expiresAt: booking.expires_at,
          seats: seats.map(s => s.seat_number)
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
