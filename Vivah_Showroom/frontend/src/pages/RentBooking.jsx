// ============================================================================
// pages/RentBooking.jsx — the "/rent/:id" route (see App.jsx). The full
// booking flow that replaces the old WhatsApp-style hand-off: a dedicated
// page (not a modal) showing everything from the product — sizes, price/
// day, details, availability — plus the actual booking form.
//
// CALLED FROM: the "Rent Now" button on ProductCard.jsx, SpotlightCard.jsx,
// and the "Rent Now" button on Product.jsx's detail page.
//
// FLOW (matches the brief exactly):
//   1. Fill in the mandatory fields: Size, Booking Date, No. of Days (1-3),
//      Return Date (auto-filled from Booking Date + No. of Days, but still
//      editable/confirmable), Time. Trying to proceed with any of these
//      empty highlights them in red instead of silently failing.
//   2. Optional: apply a coupon/offer code (see api/index.js's
//      validateCouponRequest -> backend's couponController.js).
//   3. Once every mandatory field is filled, the button changes from
//      "Rent Now" to "Proceed".
//   4. Proceed -> payment step: Cash on Delivery / UPI / QR Code.
//   5. Selecting a mode reveals "Confirm Booking". Clicking it creates the
//      order (api/index.js's createOrderRequest -> POST /api/orders) and:
//        - COD: booking is confirmed immediately, order appears in My Orders.
//        - UPI/QR: shows a "Mark payment as done" step (placeholder for a
//          real gateway — see confirmPaymentRequest/backend's
//          confirmPayment()) before showing "Booking Confirmed" and adding
//          it to My Orders.
//   6. Either way, ends by navigating to /orders (pages/MyOrders.jsx).
// ============================================================================
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { Star, ShieldCheck, Truck, Tag, Wallet, QrCode, Smartphone, CheckCircle2 } from 'lucide-react'
import { fetchProduct } from '../api'
import { validateCouponRequest, createOrderRequest, confirmPaymentRequest } from '../api'
import { useShowroom } from '../context/ShowroomContext'

const TIME_SLOTS = ['10:00 AM – 1:00 PM', '1:00 PM – 4:00 PM', '4:00 PM – 7:00 PM']
const PAYMENT_MODES = [
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet, blurb: 'Pay when your order is delivered.' },
  { id: 'upi', label: 'UPI', icon: Smartphone, blurb: 'Pay instantly via any UPI app.' },
  { id: 'qr', label: 'QR Code', icon: QrCode, blurb: 'Scan the showroom QR code to pay.' },
]

function addDays(dateStr, days) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + Number(days))
  return d.toISOString().slice(0, 10)
}

