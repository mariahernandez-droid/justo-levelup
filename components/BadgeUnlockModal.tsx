"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  open: boolean;
  badgeIcon: string;
  badgeName: string;
  onClose: () => void;
}

export default function BadgeUnlockModal({
  open,
  badgeIcon,
  badgeName,
  onClose
}: Props) {

  useEffect(() => {

    if (open) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

  }, [open]);

  if (!open) return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm">

        <h2 className="text-3xl font-bold mb-4">
          🎉 Nueva insignia
        </h2>

        <div className="text-6xl mb-4">
          {badgeIcon}
        </div>

        <p className="text-xl font-semibold mb-6">
          {badgeName}
        </p>

        <button
          onClick={onClose}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl"
        >
          Continuar
        </button>

      </div>

    </div>

  );

}