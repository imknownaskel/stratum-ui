# UI translations

Stratum's interface translations are bundled with the app and do not require a runtime translation API. Components call `t()` with the English source phrase, and each JSON catalog maps that phrase to its localized version.

Run `npm run check:locales` after adding or changing interface copy. The checker verifies that every literal `t()` phrase is registered and that every supported locale has a safe value.

Hausa, Yorùbá, and Igbo currently use reviewed core-interface dictionaries with English fallbacks for longer legal and technical demo copy. Those fallback entries should be refined with native-speaker review before describing the catalogs as fully localized.