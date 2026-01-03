export type Language = 'ru' | 'kk';

export const dictionary = {
  ru: {
    // Common
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',
    submit: 'Отправить',
    close: 'Закрыть',
    
    // Cart & Checkout
    cart_empty:  'Корзина пуста',
    cart_title: 'Корзина',
    add_to_cart: 'Добавить в корзину',
    checkout_title: 'Оформление заказа',
    place_order: 'Оформить заказ',
    order_success: 'Заказ успешно размещен! ',
    order_total: 'Итого',
    
    // Photo Gallery
    select_photo: 'Выбрать фото',
    view_gallery: 'Посмотреть галерею',
    no_photos: 'Фотографии пока не загружены',
    photos_count: 'фотографий',
    
    // Forms
    first_name: 'Имя',
    last_name: 'Фамилия',
    email: 'Email',
    phone: 'Телефон',
    required_field: 'Обязательное поле',
    
    // Teacher Dashboard
    teacher_dashboard_title: 'Панель учителя',
    classroom:  'Класс',
    students: 'Учащиеся',
    orders: 'Заказы',
    pending_orders: 'Ожидающие заказы',
    approved_orders: 'Одобренные заказы',
    
    // Status
    pending: 'Ожидает',
    approved: 'Одобрено',
    locked: 'Заблокировано',
    completed: 'Завершено',
    
    // Photo Formats
    format_a4: 'Формат A4 (21×29.7 см)',
    format_a5: 'Формат A5 (14.8×21 см)',
    format_magnet: 'Фото-магнит',
    format_digital: 'Цифровая копия',
    
    // School
    choose_classroom: 'Выберите класс',
    school_info:  'Информация о школе',
    
    // Watermark
    watermark_notice: 'Водяной знак будет удален при печати',
    
    // Actions
    approve_order: 'Одобрить заказ',
    request_edit: 'Запросить редактирование',
    view_order: 'Просмотреть заказ',
    
    // Messages
    order_confirmation: 'Вы получите подтверждение на email',
    contact_info: 'Контактная информация',
    order_summary: 'Сводка заказа',
  },
  
  kk: {
    // Common
    loading: 'Жүктелуде...',
    save: 'Сақтау',
    cancel: 'Болдырмау',
    delete: 'Жою',
    edit: 'Өңдеу',
    back: 'Артқа',
    submit: 'Жіберу',
    close: 'Жабу',
    
    // Cart & Checkout
    cart_empty:  'Себет бос',
    cart_title: 'Себет',
    add_to_cart: 'Себетке қосу',
    checkout_title: 'Тапсырысты рәсімдеу',
    place_order:  'Тапсырыс беру',
    order_success:  'Тапсырыс сәтті орналастырылды!',
    order_total: 'Барлығы',
    
    // Photo Gallery
    select_photo: 'Фото таңдау',
    view_gallery: 'Галереяны қарау',
    no_photos: 'Фотосуреттер әлі жүктелмеген',
    photos_count: 'фотосурет',
    
    // Forms
    first_name: 'Аты',
    last_name: 'Тегі',
    email: 'Email',
    phone: 'Телефон',
    required_field: 'Міндетті өріс',
    
    // Teacher Dashboard
    teacher_dashboard_title:  'Мұғалім панелі',
    classroom: 'Сынып',
    students: 'Оқушылар',
    orders: 'Тапсырыстар',
    pending_orders:  'Күтілуде',
    approved_orders: 'Бекітілген',
    
    // Status
    pending: 'Күтілуде',
    approved: 'Бекітілді',
    locked: 'Бұғатталған',
    completed: 'Аяқталды',
    
    // Photo Formats
    format_a4: 'A4 форматы (21×29.7 см)',
    format_a5: 'A5 форматы (14.8×21 см)',
    format_magnet:  'Фото-магнит',
    format_digital: 'Цифрлық көшірме',
    
    // School
    choose_classroom: 'Сыныпты таңдаңыз',
    school_info: 'Мектеп туралы ақпарат',
    
    // Watermark
    watermark_notice: 'Су белгісі басып шығарғанда алынады',
    
    // Actions
    approve_order: 'Тапсырысты бекіту',
    request_edit: 'Өңдеуді сұрау',
    view_order: 'Тапсырысты қарау',
    
    // Messages
    order_confirmation: 'Сізге email арқылы растау жіберіледі',
    contact_info:  'Байланыс ақпараты',
    order_summary: 'Тапсырыс қорытындысы',
  },
} as const;

export type TranslationKey = keyof typeof dictionary. ru;