
const {
    RegExpMatcher,
    DataSet,
    englishDataset,
    englishRecommendedTransformers,
    pattern
} = require("obscenity");


const profanityDataset = new DataSet().addAll(englishDataset);

// Palabras en español
const spanishWords = [
    "chingada",
    "chingado",
    "chingar",
    "pendejo",
    "pendeja",
    "puto",
    "puta",
    "verga",
    "vergazo",
    "culero",
    "culera",
    "cabrón",
    "cabrona",
    "mamón",
    "mamona",
    "mierda",
    "pinche",
    "imbécil",
    "idiota",
    "estúpido",
    "estúpida",
    "baboso",
    "babosa",
    "zorra",
    "malparido",
    "huevón",
    "carajo",
    "joto",
    "maricón",
    "chingadera"
];

// Agregar palabras al dataset
for (const word of spanishWords) {
    profanityDataset.addPhrase(phrase =>
        phrase
            .setMetadata({ originalWord: word })
            .addPattern(pattern`|${word}|`)
    );
}

// Crear matcher
const matcher = new RegExpMatcher({
    ...profanityDataset.build(),
    ...englishRecommendedTransformers
});

// Función reutilizable
function contieneGroserias(texto) {
    if (typeof texto !== "string") return false;
    return matcher.hasMatch(texto);
}

module.exports = { contieneGroserias, matcher };
