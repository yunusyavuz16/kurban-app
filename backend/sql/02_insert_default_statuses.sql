-- Insert default statuses
INSERT INTO kurban_statuses (name, label, color_bg, color_text, color_border, display_order) VALUES
    ('waiting', 'Beklemede', 'bg-gray-50', 'text-gray-800', 'border-gray-300', 1),
    ('slaughtering', 'Kesimde', 'bg-red-50', 'text-red-900', 'border-red-300', 2),
    ('skinning', 'Yüzme', 'bg-orange-50', 'text-orange-900', 'border-orange-300', 3),
    ('cleaning', 'Temizleme', 'bg-yellow-50', 'text-yellow-900', 'border-yellow-300', 4),
    ('packaging', 'Paketleme', 'bg-green-50', 'text-green-900', 'border-green-300', 5),
    ('completed', 'Tamamlandı', 'bg-blue-50', 'text-blue-900', 'border-blue-300', 6),
    ('cancelled', 'İptal Edildi', 'bg-gray-100', 'text-gray-500', 'border-gray-400', 7)
ON CONFLICT (name) DO NOTHING;