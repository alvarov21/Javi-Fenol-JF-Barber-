// Base de datos simulada en el navegador (Local Storage)
const DB_KEY = 'jf_barber_db_bookings';

// Citas iniciales (Mockup)
const defaultBookings = [
    {
        id: '1',
        clientName: 'David Navarro',
        phone: '600 123 456',
        service: 'Corte + Barba (Combo VIP)',
        date: 'Jueves, 13 Nov',
        time: '18:30',
        duration: '1h 15m',
        status: 'pending',
        type: 'Nuevo Cliente',
        timestamp: Date.now() - 100000
    },
    {
        id: '2',
        clientName: 'Izan Millán',
        phone: '611 987 654',
        service: 'Arreglo de Barba',
        date: 'Viernes, 14 Nov',
        time: '11:00',
        duration: '30 min',
        status: 'pending',
        type: 'Habitual',
        timestamp: Date.now() - 50000
    }
];

// Inicializar DB
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultBookings));
    }
}

// Obtener todas las citas
function getBookings() {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
}

// Guardar nueva cita (desde la web del cliente)
function createBooking(bookingData) {
    const bookings = getBookings();
    const newBooking = {
        id: Date.now().toString(),
        status: 'pending',
        type: 'Reserva Online',
        timestamp: Date.now(),
        ...bookingData
    };
    bookings.push(newBooking);
    localStorage.setItem(DB_KEY, JSON.stringify(bookings));
    
    // Disparar evento para que otras pestañas (el admin) se actualicen en tiempo real
    window.dispatchEvent(new Event('storage'));
    
    return newBooking;
}

// Actualizar estado (Aceptar/Rechazar desde el Admin)
function updateBookingStatus(id, newStatus) {
    const bookings = getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
        bookings[index].status = newStatus;
        localStorage.setItem(DB_KEY, JSON.stringify(bookings));
        window.dispatchEvent(new Event('storage'));
    }
}

initDB();
