// Base de datos conectada a la nube (Upstash Redis a través de Vercel API)

// Obtener todas las citas
async function getBookings() {
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) return [];
        const data = await response.json();
        return data || [];
    } catch (e) {
        console.error("Error obteniendo citas:", e);
        return [];
    }
}

// Guardar nueva cita (desde la web del cliente)
async function createBooking(bookingData) {
    const newBooking = {
        id: Date.now().toString(),
        status: 'pending',
        type: 'Reserva Online',
        timestamp: Date.now(),
        ...bookingData
    };
    
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking)
        });
        
        // Simular evento local (para mantener UX fluida si están en el mismo equipo temporalmente)
        window.dispatchEvent(new Event('storage'));
        
        return await response.json();
    } catch (e) {
        console.error("Error guardando cita:", e);
        return newBooking; // fallback optimista
    }
}

// Actualizar estado (Aceptar/Rechazar desde el Admin)
async function updateBookingStatus(id, newStatus) {
    try {
        const response = await fetch('/api/bookings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        return await response.json();
    } catch (e) {
        console.error("Error actualizando cita:", e);
        return null;
    }
}
