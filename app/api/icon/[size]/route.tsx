import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params
  const size = parseInt(sizeStr) || 192
  const pad = Math.round(size * 0.18)
  const innerSize = size - pad * 2

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#090909',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={innerSize}
          height={innerSize}
          viewBox="0 0 256 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="128" cy="128" r="100" stroke="#4fc3f7" strokeWidth="14" />
          <circle cx="128" cy="128" r="56" stroke="#4fc3f7" strokeWidth="10" strokeOpacity="0.55" />
          <circle cx="128" cy="128" r="18" fill="#4fc3f7" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
