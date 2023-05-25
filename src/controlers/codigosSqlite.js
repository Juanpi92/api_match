import { openDb } from "../infra/db.js";


export async function armazenarCodigo(email, codigo) {

    openDb().then(db => db.run(`INSERT INTO codigo (email, codigo) VALUES ('${email}', ${codigo});`))
    // .catch((error) => console.log('deu erro no db'))

}


export async function excluirCodigo(email, codigo) {

    setTimeout(function() {
        return openDb().then(db => {
            return db.get(`DELETE FROM codigo WHERE email = '${email}' AND codigo = ${codigo};`).then(res => res)
        })
    }, 30000);

}


export async function verificarCodigo(email, codigo) {

    return openDb().then(db => {
        return db.get(`SELECT * FROM codigo WHERE email = '${email}' AND codigo = ${codigo}`)
        .then(res => res)
    })

}