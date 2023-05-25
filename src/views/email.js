export const emailCliente = (codigo) => {

    return `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">

            <title>Match up</title>
        </head>
        <body>
            <h1>Código de verificação: ${codigo}</h1>
        </body>
        </html>
        `
} 
