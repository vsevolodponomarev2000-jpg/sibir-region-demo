/*
  НАСТРОЙКИ САЙТА «Сибирь Регион» — единственное место, где правятся контакты и ссылки.
  После правки: в папке site-src выполнить `node build.mjs --foto` (готовый сайт — в папке site-foto).

  КАК ПОДКЛЮЧИТЬ МЕНЕДЖЕРОВ (у каждой специальности):
  - maxPhone — номер менеджера в MAX. Ссылки «по номеру» у MAX нет, поэтому на сайте номер показывается
    с кнопкой «Скопировать»: соискатель находит менеджера в MAX через «Найти по номеру».
  - max — ссылка на профиль в MAX вида https://max.ru/u/… (менеджер копирует её в приложении:
    Профиль → QR-код → Поделиться). Если заполнена — кнопка «Трудоустроиться» СРАЗУ откроет чат в MAX.
  - telegram — ссылка вида https://t.me/имя (ник без @).
  Если max пустой — показывается окно «Напишите менеджеру» с тем, что заполнено.
*/
window.SR_CONFIG = {
  siteUrl: "https://vsevolodponomarev2000-jpg.github.io/sibir-region-demo/",           // адрес будущего сайта (для og-ссылок)
  phone: "+7 900 921-40-40",                      // для звонков
  leadsEndpoint: "https://sibir-region-forms.vsevolod-ai.workers.dev", // куда форма отправляет заявки (пусто — форма только показывает телефон)
  complaintPhone: "8 905 990-27-35",              // для жалоб и предложений
  cities: ["Новосибирск", "Томск", "Москва"],
  salaryUnit: "в месяц",                                 // единица зарплаты: «в месяц» или «за вахту» — пусто = не пишем
  hours: [                                        // часы работы: строка или список строк (по городам)
    "Новосибирск, Томск — пн–пт с 8:00 до 16:00",
    "Москва — пн–пт с 8:00 до 18:00",
  ],

  // Общие ссылки компании (шапка, подвал, контакты). Пусто = значок бледный.
  social: {
    max: "",
    telegram: "",
    vk: "https://vk.ru/id1068177842",
    ok: "https://ok.ru/profile/910026304875",     // Одноклассники
  },

  // Менеджер «по умолчанию» — если у специальности никого нет
  fallbackManager: { name: "", maxPhone: "", max: "", telegram: "" },

  // Менеджеры по специальностям (список от кадров, 27.11.2026)
  managers: {
    // Стройка
    "elektromontazhnik":     { name: "Дарья Сергеевна",         maxPhone: "+7 923 438-31-41", max: "", telegram: "https://t.me/Kadrovik2026" },
    "betonshchik":           { name: "Ангелина Константиновна", maxPhone: "+7 923 426-21-31", max: "", telegram: "https://t.me/RabotaVaxta57" },
    "montazhnik":            { name: "Анна Юрьевна",            maxPhone: "+7 952 756-99-00", max: "", telegram: "https://t.me/AnnaRabota26" },
    "armaturshchik":         { name: "Екатерина Алексеевна",    maxPhone: "+7 960 978-55-35", max: "", telegram: "https://t.me/vahta130" },
    "svarshchik-stroyka":    { name: "Дарья Сергеевна",         maxPhone: "+7 923 438-31-41", max: "", telegram: "https://t.me/Kadrovik2026" },
    "raznorabochiy":         { name: "Софья Алексеевна",        maxPhone: "+7 960 978-18-65", max: "", telegram: "" },
    "podsobnyy-rabochiy":    { name: "Ксения Николаевна",       maxPhone: "+7 952 176-99-00", max: "", telegram: "" }, // Telegram — позже
    // Склады
    "komplektovshchik":      { name: "Дарья Игоревна",          maxPhone: "+7 953 922-05-97", max: "", telegram: "https://t.me/Darya12242" },
    "gruzchik":              { name: "Ольга Валерьевна",        maxPhone: "+7 903 951-58-75", max: "", telegram: "https://t.me/Elenavahta26" },
    // Обучение
    "montazhnik-vysotnik":   { name: "Анастасия Юрьевна",       maxPhone: "+7 900 922-00-66", max: "", telegram: "https://t.me/KadroviK26" },
    "promyshlennyy-alpinist":{ name: "Анастасия Юрьевна",       maxPhone: "+7 900 922-00-66", max: "", telegram: "https://t.me/KadroviK26" },
    "izolirovshchik":        { name: "Анастасия Юрьевна",       maxPhone: "+7 900 922-00-66", max: "", telegram: "https://t.me/KadroviK26" },
    // Производство (номер MAX Виктории Олеговны уточняется — в списке он записан с ошибкой)
    "slesar":                { name: "Виктория Олеговна",       maxPhone: "", max: "", telegram: "https://t.me/rosgospro" },
    "transportirovshchik":   { name: "Виктория Олеговна",       maxPhone: "", max: "", telegram: "https://t.me/rosgospro" },
    "svarshchik":            { name: "Дарья Сергеевна",         maxPhone: "+7 923 438-31-41", max: "", telegram: "https://t.me/Kadrovik2026" },
    "operator-pogruzchika":  { name: "Виктория Олеговна",       maxPhone: "", max: "", telegram: "https://t.me/rosgospro" },
  },

  // Реквизиты — для подвала, контактов, политики и согласия (выписка из ЕГРИП от 16.12.2024).
  // ogrn — ОГРН (13 цифр) или ОГРНИП (15 цифр): подпись на сайте выбирается по длине номера. address — адрес для обращений.
  legal: { name: "ИП Михайлова Яна Сергеевна", inn: "423006997341", ogrn: "324700000055871", address: "" },

  // Демо-переключатель «Вариант: 3D | Фото» в углу — только для показа заказчику. На рабочем сайте: false
  demoSwitch: false,

  // ---- Рабочий сайт на российском хостинге (сборка: node build.mjs --ru → папка site-ru) ----
  // В сборке --ru анкеты уходят на свой сервер (/api/anketa.php), leadsEndpoint выше — только для демо на GitHub.
  indexing: false,      // true — сайт открыт для Яндекса и Google (sitemap.xml, robots.txt). Включать после запуска на домене
  metrikaId: "",        // номер счётчика Яндекс Метрики (только цифры). Пусто — без Метрики
  captchaKey: "",       // ключ для сайта Яндекс SmartCaptcha (секретный ключ — в sr-private/config.php). Пусто — без капчи
};
