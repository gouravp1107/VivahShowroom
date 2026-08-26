// ============================================================================
// controllers/appointmentController.js — logic for /api/appointments/*
// routes (see routes/appointmentRoutes.js). bookAppointment() is public
// (no login required — guests can request a fitting too); myAppointments/
// listAppointments/updateAppointmentStatus require login (the last two are
// admin-only, per routes/appointmentRoutes.js's guards).
//
// CALLED BY: frontend's pages/BookAppointment.jsx form, via
// submitAppointment() in src/api/index.js.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'

// POST /api/appointments — `req.user?._id` uses optional chaining because
// this route does NOT require the `protect` middleware (see
// routes/appointmentRoutes.js), so req.user may not exist for guest bookings.
export async function bookAppointment(req, res) {
  const appointment = await prisma.appointment.create({ data: { ...req.body, userId: req.user?._id || null } })
  res.status(201).json({ appointment: withId(appointment) })
}

export async function myAppointments(req, res) {
  const appointments = await prisma.appointment.findMany({ where: { userId: req.user._id }, orderBy: { preferredDate: 'asc' } })
  res.json({ appointments: withIds(appointments) })
}

// --- Admin ---
export async function listAppointments(req, res) {
  const { status } = req.query
  const where = status ? { status } : {}
  const appointments = await prisma.appointment.findMany({ where, orderBy: { preferredDate: 'asc' } })
  res.json({ appointments: withIds(appointments) })
}

export async function updateAppointmentStatus(req, res) {
  try {
    const appointment = await prisma.appointment.update({ where: { id: req.params.id }, data: { status: req.body.status } })
    res.json({ appointment: withId(appointment) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Appointment not found' })
    throw err
  }
}
