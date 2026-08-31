"""Static Uzbekistan city list used for autocomplete and for the deterministic
keyword-matching fallback when the AI parsing layer is unavailable or too slow.
Keeping this list in the DB layer (not invented by the AI) is part of the
Zero-Hallucination guarantee: the AI only ever picks names from this list.
"""

UZBEKISTAN_CITIES: list[str] = [
    "Toshkent",
    "Andijon",
    "Namangan",
    "Farg'ona",
    "Marg'ilon",
    "Qo'qon",
    "Samarqand",
    "Buxoro",
    "Qarshi",
    "Termiz",
    "Guliston",
    "Jizzax",
    "Navoiy",
    "Nukus",
    "Urganch",
    "Xiva",
    "Angren",
    "Chirchiq",
    "Olmaliq",
    "Bekobod",
    "Kogon",
    "Denov",
    "Shahrisabz",
    "Kitob",
    "Yangiyo'l",
    "Gazalkent",
    "Zomin",
    "Koson",
    "Muborak",
    "Chust",
    "Kosonsoy",
    "Asaka",
    "Xonobod",
    "Beruniy",
    "Shovot",
    "Nurota",
    "Konimex",
    "G'ijduvon",
    "Kagan",
    "Yangiyer",
    "Sirdaryo",
    "Baxt",
    "Boysun",
]

_NORMALIZED_INDEX = {c.lower().replace("'", "").replace("‘", ""): c for c in UZBEKISTAN_CITIES}


def normalize_city(raw: str) -> str | None:
    """Best-effort match of free-form user text to a known city name. Returns
    None (never a guess) if nothing in the known list matches."""
    if not raw:
        return None
    key = raw.strip().lower().replace("'", "").replace("‘", "")
    if key in _NORMALIZED_INDEX:
        return _NORMALIZED_INDEX[key]
    # substring match, e.g. "toshkentdan" -> "toshkent"
    for norm, original in _NORMALIZED_INDEX.items():
        if norm in key or key in norm:
            return original
    return None


def find_cities_in_text(text: str) -> list[str]:
    """Cities mentioned in the text, ordered by where they first appear (not
    by the fixed city-list order) — critical so "Samarqanddan Toshkentga"
    parses as origin=Samarqand, destination=Toshkent rather than the reverse."""
    text_lower = text.lower()
    matches: list[tuple[int, str]] = []
    for norm, original in _NORMALIZED_INDEX.items():
        pos = text_lower.find(norm)
        if pos != -1 and original not in [m[1] for m in matches]:
            matches.append((pos, original))
    matches.sort(key=lambda m: m[0])
    return [city for _, city in matches]
