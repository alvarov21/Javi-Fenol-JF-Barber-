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
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al procesar la reserva. Puede que la hora ya esté ocupada.');
        }
        
        window.dispatchEvent(new Event('storage'));
        
        return { success: true, data: await response.json() };
    } catch (e) {
        console.error("Error guardando cita:", e);
        return { success: false, error: e.message };
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
