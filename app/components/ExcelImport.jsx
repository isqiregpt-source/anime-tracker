'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export default function ExcelImport({ onClose, onImportComplete }) {
  const [importMethod, setImportMethod] = useState('text');
  const [file, setFile] = useState(null);
  const [textList, setTextList] = useState('');
  const [preview, setPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0, errors: [] });
  const [selectedTags, setSelectedTags] = useState([]);
  const [targetCategory, setTargetCategory] = useState('planned');
  const [importDone, setImportDone] = useState(false);
  const [addAnyway, setAddAnyway] = useState(false);

  const categories = [
    { id: 'watching', name: '▶️ В процессе' },
    { id: 'completed', name: '⭐ Просмотренные' },
    { id: 'planned', name: '📌 Запланированные' },
    { id: 'on_hold', name: '️ Ожидаю' },
    { id: 'dropped', name: '🗑️ Заброшенные' },
    { id: 'closed', name: '🚫 Закрытые' },
  ];

  const allTags = [
    { id: 'priority', name: 'Смотреть в 1-ю очередь', color: '#ef4444' },
    { id: 'long', name: 'Длинный тайтл', color: '#06b6d4' },
    { id: 'isekai', name: 'Исекай', color: '#f97316' },
    { id: 'movie', name: 'Фильм', color: '#a855f7' },
    { id: 'top', name: 'Топ рейтинг', color: '#eab308' },
    { id: 'comedy', name: 'Комедия', color: '#22c55e' },
    { id: 'no-cover', name: 'Без обложки', color: '#6b7280' },
  ];

  const defaultNoCoverImage = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg';

  const handleTextChange = (e) => {
    const text = e.target.value;
    setTextList(text);
    
    // Парсим текст в формате: Название | Обложка | Год | Эпизоды | Оценка | Жанры
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const parsed = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        title: parts[0] || '',
        image_url: parts[1] || '',
        year: parts[2] || '',
        episodes: parts[3] || '',
        score: parts[4] || '',
        genres: parts[5] || ''
      };
    }).filter(item => item.title.length > 0);
    
    setPreview(parsed);
    setProgress({ current: 0, total: parsed.length, success: 0, failed: 0, errors: [] });
    setImportDone(false);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Пропускаем заголовок (первая строка)
        const animeList = jsonData.slice(1).map(row => ({
          title: row[0] || '',
          image_url: row[1] || '',
          year: row[2] || '',
          episodes: row[3] || '',
          score: row[4] || '',
          genres: row[5] || ''
        })).filter(item => item.title && item.title.toString().trim().length > 0);
        
        setPreview(animeList);
        setProgress({ current: 0, total: animeList.length, success: 0, failed: 0, errors: [] });
        setImportDone(false);
      } catch (error) {
        console.error('Ошибка чтения файла:', error);
        alert('Не удалось прочитать файл.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      alert('Сначала добавь список аниме!');
      return;
    }

    setIsImporting(true);
    setProgress({ current: 0, total: preview.length, success: 0, failed: 0, errors: [] });

    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    const currentProfile = JSON.parse(localStorage.getItem('currentProfile'));

    for (let i = 0; i < preview.length; i++) {
      const item = preview[i];
      const title = item.title.toString().trim();
      
      try {
        // Проверяем, есть ли уже такое аниме
        const { data: existing } = await supabase
          .from('anime')
          .select('id')
          .eq('title', title)
          .eq('profile_id', currentProfile?.id)
          .limit(1);

        if (existing && existing.length > 0) {
          failedCount++;
          errors.push({ title, reason: 'Уже существует в базе' });
        } else {
          // Формируем данные для добавления
          const hasNoCover = !item.image_url || 
                             item.image_url.includes('placeholder') || 
                             item.image_url === defaultNoCoverImage;
          const finalImageUrl = hasNoCover ? defaultNoCoverImage : item.image_url;
          
          let finalTags = [...selectedTags];
          if (hasNoCover && !finalTags.includes('no-cover')) {
            finalTags.push('no-cover');
          }

          // Парсим жанры
          const genres = item.genres 
            ? item.genres.toString().split(',').map(g => g.trim()).filter(g => g)
            : [];

          const newAnimePayload = {
            title: title,
            title_russian: title,
            year: item.year ? item.year.toString() : null,
            episodes: item.episodes ? item.episodes.toString() : null,
            synopsis: null,
            image_url: finalImageUrl,
            genres: genres,
            score: item.score ? Number(item.score) : null,
            format: 'TV',
            source: 'import',
            category_id: targetCategory,
            custom_tags: finalTags,
            profile_id: currentProfile?.id
          };

          const { error } = await supabase.from('anime').insert(newAnimePayload).select();
          
          if (error) {
            failedCount++;
            errors.push({ title, reason: 'Ошибка БД: ' + error.message });
          } else {
            successCount++;
          }
        }
      } catch (error) {
        failedCount++;
        errors.push({ title, reason: 'Ошибка: ' + error.message });
      }

      setProgress({ 
        current: i + 1, 
        total: preview.length, 
        success: successCount, 
        failed: failedCount, 
        errors: errors 
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsImporting(false);
    setImportDone(true);
  };

  const handleFinish = () => {
    if (onImportComplete) onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-400">📥 Импорт аниме</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-2xl transition font-bold" disabled={isImporting}>✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => { setImportMethod('text'); setPreview([]); setImportDone(false); }} className={`px-4 py-3 rounded-xl font-bold transition-all ${importMethod === 'text' ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>📝 Текстовый список</button>
            <button onClick={() => { setImportMethod('file'); setPreview([]); setImportDone(false); }} className={`px-4 py-3 rounded-xl font-bold transition-all ${importMethod === 'file' ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50' : 'bg-black/40 text-gray-400 border border-red-900/30 hover:border-red-700'}`}>📊 Excel/CSV файл</button>
          </div>

          {importMethod === 'text' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-3">Формат: Название | Обложка | Год | Эпизоды | Оценка | Жанры</label>
              <textarea 
                value={textList} 
                onChange={handleTextChange} 
                placeholder={`Убийца акаме | https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20613.jpg | 2014 | 24 | 78 | Экшен, Фэнтези, Драма\nOverlord | https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20832.jpg | 2015 | 52 | 80 | Фэнтези, Экшен`}
                rows={10} 
                className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700 placeholder-gray-500 resize-y font-mono" 
                disabled={isImporting} 
              />
            </div>
          )}

          {importMethod === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-3">Загрузи Excel/CSV файл:</label>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isImporting} className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-red-900/50 file:text-red-300 hover:file:bg-red-900/70" />
              <p className="text-xs text-gray-400 mt-2">Формат: Название | Ссылка на обложку | Год | Серий | Оценка | Жанры</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-400 font-bold">✓ Найдено аниме: {preview.length}</p>
                <button onClick={() => { setPreview([]); setTextList(''); setFile(null); }} className="text-xs text-gray-400 hover:text-red-400 transition">Очистить</button>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {preview.slice(0, 5).map((item, i) => (
                  <p key={i} className="text-xs text-gray-400">• {item.title} ({item.year})</p>
                ))}
                {preview.length > 5 && <p className="text-xs text-gray-500 mt-1">...и ещё {preview.length - 5}</p>}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-300 mb-3">Выбери папку для импорта:</label>
            <select value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} disabled={isImporting} className="w-full px-4 py-3 bg-black/60 border border-red-900/30 rounded-xl text-white text-sm focus:outline-none focus:border-red-700">
              {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-300 mb-3">Выбери теги (необязательно):</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => {
                const isActive = selectedTags.includes(tag.id);
                return (
                  <button key={tag.id} onClick={() => { isActive ? setSelectedTags(selectedTags.filter(id => id !== tag.id)) : setSelectedTags([...selectedTags, tag.id]); }} disabled={isImporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition border ${isActive ? 'bg-red-900/50 text-white border-red-700' : 'bg-black/40 text-gray-400 border-red-900/30 hover:border-red-700'}`}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {isImporting && (
            <div className="mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-red-400"> Импорт в процессе...</p>
                <p className="text-sm text-gray-400">{progress.current} / {progress.total}</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
                <div className="bg-gradient-to-r from-red-600 to-red-400 h-3 rounded-full transition-all duration-300" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}></div>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">✓ Успешно: {progress.success}</span>
                <span className="text-red-400">✕ Пропущено: {progress.failed}</span>
              </div>
            </div>
          )}

          {importDone && (
            <div className="mb-6 p-4 bg-black/40 border border-red-900/30 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">📊 Результаты импорта</h3>
                <button onClick={handleFinish} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition">✓ Завершить</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-green-900/20 border border-green-900/50 rounded-lg"><p className="text-xs text-gray-400">Добавлено</p><p className="text-2xl font-black text-green-400">{progress.success}</p></div>
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg"><p className="text-xs text-gray-400">Пропущено</p><p className="text-2xl font-black text-red-400">{progress.failed}</p></div>
              </div>
              {progress.errors.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {progress.errors.slice(0, 20).map((error, i) => (
                    <div key={i} className="p-2 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start gap-2">
                      <span className="text-red-400 text-xs mt-0.5">✕</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{error.title}</p>
                        <p className="text-xs text-gray-400">{error.reason}</p>
                      </div>
                    </div>
                  ))}
                  {progress.errors.length > 20 && <p className="text-xs text-gray-500 text-center">...и ещё {progress.errors.length - 20} ошибок</p>}
                </div>
              )}
            </div>
          )}

          {!importDone && (
            <button onClick={handleImport} disabled={isImporting || preview.length === 0} className={`w-full px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 ${isImporting || preview.length === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 transform hover:scale-105 shadow-lg shadow-red-900/50'}`}>
              {isImporting ? '⏳ Импортирую...' : `🚀 Импортировать ${preview.length} аниме`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}