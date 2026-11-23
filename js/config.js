/*
  НАСТРОЙКИ САЙТА «Сибирь Регион» — единственное место, где правятся контакты и ссылки.
  После правки: в папке site-src выполнить `node build.mjs` (готовый сайт — в папке site).

  КАК ПОДКЛЮЧИТЬ МЕНЕДЖЕРОВ:
  у каждой специальности впишите ссылки менеджера. Если заполнена ссылка max —
  кнопка «Трудоустроиться» этой специальности СРАЗУ откроет чат в MAX (без всплывающего окна).
  Если max пустой — показывается окно «Напишите менеджеру» с теми ссылками, что заполнены.
*/
window.SR_CONFIG = {
  siteUrl: "https://vsevolodponomarev2000-jpg.github.io/sibir-region-demo/",           // адрес будущего сайта (для og-ссылок)
  phone: "+7 900 921-40-40",                      // для звонков
  complaintPhone: "8 905 990-27-35",              // для жалоб и предложений
  cities: ["Новосибирск", "Томск", "Москва"],
  hours: "",                                      // часы работы, например «Пн–Пт 9:00–18:00»

  // Общие ссылки компании (шапка, подвал, контакты). Пусто = значок бледный.
  social: { max: "", telegram: "", vk: "" },

  // Менеджер «по умолчанию» — если у специальности никого нет
  fallbackManager: { name: "", max: "", telegram: "", vk: "" },

  // Менеджеры по специальностям: name — имя, ссылки — на личный чат менеджера
  managers: {
    "betonshchik":        { name: "", max: "", telegram: "", vk: "" },
    "montazhnik":         { name: "", max: "", telegram: "", vk: "" },
    "armaturshchik":      { name: "", max: "", telegram: "", vk: "" },
    "plotnik":            { name: "", max: "", telegram: "", vk: "" },
    "svarshchik":         { name: "", max: "", telegram: "", vk: "" },
    "elektromontazhnik":  { name: "", max: "", telegram: "", vk: "" },
    "podsobnyy-rabochiy": { name: "", max: "", telegram: "", vk: "" },
    "raznorabochiy":      { name: "", max: "", telegram: "", vk: "" },
    "komplektovshchik":   { name: "", max: "", telegram: "", vk: "" },
    "obuchenie":          { name: "", max: "", telegram: "", vk: "" },
  },

  // Реквизиты — для подвала, политики и согласия
  legal: { name: "", inn: "", ogrn: "", address: "" },

  // Демо-переключатель «Вариант: 3D | Фото» в углу — только для показа заказчику. На рабочем сайте: false
  demoSwitch: true,
};
