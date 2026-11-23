import { ImageResponse } from 'next/og';

export const alt = 'track — Agents make mistakes. Kane CLI catches & fixes them.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F9F5ED',
          padding: '56px 64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#11161F',
          border: '12px solid #131922',
        }}
      >
        {/* Top Row: Track Logo + Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: '#131922',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F2EEE6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <line x1="8" x2="16" y1="6" y2="6" />
                <line x1="16" x2="16" y1="14" y2="18" />
                <path d="M16 10h.01" />
                <path d="M12 10h.01" />
                <path d="M8 10h.01" />
                <path d="M12 14h.01" />
                <path d="M8 14h.01" />
                <path d="M12 18h.01" />
                <path d="M8 18h.01" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '40px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#11161F',
              }}
            >
              track
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FDFAF4',
              border: '2px solid #11161F',
              borderRadius: '999px',
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#545B66',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                backgroundColor: '#F25820',
              }}
            />
            <span>AI Transaction Calculator · Kane CLI</span>
          </div>
        </div>

        {/* Middle Row: Editorial Headline + Tilted Orange Terminal Snapshot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '48px',
            marginTop: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '610px' }}>
            <div
              style={{
                fontSize: '64px',
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
                color: '#11161F',
              }}
            >
              Agents make mistakes.
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '14px',
                marginTop: '12px',
                fontSize: '64px',
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
                color: '#11161F',
              }}
            >
              <span>Kane CLI</span>
              <span
                style={{
                  backgroundColor: '#EEE354',
                  padding: '2px 12px',
                  borderRadius: '6px',
                }}
              >
                fixes them.
              </span>
            </div>
            <div
              style={{
                marginTop: '24px',
                fontSize: '22px',
                lineHeight: 1.45,
                color: '#545B66',
              }}
            >
              Upload your CSV or Excel ledger. Pending, Reversed, and duplicate calculation bugs
              are caught, healed, and logged in the Audit Evidence Vault.
            </div>
          </div>

          {/* Mini Hot-Orange Framed Dark Ink Terminal */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F25820',
              padding: '14px',
              borderRadius: '26px',
              transform: 'rotate(1.5deg)',
              boxShadow: '10px 10px 0px #11161F',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '370px',
                backgroundColor: '#131922',
                borderRadius: '16px',
                padding: '24px',
                color: '#F2EEE6',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '999px', backgroundColor: '#545B66' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '999px', backgroundColor: '#545B66' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '999px', backgroundColor: '#FD8537' }} />
                </div>
                <span style={{ fontSize: '13px', color: '#9199A5' }}>kane audit: active</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
                <span style={{ color: '#FD8537' }}>› 2 Pending &amp; 1 Reversed caught</span>
                <span style={{ color: '#F2EEE6' }}>› 5 repeat rows protected</span>
                <span style={{ color: '#9199A5' }}>› 1 invalid row quarantined</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span style={{ fontSize: '12px', color: '#9199A5', letterSpacing: '0.1em' }}>
                  CERTIFIED SETTLED TOTAL
                </span>
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#EEE354', marginTop: '4px' }}>
                  $34,000.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #D7D0C3',
            paddingTop: '18px',
            fontSize: '18px',
            color: '#545B66',
            fontWeight: 600,
          }}
        >
          <span>CSV · XLSX · XLS · Live FX (USD / NGN / GBP / EUR)</span>
          <span style={{ color: '#059669' }}>✓ Kane Audit: Certified</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
