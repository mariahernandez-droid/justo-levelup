import "./globals.css";

export const metadata = {
  title: "LevelUp – Justo SAC",
  description: "Plataforma interna de capacitación",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