export default function RentBooking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, notify } = useShowroom()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- Mandatory booking fields ---
  const [size, setSize] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [noOfDays, setNoOfDays] = useState(null) // 1, 2 or 3
  const [returnDate, setReturnDate] = useState('')
  const [time, setTime] = useState('')

  // --- Optional coupon ---
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // { code, discountAmount, message }
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [showErrors, setShowErrors] = useState(false) // becomes true once they try Proceed with gaps
  const [stage, setStage] = useState('form') // 'form' -> 'payment' -> 'confirmed'
  const [paymentMode, setPaymentMode] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProduct(id).then((p) => { setProduct(p); setLoading(false) })
  }, [id])

  // Booking date + No. of Days keeps Return Date in sync automatically —
  // the customer can still override Return Date by hand afterwards.
  useEffect(() => {
    if (bookingDate && noOfDays) setReturnDate(addDays(bookingDate, noOfDays))
  }, [bookingDate, noOfDays])

  const price = useMemo(() => {
    if (!product || !noOfDays) return 0
    return product.rentalPrice * noOfDays // rentalPrice treated as price/day, per noOfDays selected
  }, [product, noOfDays])

  const discountAmount = coupon?.valid ? coupon.discountAmount : 0
  const grandTotal = Math.max(0, price - discountAmount) + (product?.deposit || 0)

  const missing = {
    size: !size,
    bookingDate: !bookingDate,
    returnDate: !returnDate,
    noOfDays: !noOfDays,
    time: !time,
  }
  const hasMissing = Object.values(missing).some(Boolean)

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-24 text-center text-ink/40 dark:text-ivory/40">Loading…</div>
  if (!product) return <Navigate to="/" replace />

  function fieldClass(key) {
    const base = 'px-4 py-2.5 rounded-xl border bg-transparent text-ink dark:text-ivory w-full'
    if (showErrors && missing[key]) return `${base} border-red-500 ring-1 ring-red-500`
    return `${base} border-ink/20 dark:border-ivory/20`
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponBusy(true); setCouponError('')
    try {
      const result = await validateCouponRequest(couponInput.trim(), price)
      if (result.valid) { setCoupon(result); notify(`Coupon ${result.code} applied`) }
      else { setCouponError(result.message || 'Invalid coupon'); setCoupon(null) }
    } catch (err) {
      setCouponError(err.message || 'Could not validate coupon')
    } finally {
      setCouponBusy(false)
    }
  }

  function handleRentNowClick() {
    if (hasMissing) {
      setShowErrors(true)
      const firstMissing = document.getElementById(`field-${Object.keys(missing).find((k) => missing[k])}`)
      firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setStage('payment')
  }

  async function handleConfirmBooking() {
    if (!user) {
      notify('Please sign in to complete your booking')
      navigate('/login')
      return
    }
    setPlacing(true); setError('')
    try {
      const { order } = await createOrderRequest({
        items: [{
          product: product.id || product._id,
          size, rentalStartDate: bookingDate, rentalEndDate: returnDate, rentalTime: time, noOfDays,
          price, deposit: product.deposit,
        }],
        paymentMode,
        couponCode: coupon?.valid ? coupon.code : undefined,
      })
      if (paymentMode === 'cod') {
        setPlacedOrder(order)
        setStage('confirmed')
      } else {
        setPlacedOrder(order) // move to the "waiting for payment" sub-step, see render below
      }
    } catch (err) {
      setError(err.message || 'Could not place your booking')
    } finally {
      setPlacing(false)
    }
  }

  // Placeholder "payment done" step for UPI/QR until a real gateway
  // (Razorpay/PayU/etc.) is connected — see confirmPaymentRequest.
  async function handlePaymentDone() {
    setPlacing(true); setError('')
    try {
      await confirmPaymentRequest(placedOrder._id)
      setStage('confirmed')
    } catch (err) {
      setError(err.message || 'Could not confirm payment')
    } finally {
      setPlacing(false)
    }
  }

  // ---- Confirmed state ----
  if (stage === 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <CheckCircle2 size={48} className="mx-auto text-green-600" />
        <h1 className="font-display italic text-3xl mt-4 text-ink dark:text-ivory">Booking Confirmed</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">
          {product.name} · Size {size} · {bookingDate} to {returnDate}
        </p>
        <div className="flex justify-center gap-3 mt-8">
          <Link to="/orders" className="px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">View My Orders</Link>
          <Link to="/" className="px-6 py-3 rounded-full border border-ink/20 dark:border-ivory/20 text-ink dark:text-ivory text-sm font-medium">Keep Browsing</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-14">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Product summary — sizes, price/day, details, availability, exactly as shown on the main page */}
        <div>
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-blush/40 dark:bg-charcoal">
            <img src={product.image || product.gallery?.[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <p className="font-label text-xs tracking-widest uppercase text-gold dark:text-gold-dark">{product.categoryName}</p>
          <h1 className="font-display italic text-3xl mt-2 text-ink dark:text-ivory">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-ink/60 dark:text-ivory/60">
            <span className="flex items-center gap-1"><Star size={14} className="fill-gold text-gold" /> {product.rating}</span>
            <span>·</span>
            <span className={product.available ? 'text-green-700 dark:text-green-400' : 'text-red-600'}>
              {product.available ? 'Available' : 'Reserved — check next slot'}
            </span>
          </div>
          <p className="mt-4 text-sm text-ink/70 dark:text-ivory/70 leading-relaxed">{product.description}</p>
          <p className="mt-3 font-display text-2xl text-wine dark:text-gold-dark">₹{product.rentalPrice.toLocaleString('en-IN')} / day</p>

          {stage === 'form' && (
            <div className="mt-8 space-y-5">
              {/* Size — mandatory */}
              <div id="field-size">
                <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">Size <span className="text-red-500">*</span></p>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || []).map((s) => (
                    <button key={s} type="button" onClick={() => setSize(s)}
                            className={`px-4 py-2 rounded-full text-xs border ${size === s ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : showErrors && missing.size ? 'border-red-500 text-red-600' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* No. of days — mandatory, 1 to 3 */}
              <div id="field-noOfDays">
                <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">No. of Days <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => setNoOfDays(n)}
                            className={`px-4 py-2 rounded-full text-xs border ${noOfDays === n ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : showErrors && missing.noOfDays ? 'border-red-500 text-red-600' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                      {n} {n === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking + return dates — mandatory */}
              <div className="grid grid-cols-2 gap-4">
                <div id="field-bookingDate">
                  <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2 block">Booking Date <span className="text-red-500">*</span></label>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className={fieldClass('bookingDate')} />
                </div>
                <div id="field-returnDate">
                  <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2 block">Return Date <span className="text-red-500">*</span></label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={fieldClass('returnDate')} />
                </div>
              </div>

              {/* Time slot — mandatory */}
              <div id="field-time">
                <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">Pickup / Delivery Time <span className="text-red-500">*</span></p>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => setTime(t)}
                            className={`px-3.5 py-2 rounded-full text-xs border ${time === t ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : showErrors && missing.time ? 'border-red-500 text-red-600' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon / offer — optional */}
              <div>
                <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2 flex items-center gap-1"><Tag size={12} /> Offer / Coupon (optional)</p>
                <div className="flex gap-2">
                  <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter code"
                         className="flex-1 px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponBusy}
                          className="px-4 py-2.5 rounded-xl border border-wine text-wine dark:border-gold-dark dark:text-gold-dark text-sm">
                    {couponBusy ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {coupon?.valid && <p className="mt-1 text-xs text-green-600">Coupon {coupon.code} applied — ₹{coupon.discountAmount} off</p>}
                {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
              </div>

              {/* Price summary */}
              <div className="pt-4 border-t border-ink/10 dark:border-ivory/10 space-y-1 text-sm">
                <div className="flex justify-between text-ink/70 dark:text-ivory/70"><span>Rental ({noOfDays || 0} day{noOfDays === 1 ? '' : 's'})</span><span>₹{price.toLocaleString('en-IN')}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discountAmount.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-ink/70 dark:text-ivory/70"><span>Refundable deposit</span><span>₹{(product.deposit || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-display text-xl text-wine dark:text-gold-dark pt-1"><span>Total</span><span>₹{grandTotal.toLocaleString('en-IN')}</span></div>
              </div>

              {showErrors && hasMissing && (
                <p className="text-xs text-red-600">Please fill in size, booking date, return date, no. of days and time to continue.</p>
              )}

              <button onClick={handleRentNowClick} disabled={!product.available}
                      className="w-full px-6 py-3.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-40">
                {hasMissing ? 'Rent Now' : 'Proceed'}
              </button>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-ink/10 dark:border-ivory/10 text-xs text-ink/60 dark:text-ivory/60">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-gold" /> Trial appointment included</span>
                <span className="flex items-center gap-2"><Truck size={15} className="text-gold" /> Pickup or doorstep delivery</span>
              </div>
            </div>
          )}

          {stage === 'payment' && !placedOrder && (
            <div className="mt-8 space-y-4">
              <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory">Select Payment Mode</p>
              {PAYMENT_MODES.map(({ id: pid, label, icon: Icon, blurb }) => (
                <button key={pid} type="button" onClick={() => setPaymentMode(pid)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left ${paymentMode === pid ? 'border-wine bg-wine/5 dark:border-gold-dark dark:bg-gold-dark/10' : 'border-ink/15 dark:border-ivory/15'}`}>
                  <Icon size={20} className="text-wine dark:text-gold-dark shrink-0" />
                  <span>
                    <span className="block text-sm text-ink dark:text-ivory font-medium">{label}</span>
                    <span className="block text-xs text-ink/50 dark:text-ivory/50">{blurb}</span>
                  </span>
                </button>
              ))}

              {paymentMode === 'qr' && (
                <div className="p-6 rounded-2xl border border-ink/10 dark:border-ivory/10 text-center">
                  <div className="w-40 h-40 mx-auto bg-ink/5 dark:bg-ivory/5 rounded-xl grid place-items-center text-xs text-ink/40 dark:text-ivory/40">
                    QR code placeholder<br />(connect a payment gateway to generate a real one)
                  </div>
                  <p className="mt-3 text-xs text-ink/50 dark:text-ivory/50">Scan with any UPI app, then confirm below.</p>
                </div>
              )}
              {paymentMode === 'upi' && (
                <div className="p-6 rounded-2xl border border-ink/10 dark:border-ivory/10 text-center text-xs text-ink/50 dark:text-ivory/50">
                  UPI payment placeholder — connect a gateway (Razorpay/PayU/etc.) to collect real payments here.
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button onClick={handleConfirmBooking} disabled={!paymentMode || placing}
                      className="w-full px-6 py-3.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-40">
                {placing ? 'Placing your booking…' : 'Confirm Booking'}
              </button>
              <button onClick={() => setStage('form')} className="w-full text-xs text-ink/50 dark:text-ivory/50">← Back to details</button>
            </div>
          )}

          {stage === 'payment' && placedOrder && paymentMode !== 'cod' && (
            <div className="mt-8 space-y-4 text-center">
              <p className="text-sm text-ink/70 dark:text-ivory/70">
                Complete your {paymentMode === 'qr' ? 'QR' : 'UPI'} payment, then confirm below.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button onClick={handlePaymentDone} disabled={placing}
                      className="w-full px-6 py-3.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-40">
                {placing ? 'Confirming…' : "I've Paid — Confirm"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
