import { NextResponse } from 'next/server';
import Fuse from 'fuse.js';

const defaultNoCoverImage = 'https://images.meme-arsenal.com/31f2e18074a78fed6adf2284b5ff3e71.jpg';

// Локальная база для мгновенного поиска
const localMap = new Map([
  ['хеллсинг', { title: 'Хеллсинг Ultimate', english: 'Hellsing Ultimate', year: '2006', episodes: '10', score: 84, genres: ['Экшен', 'Ужасы'] }],
  ['акудама', { title: 'Акудама Драйв', english: 'Akudama Drive', year: '2020', episodes: '12', score: 78, genres: ['Экшен', 'Фантастика'] }],
  ['ван пис', { title: 'Ван-Пис', english: 'One Piece', year: '1999', episodes: '1100+', score: 87, genres: ['Экшен', 'Приключения'] }],
  ['one piece', { title: 'Ван-Пис', english: 'One Piece', year: '1999', episodes: '1100+', score: 87, genres: ['Экшен', 'Приключения'] }],
  ['мастера меча', { title: 'Мастера меча онлайн', english: 'Sword Art Online', year: '2012', episodes: '96', score: 75, genres: ['Экшен', 'Фантастика'] }],
  ['sword art', { title: 'Мастера меча онлайн', english: 'Sword Art Online', year: '2012', episodes: '96', score: 75, genres: ['Экшен', 'Фантастика'] }],
  ['семь смертных', { title: 'Семь смертных грехов', english: 'The Seven Deadly Sins', year: '2014', episodes: '100', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['конусуба', { title: 'Конусуба: Да благословит этот прекрасный мир!', english: 'KonoSuba', year: '2016', episodes: '20', score: 82, genres: ['Комедия', 'Фэнтези'] }],
  ['kono suba', { title: 'Конусуба: Да благословит этот прекрасный мир!', english: 'KonoSuba', year: '2016', episodes: '20', score: 82, genres: ['Комедия', 'Фэнтези'] }],
  ['по велению', { title: 'По велению адской сестры', english: 'Onimai', year: '2023', episodes: '12', score: 78, genres: ['Комедия', 'Повседневность'] }],
  ['эроса', { title: 'Вот почему без Эроса жизнь мне не мила!', english: 'Nande Koko ni Sensei ga!?', year: '2019', episodes: '12', score: 70, genres: ['Комедия', 'Романтика'] }],
  ['сильнейший мудрец', { title: 'Сильнейший мудрец низшей эмблемы', english: 'The Strongest Sage With the Weakest Crest', year: '2022', episodes: '12', score: 72, genres: ['Фэнтези', 'Экшен'] }],
  ['усио', { title: 'Усио и Тора', english: 'Ushio and Tora', year: '2015', episodes: '39', score: 76, genres: ['Экшен', 'Фэнтези'] }],
  ['бездарная', { title: 'Бездарная Нана', english: 'Munou na Nana', year: '2020', episodes: '13', score: 76, genres: ['Триллер', 'Мистика'] }],
  ['арифурэта', { title: 'Арифурэта: Сильнейший ремесленник в мире', english: 'Arifureta', year: '2019', episodes: '25', score: 72, genres: ['Фэнтези', 'Экшен'] }],
  ['семья шпиона', { title: 'Семья шпиона', english: 'Spy x Family', year: '2022', episodes: '37', score: 85, genres: ['Экшен', 'Комедия'] }],
  ['spy family', { title: 'Семья шпиона', english: 'Spy x Family', year: '2022', episodes: '37', score: 85, genres: ['Экшен', 'Комедия'] }],
  ['повторная жизнь', { title: 'Повторная жизнь', english: 'ReLIFE', year: '2016', episodes: '13', score: 80, genres: ['Драма', 'Романтика'] }],
  ['маг на полную', { title: 'Маг на полную ставку', english: 'Quanzhi Fashi', year: '2016', episodes: '48', score: 74, genres: ['Экшен', 'Фэнтези'] }],
  ['хроники акаши', { title: 'Хроники Акаши', english: 'Akashic Records of Bastard Magic Instructor', year: '2017', episodes: '12', score: 74, genres: ['Фэнтези', 'Экшен'] }],
  ['потерявшийся герой', { title: 'Потерявшийся герой забрал девицу домой', english: 'Maigo no Hero', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Романтика'] }],
  ['непризнанный', { title: 'Непризнанный школой владыка демонов', english: 'The Misfit of Demon King Academy', year: '2020', episodes: '26', score: 78, genres: ['Фэнтези', 'Экшен'] }],
  ['обычный мужчина', { title: 'Обычный мужчина средних лет и его журнал активности в VRMMO', english: "The Old Man's VRMMO Activity Diary", year: '2023', episodes: '12', score: 70, genres: ['Фэнтези', 'Приключения'] }],
  ['для тебя бессмертный', { title: 'Для тебя, Бессмертный', english: 'To Your Eternity', year: '2021', episodes: '40', score: 84, genres: ['Драма', 'Фэнтези'] }],
  ['to your eternity', { title: 'Для тебя, Бессмертный', english: 'To Your Eternity', year: '2021', episodes: '40', score: 84, genres: ['Драма', 'Фэнтези'] }],
  ['бессмертного короля', { title: 'Повседневная жизнь бессмертного короля', english: 'The Daily Life of the Immortal King', year: '2020', episodes: '30', score: 74, genres: ['Экшен', 'Фэнтези'] }],
  ['overlord', { title: 'Overlord', english: 'Overlord', year: '2015', episodes: '52', score: 80, genres: ['Фэнтези', 'Экшен'] }],
  ['питер грилл', { title: 'Питер Грилл и время мудреца', english: "Peter Grill and the Philosopher's Time", year: '2020', episodes: '12', score: 62, genres: ['Комедия', 'Фэнтези'] }],
  ['уникальным навыком', { title: 'С этим уникальным навыком я стану сильнейшим', english: 'Kono Skill ga Isekai de Saikyou desu', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['восхождение в тени', { title: 'Восхождение в тени', english: 'The Eminence in Shadow', year: '2022', episodes: '20', score: 83, genres: ['Экшен', 'Комедия'] }],
  ['eminence shadow', { title: 'Восхождение в тени', english: 'The Eminence in Shadow', year: '2022', episodes: '20', score: 83, genres: ['Экшен', 'Комедия'] }],
  ['адский рай', { title: 'Адский рай', english: "Hell's Paradise", year: '2023', episodes: '13', score: 81, genres: ['Экшен', 'Приключения'] }],
  ['hell paradise', { title: 'Адский рай', english: "Hell's Paradise", year: '2023', episodes: '13', score: 81, genres: ['Экшен', 'Приключения'] }],
  ['мышцы магия', { title: 'Мышцы и магия', english: 'Mashle', year: '2023', episodes: '24', score: 78, genres: ['Экшен', 'Комедия'] }],
  ['mashle', { title: 'Мышцы и магия', english: 'Mashle', year: '2023', episodes: '24', score: 78, genres: ['Экшен', 'Комедия'] }],
  ['re zero', { title: 'Re:Zero. Жизнь с нуля в другом мире', english: 'Re:Zero', year: '2016', episodes: '50', score: 83, genres: ['Фэнтези', 'Драма'] }],
  ['ре зеро', { title: 'Re:Zero. Жизнь с нуля в другом мире', english: 'Re:Zero', year: '2016', episodes: '50', score: 83, genres: ['Фэнтези', 'Драма'] }],
  ['стальной алхимик', { title: 'Стальной алхимик: Братство', english: 'Fullmetal Alchemist: Brotherhood', year: '2009', episodes: '64', score: 92, genres: ['Экшен', 'Приключения'] }],
  ['fullmetal', { title: 'Стальной алхимик: Братство', english: 'Fullmetal Alchemist: Brotherhood', year: '2009', episodes: '64', score: 92, genres: ['Экшен', 'Приключения'] }],
  ['изгнанный рыцарь', { title: 'Изгнанный реинкарнированный тяжёлый рыцарь', english: 'Tsuihou sareta Tensei Kiju', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['наруто', { title: 'Наруто', english: 'Naruto', year: '2002', episodes: '220', score: 83, genres: ['Экшен', 'Приключения'] }],
  ['атака титанов', { title: 'Атака титанов', english: 'Attack on Titan', year: '2013', episodes: '87', score: 90, genres: ['Экшен', 'Драма'] }],
  ['attack on titan', { title: 'Атака титанов', english: 'Attack on Titan', year: '2013', episodes: '87', score: 90, genres: ['Экшен', 'Драма'] }],
  ['тетрадь смерти', { title: 'Тетрадь смерти', english: 'Death Note', year: '2006', episodes: '37', score: 86, genres: ['Триллер', 'Детектив'] }],
  ['death note', { title: 'Тетрадь смерти', english: 'Death Note', year: '2006', episodes: '37', score: 86, genres: ['Триллер', 'Детектив'] }],
  ['клинок рассекающий', { title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', year: '2019', episodes: '55', score: 86, genres: ['Экшен', 'Фэнтези'] }],
  ['demon slayer', { title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', year: '2019', episodes: '55', score: 86, genres: ['Экшен', 'Фэнтези'] }],
  ['киметсу', { title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', year: '2019', episodes: '55', score: 86, genres: ['Экшен', 'Фэнтези'] }],
  ['магическая битва', { title: 'Магическая битва', english: 'Jujutsu Kaisen', year: '2020', episodes: '47', score: 86, genres: ['Экшен', 'Фэнтези'] }],
  ['jujutsu', { title: 'Магическая битва', english: 'Jujutsu Kaisen', year: '2020', episodes: '47', score: 86, genres: ['Экшен', 'Фэнтези'] }],
  ['бензопила', { title: 'Человек-бензопила', english: 'Chainsaw Man', year: '2022', episodes: '12', score: 85, genres: ['Экшен', 'Ужасы'] }],
  ['chainsaw', { title: 'Человек-бензопила', english: 'Chainsaw Man', year: '2022', episodes: '12', score: 85, genres: ['Экшен', 'Ужасы'] }],
  ['дандадан', { title: 'Дандадан', english: 'Dandadan', year: '2024', episodes: '12', score: 87, genres: ['Экшен', 'Комедия'] }],
  ['поднятие уровня', { title: 'Поднятие уровня в одиночку', english: 'Solo Leveling', year: '2024', episodes: '12', score: 84, genres: ['Экшен', 'Фэнтези'] }],
  ['solo leveling', { title: 'Поднятие уровня в одиночку', english: 'Solo Leveling', year: '2024', episodes: '12', score: 84, genres: ['Экшен', 'Фэнтези'] }],
  ['слизь', { title: 'О моём перерождении в слизь', english: 'That Time I Got Reincarnated as a Slime', year: '2018', episodes: '72', score: 82, genres: ['Фэнтези', 'Приключения'] }],
  ['tensei slime', { title: 'О моём перерождении в слизь', english: 'That Time I Got Reincarnated as a Slime', year: '2018', episodes: '72', score: 82, genres: ['Фэнтези', 'Приключения'] }],
  ['безработного', { title: 'Реинкарнация безработного', english: 'Mushoku Tensei', year: '2021', episodes: '35', score: 84, genres: ['Фэнтези', 'Драма'] }],
  ['mushoku', { title: 'Реинкарнация безработного', english: 'Mushoku Tensei', year: '2021', episodes: '35', score: 84, genres: ['Фэнтези', 'Драма'] }],
  ['ванпанчмен', { title: 'Ванпанчмен', english: 'One Punch Man', year: '2015', episodes: '24', score: 85, genres: ['Экшен', 'Комедия'] }],
  ['one punch', { title: 'Ванпанчмен', english: 'One Punch Man', year: '2015', episodes: '24', score: 85, genres: ['Экшен', 'Комедия'] }],
  ['доктор стоун', { title: 'Доктор Стоун', english: 'Dr. Stone', year: '2019', episodes: '35', score: 82, genres: ['Приключения', 'Фантастика'] }],
  ['dr stone', { title: 'Доктор Стоун', english: 'Dr. Stone', year: '2019', episodes: '35', score: 82, genres: ['Приключения', 'Фантастика'] }],
  ['ирума', { title: 'Добро пожаловать в ад Ирума', english: 'Welcome to Demon School! Iruma-kun', year: '2019', episodes: '65', score: 78, genres: ['Комедия', 'Фэнтези'] }],
  ['паук', { title: 'Да, я паук, и что?', english: "So I'm a Spider, So What?", year: '2021', episodes: '24', score: 74, genres: ['Фэнтези', 'Приключения'] }],
  ['внук мудреца', { title: 'Внук мудреца', english: 'Kenja no Mago', year: '2019', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['боюсь боли', { title: 'Боюсь боли, поэтому вкачаю всю защиту', english: 'Bofuri', year: '2020', episodes: '24', score: 74, genres: ['Фэнтези', 'Комедия'] }],
  ['bofuri', { title: 'Боюсь боли, поэтому вкачаю всю защиту', english: 'Bofuri', year: '2020', episodes: '24', score: 74, genres: ['Фэнтези', 'Комедия'] }],
  ['нет игры нет жизни', { title: 'Нет игры, нет жизни', english: 'No Game No Life', year: '2014', episodes: '12', score: 82, genres: ['Фэнтези', 'Комедия'] }],
  ['no game', { title: 'Нет игры, нет жизни', english: 'No Game No Life', year: '2014', episodes: '12', score: 82, genres: ['Фэнтези', 'Комедия'] }],
  ['лунное путешествие', { title: 'Лунное путешествие в другой мир', english: 'Tsukimichi', year: '2021', episodes: '25', score: 78, genres: ['Фэнтези', 'Приключения'] }],
  ['tsukimichi', { title: 'Лунное путешествие в другой мир', english: 'Tsukimichi', year: '2021', episodes: '25', score: 78, genres: ['Фэнтези', 'Приключения'] }],
  ['id вторжение', { title: 'ID: Вторжение', english: 'ID: Invaded', year: '2020', episodes: '13', score: 78, genres: ['Фантастика', 'Мистика'] }],
  ['плод эволюции', { title: 'Плод эволюции', english: 'Shinka no Mi', year: '2021', episodes: '12', score: 62, genres: ['Фэнтези', 'Комедия'] }],
  ['ассасин аристократ', { title: 'Лучший в мире ассасин, переродившийся в другом мире как аристократ', english: "The World's Finest Assassin", year: '2021', episodes: '12', score: 76, genres: ['Экшен', 'Фэнтези'] }],
  ['перерождение дяди', { title: 'Перерождение дяди', english: 'Isekai Ojisan', year: '2022', episodes: '13', score: 80, genres: ['Фэнтези', 'Комедия'] }],
  ['isekai ojisan', { title: 'Перерождение дяди', english: 'Isekai Ojisan', year: '2022', episodes: '13', score: 80, genres: ['Фэнтези', 'Комедия'] }],
  ['паразит', { title: 'Паразит', english: 'Parasyte', year: '2014', episodes: '24', score: 84, genres: ['Экшен', 'Ужасы'] }],
  ['дороро', { title: 'Дороро', english: 'Dororo', year: '2019', episodes: '24', score: 81, genres: ['Экшен', 'Фэнтези'] }],
  ['убийца гоблинов', { title: 'Убийца гоблинов', english: 'Goblin Slayer', year: '2018', episodes: '24', score: 75, genres: ['Экшен', 'Фэнтези'] }],
  ['goblin slayer', { title: 'Убийца гоблинов', english: 'Goblin Slayer', year: '2018', episodes: '24', score: 75, genres: ['Экшен', 'Фэнтези'] }],
  ['киберпанк', { title: 'Киберпанк: Бегущие по краю', english: 'Cyberpunk: Edgerunners', year: '2022', episodes: '10', score: 86, genres: ['Экшен', 'Фантастика'] }],
  ['edgerunners', { title: 'Киберпанк: Бегущие по краю', english: 'Cyberpunk: Edgerunners', year: '2022', episodes: '10', score: 86, genres: ['Экшен', 'Фантастика'] }],
  ['кулинарные скитания', { title: 'Кулинарные скитания в параллельном мире', english: 'Campfire Cooking', year: '2023', episodes: '12', score: 76, genres: ['Фэнтези', 'Приключения'] }],
  ['гуррен лаганн', { title: 'Гуррен-Лаганн', english: 'Gurren Lagann', year: '2007', episodes: '27', score: 86, genres: ['Экшен', 'Меха'] }],
  ['берсерк', { title: 'Берсерк', english: 'Berserk', year: '1997', episodes: '25', score: 86, genres: ['Экшен', 'Драма'] }],
  ['ковбой бибоп', { title: 'Ковбой Бибоп', english: 'Cowboy Bebop', year: '1998', episodes: '26', score: 86, genres: ['Экшен', 'Фантастика'] }],
  ['cowboy bebop', { title: 'Ковбой Бибоп', english: 'Cowboy Bebop', year: '1998', episodes: '26', score: 86, genres: ['Экшен', 'Фантастика'] }],
  ['евангелион', { title: 'Евангелион', english: 'Neon Genesis Evangelion', year: '1995', episodes: '26', score: 84, genres: ['Фантастика', 'Драма'] }],
  ['evangelion', { title: 'Евангелион', english: 'Neon Genesis Evangelion', year: '1995', episodes: '26', score: 84, genres: ['Фантастика', 'Драма'] }],
  ['код гиасс', { title: 'Код Гиасс', english: 'Code Geass', year: '2006', episodes: '50', score: 87, genres: ['Экшен', 'Фантастика'] }],
  ['блич', { title: 'Блич', english: 'Bleach', year: '2004', episodes: '366', score: 80, genres: ['Экшен', 'Приключения'] }],
  ['драконий жемчуг', { title: 'Драконий жемчуг Z', english: 'Dragon Ball Z', year: '1989', episodes: '291', score: 83, genres: ['Экшен', 'Приключения'] }],
  ['хвост феи', { title: 'Хвост феи', english: 'Fairy Tail', year: '2009', episodes: '328', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['обещанный неверленд', { title: 'Обещанный Неверленд', english: 'The Promised Neverland', year: '2019', episodes: '23', score: 84, genres: ['Триллер', 'Фантастика'] }],
  ['моя геройская', { title: 'Моя геройская академия', english: 'My Hero Academia', year: '2016', episodes: '138', score: 80, genres: ['Экшен', 'Фэнтези'] }],
  ['hero academia', { title: 'Моя геройская академия', english: 'My Hero Academia', year: '2016', episodes: '138', score: 80, genres: ['Экшен', 'Фэнтези'] }],
  ['созданный бездне', { title: 'Созданный в бездне', english: 'Made in Abyss', year: '2017', episodes: '25', score: 87, genres: ['Фэнтези', 'Приключения'] }],
  ['made abyss', { title: 'Созданный в бездне', english: 'Made in Abyss', year: '2017', episodes: '25', score: 87, genres: ['Фэнтези', 'Приключения'] }],
  ['безумный азарт', { title: 'Безумный азарт', english: 'Kakegurui', year: '2017', episodes: '24', score: 76, genres: ['Драма', 'Мистика'] }],
  ['класс убийц', { title: 'Класс убийц', english: 'Assassination Classroom', year: '2015', episodes: '47', score: 82, genres: ['Экшен', 'Комедия'] }],
  ['тяжкий труд подземелье', { title: 'Тяжкий труд в подземелье', english: 'Delicious in Dungeon', year: '2024', episodes: '24', score: 86, genres: ['Фэнтези', 'Комедия'] }],
  ['dungeon meshi', { title: 'Тяжкий труд в подземелье', english: 'Delicious in Dungeon', year: '2024', episodes: '24', score: 86, genres: ['Фэнтези', 'Комедия'] }],
  ['одинокий рокер', { title: 'Одинокий рокер', english: 'Bocchi the Rock!', year: '2022', episodes: '12', score: 88, genres: ['Комедия', 'Музыка'] }],
  ['bocchi', { title: 'Одинокий рокер', english: 'Bocchi the Rock!', year: '2022', episodes: '12', score: 88, genres: ['Комедия', 'Музыка'] }],
  ['башня бога', { title: 'Башня бога', english: 'Tower of God', year: '2020', episodes: '26', score: 77, genres: ['Экшен', 'Фэнтези'] }],
  ['tower god', { title: 'Башня бога', english: 'Tower of God', year: '2020', episodes: '26', score: 77, genres: ['Экшен', 'Фэнтези'] }],
  ['шарлотта', { title: 'Шарлотта', english: 'Charlotte', year: '2015', episodes: '13', score: 79, genres: ['Драма', 'Фантастика'] }],
  ['тёмный дворецкий', { title: 'Тёмный дворецкий', english: 'Black Butler', year: '2008', episodes: '46', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['black butler', { title: 'Тёмный дворецкий', english: 'Black Butler', year: '2008', episodes: '46', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['дюрарара', { title: 'Дюрарара', english: 'Durarara!!', year: '2010', episodes: '24', score: 82, genres: ['Экшен', 'Мистика'] }],
  ['акаме', { title: 'Убийца акаме', english: 'Akame ga Kill!', year: '2014', episodes: '24', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['akame', { title: 'Убийца акаме', english: 'Akame ga Kill!', year: '2014', episodes: '24', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['смартфон', { title: 'В другом мире со смартфоном', english: 'In Another World With My Smartphone', year: '2017', episodes: '24', score: 66, genres: ['Фэнтези', 'Приключения'] }],
  ['рыцари магия', { title: 'Рыцари и магия', english: "Knight's & Magic", year: '2017', episodes: '13', score: 72, genres: ['Фэнтези', 'Меха'] }],
  ['она представилась', { title: 'Она представилась учеником мудреца', english: 'Majo no Tabitabi', year: '2020', episodes: '12', score: 76, genres: ['Фэнтези', 'Приключения'] }],
  ['девушкой монстром', { title: 'Повседневная жизнь с девушкой монстром', english: 'Monster Musume', year: '2015', episodes: '12', score: 70, genres: ['Комедия', 'Фэнтези'] }],
  ['тетрадь', { title: 'Тетрадь смерти', english: 'Death Note', year: '2006', episodes: '37', score: 86, genres: ['Триллер', 'Детектив'] }],
  ['мэри ведьмин', { title: 'Мэри и ведьмин цветок', english: "Mary and the Witch's Flower", year: '2017', episodes: '1', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['hunter hunter', { title: 'Hunter x Hunter', english: 'Hunter x Hunter', year: '2011', episodes: '148', score: 90, genres: ['Экшен', 'Приключения'] }],
  ['охотник', { title: 'Hunter x Hunter', english: 'Hunter x Hunter', year: '2011', episodes: '148', score: 90, genres: ['Экшен', 'Приключения'] }],
  ['чёрный клевер', { title: 'Чёрный клевер', english: 'Black Clover', year: '2017', episodes: '170', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['black clover', { title: 'Чёрный клевер', english: 'Black Clover', year: '2017', episodes: '170', score: 78, genres: ['Экшен', 'Фэнтези'] }],
  ['невеста чародея', { title: 'Невеста чародея', english: "The Ancient Magus' Bride", year: '2017', episodes: '24', score: 81, genres: ['Фэнтези', 'Романтика'] }],
  ['magus bride', { title: 'Невеста чародея', english: "The Ancient Magus' Bride", year: '2017', episodes: '24', score: 81, genres: ['Фэнтези', 'Романтика'] }],
  ['рандеву', { title: 'Рандеву с жизнью', english: 'Date A Live', year: '2013', episodes: '60', score: 74, genres: ['Фантастика', 'Романтика'] }],
  ['date live', { title: 'Рандеву с жизнью', english: 'Date A Live', year: '2013', episodes: '60', score: 74, genres: ['Фантастика', 'Романтика'] }],
  ['онидзука', { title: 'Крутой учитель Онидзука', english: 'Great Teacher Onizuka', year: '1999', episodes: '43', score: 86, genres: ['Комедия', 'Драма'] }],
  ['great teacher', { title: 'Крутой учитель Онидзука', english: 'Great Teacher Onizuka', year: '1999', episodes: '43', score: 86, genres: ['Комедия', 'Драма'] }],
  ['класс превосходства', { title: 'Добро пожаловать в класс превосходства', english: 'Classroom of the Elite', year: '2017', episodes: '38', score: 80, genres: ['Драма', 'Психология'] }],
  ['classroom elite', { title: 'Добро пожаловать в класс превосходства', english: 'Classroom of the Elite', year: '2017', episodes: '38', score: 80, genres: ['Драма', 'Психология'] }],
  ['последний серафим', { title: 'Последний серафим', english: 'Owari no Seraph', year: '2015', episodes: '24', score: 76, genres: ['Экшен', 'Фэнтези'] }],
  ['кабанэ', { title: 'Инцидент Кабанэ', english: 'Kabaneri', year: '2016', episodes: '12', score: 74, genres: ['Экшен', 'Фантастика'] }],
  ['скейт', { title: 'Бесконечный скейт', english: 'SK8 the Infinity', year: '2021', episodes: '12', score: 80, genres: ['Спорт', 'Комедия'] }],
  ['sk8', { title: 'Бесконечный скейт', english: 'SK8 the Infinity', year: '2021', episodes: '12', score: 80, genres: ['Спорт', 'Комедия'] }],
  ['тринити', { title: 'Тринити: Семь магов', english: 'Trinity Seven', year: '2014', episodes: '12', score: 74, genres: ['Экшен', 'Фэнтези'] }],
  ['ханако', { title: 'Туалетный мальчик Ханако-кун', english: 'Jibaku Shounen Hanako-kun', year: '2020', episodes: '12', score: 78, genres: ['Комедия', 'Мистика'] }],
  ['инуяшики', { title: 'Инуяшики', english: 'Inuyashiki', year: '2017', episodes: '11', score: 77, genres: ['Экшен', 'Фантастика'] }],
  ['баки', { title: 'Боец Баки', english: 'Baki', year: '2018', episodes: '26', score: 74, genres: ['Экшен', 'Спорт'] }],
  ['кастлвания', { title: 'Кастлвания', english: 'Castlevania', year: '2017', episodes: '32', score: 83, genres: ['Экшен', 'Фэнтези'] }],
  ['люпен', { title: 'Люпен III', english: 'Lupin III', year: '1971', episodes: '155+', score: 79, genres: ['Экшен', 'Приключения'] }],
  ['акира', { title: 'Акира', english: 'Akira', year: '1988', episodes: '1', score: 81, genres: ['Фантастика', 'Экшен'] }],
  ['сайки', { title: 'Несладкая жизнь псионика Сайки Касуо', english: 'Saiki Kusuo', year: '2016', episodes: '120', score: 84, genres: ['Комедия', 'Фантастика'] }],
  ['saiki', { title: 'Несладкая жизнь псионика Сайки Касуо', english: 'Saiki Kusuo', year: '2016', episodes: '120', score: 84, genres: ['Комедия', 'Фантастика'] }],
  ['магистр дьявольского', { title: 'Магистр дьявольского культа', english: 'Mo Dao Zu Shi', year: '2018', episodes: '35', score: 84, genres: ['Экшен', 'Фэнтези'] }],
  ['ванитоса', { title: 'Мемуары Ванитоса', english: 'The Case Study of Vanitas', year: '2021', episodes: '24', score: 80, genres: ['Экшен', 'Фэнтези'] }],
  ['vanitas', { title: 'Мемуары Ванитоса', english: 'The Case Study of Vanitas', year: '2021', episodes: '24', score: 80, genres: ['Экшен', 'Фэнтези'] }],
  ['high school dxd', { title: 'Бог старшей школы', english: 'High School DxD', year: '2012', episodes: '48', score: 75, genres: ['Экшен', 'Фэнтези'] }],
  ['врата', { title: 'Врата: там бьются наши воины', english: 'Gate', year: '2015', episodes: '24', score: 77, genres: ['Фэнтези', 'Экшен'] }],
  ['радиант', { title: 'Радиант', english: 'Radiant', year: '2018', episodes: '42', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['биско', { title: 'Биско Ржавоед', english: 'Sabikui Bisco', year: '2022', episodes: '12', score: 73, genres: ['Экшен', 'Фэнтези'] }],
  ['семпай раздражает', { title: 'Мой семпай раздражает', english: 'Senpai ga Uzai', year: '2021', episodes: '12', score: 78, genres: ['Комедия', 'Романтика'] }],
  ['ублюдок', { title: 'Ублюдок!! Сокрушитель тьмы', english: 'Mashle', year: '2023', episodes: '24', score: 78, genres: ['Экшен', 'Комедия'] }],
  ['билд дивайд', { title: 'Билд Дивайд', english: 'Build Divide', year: '2021', episodes: '24', score: 68, genres: ['Фантастика', 'Игры'] }],
  ['рагна', { title: 'Рагна Багровый', english: 'Ragna Crimson', year: '2023', episodes: '24', score: 72, genres: ['Экшен', 'Фэнтези'] }],
  ['перси джексон', { title: 'Перси Джексон и Олимпийцы', english: 'Percy Jackson', year: '2023', episodes: '8', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['аватар короля', { title: 'Аватар короля', english: "King's Avatar", year: '2017', episodes: '40', score: 81, genres: ['Экшен', 'Фантастика'] }],
  ['лог горизонт', { title: 'Лог Горизонт', english: 'Log Horizon', year: '2013', episodes: '62', score: 77, genres: ['Фэнтези', 'Приключения'] }],
  ['горничных акибы', { title: 'Война горничных Акибы', english: 'Akiba Maid War', year: '2022', episodes: '12', score: 72, genres: ['Экшен', 'Комедия'] }],
  ['комбатанты', { title: 'Комбатанты будут высланы', english: 'Sentouin Hakenshimasu', year: '2021', episodes: '12', score: 72, genres: ['Фантастика', 'Комедия'] }],
  ['хилер бесит', { title: 'Этот хилер меня бесит', english: 'Kono Healer Mendakusei', year: '2022', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['вампира', { title: 'Слуга вампира', english: 'Servant x Service', year: '2013', episodes: '13', score: 74, genres: ['Комедия', 'Романтика'] }],
  ['привет мир', { title: 'Привет, мир', english: 'Hello World', year: '2019', episodes: '1', score: 76, genres: ['Фантастика', 'Романтика'] }],
  ['hello world', { title: 'Привет, мир', english: 'Hello World', year: '2019', episodes: '1', score: 76, genres: ['Фантастика', 'Романтика'] }],
  ['нежить неудача', { title: 'Нежить и неудача', english: 'Undead Unluck', year: '2023', episodes: '24', score: 78, genres: ['Экшен', 'Фантастика'] }],
  ['укротитель зверей', { title: 'Укротитель зверей', english: 'Beast Tamer', year: '2022', episodes: '13', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['волшебницей', { title: 'Становясь волшебницей', english: 'Mahou Shoujo ni Akogarete', year: '2024', episodes: '13', score: 78, genres: ['Комедия', 'Фэнтези'] }],
  ['кэмоно', { title: 'Инцидент Кэмоно', english: 'Kemono Jihen', year: '2021', episodes: '12', score: 76, genres: ['Экшен', 'Фэнтези'] }],
  ['devilman', { title: 'Человек-дьявол-плакса', english: 'Devilman Crybaby', year: '2018', episodes: '10', score: 78, genres: ['Экшен', 'Ужасы'] }],
  ['сасаки', { title: 'Сасаки и Пи', english: 'Sasaki to Pii-chan', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['зомби', { title: 'Фарс из-за убийства девушки-нежити', english: 'Zombie Land Saga', year: '2018', episodes: '24', score: 78, genres: ['Комедия', 'Музыка'] }],
  ['zombie land', { title: 'Фарс из-за убийства девушки-нежити', english: 'Zombie Land Saga', year: '2018', episodes: '24', score: 78, genres: ['Комедия', 'Музыка'] }],
  ['фебл', { title: 'Фейбл', english: 'Fable', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['джоджо', { title: 'ДжоДжо', english: 'JoJo no Kimyou na Bouken', year: '2012', episodes: '190+', score: 85, genres: ['Экшен', 'Приключения'] }],
  ['jojo', { title: 'ДжоДжо', english: 'JoJo no Kimyou na Bouken', year: '2012', episodes: '190+', score: 85, genres: ['Экшен', 'Приключения'] }],
  ['принцесса пыток', { title: 'Время пыток, принцесса!', english: 'Himesama Goumon', year: '2024', episodes: '12', score: 76, genres: ['Комедия', 'Фэнтези'] }],
  ['atelie', { title: 'Ателье колдовских колпаков', english: 'Witch Hat Atelier', year: '2023', episodes: '12', score: 79, genres: ['Фэнтези', 'Приключения'] }],
  ['witch hat', { title: 'Ателье колдовских колпаков', english: 'Witch Hat Atelier', year: '2023', episodes: '12', score: 79, genres: ['Фэнтези', 'Приключения'] }],
  ['осторожен', { title: 'Этот герой неуязвим, но очень осторожен', english: 'Shinchou Yuusha', year: '2019', episodes: '12', score: 78, genres: ['Фэнтези', 'Комедия'] }],
  ['избранный богами', { title: 'Избранный богами', english: 'Chosen by the Gods', year: '2020', episodes: '24', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['призыватель', { title: 'Чёрный призыватель', english: 'Black Summoner', year: '2022', episodes: '12', score: 74, genres: ['Фэнтези', 'Экшен'] }],
  ['расхититель', { title: 'Расхититель гробниц', english: 'Tomb Raider King', year: '2024', episodes: '12', score: 72, genres: ['Экшен', 'Фэнтези'] }],
  ['крестьянин', { title: 'Крестьянин 999 уровня', english: 'Hyakuman Level no Noumin', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['героем', { title: 'Перестану быть героем', english: 'Yuusha Yamemasu', year: '2022', episodes: '12', score: 72, genres: ['Фэнтези', 'Комедия'] }],
  ['пощади меня', { title: 'Пощади меня, великий господин', english: 'Onegai Goshujin-sama', year: '2023', episodes: '12', score: 70, genres: ['Комедия', 'Фэнтези'] }],
  ['алхимиком', { title: 'Однажды я стану величайшим алхимиком', english: 'Arifureta', year: '2019', episodes: '25', score: 72, genres: ['Фэнтези', 'Экшен'] }],
  ['парировал', { title: 'Я парировал всё время', english: 'Parry Kizoku', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['усредни', { title: 'Я сказала усредни мои способности', english: 'Heikinchi', year: '2019', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['сайто', { title: 'Мастер на все руки Сайто в другом мире', english: 'Saitou in Another World', year: '2023', episodes: '12', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['забыли мир', { title: 'Почему все забыли мой мир?', english: 'Naze Boku no Sekai', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['фермерские', { title: 'Каким-то образом я стал сильнейшим', english: 'Nonbiri Nouka', year: '2023', episodes: '12', score: 72, genres: ['Фэнтези', 'Повседневность'] }],
  ['повелитель демонов 2099', { title: 'Повелитель демонов 2099', english: 'Maou 2099', year: '2024', episodes: '12', score: 72, genres: ['Фантастика', 'Экшен'] }],
  ['сильный', { title: 'На самом деле, я самый сильный?', english: 'Jitsu wa Ore Saikyou', year: '2023', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['аристократа', { title: 'Реинкарнация аристократа', english: 'Reincarnation of a Noble', year: '2024', episodes: '12', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['эльфа', { title: 'Я реинкарнировал в высшего эльфа', english: 'Reincarnated as a High Elf', year: '2027', episodes: '?', score: null, genres: ['Фэнтези', 'Приключения'] }],
  ['гоблином', { title: 'Я переродился гоблином', english: 'Reincarnated as a Goblin', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Комедия'] }],
  ['ниа листон', { title: 'Безжалостная леди Ниа Листон', english: 'Akuyaku Reijou Level 99', year: '2024', episodes: '12', score: 74, genres: ['Фэнтези', 'Комедия'] }],
  ['диктор', { title: 'Самый известный диктор', english: 'Saikyou Announcer', year: '2024', episodes: '12', score: 72, genres: ['Фэнтези', 'Комедия'] }],
  ['князь тьмы снова', { title: 'Князь тьмы, попытайтесь снова', english: 'Maou Gakuin Retry', year: '2024', episodes: '12', score: 78, genres: ['Фэнтези', 'Экшен'] }],
  ['злодейка', { title: 'Злодейка девяносто девятого уровня', english: 'Villainess Level 99', year: '2024', episodes: '12', score: 74, genres: ['Фэнтези', 'Комедия'] }],
  ['оценщика', { title: 'Худшая работа «оценщика» оказалась самой сильной', english: 'Saijaku Tamer', year: '2024', episodes: '12', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['гача', { title: 'Благодаря своему навыку «Бесконечная гача»', english: 'Mugen Gacha', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['второй жизни', { title: 'Что будет делать сильнейший король в своей второй жизни', english: 'Nidome no Jinsei', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Драма'] }],
  ['мудреца другом мире', { title: 'Жизнь перерождённого мудреца в другом мире', english: 'Tensei Kenja no Isekai Life', year: '2022', episodes: '12', score: 70, genres: ['Фэнтези', 'Приключения'] }],
  ['выгнали отряда', { title: 'Мастера на все руки выгнали из отряда героев', english: 'Yuusha Party', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Драма'] }],
  ['бесклассовый', { title: 'Бесклассовый герой', english: 'Mushoku no Eiyuu', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['возвращение героя', { title: 'Возвращение героя', english: 'Yuusha Gaeri', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['хардкорный геймер', { title: 'Адский уровень: Хардкорный геймер', english: 'Jigokuraku', year: '2023', episodes: '13', score: 81, genres: ['Экшен', 'Приключения'] }],
  ['бармен', { title: 'Бармен: Бокал бога', english: 'Bartender: Kami no Glass', year: '2024', episodes: '11', score: 76, genres: ['Драма', 'Повседневность'] }],
  ['слабейший монстр', { title: 'Слабейший монстр', english: 'Saikyou no Shienshoku', year: '2024', episodes: '12', score: 72, genres: ['Фэнтези', 'Приключения'] }],
  ['труська', { title: 'Труська, Чулко и пресвятой Подвяз', english: 'Shimoneta', year: '2015', episodes: '12', score: 74, genres: ['Комедия', 'Этти'] }],
  ['читер чародей', { title: 'Изгнанный читер-чародей', english: 'Tsuihou sareta Tensei Kiju', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['одолженная магия', { title: 'Одолженная мной магия', english: 'Borrowed Magic', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Экшен'] }],
  ['передовая полиция', { title: 'Передовая полиция', english: 'Advance Police', year: '2020', episodes: '12', score: 65, genres: ['Экшен', 'Драма'] }],
  ['день стал богом', { title: 'День, когда я стал богом', english: 'Kami ni Natta Hi', year: '2020', episodes: '12', score: 68, genres: ['Драма', 'Фантастика'] }],
  ['эскафолона', { title: 'Видение Эскафолона', english: 'Tenkuu no Escaflowne', year: '1996', episodes: '26', score: 78, genres: ['Фэнтези', 'Романтика'] }],
  ['гарем рабов', { title: 'Гарем рабов в лабиринте другого мира', english: 'Isekai Maou to Shoukan Shoujo', year: '2018', episodes: '22', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['цепные хроники', { title: 'Цепные хроники', english: 'Chain Chronicle', year: '2017', episodes: '12', score: 65, genres: ['Фэнтези', 'Экшен'] }],
  ['отвергнутых', { title: 'Один из отвергнутых: Изгой', english: 'Mushibugyou', year: '2013', episodes: '26', score: 70, genres: ['Экшен', 'Фэнтези'] }],
  ['персиковый', { title: 'Персиковый мальчик', english: 'Momotarou', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Приключения'] }],
  ['красавицей', { title: 'Мужик, переродившийся красавицей', english: 'Otoko no Ko', year: '2024', episodes: '12', score: 68, genres: ['Комедия', 'Романтика'] }],
  ['небожителей', { title: 'Благословение небожителей', english: 'Tenkuu Shinpan', year: '2021', episodes: '12', score: 64, genres: ['Экшен', 'Мистика'] }],
  ['королевство руин', { title: 'Королевство руин', english: 'Kingdom of Ruin', year: '2023', episodes: '12', score: 72, genres: ['Фэнтези', 'Драма'] }],
  ['дочери', { title: 'Ради своей дочери я смогу победить даже короля демонов', english: 'Uchi no Musume no Tame', year: '2019', episodes: '12', score: 74, genres: ['Фэнтези', 'Приключения'] }],
  ['томодзаки', { title: 'Низкоуровневый Томодзаки', english: 'Jaku-Chara Tomozaki-kun', year: '2021', episodes: '12', score: 72, genres: ['Драма', 'Романтика'] }],
  ['стрелялка', { title: 'Страйкбольный клуб', english: 'Upotte!!', year: '2012', episodes: '10', score: 68, genres: ['Экшен', 'Комедия'] }],
  ['upotte', { title: 'Страйкбольный клуб', english: 'Upotte!!', year: '2012', episodes: '10', score: 68, genres: ['Экшен', 'Комедия'] }],
  ['магия вернувшегося', { title: 'Магия вернувшегося должна быть особенной', english: 'Kikansha no Mahou', year: '2024', episodes: '12', score: 72, genres: ['Фэнтези', 'Экшен'] }],
  ['факел', { title: 'Чёрный факел', english: 'Kuro no Torch', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['неудачник', { title: 'Необыкновенный неудачник', english: 'Rakudai Kishi', year: '2015', episodes: '12', score: 74, genres: ['Экшен', 'Фэнтези'] }],
  ['десять лет', { title: 'Прошло десять лет', english: 'Tensei Kenja', year: '2022', episodes: '12', score: 70, genres: ['Фэнтези', 'Приключения'] }],
  ['престол', { title: 'Тайная битва за престол', english: 'Ouji no Honmei', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Драма'] }],
  ['герцог', { title: 'Смертоносный герцог', english: 'Shikkoku no Duke', year: '2024', episodes: '12', score: 70, genres: ['Фэнтези', 'Романтика'] }],
  ['мамочку', { title: 'Ты же любишь мамочку', english: 'Tsuujou Kougeki', year: '2019', episodes: '12', score: 64, genres: ['Фэнтези', 'Комедия'] }],
  ['хак', { title: '.Hack//Sign', english: '.hack//Sign', year: '2002', episodes: '26', score: 72, genres: ['Фантастика', 'Мистика'] }],
  ['купидонов', { title: 'Купидонов шоколад', english: "Cupid's Chocolate", year: '2024', episodes: '12', score: 68, genres: ['Романтика', 'Комедия'] }],
  ['дракон дома', { title: 'Дракон в поисках дома', english: 'Dragon Goes House-Hunting', year: '2021', episodes: '12', score: 72, genres: ['Фэнтези', 'Комедия'] }],
  ['ремейк', { title: 'Ремейк нашей жизни', english: 'Bokutachi no Remake', year: '2021', episodes: '12', score: 72, genres: ['Драма', 'Романтика'] }],
  ['серебряный', { title: 'Серебряный страж', english: 'Silver Guardian', year: '2017', episodes: '24', score: 58, genres: ['Фантастика', 'Экшен'] }],
  ['лидейл', { title: 'Мир Лидейл', english: 'Leadale no Daichi nite', year: '2022', episodes: '12', score: 70, genres: ['Фэнтези', 'Приключения'] }],
  ['гильдия', { title: 'Развращённая Гильдия', english: 'Corrupted Guild', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['старшая карта', { title: 'Старшая карта', english: 'High Card', year: '2023', episodes: '20', score: 72, genres: ['Экшен', 'Фэнтези'] }],
  ['ванадис', { title: 'Король магических стрел и Ванадис', english: 'Madan no Ou to Vanadis', year: '2014', episodes: '13', score: 72, genres: ['Экшен', 'Фэнтези'] }],
  ['блокады', { title: 'Фронт кровавой блокады', english: 'Kekkai Sensen', year: '2015', episodes: '24', score: 76, genres: ['Экшен', 'Фантастика'] }],
  ['заклятом', { title: 'Герой при заклятом враге', english: 'Maoyuu Maou Yuusha', year: '2013', episodes: '12', score: 74, genres: ['Фэнтези', 'Романтика'] }],
  ['темнее', { title: 'Темнее чёрного', english: 'Darker than Black', year: '2007', episodes: '38', score: 81, genres: ['Экшен', 'Фантастика'] }],
  ['поезд', { title: 'Куда едет поезд Судного дня', english: 'Shuumatsu Train', year: '2024', episodes: '12', score: 72, genres: ['Фантастика', 'Приключения'] }],
  ['однушка', { title: 'Однушка лорда демонов', english: 'Maou-sama Retry', year: '2019', episodes: '12', score: 62, genres: ['Фэнтези', 'Приключения'] }],
  ['клеватесс', { title: 'Клеватесс', english: 'Cleavess', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Экшен'] }],
  ['кунон', { title: 'Волшебник Кунон всё видит', english: 'Kunoichi Tsubaki', year: '2022', episodes: '13', score: 72, genres: ['Комедия', 'Повседневность'] }],
  ['целитель', { title: 'Маг-целитель: Новый старт', english: 'Kaifuku Jutsushi', year: '2021', episodes: '12', score: 65, genres: ['Фэнтези', 'Экшен'] }],
  ['бывший герой', { title: 'Бывший герой, которого прозвали неудачником', english: 'Moto Yuusha', year: '2024', episodes: '12', score: 68, genres: ['Фэнтези', 'Комедия'] }],
  ['перси', { title: 'Перси Джексон и Олимпийцы', english: 'Percy Jackson', year: '2023', episodes: '8', score: 72, genres: ['Фэнтези', 'Приключения'] }],
]);

function searchLocal(query) {
  const q = query.toLowerCase().trim();
  if (localMap.has(q)) return localMap.get(q);
  for (const [key, value] of localMap) {
    if (key.includes(q) || value.title.toLowerCase().includes(q)) {
      return value;
    }
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Мгновенный поиск в локальной базе
    const localMatch = searchLocal(query);
    
    if (localMatch) {
      return NextResponse.json([{
        id: `local-${Date.now()}`,
        title: localMatch.title,
        title_russian: localMatch.title,
        title_english: localMatch.english,
        year: localMatch.year,
        episodes: localMatch.episodes,
        image_url: defaultNoCoverImage,
        genres: localMatch.genres || [],
        format: 'TV',
        score: localMatch.score,
        source: 'local',
        links: {}
      }]);
    }

    // 2. Параллельные запросы к Shikimori и AniList
    const shikimoriPromise = fetch(
      `https://shikimori.one/api/animes?search=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'AnimeTracker/1.0 (contact@example.com)',
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 }
      }
    ).then(res => res.ok ? res.json() : []).catch(() => []);

    const anilistPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query: `
          query ($search: String) {
            Page(page: 1, perPage: 5) {
              media(search: $search, type: ANIME) {
                id
                title { romaji english native }
                coverImage { large extraLarge }
                startDate { year }
                episodes
                genres
                averageScore
                format
                siteUrl
              }
            }
          }
        `,
        variables: { search: query }
      }),
      next: { revalidate: 60 }
    }).then(res => res.ok ? res.json() : null).catch(() => null);

    const [shikimoriData, anilistData] = await Promise.all([shikimoriPromise, anilistPromise]);

    let results = [];

    if (Array.isArray(shikimoriData) && shikimoriData.length > 0) {
      results = shikimoriData.map(anime => ({
        id: `shiki-${anime.id}`,
        title: anime.russian || anime.name || 'Без названия',
        title_russian: anime.russian || '',
        title_english: anime.name || '',
        year: anime.year?.toString() || 'Неизвестно',
        episodes: anime.episodes ? anime.episodes.toString() : (anime.episodes_aired ? `${anime.episodes_aired}+` : '?'),
        image_url: anime.image?.original 
          ? `https://shikimori.one${anime.image.original}`
          : defaultNoCoverImage,
        genres: (anime.genre || []).map(g => g.russian || g.name),
        format: anime.kind || 'TV',
        score: anime.score || null,
        source: 'shikimori',
        links: {
          shikimori: `https://shikimori.one${anime.url}` || null
        }
      }));
    }

    if (results.length === 0 && anilistData) {
      const animeList = anilistData.data?.Page?.media || [];
      results = animeList.map(anime => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji || anime.title.native || 'Без названия',
        title_russian: '',
        title_english: anime.title.english || anime.title.romaji || '',
        year: anime.startDate?.year?.toString() || 'Неизвестно',
        episodes: anime.episodes ? anime.episodes.toString() : '?',
        image_url: anime.coverImage?.extraLarge || anime.coverImage?.large || defaultNoCoverImage,
        genres: anime.genres || [],
        format: anime.format || 'TV',
        score: anime.averageScore || null,
        source: 'anilist',
        links: { anilist: anime.siteUrl || null }
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    return NextResponse.json([]);
  }
}