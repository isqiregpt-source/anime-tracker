import { NextResponse } from 'next/server';

// Базовый URL для постеров Aniliberty
const ANILIBRIA_POSTER_URL = 'https://static.anilibria.tv';

// Нормализация запроса — убираем лишнее (сезоны, годы, серии)
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/\s*\d+\s*сезон/gi, '')
    .replace(/\s*season\s*\d+/gi, '')
    .replace(/\s*часть\s*\d+/gi, '')
    .replace(/\s*серия\s*\d+/gi, '')
    .replace(/\s*эпизод\s*\d+/gi, '')
    .replace(/\s*\(\d{4}\)/g, '')
    .replace(/\s*\d{4}\s*год/gi, '')
    .replace(/[!?.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ url: null });
  }

  const normalizedQuery = normalizeQuery(query);
  
  // Варианты запроса для поиска
  const searchVariants = [
    normalizedQuery,
    query,
    query.split(':')[0].trim(),
    query.split('—')[0].trim(),
    query.split('(')[0].trim(),
  ].filter(q => q && q.length >= 2);

  const uniqueVariants = [...new Set(searchVariants)];

  try {
    // 1. Aniliberty API (основной источник, знает русские названия)
    for (const searchQuery of uniqueVariants) {
      try {
        const anilibriaResponse = await fetch(
          `https://api.anilibria.tv/v3/title/search?search=${encodeURIComponent(searchQuery)}&limit=5&description=false`,
          {
            next: { revalidate: 3600 }
          }
        );

        if (anilibriaResponse.ok) {
          const anilibriaData = await anilibriaResponse.json();
          
          if (anilibriaData.list && anilibriaData.list.length > 0) {
            // Ищем результат с оригинальным постером
            const withPoster = anilibriaData.list.find(item => item.posters?.original?.url);

            if (withPoster) {
              const posterUrl = `${ANILIBRIA_POSTER_URL}${withPoster.posters.original.url}`;
              const title = withPoster.names?.ru || withPoster.names?.en || withPoster.names?.alternative?.[0] || searchQuery;
              
              console.log(`✅ Aniliberty: ${title}`);
              return NextResponse.json({ 
                url: posterUrl,
                source: 'aniliberty',
                title: title
              });
            }

            // Если нет оригинального, пробуем medium
            const withMediumPoster = anilibriaData.list.find(item => item.posters?.medium?.url);

            if (withMediumPoster) {
              const posterUrl = `${ANILIBRIA_POSTER_URL}${withMediumPoster.posters.medium.url}`;
              const title = withMediumPoster.names?.ru || withMediumPoster.names?.en || searchQuery;
              
              console.log(`✅ Aniliberty (medium): ${title}`);
              return NextResponse.json({ 
                url: posterUrl,
                source: 'aniliberty',
                title: title
              });
            }
          }
        }
      } catch (e) {
        console.log(`Aniliberty ошибка для "${searchQuery}":`, e.message);
      }
    }

    // 2. Fallback на Shikimori (если Aniliberty не нашёл)
    for (const searchQuery of uniqueVariants) {
      try {
        const shikimoriResponse = await fetch(
          `https://shikimori.one/api/animes?search=${encodeURIComponent(searchQuery)}&limit=3`,
          {
            headers: {
              'User-Agent': 'AnimeTracker/1.0 (contact@example.com)',
              'Accept': 'application/json',
            },
            next: { revalidate: 3600 }
          }
        );

        if (shikimoriResponse.ok) {
          const shikimoriData = await shikimoriResponse.json();
          
          if (Array.isArray(shikimoriData) && shikimoriData.length > 0) {
            const firstWithImage = shikimoriData.find(a => a.image?.original);
            if (firstWithImage) {
              console.log(`✅ Shikimori: ${firstWithImage.russian || firstWithImage.name}`);
              return NextResponse.json({ 
                url: `https://shikimori.one${firstWithImage.image.original}`,
                source: 'shikimori',
                title: firstWithImage.russian || firstWithImage.name
              });
            }
          }
        }
      } catch (e) {
        console.log(`Shikimori ошибка для "${searchQuery}":`, e.message);
      }
    }

    console.log(`❌ Не найдено для: ${query}`);
    return NextResponse.json({ url: null });
  } catch (error) {
    console.error('Общая ошибка поиска:', error);
    return NextResponse.json({ url: null });
  }
}