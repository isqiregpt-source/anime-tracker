import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text || text.length < 2) {
    return NextResponse.json({ translated: text });
  }

  try {
    // MyMemory Translation API (бесплатный, без ключа)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ru`,
      {
        next: { revalidate: 3600 }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const translated = data.responseData?.translatedText || text;
      
      // Проверяем качество перевода
      if (data.responseStatus === 200 && translated !== text) {
        return NextResponse.json({ translated });
      }
    }

    return NextResponse.json({ translated: text });
  } catch (error) {
    console.error('Ошибка перевода:', error);
    return NextResponse.json({ translated: text });
  }
}