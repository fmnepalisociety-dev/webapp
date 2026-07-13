// Reusable payment images (QR codes, etc.) offered as quick-fill presets in
// the RSVP image field. Update the URL here when the payment QR changes.
export interface PaymentImage {
  label: string
  url: string
}

export const PAYMENT_IMAGES: PaymentImage[] = [
  {label: 'Zelle QR (NeSFM)', url: 'https://fmnepali.org/img/payment/nesfm-zelle.jpeg'},
]
