import './globals.css';

export const metadata = {
  title: 'Anime Tracker',
  description: 'Мой личный трекер аниме',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}