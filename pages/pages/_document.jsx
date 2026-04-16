import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/ringrage-icon-180.png" />
        <meta name="theme-color" content="#E24B4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ring Rage" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
