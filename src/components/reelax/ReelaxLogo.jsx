import React from 'react';

export default function ReelaxLogo({ className = "h-10" }) {
  return (
    <a href="https://reelax-tickets.com/" target="_self">
      <img
        src="https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/08f5dbaa2_image.png"
        alt="Reelax Tickets"
        className={className}
        style={{ objectFit: 'contain' }}
      />
    </a>
  );
}