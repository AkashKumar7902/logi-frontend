// src/components/Driver/DriverDashboard.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

function DriverDashboard() {
  const [pendingBookings, setPendingBookings] = useState([]);

  // useEffect(() => {
  //   fetchPendingBookings();
  //   connectWebSocket();
  //   return () => disconnectWebSocket();
  // }, []);

  // const fetchPendingBookings = async () => {
  //   try {
  //     const res = await api.get('/drivers/pending-bookings');
  //     setPendingBookings(res.data);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const respondToBooking = async (bookingId, response) => {
  //   try {
  //     await api.post('/drivers/respond-booking', {
  //       booking_id: bookingId,
  //       response,
  //     });
  //     fetchPendingBookings();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  return (
    <div>
      <h1>Driver Dashboard</h1>
    </div>
  );
}

export default DriverDashboard;
