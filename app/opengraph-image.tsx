import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

// Dynamic Open Graph image built from the title-hero key art. Applies to the
// whole route tree (file-based metadata takes precedence), so every share/AI
// preview gets branded 1200×630 art.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const hero = await readFile(join(process.cwd(), 'public', 'title-hero.png'))
  const heroSrc = `data:image/png;base64,${hero.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 28% 50%, #1b2148 0%, #0c1024 60%, #0c1024 100%)',
          padding: '0 80px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          width={460}
          height={460}
          style={{ objectFit: 'contain' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 56,
            maxWidth: 560,
          }}
        >
          <div
            style={{
              fontSize: 104,
              fontWeight: 900,
              letterSpacing: '-2px',
              color: '#ecf0ff',
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 38,
              color: '#3aa8ff',
              lineHeight: 1.2,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 26,
              color: 'rgba(236,240,255,0.55)',
            }}
          >
            Free tap-to-split arcade game
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
