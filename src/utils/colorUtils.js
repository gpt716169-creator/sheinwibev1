export const getColorStyle = (colorName) => {
    if (!colorName) return '#ccc'; // Fallback

    const lower = colorName.toLowerCase().replace('-', ' ').trim();

    const colorMap = {
        'burgundy': '#800020',
        'navy blue': '#000080',
        'navy': '#000080',
        'beige': '#F5F5DC',
        'khaki': '#F0E68C',
        'camel': '#C19A6B',
        'coffee': '#6F4E37',
        'teal': '#008080',
        'grey': '#808080',
        'gray': '#808080',
        'off white': '#FAF9F6',
        'cream': '#FFFDD0',
        'mustard': '#FFDB58',
        'olive': '#808000',
        'mint': '#3EB489',
        'coral': '#FF7F50',
        'apricot': '#FBCEB1',
        'lilac': '#C8A2C8',
        'lavender': '#E6E6FA',
        'baby blue': '#89CFF0',
        'royal blue': '#4169E1',
        'denim': '#1560BD',
        'charcoal': '#36454F',
        'champagne': '#F7E7CE',
        'ivory': '#FFFFF0',
        'mauve': '#E0B0FF',
        'peach': '#FFE5B4',
        'salmon': '#FA8072',
        'tan': '#D2B48C',
        'taupe': '#483C32',
        'turquoise': '#40E0D0',
        // Добавляем специфичные для Shein варианты, если нужно
        'multicolor': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
    };

    // Если есть в мапе - возвращаем hex
    if (colorMap[lower]) {
        return colorMap[lower];
    }

    // Если это Multicolor - возвращаем градиент
    if (lower.includes('multicolor') || lower.includes('multi')) {
        return 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)';
    }

    // По умолчанию возвращаем как есть (на случай если это валидный цвет типа "red" или hex)
    return colorName;
};
