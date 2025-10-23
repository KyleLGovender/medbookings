'use client';

import { useState } from 'react';

import { logger } from '@/lib/logger';

interface ContactInfo {
  name: string;
  phone: string;
}

export function VCardSender() {
  const [recipientNumber, setRecipientNumber] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/whatsapp/send-vcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactInfo,
          recipientNumber,
        }),
      });

      if (!response.ok) throw new Error('Failed to send vCard');

      setStatus('success');
    } catch (error) {
      logger.error('Error sending vCard', {
        error: error instanceof Error ? error.message : String(error),
      });
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="recipientNumber">Recipient WhatsApp Number (E.164 format):</label>
        <input
          type="text"
          id="recipientNumber"
          value={recipientNumber}
          onChange={(e) => setRecipientNumber(e.target.value)}
          placeholder="+1234567890"
          required
          className="w-full rounded border p-2"
        />
      </div>

      {/* Contact Info Fields */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="First Name"
          value={contactInfo.name}
          onChange={(e) => setContactInfo((prev) => ({ ...prev, firstName: e.target.value }))}
          required
          className="rounded border p-2"
        />
      </div>

      {/* Additional Fields */}
      <div className="space-y-2">
        <input
          type="tel"
          placeholder="Phone"
          value={contactInfo.phone}
          onChange={(e) => setContactInfo((prev) => ({ ...prev, phone: e.target.value }))}
          className="w-full rounded border p-2"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {status === 'loading' ? 'Sending...' : 'Send vCard'}
      </button>

      {status === 'success' && <p className="text-green-600">vCard sent successfully!</p>}
      {status === 'error' && (
        <p className="text-red-600">Failed to send vCard. Please try again.</p>
      )}
    </form>
  );
}
