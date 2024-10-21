export function formatAIResponse(chunk: string): string {
    let formatChunk = chunk
        //.replaceAll(/\[.*?\]/g, '')
        .replaceAll(/【.*?】/g, '')
        //remove ![Antonella](attachment:3-Antonella)
        //.replaceAll(/!\[.*?]\(.*?\)/g, '')
        .replaceAll(/!\[.*?]\(image:(.*?)\)/g, '')
        //remove [image:9-Stefany]
        .replaceAll(/\[image:[^\]]+\]/g, '')
        .replaceAll(/!\[.*?\]\((.*?)\)/g, '')
        .replaceAll(": .", ':')
        .replaceAll(":.", ':')
        .replaceAll("--", '')
        .trim();

    // Format from
    //\[ 120 \text{ pares} \times \$14,000 \text{ por par} = \$1,680,000 \]
    //to 
    // 120 pares x $14,000 por par = $1,680,000
    // Paso 1: Remover los delimitadores de LaTeX
    formatChunk = formatChunk.replaceAll(/\\\[/g, '').replace(/\\\]/g, '');

    // Paso 2: Remover \text{...}
    formatChunk = formatChunk.replaceAll(/\\text\{([^}]+)\}/g, '$1');

    // Paso 3: Reemplazar \times con x
    formatChunk = formatChunk.replaceAll(/\\times/g, 'x');
    formatChunk = formatChunk.replaceAll('**', '*');

    //if format chunk termina en - Imagen: remove
    formatChunk = formatChunk.replace(/- Imagen:$/, '');

    //if formatChunk termina en - remove
    formatChunk = formatChunk.replace(/-$/, '');

    // if formatChunk termina en : remove
    formatChunk = formatChunk.replace(/:$/, '');

    //if formatChunk is empty change
    if (formatChunk.trim() == "") {
        formatChunk = "";
    }
    return formatChunk;
}
