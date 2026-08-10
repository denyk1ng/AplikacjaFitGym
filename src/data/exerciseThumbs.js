// Miniatury ćwiczeń z planu = te same zdjęcia co na ekranie ćwiczenia,
// czyli ujęcie DANEGO ruchu (patrz exerciseImages.js).
//
// Wcześniej stały tu kadry dobierane "po klimacie" i część pokazywała co
// innego niż ćwiczenie: lina wspinaczkowa przy ściąganiu linki wyciągu i face
// pullach, guma oporowa przy kółku do brzucha, kobieta ze sztangą przy wykroku
// bułgarskim, pusta siłownia przy rozpiętkach, a wyciskanie i wiosłowanie
// dzieliły jedno zdjęcie hero. EX_IMG jest kluczowane per id ćwiczenia, więc
// miniatura zawsze zgadza się z ruchem.
import { EX_IMG } from "./exerciseImages.js";

const mods = import.meta.glob("../assets/thumb/*.jpg", { eager: true, import: "default" });
const S = Object.fromEntries(Object.entries(mods).map(([p, u]) => [p.match(/([^/]+)\.jpg$/)[1], u]));

// surowe miniatury po nazwie pliku — używa ich katalog ćwiczeń spoza planu,
// gdzie nie ma zdjęcia konkretnego ruchu i kadr klimatyczny jest w porządku
export const THUMB = S;

// klucz = id ćwiczenia z planu (łącznie z aliasami c8/c10 z EX_IMG)
export const EX_THUMB = { ...EX_IMG };
