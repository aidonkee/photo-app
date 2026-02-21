export type Language = 'ru' | 'kk';

export const dictionary = {
  ru: {
    // Common
    loading: 'Загрузка...',
    loading_photos: 'Загрузка фотографий...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',
    back_to: 'Назад к',
    submit: 'Отправить',
    close: 'Закрыть',

    // School Landing
    school_not_found: 'Школа не найдена',
    photo_gallery: 'Фотогалерея',
    choose_your_class: 'Выберите ваш класс',
    choose_class_to_view: 'Выберите ваш класс, чтобы просмотреть фотографии',
    no_classrooms: 'Классы отсутствуют',
    photos_coming_soon: 'Фотографии скоро будут доступны. Пожалуйста, зайдите позже.',
    view_gallery: 'Посмотреть галерею',
    photos_word: 'фото',

    // Cart & Checkout
    cart_empty: 'Корзина пуста',
    cart_title: 'Корзина',
    cart_your_empty: 'Ваша корзина пуста.',
    add_to_cart: 'Добавить в корзину',
    added_to_cart: 'Успешно',
    cart_other_items_warning: 'В корзине есть фото из других классов (они сохранены)',
    checkout_title: 'Оформление заказа',
    checkout_fill_data: 'Заполните данные для заказа.',
    checkout_check_photos: 'Проверьте выбранные фото.',
    place_order: 'Оформить заказ',
    order_success: 'Заказ успешно создан!',
    order_redirecting: 'Перенаправляем вас на страницу статуса...',
    order_total: 'Итого',
    total_to_pay: 'Всего к оплате:',
    you_selected: 'Вы выбрали',
    photos_selected: 'фото',
    pay: 'Заказать',
    processing: 'Оформляем...',

    // Photo Gallery
    select_photo: 'Выбор фотографии',
    select_format_quantity: 'Выберите формат и количество',
    no_photos: 'Фотографии отсутствуют',
    no_photos_yet: 'Фотограф еще не загрузил снимки.',
    photos_count: 'фотографий',
    photos_available: 'доступно',
    click_to_view: 'Нажмите для просмотра',
    use_arrows_or_swipe: 'Используйте ← → или свайп',
    swipe_hint: '👆 Свайп влево/вправо для навигации',
    of: 'из',
    photo: 'Фотография',

    // Forms
    first_name: 'Имя',
    last_name: 'Фамилия',
    student_name: 'Фамилия и Имя (ученика)',
    student_name_placeholder: 'Иванов Алексей',
    email: 'Email',
    email_optional: 'Email (необязательно)',
    email_placeholder: 'example@mail.ru',
    email_hint: 'Для получения чека и уведомлений о готовности',
    phone: 'Телефон',
    phone_optional: 'Номер телефона (необязательно)',
    phone_placeholder: '+7 (___) ___-__-__',
    required_field: 'Обязательное поле',

    // Pricing
    format: 'Формат',
    quantity: 'Количество',
    price_per_unit: 'Цена за единицу:',

    // Teacher Dashboard
    teacher_dashboard_title: 'Панель учителя',
    classroom: 'Класс',
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
    format_a4: 'Формат A4',
    format_a5: 'Формат A5',

    // School
    choose_classroom: 'Выберите класс',
    school_info: 'Информация о школе',

    // Watermark
    watermark_notice: 'Водяной знак будет удален при печати',

    // Actions
    approve_order: 'Одобрить заказ',
    request_edit: 'Запросить редактирование',
    view_order: 'Просмотреть заказ',
    prev_photo: 'Предыдущее фото',
    next_photo: 'Следующее фото',

    // Messages
    order_confirmation: 'Вы получите подтверждение на email',
    contact_info: 'Контактная информация',
    order_summary: 'Сводка заказа',
    order_error: 'Ошибка при оформлении заказа',

    // Legal
    terms_agreement: 'Нажимая кнопку, вы соглашаетесь с правилами сервиса и обработкой персональных данных.',
  },

  kk: {
    // Common
    loading: 'Жүктелуде...',
    loading_photos: 'Фотосуреттер жүктелуде...',
    save: 'Сақтау',
    cancel: 'Болдырмау',
    delete: 'Жою',
    edit: 'Өңдеу',
    back: 'Артқа',
    back_to: 'Артқа',
    submit: 'Жіберу',
    close: 'Жабу',

    // School Landing
    school_not_found: 'Мектеп табылмады',
    photo_gallery: 'Фотогалерея',
    choose_your_class: 'Сыныпты таңдаңыз',
    choose_class_to_view: 'Фотосуреттерді қарау үшін сыныпты таңдаңыз',
    no_classrooms: 'Сыныптар жоқ',
    photos_coming_soon: 'Фотосуреттер жақында қолжетімді болады. Кейінірек кіріңіз.',
    view_gallery: 'Галереяны қарау',
    photos_word: 'фото',

    // Cart & Checkout
    cart_empty: 'Себет бос',
    cart_title: 'Себет',
    cart_your_empty: 'Сіздің себетіңіз бос.',
    add_to_cart: 'Себетке қосу',
    added_to_cart: 'Себетке сәтті қосылды!',
    cart_other_items_warning: 'Себетте басқа сыныптардан фотосуреттер бар (олар сақталды)',
    checkout_title: 'Тапсырысты рәсімдеу',
    checkout_fill_data: 'Тапсырыс үшін деректерді толтырыңыз.',
    checkout_check_photos: 'Таңдалған фотоларды тексеріңіз.',
    place_order: 'Тапсырыс беру',
    order_success: 'Тапсырыс сәтті жасалды!',
    order_redirecting: 'Сізді мәртебе бетіне бағыттаймыз...',
    order_total: 'Барлығы',
    total_to_pay: 'Төлеу сомасы:',
    you_selected: 'Сіз таңдадыңыз',
    photos_selected: 'фото',
    pay: 'Тапсырыс беру',
    processing: 'Өңделуде...',

    // Photo Gallery
    select_photo: 'Фото таңдау',
    select_format_quantity: 'Пішім мен санын таңдаңыз',
    no_photos: 'Фотосуреттер жоқ',
    no_photos_yet: 'Фотограф әлі суреттер жүктемеген.',
    photos_count: 'фотосурет',
    photos_available: 'қолжетімді',
    click_to_view: 'Қарау үшін басыңыз',
    use_arrows_or_swipe: '← → немесе свайп қолданыңыз',
    swipe_hint: '👆 Навигация үшін солға/оңға сырғытыңыз',
    of: 'ішінен',
    photo: 'Фотосурет',

    // Forms
    first_name: 'Аты',
    last_name: 'Тегі',
    student_name: 'Тегі және Аты (оқушының)',
    student_name_placeholder: 'Иванов Алексей',
    email: 'Email',
    email_optional: 'Email (міндетті емес)',
    email_placeholder: 'example@mail.ru',
    email_hint: 'Чек және дайындық туралы хабарламалар алу үшін',
    phone: 'Телефон',
    phone_optional: 'Телефон нөмірі (міндетті емес)',
    phone_placeholder: '+7 (___) ___-__-__',
    required_field: 'Міндетті өріс',

    // Pricing
    format: 'Пішім',
    quantity: 'Саны',
    price_per_unit: 'Бірлік бағасы:',

    // Teacher Dashboard
    teacher_dashboard_title: 'Мұғалім панелі',
    classroom: 'Сынып',
    students: 'Оқушылар',
    orders: 'Тапсырыстар',
    pending_orders: 'Күтілуде',
    approved_orders: 'Бекітілген',

    // Status
    pending: 'Күтілуде',
    approved: 'Бекітілді',
    locked: 'Бұғатталған',
    completed: 'Аяқталды',

    // Photo Formats
    format_a4: 'A4 пішімі',
    format_a5: 'A5 пішімі',

    // School
    choose_classroom: 'Сыныпты таңдаңыз',
    school_info: 'Мектеп туралы ақпарат',

    // Watermark
    watermark_notice: 'Су белгісі басып шығарғанда алынады',

    // Actions
    approve_order: 'Тапсырысты бекіту',
    request_edit: 'Өңдеуді сұрау',
    view_order: 'Тапсырысты қарау',
    prev_photo: 'Алдыңғы фото',
    next_photo: 'Келесі фото',

    // Messages
    order_confirmation: 'Сізге email арқылы растау жіберіледі',
    contact_info: 'Байланыс ақпараты',
    order_summary: 'Тапсырыс қорытындысы',
    order_error: 'Тапсырысты рәсімдеу кезінде қате',

    // Legal
    terms_agreement: 'Түймені басу арқылы сіз қызмет ережелерімен және жеке деректерді өңдеумен келісесіз.',
  },
} as const;

export type TranslationKey = keyof typeof dictionary.ru;