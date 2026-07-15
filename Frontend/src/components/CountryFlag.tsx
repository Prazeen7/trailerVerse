export function getCountryFlag(countryCode?: string) {
    if (!countryCode) return "🌍";

    return countryCode
        .toUpperCase()
        .replace(/./g, char =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
        );
}