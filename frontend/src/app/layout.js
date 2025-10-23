import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '../contexts/NotificationContext';
// import IdleSessionProvider from '../contexts/IdleSessionProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TrustElect",
  description: "Secure Electronic Voting System",
};

export default function RootLayout({ children }) {
  return (
   
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>
          {/* <IdleSessionProvider> */}
            {children}
            <Toaster position="top-center" />
          {/* </IdleSessionProvider> */}
        </NotificationProvider>
      </body>
    </html>
  );
}
