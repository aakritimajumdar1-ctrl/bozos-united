import "./globals.css";

export const metadata = {
  title: "Bozos United",
  description: "Aakriti and Riley's wedding planning hub",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#FAF5EC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
