export function countryCopy(data) {
  return (english, french = english) => {
    const translated = data.ui?.[english];
    return typeof translated === 'string' && translated.trim() ? translated
      : data.locale === 'fr' ? french : english;
  };
}
