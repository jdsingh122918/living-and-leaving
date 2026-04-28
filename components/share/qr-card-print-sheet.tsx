"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import brandConfig from "@/brand.config";

interface QRCardPrintSheetProps {
  ownerFirstName: string;
  ownerLastName: string;
  qrCodeDataUrl: string;
  onClose: () => void;
}

const CARDS_PER_PAGE = 10;

export function QRCardPrintSheet({
  ownerFirstName,
  ownerLastName,
  qrCodeDataUrl,
  onClose,
}: QRCardPrintSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!mounted) return null;

  // Portal into document.body so the print CSS rule
  // `body > *:not(#qr-print-root) { display: none }` actually leaves
  // #qr-print-root as a direct body child instead of getting hidden
  // along with whatever admin layout wrapper React rendered into.
  return createPortal(
    <>
      <style>{`
        @media print {
          body > *:not(#qr-print-root) {
            display: none !important;
          }
          #qr-print-root {
            position: static !important;
            inset: auto !important;
            background: none !important;
            z-index: auto !important;
          }
          .qr-print-overlay-chrome {
            display: none !important;
          }
          .qr-card-grid {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: letter portrait;
            margin: 0.5in 0.5in;
          }
        }
      `}</style>

      <div
        id="qr-print-root"
        className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center overflow-auto"
      >
        <div className="qr-print-overlay-chrome sticky top-0 z-10 w-full bg-white border-b shadow-sm flex items-center justify-between px-6 py-3">
          <h2 className="text-lg font-semibold text-gray-800">
            QR Wallet Card Sheet
          </h2>
          <div className="flex items-center gap-3">
            <Button onClick={handlePrint} className="min-h-[44px] gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] gap-2"
            >
              <X className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div
          className="qr-card-grid"
          style={{
            width: "7.5in",
            minHeight: "10in",
            padding: "0.25in 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "repeat(5, 2in)",
            gap: "0",
            background: "white",
            margin: "24px auto",
          }}
        >
          {Array.from({ length: CARDS_PER_PAGE }).map((_, i) => (
            <QRCard
              key={i}
              firstName={ownerFirstName}
              lastName={ownerLastName}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ---------- Individual card ---------- */

function QRCard({
  firstName,
  lastName,
  qrCodeDataUrl,
}: {
  firstName: string;
  lastName: string;
  qrCodeDataUrl: string;
}) {
  return (
    <div
      style={{
        width: "3.5in",
        height: "2in",
        border: "0.5px solid #ccc",
        boxSizing: "border-box",
        padding: "0.15in 0.2in",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        pageBreakInside: "avoid",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "1 1 auto",
          minWidth: 0,
          paddingRight: "0.15in",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {brandConfig.logos?.light && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandConfig.logos.light}
                alt={brandConfig.name ?? "Logo"}
                style={{ height: "28px", width: "auto" }}
              />
            )}
            <span
              style={{
                fontSize: "7.5px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                textTransform: "uppercase",
                color: "#1a1a1a",
              }}
            >
              {renderBrandName(brandConfig.name ?? "")}
            </span>
          </div>
        </div>

        <div style={{ marginTop: "6px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.15,
            }}
          >
            {firstName}
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.15,
            }}
          >
            {lastName}
          </div>
        </div>

        <div
          style={{
            fontSize: "7px",
            color: "#444",
            fontWeight: 600,
            lineHeight: 1.3,
            marginTop: "auto",
            paddingTop: "4px",
          }}
        >
          Scan for healthcare directive
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCodeDataUrl}
          alt="QR Code"
          style={{
            width: "1.5in",
            height: "1.5in",
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}

// "Living & Leaving" → two lines "Living &" / "Leaving".
// Falls back to one line for short names.
function renderBrandName(name: string): React.ReactNode {
  const words = name.split(" ");
  if (words.length < 3) return name;
  const midpoint = Math.ceil(words.length / 2);
  return (
    <>
      {words.slice(0, midpoint).join(" ")}
      <br />
      {words.slice(midpoint).join(" ")}
    </>
  );
}
